import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Table from '@/components/ui/Table';

const InventoryReport = ({ data }) => {
    const { inventoryValue = [] } = data || {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const inventoryColumns = [
        { header: 'Sản phẩm', accessor: 'name' },
        { header: 'Tồn kho', accessor: 'stock' },
        {
            header: 'Giá trị tồn kho',
            accessor: 'value',
            render: (value) => formatCurrency(value)
        },
    ];

    const checkColumns = [
        {
            header: 'Ngày kiểm',
            accessor: 'date',
            render: (value) => new Date(value).toLocaleDateString('vi-VN')
        },
        { header: 'Người kiểm', accessor: 'checker' },
        { header: 'Số SP kiểm', accessor: 'totalProducts' },
        { header: 'Chênh lệch', accessor: 'totalVariance' },
        {
            header: 'Trạng thái',
            accessor: 'status',
            render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${value === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {value === 'completed' ? 'Hoàn thành' : 'Đang kiểm'}
                </span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Giá trị tồn kho theo sản phẩm</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table
                        columns={inventoryColumns}
                        data={inventoryValue}
                        emptyMessage="Không có dữ liệu tồn kho"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử kiểm kho gần đây</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table
                        columns={checkColumns}
                        data={data.recentChecks || []}
                        emptyMessage="Chưa có phiếu kiểm kho nào"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default InventoryReport;
