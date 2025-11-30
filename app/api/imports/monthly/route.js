import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Import } from '@/models';
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
    const monthlyTotals = await Import.aggregate([
      {
        $match: {
          user_id: user._id,
          import_date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$product_id',
          total_quantity: { $sum: '$qty_imported' },
          total_amount: { $sum: '$total_imported_amt' },
          avg_price: { $avg: '$price_imported' },
          import_count: { $sum: 1 }
        }
      },
      {
        $sort: { total_amount: -1 }
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
          total_amount: 1,
          avg_price: 1,
          import_count: 1
        }
      }
    ]);

    // Get summary statistics
    const summary = await Import.aggregate([
      {
        $match: {
          user_id: user._id,
          import_date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total_imports: { $sum: 1 },
          total_quantity: { $sum: '$qty_imported' },
          total_amount: { $sum: '$total_imported_amt' },
          avg_price_per_unit: { $avg: '$price_imported' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      total_imports: 0,
      total_quantity: 0,
      total_amount: 0,
      avg_price_per_unit: 0
    };

    return ApiResponse.success({
      summary: summaryData,
      details: monthlyTotals
    }, 'Monthly import totals retrieved successfully');

  } catch (error) {
    console.error('Get monthly imports error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve monthly imports', 500);
  }
}