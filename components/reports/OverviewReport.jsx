import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import BusinessTrendsChart from './BusinessTrendsChart';

const OverviewReport = ({ data }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const getSafeValue = (value, defaultValue = 0) => {
        return value !== undefined && value !== null ? value : defaultValue;
    };

    const getSafeArray = (value, defaultValue = []) => {
        return Array.isArray(value) ? value : defaultValue;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {formatCurrency(getSafeValue(data.totalRevenue))}
                                </p>
                                <div className="flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-green-500">+12.5%</span>
                                    <span className="text-gray-500 ml-1">so với tháng trước</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Lợi nhuận</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {formatCurrency(getSafeValue(data.netProfit) || getSafeValue(data.totalProfit))}
                                </p>
                                <div className="flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-green-500">+8.3%</span>
                                    <span className="text-gray-500 ml-1">so với tháng trước</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingDown className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Chi phí</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {formatCurrency(getSafeValue(data.totalExpenses))}
                                </p>
                                <div className="flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                                    <span className="text-red-500">+5.2%</span>
                                    <span className="text-gray-500 ml-1">so với tháng trước</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Tổng giao dịch</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {getSafeValue(data.totalImports) + getSafeValue(data.totalExports)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {getSafeValue(data.totalImports)} nhập / {getSafeValue(data.totalExports)} xuất
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Package className="h-5 w-5 mr-2" />
                            Sản phẩm bán chạy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {getSafeArray(data.topSellingProducts).length > 0 ? (
                                getSafeArray(data.topSellingProducts).map((product, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name || 'Sản phẩm không tên'}</p>
                                            <p className="text-sm text-gray-500">{getSafeValue(product.totalQuantity)} đơn vị</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{formatCurrency(getSafeValue(product.totalRevenue))}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Chưa có dữ liệu sản phẩm bán chạy</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Cảnh báo tồn kho
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Hết hàng</p>
                                        <p className="text-sm text-gray-500">{getSafeValue(data.outOfStockProducts)} sản phẩm</p>
                                    </div>
                                </div>
                                <span className="text-red-600 font-medium">{getSafeValue(data.outOfStockProducts)}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Sắp hết hàng</p>
                                        <p className="text-sm text-gray-500">{getSafeValue(data.lowStockProducts)} sản phẩm</p>
                                    </div>
                                </div>
                                <span className="text-yellow-600 font-medium">{getSafeValue(data.lowStockProducts)}</span>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Khuyến nghị:</strong> Cần nhập hàng cho các sản phẩm sắp hết hàng để tránh gián đoạn kinh doanh.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Xu hướng kinh doanh</CardTitle>
                </CardHeader>
                <CardContent>
                    <BusinessTrendsChart data={getSafeArray(data.salesTrend)} />
                </CardContent>
            </Card>
        </div>
    );
};

export default OverviewReport;
