import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Check subscription status
    if (!user.isSubscriptionActive()) {
      return ApiResponse.error('Subscription expired', 403);
    }

    // Return user data without sensitive information
    const userResponse = user.toSafeObject();

    return ApiResponse.success(userResponse, 'User retrieved successfully');

  } catch (error) {
    console.error('Get user error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve user', 500);
  }
}