import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Expense } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET all expenses for authenticated user
export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const expense_type = searchParams.get('expense_type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const recurring = searchParams.get('recurring');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const sort_by = searchParams.get('sort_by') || 'expense_date';
    const sort_order = searchParams.get('sort_order') || 'desc';

    // Build query
    const query = { user_id: user._id };

    if (expense_type) {
      query.expense_type = expense_type;
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (recurring !== null && recurring !== undefined) {
      query.recurring = recurring === 'true';
    }

    if (start_date || end_date) {
      query.expense_date = {};
      if (start_date) {
        query.expense_date.$gte = new Date(start_date);
      }
      if (end_date) {
        query.expense_date.$lte = new Date(end_date);
      }
    }

    // Build sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const expenses = await Expense.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(query);

    return ApiResponse.success({
      expenses,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }, 'Expenses retrieved successfully');

  } catch (error) {
    console.error('Get expenses error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve expenses', 500);
  }
}

// POST create new expense
export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['expense_id', 'expense_type', 'amount', 'description'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return ApiResponse.validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if expense_id already exists for this user
    const existingExpense = await Expense.findOne({
      user_id: user._id,
      expense_id: body.expense_id.trim()
    });

    if (existingExpense) {
      return ApiResponse.error('Expense ID already exists', 409);
    }

    // Create expense data
    const expenseData = getValidatedFields(body, [
      'expense_id', 'expense_type', 'amount', 'description', 'category',
      'payment_method', 'recipient', 'invoice_number', 'related_product',
      'department', 'notes', 'status', 'recurring', 'recurring_period'
    ]);

    expenseData.user_id = user._id;
    expenseData.expense_id = expenseData.expense_id.trim();

    // Set default values
    expenseData.status = expenseData.status || 'approved';
    expenseData.recurring = expenseData.recurring || false;

    const expense = new Expense(expenseData);
    await expense.save();

    return ApiResponse.created(expense, 'Expense created successfully');

  } catch (error) {
    console.error('Create expense error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    if (error.code === 11000) {
      return ApiResponse.error('Expense ID already exists', 409);
    }

    return ApiResponse.error('Failed to create expense', 500);
  }
}