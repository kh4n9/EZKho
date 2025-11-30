import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User, Product, Import, Export, Expense } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser, authorize } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate and authorize (only admin can see stats)
    const user = await authorize(['admin'])(request);

    // Get overall user statistics
    const userStats = await User.getUserStats();

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get active users count
    const activeUsers = await User.countDocuments({ is_active: true });

    // Get users by subscription plan
    const usersByPlan = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 },
          active_count: {
            $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get expired subscriptions
    const expiredSubscriptions = await User.findExpiredSubscriptions();

    // Get registration trends (last 12 months)
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear - 1, currentMonth - 1, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get recent activity summary
    const recentActivity = await Promise.all([
      Product.countDocuments(),
      Import.countDocuments(),
      Export.countDocuments(),
      Expense.countDocuments()
    ]);

    return ApiResponse.success({
      user_stats: userStats,
      active_users: activeUsers,
      users_by_plan: usersByPlan,
      expired_subscriptions: expiredSubscriptions.length,
      registration_trend: registrationTrend,
      activity_summary: {
        total_products: recentActivity[0],
        total_imports: recentActivity[1],
        total_exports: recentActivity[2],
        total_expenses: recentActivity[3]
      }
    }, 'User statistics retrieved successfully');

  } catch (error) {
    console.error('Get user stats error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.message.includes('Insufficient permissions')) {
      return ApiResponse.forbidden(error.message);
    }

    return ApiResponse.error('Failed to retrieve user statistics', 500);
  }
}