import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return ApiResponse.validationError('Email and password are required');
    }

    // Find user by email
    const user = await User.findOne({
      email: body.email.trim().toLowerCase(),
      is_active: true
    });

    if (!user) {
      return ApiResponse.unauthorized('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(body.password);
    if (!isPasswordValid) {
      return ApiResponse.unauthorized('Invalid email or password');
    }

    // Check subscription status
    if (!user.isSubscriptionActive()) {
      return ApiResponse.error('Subscription expired', 403);
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    const userResponse = user.toSafeObject();

    return ApiResponse.success({
      user: userResponse,
      token
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.error('Login failed', 500);
  }
}