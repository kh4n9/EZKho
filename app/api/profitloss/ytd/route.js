import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ProfitLoss } from '@/models';
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

    // Get year-to-date profit/loss summary
    const ytdSummary = await ProfitLoss.aggregate([
      {
        $match: {
          user_id: user._id,
          period_year: year
        }
      },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: '$total_revenue' },
          cost_of_goods_sold: { $sum: '$cost_of_goods_sold' },
          gross_profit: { $sum: '$gross_profit' },
          total_expenses: { $sum: '$total_expenses' },
          net_profit: { $sum: '$net_profit' },
          total_orders: { $sum: '$total_orders' },
          avg_monthly_revenue: { $avg: '$total_revenue' },
          avg_monthly_profit: { $avg: '$net_profit' }
        }
      }
    ]);

    const summaryData = ytdSummary[0] || {
      total_revenue: 0,
      cost_of_goods_sold: 0,
      gross_profit: 0,
      total_expenses: 0,
      net_profit: 0,
      total_orders: 0,
      avg_monthly_revenue: 0,
      avg_monthly_profit: 0
    };

    // Get monthly trend for the year
    const monthlyTrend = await ProfitLoss.find({
      user_id: user._id,
      period_year: year
    })
      .sort({ period_month: 1 })
      .select('period_month total_revenue gross_profit net_profit total_orders');

    // Calculate profit margins
    const grossProfitMargin = summaryData.total_revenue > 0
      ? (summaryData.gross_profit / summaryData.total_revenue) * 100
      : 0;
    const netProfitMargin = summaryData.total_revenue > 0
      ? (summaryData.net_profit / summaryData.total_revenue) * 100
      : 0;

    return ApiResponse.success({
      summary: {
        ...summaryData,
        gross_profit_margin: grossProfitMargin,
        net_profit_margin: netProfitMargin
      },
      monthly_trend: monthlyTrend
    }, 'Year-to-date profit/loss summary retrieved successfully');

  } catch (error) {
    console.error('Get YTD profit/loss error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve year-to-date profit/loss summary', 500);
  }
}