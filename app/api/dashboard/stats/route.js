import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product, Import, Export, Expense } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);
    const userId = new mongoose.Types.ObjectId(user._id);

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;


    // Get basic stats
    const [
      totalProducts,
      currentMonthImports,
      lastMonthImports,
      currentMonthExports,
      lastMonthExports,
      currentMonthExpenses,
      lastMonthExpenses
    ] = await Promise.all([
      Product.countDocuments({ user_id: userId, is_active: true }),

      // Current month imports
      Import.aggregate([
        {
          $match: {
            user_id: userId,
            import_date: {
              $gte: new Date(currentYear, currentMonth - 1, 1),
              $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59)
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$total_imported_amt' },
            totalQuantity: { $sum: '$qty_imported' }
          }
        }
      ]),

      // Last month imports
      Import.aggregate([
        {
          $match: {
            user_id: userId,
            import_date: {
              $gte: new Date(lastMonthYear, lastMonth - 1, 1),
              $lte: new Date(lastMonthYear, lastMonth, 0, 23, 59, 59)
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$total_imported_amt' },
            totalQuantity: { $sum: '$qty_imported' }
          }
        }
      ]),

      // Current month exports
      Export.aggregate([
        {
          $match: {
            user_id: userId,
            export_date: {
              $gte: new Date(currentYear, currentMonth - 1, 1),
              $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59)
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total_exported_amt' },
            totalProfit: { $sum: '$profit' },
            totalQuantity: { $sum: '$qty_exported' }
          }
        }
      ]),

      // Last month exports
      Export.aggregate([
        {
          $match: {
            user_id: userId,
            export_date: {
              $gte: new Date(lastMonthYear, lastMonth - 1, 1),
              $lte: new Date(lastMonthYear, lastMonth, 0, 23, 59, 59)
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total_exported_amt' },
            totalProfit: { $sum: '$profit' },
            totalQuantity: { $sum: '$qty_exported' }
          }
        }
      ]),

      // Current month expenses
      Expense.aggregate([
        {
          $match: {
            user_id: userId,
            expense_date: {
              $gte: new Date(currentYear, currentMonth - 1, 1),
              $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59)
            },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),

      // Last month expenses
      Expense.aggregate([
        {
          $match: {
            user_id: userId,
            expense_date: {
              $gte: new Date(lastMonthYear, lastMonth - 1, 1),
              $lte: new Date(lastMonthYear, lastMonth, 0, 23, 59, 59)
            },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ]);



    // Calculate totals
    const currentImports = currentMonthImports[0] || { totalAmount: 0, totalQuantity: 0 };
    const lastImports = lastMonthImports[0] || { totalAmount: 0, totalQuantity: 0 };
    const currentExports = currentMonthExports[0] || { totalRevenue: 0, totalProfit: 0, totalQuantity: 0 };
    const lastExports = lastMonthExports[0] || { totalRevenue: 0, totalProfit: 0, totalQuantity: 0 };
    const currentExpenses = currentMonthExpenses[0] || { totalAmount: 0 };
    const lastExpenses = lastMonthExpenses[0] || { totalAmount: 0 };

    // Calculate changes
    const importChange = lastImports.totalAmount > 0
      ? ((currentImports.totalAmount - lastImports.totalAmount) / lastImports.totalAmount * 100).toFixed(1)
      : 0;

    const exportChange = lastExports.totalRevenue > 0
      ? ((currentExports.totalRevenue - lastExports.totalRevenue) / lastExports.totalRevenue * 100).toFixed(1)
      : 0;

    const profitChange = lastExports.totalProfit > 0
      ? ((currentExports.totalProfit - lastExports.totalProfit) / Math.abs(lastExports.totalProfit) * 100).toFixed(1)
      : 0;

    // Get inventory value
    const inventoryValue = await Product.aggregate([
      {
        $match: {
          user_id: userId,
          is_active: true,
          current_stock: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$current_stock', '$average_cost'] } }
        }
      }
    ]);

    const totalInventoryValue = inventoryValue[0]?.totalValue || 0;

    // Get recent activity (last 10 items)
    const recentImports = await Import.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('import_id import_date total_imported_amt createdAt')
      .lean();

    const recentExports = await Export.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('export_id export_date total_exported_amt customer createdAt')
      .lean();

    const recentExpenses = await Expense.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('expense_id expense_type amount description createdAt')
      .lean();

    // Combine and format activities
    const activities = [
      ...recentImports.map(item => ({
        type: 'import',
        description: `Nhập hàng #${item.import_id}`,
        amount: item.total_imported_amt,
        createdAt: item.createdAt
      })),
      ...recentExports.map(item => ({
        type: 'export',
        description: `Xuất hàng #${item.export_id} cho ${item.customer || 'khách hàng'}`,
        amount: item.total_exported_amt,
        createdAt: item.createdAt
      })),
      ...recentExpenses.map(item => ({
        type: 'expense',
        description: `Chi phí: ${item.description}`,
        amount: item.amount,
        createdAt: item.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    const dashboardStats = {
      totalProducts,
      inventoryValue: totalInventoryValue,
      monthlyRevenue: currentExports.totalRevenue,
      monthlyProfit: currentExports.totalProfit,
      importChange: `${importChange > 0 ? '+' : ''}${importChange}%`,
      revenueChange: `${exportChange > 0 ? '+' : ''}${exportChange}%`,
      profitChange: `${profitChange > 0 ? '+' : ''}${profitChange}%`,
      importChangeType: importChange >= 0 ? 'positive' : 'negative',
      revenueChangeType: exportChange >= 0 ? 'positive' : 'negative',
      profitChangeType: profitChange >= 0 ? 'positive' : 'negative',
      activities
    };

    return ApiResponse.success(dashboardStats, 'Dashboard stats retrieved successfully');

  } catch (error) {
    console.error('Get dashboard stats error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    // Return default stats instead of error to avoid breaking the dashboard
    const defaultStats = {
      totalProducts: 0,
      inventoryValue: 0,
      monthlyRevenue: 0,
      monthlyProfit: 0,
      importChange: '0%',
      revenueChange: '0%',
      profitChange: '0%',
      importChangeType: 'positive',
      revenueChangeType: 'positive',
      profitChangeType: 'positive',
      activities: []
    };

    return ApiResponse.success(defaultStats, 'Default dashboard stats returned');
  }
}