import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Customer } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query = { user_id: user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customer_code: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query)
    ]);

    // Get stats for the top cards
    const stats = await Customer.aggregate([
      { $match: { user_id: user._id } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          newThisMonth: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return ApiResponse.success({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || { totalCustomers: 0, activeCustomers: 0, newThisMonth: 0 }
    });

  } catch (error) {
    return ApiResponse.error(error);
  }
}

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();

    const data = await request.json();

    // Sanitize data: remove empty strings for optional fields to avoid validation errors
    const cleanData = { ...data };
    ['phone', 'email', 'address', 'customer_code'].forEach(field => {
      if (cleanData[field] === '') {
        delete cleanData[field];
      }
    });

    // Check if phone or email already exists for this user
    if (cleanData.phone) {
      const existingPhone = await Customer.findOne({
        user_id: user._id,
        phone: cleanData.phone
      });
      if (existingPhone) {
        throw new Error('Số điện thoại đã tồn tại');
      }
    }

    if (cleanData.email) {
      const existingEmail = await Customer.findOne({
        user_id: user._id,
        email: cleanData.email
      });
      if (existingEmail) {
        throw new Error('Email đã tồn tại');
      }
    }

    const customer = await Customer.create({
      ...cleanData,
      user_id: user._id,
      created_by: user.name || 'System'
    });

    return ApiResponse.created(customer, 'Thêm khách hàng thành công');

  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.error('Dữ liệu không hợp lệ', 400, errors);
    }
    return ApiResponse.error(error.message || 'Có lỗi xảy ra khi tạo khách hàng');
  }
}