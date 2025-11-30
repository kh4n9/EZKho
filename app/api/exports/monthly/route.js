import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Export } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));

    if (!year || !month) {
      return ApiResponse.validationError('Year and month are required');
    }

    // Get monthly totals
    const monthlyTotals = await Export.aggregate([
      {
        $match: {
          user_id: user._id,
          export_date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$product_id',
          total_quantity: { $sum: '$qty_exported' },
          total_revenue: { $sum: '$total_exported_amt' },
          total_profit: { $sum: '$profit' },
          avg_price: { $avg: '$price_exported' },
          export_count: { $sum: 1 }
        }
      },
      {
        $sort: { total_revenue: -1 }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'product_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          product_id: '$_id',
          product_name: '$product.product_name',
          unit: '$product.unit',
          total_quantity: 1,
          total_revenue: 1,
          total_profit: 1,
          avg_price: 1,
          export_count: 1
        }
      }
    ]);

    // Get summary statistics
    const summary = await Export.aggregate([
      {
        $match: {
          user_id: user._id,
          export_date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total_exports: { $sum: 1 },
          total_quantity: { $sum: '$qty_exported' },
          total_revenue: { $sum: '$total_exported_amt' },
          total_profit: { $sum: '$profit' },
          avg_price_per_unit: { $avg: '$price_exported' },
          avg_profit_per_unit: { $avg: '$profit' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      total_exports: 0,
      total_quantity: 0,
      total_revenue: 0,
      total_profit: 0,
      avg_price_per_unit: 0,
      avg_profit_per_unit: 0
    };

    return ApiResponse.success({
      summary: summaryData,
      details: monthlyTotals
    }, 'Monthly export totals retrieved successfully');

  } catch (error) {
    console.error('Get monthly exports error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve monthly exports', 500);
  }
}