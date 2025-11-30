import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Check subscription status
    if (!user.isSubscriptionActive()) {
      return ApiResponse.error('Subscription expired', 403);
    }

    // Generate new token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    const userResponse = user.toSafeObject();

    return ApiResponse.success({
      user: userResponse,
      token
    }, 'Token refreshed successfully');

  } catch (error) {
    console.error('Token refresh error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to refresh token', 500);
  }
}