import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { InventoryCheck, Product } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        await connectToDatabase();
        const user = await authenticateUser(request);
        const userId = new mongoose.Types.ObjectId(user._id);

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        const query = { user_id: userId };

        if (search) {
            query.$or = [
                { check_code: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [checks, total] = await Promise.all([
            InventoryCheck.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            InventoryCheck.countDocuments(query)
        ]);

        return ApiResponse.success({
            checks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return ApiResponse.error(error.message);
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const user = await authenticateUser(request);
        const userId = new mongoose.Types.ObjectId(user._id);

        const data = await request.json();

        // Validate products
        if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
            throw new Error('Danh sách sản phẩm kiểm kho không được để trống');
        }

        // Generate check code
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

        const lastCheck = await InventoryCheck.findOne({
            user_id: userId,
            check_code: new RegExp(`^KK-${dateStr}-`)
        }).sort({ check_code: -1 });

        let sequence = 1;
        if (lastCheck) {
            const parts = lastCheck.check_code.split('-');
            sequence = parseInt(parts[2]) + 1;
        }

        const checkCode = `KK-${dateStr}-${String(sequence).padStart(3, '0')}`;

        // Create inventory check
        const inventoryCheck = await InventoryCheck.create({
            ...data,
            user_id: userId,
            check_code: checkCode,
            status: 'draft' // Always start as draft
        });

        return ApiResponse.created(inventoryCheck, 'Tạo phiếu kiểm kho thành công');
    } catch (error) {
        return ApiResponse.error(error.message);
    }
}
