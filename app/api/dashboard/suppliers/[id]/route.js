import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Supplier } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();
    const { id } = await params;

    const supplier = await Supplier.findOne({
      _id: id,
      user_id: user._id
    });

    if (!supplier) {
      return ApiResponse.notFound('Supplier not found');
    }

    return ApiResponse.success(supplier);

  } catch (error) {
    return ApiResponse.error(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();
    const { id } = await params;

    const body = await request.json();

    const supplier = await Supplier.findOne({
      _id: id,
      user_id: user._id
    });

    if (!supplier) {
      return ApiResponse.notFound('Supplier not found');
    }

    // Check for duplicates if updating phone/email
    if ((body.phone && body.phone !== supplier.phone) || (body.email && body.email !== supplier.email)) {
      const duplicateQuery = {
        user_id: user._id,
        _id: { $ne: id },
        $or: []
      };
      if (body.phone) duplicateQuery.$or.push({ phone: body.phone });
      if (body.email) duplicateQuery.$or.push({ email: body.email });

      if (duplicateQuery.$or.length > 0) {
        const existing = await Supplier.findOne(duplicateQuery);
        if (existing) {
          return ApiResponse.error('Supplier with this phone or email already exists', 409);
        }
      }
    }

    Object.assign(supplier, body);
    await supplier.save();

    return ApiResponse.success(supplier);

  } catch (error) {
    return ApiResponse.error(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();
    const { id } = await params;

    const supplier = await Supplier.findOneAndDelete({
      _id: id,
      user_id: user._id
    });

    if (!supplier) {
      return ApiResponse.notFound('Supplier not found');
    }

    return ApiResponse.success({ message: 'Supplier deleted successfully' });

  } catch (error) {
    return ApiResponse.error(error);
  }
}
