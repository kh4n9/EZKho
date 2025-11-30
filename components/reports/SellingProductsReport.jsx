'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  ArrowUp, 
  ArrowDown,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  Area,
  AreaChart as ReAreaChart,
  ResponsiveContainer
} from 'recharts';

const SellingProductsReport = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('revenue');
  const [selectedLimit, setSelectedLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const periodOptions = [
    { value: 'current_month', label: 'Tháng hiện tại' },
    { value: 'last_month', label: 'Tháng trước' },
    { value: 'last_3_months', label: '3 tháng gần nhất' },
    { value: 'last_6_months', label: '6 tháng gần nhất' },
    { value: 'current_year', label: 'Năm hiện tại' },
    { value: 'custom', label: 'Tùy chỉnh' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'gao', label: 'Gạo' },
    { value: 'nong_san', label: 'Nông sản' },
    { value: 'khac', label: 'Khác' },
  ];

  const sortOptions = [
    { value: 'revenue', label: 'Doanh thu' },
    { value: 'quantity', label: 'Số lượng' },
    { value: 'profit', label: 'Lợi nhuận' },
    { value: 'name', label: 'Tên sản phẩm' },
  ];

  const limitOptions = [
    { value: 5, label: 'Top 5' },
    { value: 10, label: 'Top 10' },
    { value: 20, label: 'Top 20' },
    { value: 50, label: 'Top 50' },
    { value: 100, label: 'Top 100' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Fetch reports data
  const fetchSellingProductsData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để xem báo cáo');
      }

      console.log('SellingProductsReport: Fetching data with params:', { 
        selectedPeriod, selectedCategory, selectedSort, selectedLimit, customStartDate, customEndDate 
      });

      const queryParams = new URLSearchParams({
        period: selectedPeriod,
        type: 'products_detail',
        category: selectedCategory,
        sort: selectedSort,
        limit: selectedLimit
      });

      // Add custom dates if period is custom
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        queryParams.append('startDate', customStartDate);
        queryParams.append('endDate', customEndDate);
      }

      const response = await fetch(`/api/dashboard/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('SellingProductsReport: Response status:', response.status);

      const data = await response.json();
      console.log('SellingProductsReport: Response data:', data);

      if (response.ok && data.success) {
        setReportData(data.data);
        console.log('SellingProductsReport: Data set successfully');
      } else {
        throw new Error(data.message || 'Không thể tải dữ liệu báo cáo');
      }
    } catch (err) {
      console.error('SellingProductsReport: Fetch reports error:', err);
      setError(err.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    fetchSellingProductsData();
  }, [selectedPeriod, selectedCategory, selectedSort, selectedLimit, customStartDate, customEndDate]);

  const handleGenerateReport = () => {
    fetchSellingProductsData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('vi-VN').format(number || 0);
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  // Use reportData or fallback to empty values
  const currentData = reportData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo sản phẩm bán chạy</h1>
          <p className="mt-1 text-sm text-gray-600">
            Phân tích hiệu quả bán hàng theo sản phẩm
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            In báo cáo
          </Button>
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? 'Đang tải...' : 'Tạo báo cáo'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select
            placeholder="Kỳ báo cáo"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periodOptions}
          />
          <Select
            placeholder="Danh mục"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categoryOptions}
          />
          <Select
            placeholder="Sắp xếp"
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            options={sortOptions}
          />
          <Select
            placeholder="Giới hạn"
            value={selectedLimit}
            onChange={(e) => setSelectedLimit(e.target.value)}
            options={limitOptions}
          />
          {selectedPeriod === 'custom' && (
            <div className="flex space-x-2">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Từ ngày"
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Đến ngày"
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {currentData.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(currentData.summary.totalRevenue)}
                  </p>
                  <div className="flex items-center text-sm">
                    {getTrendIcon(currentData.summary.growthRate)}
                    <span className={getTrendColor(currentData.summary.growthRate)}>
                      {Math.abs(currentData.summary.growthRate || 0).toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-1">so với kỳ trước</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sản phẩm bán</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(currentData.summary.totalProducts)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Top {selectedLimit} sản phẩm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tăng trưởng</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentData.summary.growthRate > 0 ? '+' : ''}{(currentData.summary.growthRate || 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">so với kỳ trước</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {currentData.topSellingProducts && currentData.topSellingProducts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart - Top Products by Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Top {selectedLimit} sản phẩm theo doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentData.topSellingProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                  />
                  <Bar 
                    dataKey="totalRevenue" 
                    fill="#8884d8"
                    name="Doanh thu"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Phân bổ doanh thu theo danh mục
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={currentData.revenueByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {currentData.revenueByCategory?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Line Chart - Sales Trend */}
      {currentData.salesTrend && currentData.salesTrend.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2" />
              Xu hướng bán hàng
              </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ReLineChart data={currentData.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { month: 'short' })}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Doanh thu"
                />
              </ReLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Area Chart - Cumulative Revenue */}
      {currentData.cumulativeRevenue && currentData.cumulativeRevenue.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AreaChart className="h-5 w-5 mr-2" />
              Doanh thu tích lũy
              </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ReAreaChart data={currentData.cumulativeRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { month: 'short' })}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                  name="Doanh thu"
                />
              </ReAreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      {currentData.topSellingProducts && currentData.topSellingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Chi tiết sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lợi nhuận
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tỷ suất LN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Xu hướng
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.topSellingProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(product.totalQuantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.totalProfit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.totalRevenue > 0 ? 
                          ((product.totalProfit / product.totalRevenue) * 100).toFixed(1) : 0
                        }%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.trend > 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : product.trend < 0 ? (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="h-4 w-4 text-gray-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellingProductsReport;