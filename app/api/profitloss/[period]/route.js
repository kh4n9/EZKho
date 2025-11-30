import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ProfitLoss } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

// GET profit/loss for specific period
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse period from params (format: "YYYY-MM")
    const period = params.period;
    const [year, month] = period.split('-').map(Number);

    if (!year || !month || month < 1 || month > 12) {
      return ApiResponse.validationError('Invalid period format. Use YYYY-MM');
    }

    const profitLoss = await ProfitLoss.findOne({
      user_id: user._id,
      period_year: year,
      period_month: month
    });

    if (!profitLoss) {
      return ApiResponse.notFound('Profit/Loss data not found for this period');
    }

    return ApiResponse.success(profitLoss, 'Profit/Loss retrieved successfully');

  } catch (error) {
    console.error('Get profit/loss period error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve profit/loss data', 500);
  }
}

// DELETE profit/loss for specific period
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse period from params (format: "YYYY-MM")
    const period = params.period;
    const [year, month] = period.split('-').map(Number);

    if (!year || !month || month < 1 || month > 12) {
      return ApiResponse.validationError('Invalid period format. Use YYYY-MM');
    }

    const profitLoss = await ProfitLoss.findOne({
      user_id: user._id,
      period_year: year,
      period_month: month
    });

    if (!profitLoss) {
      return ApiResponse.notFound('Profit/Loss data not found for this period');
    }

    await ProfitLoss.deleteOne({
      user_id: user._id,
      period_year: year,
      period_month: month
    });

    return ApiResponse.noContent('Profit/Loss data deleted successfully');

  } catch (error) {
    console.error('Delete profit/loss error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to delete profit/loss data', 500);
  }
}