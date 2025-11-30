import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Table from '@/components/ui/Table';

const FinancialReport = ({ data }) => {
    const { timeline = [], expenseBreakdown = [] } = data || {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const expenseColumns = [
        { header: 'Loại chi phí', accessor: 'category' },
        {
            header: 'Số tiền',
            accessor: 'amount',
            render: (value) => formatCurrency(value)
        },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Doanh thu vs Chi phí</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Doanh thu" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                                <Area type="monotone" dataKey="expense" name="Chi phí" stackId="2" stroke="#ef4444" fill="#ef4444" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Phân bổ chi phí</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="amount"
                                        nameKey="category"
                                    >
                                        {expenseBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Chi tiết chi phí</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table
                            columns={expenseColumns}
                            data={expenseBreakdown}
                            emptyMessage="Không có dữ liệu chi phí"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinancialReport;
