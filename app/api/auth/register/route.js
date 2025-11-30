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
    const requiredFields = ['username', 'email', 'password', 'full_name', 'store_name'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return ApiResponse.validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: body.email }, { username: body.username }]
    });

    if (existingUser) {
      return ApiResponse.error('User with this email or username already exists', 409);
    }

    // Check subscription limits for free plan
    if (body.subscription?.plan === 'free') {
      const activeUsers = await User.countDocuments({
        'subscription.plan': 'free',
        'subscription.status': 'active',
        is_active: true
      });

      // You can set a limit for free users
      const FREE_USER_LIMIT = 100;
      if (activeUsers >= FREE_USER_LIMIT) {
        return ApiResponse.error('Free user limit reached', 429);
      }
    }

    // Create new user
    const userData = {
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      full_name: body.full_name.trim(),
      phone: body.phone?.trim() || '',
      store_name: body.store_name.trim(),
      store_address: body.store_address?.trim() || '',
      store_phone: body.store_phone?.trim() || '',
      store_email: body.store_email?.trim().toLowerCase() || '',
      role: body.role || 'owner',
      preferences: {
        language: body.preferences?.language || 'vi',
        currency: body.preferences?.currency || 'VND',
        timezone: body.preferences?.timezone || 'Asia/Ho_Chi_Minh',
        theme: body.preferences?.theme || 'light'
      },
      settings: {
        low_stock_threshold: body.settings?.low_stock_threshold || 100,
        auto_backup: body.settings?.auto_backup !== false,
        email_notifications: body.settings?.email_notifications !== false,
        low_stock_alerts: body.settings?.low_stock_alerts !== false
      },
      subscription: {
        plan: body.subscription?.plan || 'free',
        status: 'active',
        max_products: body.subscription?.max_products || 50,
        max_users: body.subscription?.max_users || 1
      }
    };

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    const userResponse = user.toSafeObject();

    return ApiResponse.created({
      user: userResponse,
      token
    }, 'User registered successfully');

  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ApiResponse.error(`${field} already exists`, 409);
    }

    return ApiResponse.error('Registration failed', 500);
  }
}