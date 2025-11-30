import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Export, Customer } from '@/models';
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

    // Get customer statistics using Customer model for better data
    const customerStats = await Customer.aggregate([
      {
        $match: {
          user_id: user._id,
          status: 'active'
        }
      },
      {
        $lookup: {
          from: 'exports',
          localField: '_id',
          foreignField: 'customer_id',
          as: 'exports'
        }
      },
      {
        $unwind: '$exports'
      },
      {
        $match: {
          'exports.export_date': {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          'exports.status': 'completed'
        }
      },
      {
        $group: {
          _id: '$exports.customer_id',
          customer: { $first: '$$ROOT' },
          total_orders: { $sum: 1 },
          total_quantity: { $sum: '$exports.qty_exported' },
          total_amount: { $sum: '$exports.total_exported_amt' },
          avg_order_value: { $avg: '$exports.total_exported_amt' },
          total_profit: { $sum: '$exports.profit' },
          first_order_date: { $min: '$exports.export_date' },
          last_order_date: { $max: '$exports.export_date' }
        }
      },
      {
        $project: {
          customer_id: '$_id',
          customer_name: '$customer.name',
          customer_code: '$customer.customer_code',
          total_orders: 1,
          total_quantity: 1,
          total_amount: 1,
          avg_order_value: 1,
          total_profit: 1,
          first_order_date: 1,
          last_order_date: 1
        }
      },
      {
        $sort: { total_amount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get customer count summary
    const customerSummary = await Customer.aggregate([
      {
        $match: {
          user_id: user._id,
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          total_customers: { $addToSet: '$customer_code' }
        }
      },
      {
        $project: {
          _id: 0,
          total_customers: { $size: '$total_customers' }
        }
      }
    ]);

    const summaryData = customerSummary[0] || { total_customers: 0 };

    // Get top 10 customers
    const topCustomers = customerStats.slice(0, 10);

    return ApiResponse.success({
      summary: summaryData,
      top_customers: topCustomers
    }, 'Customer statistics retrieved successfully');

  } catch (error) {
    console.error('Get customer stats error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve customer statistics', 500);
  }
}