import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Table from '@/components/ui/Table';

const PartnerReport = ({ data }) => {
    const { topCustomers = [], topSuppliers = [] } = data || {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const customerColumns = [
        { header: 'Khách hàng', accessor: 'name' },
        { header: 'Số điện thoại', accessor: 'phone' },
        { header: 'Số đơn hàng', accessor: 'orderCount' },
        {
            header: 'Tổng doanh thu',
            accessor: 'totalRevenue',
            render: (value) => formatCurrency(value)
        },
    ];

    const supplierColumns = [
        { header: 'Nhà cung cấp', accessor: 'name' },
        { header: 'Số điện thoại', accessor: 'phone' },
        { header: 'Số lần nhập', accessor: 'importCount' },
        {
            header: 'Tổng chi tiêu',
            accessor: 'totalSpend',
            render: (value) => formatCurrency(value)
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Top Khách hàng</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table
                        columns={customerColumns}
                        data={topCustomers}
                        emptyMessage="Không có dữ liệu khách hàng"
                    />
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

export default PartnerReport;
