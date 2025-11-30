import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Inventory } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1;

    // Get inventory value summary
    const summary = await Inventory.aggregate([
      {
        $match: {
          user_id: user._id,
          period_year: year,
          period_month: month
        }
      },
      {
        $group: {
          _id: null,
          total_products: { $sum: 1 },
          total_stock: { $sum: '$closing_stock' },
          total_value: { $sum: '$closing_value' },
          avg_cost_per_unit: { $avg: '$average_cost' },
          total_imported: { $sum: '$total_imported' },
          total_exported: { $sum: '$total_exported' },
          avg_stock_per_product: { $avg: '$closing_stock' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      total_products: 0,
      total_stock: 0,
      total_value: 0,
      avg_cost_per_unit: 0,
      total_imported: 0,
      total_exported: 0,
      avg_stock_per_product: 0
    };

    // Get stock status distribution
    const stockStatusDistribution = await Inventory.aggregate([
      {
        $match: {
          user_id: user._id,
          period_year: year,
          period_month: month
        }
      },
      {
        $group: {
          _id: null,
          out_of_stock: {
            $sum: {
              $cond: [{ $eq: ['$closing_stock', 0] }, 1, 0]
            }
          },
          low_stock: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$closing_stock', 0] }, { $lt: ['$closing_stock', 100] }] },
                1,
                0
              ]
            }
          },
          in_stock: {
            $sum: {
              $cond: [{ $gte: ['$closing_stock', 100] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stockStatusData = stockStatusDistribution[0] || {
      out_of_stock: 0,
      low_stock: 0,
      in_stock: 0
    };

    // Get top products by value
    const topProductsByValue = await Inventory.aggregate([
      {
        $match: {
          user_id: user._id,
          period_year: year,
          period_month: month,
          closing_value: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: 'product_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          product_id: 1,
          product_name: '$product.product_name',
          unit: '$product.unit',
          closing_stock: 1,
          closing_value: 1,
          average_cost: 1
        }
      },
      {
        $sort: { closing_value: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get top products by quantity
    const topProductsByQuantity = await Inventory.aggregate([
      {
        $match: {
          user_id: user._id,
          period_year: year,
          period_month: month,
          closing_stock: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: 'product_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          product_id: 1,
          product_name: '$product.product_name',
          unit: '$product.unit',
          closing_stock: 1,
          closing_value: 1,
          average_cost: 1
        }
      },
      {
        $sort: { closing_stock: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return ApiResponse.success({
      summary: summaryData,
      stock_status_distribution: stockStatusData,
      top_products_by_value: topProductsByValue,
      top_products_by_quantity: topProductsByQuantity,
      period: { year, month }
    }, 'Inventory summary retrieved successfully');

  } catch (error) {
    console.error('Get inventory summary error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve inventory summary', 500);
  }
}