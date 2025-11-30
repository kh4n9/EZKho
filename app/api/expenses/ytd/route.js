import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Expense } from '@/models';
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

    if (!year) {
      return ApiResponse.validationError('Year is required');
    }

    // Get year-to-date expenses by month
    const ytdExpenses = await Expense.aggregate([
      {
        $match: {
          user_id: user._id,
          expense_date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59)
          },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$expense_date' },
            month: { $month: '$expense_date' }
          },
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          total_amount: 1,
          count: 1
        }
      }
    ]);

    // Get YTD summary
    const ytdSummary = await Expense.aggregate([
      {
        $match: {
          user_id: user._id,
          expense_date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59)
          },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          total_expenses: { $sum: '$amount' },
          expense_count: { $sum: 1 },
          avg_monthly_expense: { $avg: '$amount' }
        }
      }
    ]);

    const summaryData = ytdSummary[0] || {
      total_expenses: 0,
      expense_count: 0,
      avg_monthly_expense: 0
    };

    return ApiResponse.success({
      summary: summaryData,
      monthly_breakdown: ytdExpenses
    }, 'Year-to-date expenses retrieved successfully');

  } catch (error) {
    console.error('Get YTD expenses error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve year-to-date expenses', 500);
  }
}