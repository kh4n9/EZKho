import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Customer, Export } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const user = await authenticateUser(request);
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const now = new Date();
        const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Ensure user._id is an ObjectId for aggregation
        const userId = new mongoose.Types.ObjectId(user._id);

        console.log('Report Params:', { userId, startDate, endDate });

        // 1. New Customers Count
        const newCustomersCount = await Customer.countDocuments({
            user_id: user._id,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // 2. Returning Customers (Active customers who bought in period but created before)
        // First find customers who bought in the period
        const customersWhoBought = await Export.distinct('customer_id', {
            user_id: user._id,
            export_date: { $gte: startDate, $lte: endDate },
            customer_id: { $ne: null },
            status: 'completed'
        });

        // Filter those who were created before startDate
        const returningCustomersCount = await Customer.countDocuments({
            _id: { $in: customersWhoBought },
            user_id: user._id,
            createdAt: { $lt: startDate }
        });

        // 3. Revenue Analysis
        const revenueStats = await Export.aggregate([
            {
                $match: {
                    user_id: userId,
                    export_date: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        isWalkIn: { $eq: [{ $ifNull: ['$customer_id', null] }, null] }
                    },
                    totalRevenue: { $sum: '$total_exported_amt' },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('Revenue Stats:', revenueStats);

        let walkInRevenue = 0;
        let registeredRevenue = 0;

        revenueStats.forEach(stat => {
            if (stat._id.isWalkIn) {
                walkInRevenue = stat.totalRevenue;
            } else {
                registeredRevenue = stat.totalRevenue;
            }
        });

        // 4. Top Customers
        const topCustomers = await Export.aggregate([
            {
                $match: {
                    user_id: userId,
                    export_date: { $gte: startDate, $lte: endDate },
                    customer_id: { $ne: null },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$customer_id',
                    totalRevenue: { $sum: '$total_exported_amt' },
                    orderCount: { $sum: 1 },
                    snapshotName: { $first: '$customer' }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customerInfo'
                }
            },
            { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: { $ifNull: ['$customerInfo.name', '$snapshotName', 'Khách hàng không xác định'] },
                    phone: { $ifNull: ['$customerInfo.phone', ''] },
                    totalRevenue: 1,
                    orderCount: 1
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);

        console.log('Top Customers:', topCustomers);

        return ApiResponse.success({
            newCustomersCount,
            returningCustomersCount,
            walkInRevenue,
            registeredRevenue,
            topCustomers,
            dateRange: { startDate, endDate }
        });

    } catch (error) {
        console.error('Report Error:', error);
        return ApiResponse.error(error);
    }
}
