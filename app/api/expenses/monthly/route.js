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
    const month = parseInt(searchParams.get('month'));

    if (!year || !month) {
      return ApiResponse.validationError('Year and month are required');
    }

    // Get monthly totals by expense type
    const monthlyTotals = await Expense.aggregate([
      {
        $match: {
          user_id: user._id,
          expense_date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$expense_type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 },
          avg_amount: { $avg: '$amount' }
        }
      },
      {
        $sort: { total_amount: -1 }
      }
    ]);

    // Get expense summary by category
    const categorySummary = await Expense.aggregate([
      {
        $match: {
          user_id: user._id,
          expense_date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$category',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total_amount: -1 }
      }
    ]);

    // Get overall summary
    const summary = await Expense.aggregate([
      {
        $match: {
          user_id: user._id,
          expense_date: {
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0, 23, 59, 59)
          },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          total_expenses: { $sum: '$amount' },
          expense_count: { $sum: 1 },
          avg_expense_amount: { $avg: '$amount' },
          max_expense: { $max: '$amount' },
          min_expense: { $min: '$amount' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      total_expenses: 0,
      expense_count: 0,
      avg_expense_amount: 0,
      max_expense: 0,
      min_expense: 0
    };

    // Calculate percentages for monthly totals
    const totalExpenses = summaryData.total_expenses;
    const monthlyTotalsWithPercentage = monthlyTotals.map(item => ({
      expense_type: item._id,
      total_amount: item.total_amount,
      count: item.count,
      avg_amount: item.avg_amount,
      percentage: totalExpenses > 0 ? (item.total_amount / totalExpenses) * 100 : 0
    }));

    // Calculate percentages for category summary
    const categorySummaryWithPercentage = categorySummary.map(item => ({
      category: item._id,
      total_amount: item.total_amount,
      count: item.count,
      percentage: totalExpenses > 0 ? (item.total_amount / totalExpenses) * 100 : 0
    }));

    return ApiResponse.success({
      summary: summaryData,
      expense_breakdown: monthlyTotalsWithPercentage,
      category_breakdown: categorySummaryWithPercentage
    }, 'Monthly expense totals retrieved successfully');

  } catch (error) {
    console.error('Get monthly expenses error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve monthly expenses', 500);
  }
}