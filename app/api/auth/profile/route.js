import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);

    return ApiResponse.success({
      user: user.toSafeObject()
    }, 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    return ApiResponse.error('Failed to retrieve profile', 500);
  }
}

export async function PUT(request) {
  try {
    const user = await authenticateUser(request);
    const body = await request.json();

    await connectToDatabase();

    // Find user and update
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        // User info
        full_name: body.full_name,
        phone: body.phone,

        // Store info
        store_name: body.store_name,
        store_address: body.store_address,
        store_phone: body.store_phone,
        store_email: body.store_email,

        // Preferences
        'preferences.language': body.language,
        'preferences.currency': body.currency,
        'preferences.timezone': body.timezone,

        // Settings
        'settings.low_stock_threshold': body.low_stock_threshold,
        'settings.auto_backup': body.auto_backup,
        'settings.email_notifications': body.email_notifications,
        'settings.low_stock_alerts': body.low_stock_alerts,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return ApiResponse.error('User not found', 404);
    }

    return ApiResponse.success({
      user: updatedUser.toSafeObject()
    }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return ApiResponse.error('Failed to update profile', 500);
  }
}