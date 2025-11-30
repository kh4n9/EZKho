import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Expense } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET single expense by ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const expense = await Expense.findOne({
      _id: params.id,
      user_id: user._id
    });

    if (!expense) {
      return ApiResponse.notFound('Expense not found');
    }

    return ApiResponse.success(expense, 'Expense retrieved successfully');

  } catch (error) {
    console.error('Get expense error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve expense', 500);
  }
}

// PUT update expense
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Find expense
    const expense = await Expense.findOne({
      _id: params.id,
      user_id: user._id
    });

    if (!expense) {
      return ApiResponse.notFound('Expense not found');
    }

    // Update fields
    const allowedFields = [
      'expense_type', 'amount', 'description', 'category',
      'payment_method', 'recipient', 'invoice_number', 'related_product',
      'department', 'notes', 'status', 'recurring', 'recurring_period'
    ];

    const updateData = getValidatedFields(body, allowedFields);

    // Handle expense_id change with validation
    if (body.expense_id && body.expense_id !== expense.expense_id) {
      const existingExpense = await Expense.findOne({
        user_id: user._id,
        expense_id: body.expense_id.trim(),
        _id: { $ne: params.id }
      });

      if (existingExpense) {
        return ApiResponse.error('Expense ID already exists', 409);
      }

      updateData.expense_id = body.expense_id.trim();
    }

    Object.assign(expense, updateData);
    await expense.save();

    return ApiResponse.success(expense, 'Expense updated successfully');

  } catch (error) {
    console.error('Update expense error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    return ApiResponse.error('Failed to update expense', 500);
  }
}

// DELETE expense
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const expense = await Expense.findOne({
      _id: params.id,
      user_id: user._id
    });

    if (!expense) {
      return ApiResponse.notFound('Expense not found');
    }

    await Expense.findByIdAndDelete(params.id);

    return ApiResponse.noContent('Expense deleted successfully');

  } catch (error) {
    console.error('Delete expense error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to delete expense', 500);
  }
}