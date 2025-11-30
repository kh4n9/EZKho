import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Table from '@/components/ui/Table';

const ExportReport = ({ data }) => {
    const { dailyExports = [], topCustomers = [] } = data || {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const customerColumns = [
        { header: 'Khách hàng', accessor: 'name' },
        { header: 'Số đơn hàng', accessor: 'count' },
        {
            header: 'Doanh thu',
            accessor: 'totalRevenue',
            render: (value) => formatCurrency(value)
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Doanh thu và Lợi nhuận theo thời gian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyExports}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3b82f6" />
                                <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#10b981" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Khách hàng (Doanh thu)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table
                        columns={customerColumns}
                        data={topCustomers}
                        emptyMessage="Không có dữ liệu khách hàng"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default ExportReport;
