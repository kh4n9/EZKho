'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';

const ReportsListDebug = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState(null);
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

  const reportTypeOptions = [
    { value: 'overview', label: 'Tổng quan' },
    { value: 'inventory', label: 'Tồn kho' },
    { value: 'sales', label: 'Doanh thu' },
    { value: 'profit_loss', label: 'Lợi nhuận/Thua lỗ' },
    { value: 'expenses', label: 'Chi phí' },
    { value: 'products_detail', label: 'Sản phẩm bán chạy' },
  ];

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để xem báo cáo');
      }

      console.log('ReportsListDebug: Fetching data with params:', { selectedPeriod, reportType, customStartDate, customEndDate });

      const queryParams = new URLSearchParams({
        period: selectedPeriod,
        type: reportType
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

      console.log('ReportsListDebug: Response status:', response.status);

      const data = await response.json();
      console.log('ReportsListDebug: Response data:', data);

      if (response.ok && data.success) {
        console.log('ReportsListDebug: Setting reports data to:', data.data);
        setReportsData(data.data.data);  // Fix: Access nested data property
        console.log('ReportsListDebug: Data set successfully');
      } else {
        throw new Error(data.message || 'Không thể tải dữ liệu báo cáo');
      }
    } catch (err) {
      console.error('ReportsListDebug: Fetch reports error:', err);
      setError(err.message);
      // Set default data to prevent UI crashes
      setReportsData({
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalLoss: 0,
        totalImports: 0,
        totalExports: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        netProfit: 0,
        topSellingProducts: [],
        summary: {
          totalProducts: 0,
          totalStock: 0,
          totalValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod, reportType, customStartDate, customEndDate]);

  const handleGenerateReport = () => {
    fetchReportsData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  // Use reportsData or fallback to empty values
  const currentData = reportsData || {};
  
  // Debug log to check currentData
  console.log('ReportsListDebug: currentData:', currentData);

  // Safe getters for data to prevent undefined errors
  const getSafeValue = (value, defaultValue = 0) => {
    return value !== undefined && value !== null ? value : defaultValue;
  };

  const getSafeArray = (value, defaultValue = []) => {
    return Array.isArray(value) ? value : defaultValue;
  };

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>Reports Data:</strong> {reportsData ? 'Exists' : 'Null'}</p>
            <p><strong>Current Data Keys:</strong> {Object.keys(currentData).join(', ')}</p>
            <p><strong>Total Revenue:</strong> {getSafeValue(currentData.totalRevenue)}</p>
            <p><strong>Total Expenses:</strong> {getSafeValue(currentData.totalExpenses)}</p>
            <p><strong>Total Profit:</strong> {getSafeValue(currentData.totalProfit)}</p>
            <p><strong>Total Imports:</strong> {getSafeValue(currentData.totalImports)}</p>
            <p><strong>Total Exports:</strong> {getSafeValue(currentData.totalExports)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo (Debug Mode)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Xem và phân tích dữ liệu kinh doanh của bạn
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
            {loading ? 'Đang tạo...' : 'Tạo báo cáo'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            placeholder="Loại báo cáo"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={reportTypeOptions}
          />
          <Select
            placeholder="Kỳ báo cáo"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periodOptions}
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
                  {formatCurrency(getSafeValue(currentData.totalRevenue))}
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
                  {formatCurrency(getSafeValue(currentData.netProfit) || getSafeValue(currentData.totalProfit))}
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
                  {formatCurrency(getSafeValue(currentData.totalExpenses))}
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
                  {getSafeValue(currentData.totalImports) + getSafeValue(currentData.totalExports)}
                </p>
                <p className="text-sm text-gray-500">
                  {getSafeValue(currentData.totalImports)} nhập / {getSafeValue(currentData.totalExports)} xuất
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsListDebug;