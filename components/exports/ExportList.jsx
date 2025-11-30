'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Table from '@/components/ui/Table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ExportForm from './ExportForm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { Card, CardContent } from '@/components/ui/card';

const ExportList = () => {
  const { token, isAuthenticated } = useAuth();
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExport, setEditingExport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sortBy, setSortBy] = useState('export_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const paymentStatusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'partial', label: 'Thanh toán một phần' },
  ];

  const sortOptions = [
    { value: 'export_date', label: 'Ngày xuất' },
    { value: 'export_id', label: 'Mã phiếu' },
    { value: 'total_exported_amt', label: 'Tổng tiền' },
    { value: 'customer', label: 'Khách hàng' },
    { value: 'product_id', label: 'Sản phẩm' },
    { value: 'profit', label: 'Lợi nhuận' },
  ];

  useEffect(() => {
    fetchExports();
    fetchCustomers();
  }, [search, productId, customerId, status, paymentStatus, sortBy, sortOrder, page]);

  const fetchExports = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page,
        limit: '20',
        ...(search && { search }),
        ...(productId && { product_id: productId }),
        ...(customerId && { customer_id: customerId }),
        ...(status && { status }),
        ...(paymentStatus && { payment_status }),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/exports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách phiếu xuất');
      }

      const data = await response.json();
      setExports(data.data.exports);
      setTotalPages(data.data.pagination.total_pages);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/dashboard/customers?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.customers || [];
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  };

  const handleAddExport = () => {
    setEditingExport(null);
    setShowModal(true);
  };

  const handleEditExport = (exportDoc) => {
    setEditingExport(exportDoc);
    setShowModal(true);
  };

  const handleDeleteExport = async (exportDoc) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phiếu xuất "${exportDoc.export_id}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/exports/${exportDoc._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa phiếu xuất');
      }

      fetchExports();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const url = editingExport
        ? `/api/exports/${editingExport._id}`
        : '/api/exports';

      const method = editingExport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể lưu phiếu xuất');
      }

      setShowModal(false);
      fetchExports();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Chờ duyệt';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'unpaid':
        return 'Chưa thanh toán';
      case 'partial':
        return 'Thanh toán một phần';
      default:
        return status;
    }
  };

  const columns = [
    {
      header: 'Mã phiếu',
      accessor: 'export_id',
    },
    {
      header: 'Ngày xuất',
      accessor: 'export_date',
      render: (value) => formatDate(value),
    },
    {
      header: 'Sản phẩm',
      accessor: 'product_id',
    },
    {
      header: 'Số lượng',
      accessor: 'qty_exported',
      render: (value) => `${parseFloat(value).toLocaleString('vi-VN')}`,
    },
    {
      header: 'Giá bán',
      accessor: 'price_exported',
      render: (value) => formatCurrency(value),
    },
    {
      header: 'Tổng tiền',
      accessor: 'total_exported_amt',
      render: (value) => formatCurrency(value),
    },
    {
      header: 'Lợi nhuận',
      accessor: 'profit',
      render: (value) => (
        <span className={value >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      header: 'Khách hàng',
      accessor: 'customer',
      render: (value, row) => {
        // If customer_id is populated, show customer code and name
        if (row.customer_id && row.customer_id.name) {
          return `${row.customer_id.customer_code} - ${row.customer_id.name}`;
        }
        // Fallback to customer field
        return value || '-';
      },
    },
    {
      header: 'TT Thanh toán',
      accessor: 'payment_status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(value)}`}>
          {getPaymentStatusText(value)}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {getStatusText(value)}
        </span>
      ),
    },
  ];

  const renderActions = (exportDoc) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleEditExport(exportDoc)}
        disabled={exportDoc.status === 'completed'}
      >
        Sửa
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDeleteExport(exportDoc)}
        disabled={exportDoc.status === 'completed'}
      >
        Xóa
      </Button>
    </div>
  );

  // Calculate statistics
  const stats = {
    totalExports: exports.length,
    completedExports: exports.filter(e => e.status === 'completed').length,
    totalRevenue: exports.reduce((sum, exp) => sum + exp.total_exported_amt, 0),
    totalProfit: exports.reduce((sum, exp) => sum + exp.profit, 0),
    paidExports: exports.filter(e => e.payment_status === 'paid').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý xuất hàng</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý các phiếu xuất hàng và theo dõi khách hàng
          </p>
        </div>
        <Button onClick={handleAddExport} className="mt-4 sm:mt-0">
          Tạo phiếu xuất mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng phiếu xuất</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedExports}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lợi nhuận</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(stats.totalProfit)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã thanh toán</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidExports}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {error}
            <button onClick={() => setError('')} className="absolute top-2 right-2 p-1 rounded-md text-destructive/80 hover:text-destructive">
              <span className="sr-only">Đóng</span>
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Input
            type="text"
            placeholder="Tìm kiếm phiếu xuất..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Mã sản phẩm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Mã khách hàng"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />

          <Select
            placeholder="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
          />

          <Select
            placeholder="TT Thanh toán"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            options={paymentStatusOptions}
          />

          <Select
            placeholder="Sắp xếp theo"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={sortOptions}
          />

          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            options={[
              { value: 'asc', label: 'Tăng dần' },
              { value: 'desc', label: 'Giảm dần' },
            ]}
          />
        </div>
      </div>

      {/* Exports Table */}
      <Table
        columns={columns}
        data={exports}
        loading={loading}
        emptyMessage="Không có phiếu xuất nào"
        actions={renderActions}
        onRowClick={handleEditExport}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="py-2 px-4 text-sm text-gray-700">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Export Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingExport ? 'Cập nhật phiếu xuất' : 'Tạo phiếu xuất mới'}
        size="lg"
      >
        <ExportForm
          exportDoc={editingExport}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
};

export default ExportList;