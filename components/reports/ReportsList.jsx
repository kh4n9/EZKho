'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Select from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';

// Import Report Components
import OverviewReport from './OverviewReport';
import ImportReport from './ImportReport';
import ExportReport from './ExportReport';
import FinancialReport from './FinancialReport';
import PartnerReport from './PartnerReport';
import InventoryReport from './InventoryReport';

const ReportsList = () => {
  const { token } = useAuth();
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
    { value: 'imports', label: 'Nhập hàng' },
    { value: 'exports', label: 'Xuất hàng' },
    { value: 'financials', label: 'Tài chính' },
    { value: 'partners', label: 'Đối tác (Khách/NCC)' },
    { value: 'inventory_checks', label: 'Tồn kho' },
  ];

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        throw new Error('Bạn cần đăng nhập để xem báo cáo');
      }



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

      const data = await response.json();

      if (response.ok && data.success) {
        setReportsData(data.data.data);
      } else {
        throw new Error(data.message || 'Không thể tải dữ liệu báo cáo');
      }
    } catch (err) {
      setError(err.message);
      setReportsData(null);
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

  const renderReportContent = () => {
    if (loading) {
      return <div className="text-center py-10">Đang tải dữ liệu...</div>;
    }

    if (!reportsData) {
      return <div className="text-center py-10 text-gray-500">Không có dữ liệu để hiển thị</div>;
    }

    switch (reportType) {
      case 'overview':
        return <OverviewReport data={reportsData} />;
      case 'imports':
        return <ImportReport data={reportsData} />;
      case 'exports':
        return <ExportReport data={reportsData} />;
      case 'financials':
        return <FinancialReport data={reportsData} />;
      case 'partners':
        return <PartnerReport data={reportsData} />;
      case 'inventory_checks':
        return <InventoryReport data={reportsData} />;
      default:
        return <OverviewReport data={reportsData} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
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

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default ReportsList;