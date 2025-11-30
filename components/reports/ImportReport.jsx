import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Table from '@/components/ui/Table';

const ImportReport = ({ data }) => {
    const { dailyImports = [], topSuppliers = [] } = data || {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const supplierColumns = [
        { header: 'Nhà cung cấp', accessor: 'name' },
        { header: 'Số lần nhập', accessor: 'count' },
        {
            header: 'Tổng giá trị',
            accessor: 'totalAmount',
            render: (value) => formatCurrency(value)
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Giá trị nhập hàng theo thời gian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyImports}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="amount" name="Giá trị nhập" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Nhà cung cấp</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table
                        columns={supplierColumns}
                        data={topSuppliers}
                        emptyMessage="Không có dữ liệu nhà cung cấp"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default ImportReport;
