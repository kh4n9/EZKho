import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Supplier } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const query = { user_id: user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplier_code: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [suppliers, total] = await Promise.all([
      Supplier.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Supplier.countDocuments(query)
    ]);

    return ApiResponse.success({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return ApiResponse.error(error.message || 'Failed to fetch suppliers');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    await connectToDatabase();

    const body = await request.json();

    // Check for duplicate phone or email if provided
    if (body.phone || body.email) {
      const duplicateQuery = {
        user_id: user._id,
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

    const supplier = await Supplier.create({
      ...body,
      user_id: user._id
    });

    return ApiResponse.created(supplier);

  } catch (error) {
    return ApiResponse.error(error.message || 'Failed to create supplier');
  }
}