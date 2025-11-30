import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Customer } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();

    // Await params before using them
    const { id } = await params;

    const customer = await Customer.findOne({
      _id: id,
      user_id: user._id
    });

    if (!customer) {
      throw new Error('Khách hàng không tồn tại');
    }

    // Get recent orders for this customer
    // Note: This assumes you have an Export model. If not, remove this part.
    // const recentOrders = await Export.find({ customer_id: id }).sort({ createdAt: -1 }).limit(5);

    return ApiResponse.success({
      customer,
      // recentOrders
    });

  } catch (error) {
    return ApiResponse.error(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();

    // Await params before using them
    const { id } = await params;
    const data = await request.json();

    const customer = await Customer.findOneAndUpdate(
      { _id: id, user_id: user._id },
      { ...data },
      { new: true, runValidators: true }
    );

    if (!customer) {
      throw new Error('Khách hàng không tồn tại');
    }

    return ApiResponse.success(customer, 'Cập nhật thông tin thành công');

  } catch (error) {
    return ApiResponse.error(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();

    // Await params before using them
    const { id } = await params;

    // Instead of hard delete, we can soft delete or check for dependencies
    // For now, let's just delete
    const customer = await Customer.findOneAndDelete({
      _id: id,
      user_id: user._id
    });

    if (!customer) {
      throw new Error('Khách hàng không tồn tại');
    }

    return ApiResponse.success(null, 'Xóa khách hàng thành công');

  } catch (error) {
    return ApiResponse.error(error);
  }
}