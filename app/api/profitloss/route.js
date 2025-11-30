import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ProfitLoss } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

// GET profit/loss reports for authenticated user
export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));
    const sort_by = searchParams.get('sort_by') || 'period_year';
    const sort_order = searchParams.get('sort_order') || 'desc';

    // Build query
    const query = { user_id: user._id };

    if (year) {
      query.period_year = year;
    }

    if (month) {
      query.period_month = month;
    }

    // Build sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const profitLoss = await ProfitLoss.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ProfitLoss.countDocuments(query);

    return ApiResponse.success({
      profit_loss: profitLoss,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }, 'Profit/Loss reports retrieved successfully');

  } catch (error) {
    console.error('Get profit/loss error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve profit/loss reports', 500);
  }
}

// POST calculate profit/loss for a specific period
export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['year', 'month'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return ApiResponse.validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const { year, month } = body;

    // Validate year and month
    if (year < 2020 || year > 2030) {
      return ApiResponse.validationError('Year must be between 2020 and 2030');
    }

    if (month < 1 || month > 12) {
      return ApiResponse.validationError('Month must be between 1 and 12');
    }

    // Calculate profit/loss for the period (modified to include user_id)
    const calculateProfitLossForUser = async (userId, year, month) => {
      const Export = mongoose.model('Export');
      const Expense = mongoose.model('Expense');
      const Inventory = mongoose.model('Inventory');
      const Product = mongoose.model('Product');

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Calculate total revenue from exports
      const revenueData = await Export.aggregate([
        {
          $match: {
            user_id: userId,
            export_date: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total_revenue: { $sum: '$total_exported_amt' },
            total_orders: { $sum: 1 },
            cost_of_goods_sold: {
              $sum: { $multiply: ['$qty_exported', '$cost_price'] }
            }
          }
        }
      ]);

      // Calculate total expenses
      const expenseData = await Expense.aggregate([
        {
          $match: {
            user_id: userId,
            expense_date: { $gte: startDate, $lte: endDate },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            total_expenses: { $sum: '$amount' }
          }
        }
      ]);

      // Get expense breakdown by type
      const expenseBreakdown = await Expense.aggregate([
        {
          $match: {
            user_id: userId,
            expense_date: { $gte: startDate, $lte: endDate },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: '$expense_type',
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { amount: -1 }
        }
      ]);

      // Get top selling products
      const topProducts = await Export.aggregate([
        {
          $match: {
            user_id: userId,
            export_date: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$product_id',
            quantity: { $sum: '$qty_exported' },
            revenue: { $sum: '$total_exported_amt' }
          }
        },
        {
          $sort: { revenue: -1 }
        },
        {
          $limit: 10
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
            quantity: 1,
            revenue: 1
          }
        }
      ]);

      const revenue = revenueData[0] || { total_revenue: 0, total_orders: 0, cost_of_goods_sold: 0 };
      const expenses = expenseData[0] || { total_expenses: 0 };

      // Calculate expense percentages
      const totalExpenses = expenses.total_expenses;
      const expenseBreakdownWithPercentage = expenseBreakdown.map(item => ({
        expense_type: item._id,
        amount: item.amount,
        percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
      }));

      // Get inventory change
      const currentInventory = await Inventory.findOne({
        user_id: userId,
        period_year: year,
        period_month: month
      });

      let inventoryChange = 0;
      if (currentInventory) {
        const prevInventory = await Inventory.findOne({
          user_id: userId,
          $or: [
            { period_year: { $lt: year } },
            { period_year: year, period_month: { $lt: month } }
          ]
        }).sort({ period_year: -1, period_month: -1 });

        if (prevInventory) {
          inventoryChange = currentInventory.closing_value - prevInventory.closing_value;
        }
      }

      const profitLossData = {
        user_id: userId,
        period_year: year,
        period_month: month,
        total_revenue: revenue.total_revenue,
        cost_of_goods_sold: revenue.cost_of_goods_sold,
        total_expenses: expenses.total_expenses,
        total_orders: revenue.total_orders,
        inventory_change: inventoryChange,
        top_selling_products: topProducts,
        expense_breakdown: expenseBreakdownWithPercentage,
        last_updated: new Date()
      };

      // Update or create profit/loss record
      return ProfitLoss.findOneAndUpdate(
        { user_id: userId, period_year: year, period_month: month },
        profitLossData,
        { upsert: true, new: true }
      );
    };

    const calculatedProfitLoss = await calculateProfitLossForUser(user._id, year, month);

    return ApiResponse.created({
      profit_loss: calculatedProfitLoss,
      period: { year, month }
    }, 'Profit/Loss calculated successfully');

  } catch (error) {
    console.error('Calculate profit/loss error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to calculate profit/loss', 500);
  }
}