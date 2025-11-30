import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET current user profile
export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Return user data without sensitive information
    const userResponse = user.toSafeObject();

    return ApiResponse.success(userResponse, 'User profile retrieved successfully');

  } catch (error) {
    console.error('Get user profile error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve user profile', 500);
  }
}

// PUT update current user profile
export async function PUT(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Update fields (exclude sensitive fields)
    const allowedFields = [
      'full_name', 'phone', 'store_name', 'store_address', 'store_phone', 'store_email',
      'preferences', 'settings'
    ];

    const updateData = getValidatedFields(body, allowedFields);

    // Validate email format if provided
    if (updateData.store_email) {
      updateData.store_email = updateData.store_email.trim().toLowerCase();
    }

    // Validate phone format if provided
    if (updateData.phone) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(updateData.phone.trim())) {
        return ApiResponse.validationError('Invalid phone number format');
      }
      updateData.phone = updateData.phone.trim();
    }

    if (updateData.store_phone) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(updateData.store_phone.trim())) {
        return ApiResponse.validationError('Invalid store phone number format');
      }
      updateData.store_phone = updateData.store_phone.trim();
    }

    // Trim string fields
    if (updateData.full_name) {
      updateData.full_name = updateData.full_name.trim();
    }

    if (updateData.store_name) {
      updateData.store_name = updateData.store_name.trim();
    }

    if (updateData.store_address) {
      updateData.store_address = updateData.store_address.trim();
    }

    Object.assign(user, updateData);
    await user.save();

    const userResponse = user.toSafeObject();

    return ApiResponse.success(userResponse, 'User profile updated successfully');

  } catch (error) {
    console.error('Update user profile error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    return ApiResponse.error('Failed to update user profile', 500);
  }
}