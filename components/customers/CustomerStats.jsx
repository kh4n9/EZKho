'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, TrendingUp } from 'lucide-react';

const CustomerStats = ({ stats }) => {
    const { totalCustomers = 0, activeCustomers = 0, newThisMonth = 0 } = stats || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng khách hàng</p>
                            <p className="text-2xl font-semibold text-gray-900">{totalCustomers}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                            <p className="text-2xl font-semibold text-gray-900">{activeCustomers}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <UserPlus className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Mới tháng này</p>
                            <p className="text-2xl font-semibold text-gray-900">{newThisMonth}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomerStats;
