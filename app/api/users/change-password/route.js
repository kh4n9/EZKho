import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Validate required fields
    if (!body.current_password || !body.new_password) {
      return ApiResponse.validationError('Current password and new password are required');
    }

    // Validate new password
    if (body.new_password.length < 6) {
      return ApiResponse.validationError('New password must be at least 6 characters long');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(body.current_password);
    if (!isCurrentPasswordValid) {
      return ApiResponse.error('Current password is incorrect', 400);
    }

    // Update password
    user.password = body.new_password;
    await user.save();

    return ApiResponse.success(null, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to change password', 500);
  }
}