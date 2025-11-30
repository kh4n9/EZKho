import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { InventoryCheck, Product } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
    try {
        await connectToDatabase();
        const user = await authenticateUser(request);
        const { id } = await params;

        const check = await InventoryCheck.findOne({
            _id: id,
            user_id: user._id
        }).lean();

        if (!check) {
            return ApiResponse.notFound('Không tìm thấy phiếu kiểm kho');
        }

        return ApiResponse.success(check);
    } catch (error) {
        return ApiResponse.error(error.message);
    }
}

export async function PUT(request, { params }) {
    try {
        await connectToDatabase();
        const user = await authenticateUser(request);
        const { id } = await params;
        const data = await request.json();

        const check = await InventoryCheck.findOne({
            _id: id,
            user_id: user._id
        });

        if (!check) {
            return ApiResponse.notFound('Không tìm thấy phiếu kiểm kho');
        }

        if (check.status === 'completed' || check.status === 'cancelled') {
            throw new Error('Không thể chỉnh sửa phiếu đã hoàn thành hoặc đã hủy');
        }

        // If status is changing to completed, update product stocks
        if (data.status === 'completed' && check.status !== 'completed') {
            // Update check status
            Object.assign(check, data);
            await check.save();

            // Update product stocks
            for (const item of check.products) {
                const product = await Product.findById(item.product_id);
                if (product) {
                    await Product.findByIdAndUpdate(
                        item.product_id,
                        {
                            $set: {
                                current_stock: item.actual_stock,
                                total_value: item.actual_stock * product.average_cost
                            }
                        }
                    );
                }
            }
        } else {
            // Normal update
            Object.assign(check, data);
            await check.save();
        }

        return ApiResponse.success(check, 'Cập nhật phiếu kiểm kho thành công');
    } catch (error) {
        return ApiResponse.error(error.message);
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectToDatabase();
        const user = await authenticateUser(request);
        const { id } = await params;

        const check = await InventoryCheck.findOne({
            _id: id,
            user_id: user._id
        });

        if (!check) {
            return ApiResponse.notFound('Không tìm thấy phiếu kiểm kho');
        }

        if (check.status === 'completed') {
            throw new Error('Không thể xóa phiếu đã hoàn thành');
        }

        await InventoryCheck.deleteOne({ _id: id });

        return ApiResponse.success(null, 'Xóa phiếu kiểm kho thành công');
    } catch (error) {
        return ApiResponse.error(error.message);
    }
}
