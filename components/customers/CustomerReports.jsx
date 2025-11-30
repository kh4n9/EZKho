'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, DollarSign, Users } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const CustomerReports = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });

            const response = await fetch(`/api/dashboard/customers/reports?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading && !data) {
        return <div className="text-center py-8">Đang tải báo cáo...</div>;
    }

    const revenueData = [
        { name: 'Khách vãng lai', value: data?.walkInRevenue || 0 },
        { name: 'Khách đăng ký', value: data?.registeredRevenue || 0 },
    ];

    const COLORS = ['#FF8042', '#0088FE'];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Từ ngày:</span>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="border rounded px-2 py-1"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Đến ngày:</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="border rounded px-2 py-1"
                    />
                </div>
                <Button onClick={fetchReportData} size="sm">Làm mới</Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full mr-4">
                            <UserPlus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Khách hàng mới</p>
                            <h3 className="text-2xl font-bold">{data?.newCustomersCount || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center">
                        <div className="p-3 bg-green-100 rounded-full mr-4">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Khách quay lại</p>
                            <h3 className="text-2xl font-bold">{data?.returningCustomersCount || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center">
                        <div className="p-3 bg-orange-100 rounded-full mr-4">
                            <Users className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Doanh thu vãng lai</p>
                            <h3 className="text-lg font-bold">{formatCurrency(data?.walkInRevenue || 0)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center">
                        <div className="p-3 bg-purple-100 rounded-full mr-4">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Doanh thu khách quen</p>
                            <h3 className="text-lg font-bold">{formatCurrency(data?.registeredRevenue || 0)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Share Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tỷ trọng doanh thu</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Customers Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Khách hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data?.topCustomers || []}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} />
                                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="totalRevenue" fill="#82ca9d" name="Doanh thu" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Customers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Chi tiết Top Khách hàng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Khách hàng</th>
                                    <th className="px-6 py-3">Số điện thoại</th>
                                    <th className="px-6 py-3 text-right">Số đơn hàng</th>
                                    <th className="px-6 py-3 text-right">Tổng doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.topCustomers?.map((customer, index) => (
                                    <tr key={index} className="bg-white border-b">
                                        <td className="px-6 py-4 font-medium">{customer.name}</td>
                                        <td className="px-6 py-4">{customer.phone}</td>
                                        <td className="px-6 py-4 text-right">{customer.orderCount}</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                                            {formatCurrency(customer.totalRevenue)}
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.topCustomers || data.topCustomers.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            Chưa có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomerReports;
