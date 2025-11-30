import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Import, Export, Expense } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Get URL params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get recent activities
    const recentImports = await Import.find({
      user_id: user._id,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(Math.ceil(limit / 3))
      .select('import_id import_date total_imported_amt createdAt status')
      .lean();

    const recentExports = await Export.find({
      user_id: user._id,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(Math.ceil(limit / 3))
      .select('export_id export_date total_exported_amt customer createdAt status')
      .lean();

    const recentExpenses = await Expense.find({
      user_id: user._id,
      status: 'approved'
    })
      .sort({ createdAt: -1 })
      .limit(Math.ceil(limit / 3))
      .select('expense_id expense_type amount description createdAt status')
      .lean();

    // Combine and format activities
    const activities = [
      ...recentImports.map(item => ({
        id: item._id,
        type: 'import',
        reference: item.import_id,
        description: `Nhập hàng #${item.import_id}`,
        amount: item.total_imported_amt,
        date: item.import_date,
        createdAt: item.createdAt,
        status: item.status
      })),
      ...recentExports.map(item => ({
        id: item._id,
        type: 'export',
        reference: item.export_id,
        description: `Xuất hàng #${item.export_id} cho ${item.customer || 'khách hàng'}`,
        amount: item.total_exported_amt,
        date: item.export_date,
        createdAt: item.createdAt,
        status: item.status,
        customer: item.customer
      })),
      ...recentExpenses.map(item => ({
        id: item._id,
        type: 'expense',
        reference: item.expense_id,
        description: `Chi phí: ${item.description}`,
        amount: item.amount,
        expense_type: item.expense_type,
        date: item.expense_date,
        createdAt: item.createdAt,
        status: item.status
      }))
    ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

    return ApiResponse.success(activities, 'Activities retrieved successfully');

  } catch (error) {
    console.error('Get activities error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    // Return empty activities instead of error to avoid breaking the dashboard
    return ApiResponse.success([], 'No activities found');
  }
}