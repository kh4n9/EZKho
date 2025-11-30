'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Table from '@/components/ui/Table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ImportForm from './ImportForm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { Card, CardContent } from '@/components/ui/card';

const ImportList = () => {
  const { token, isAuthenticated } = useAuth();
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingImport, setEditingImport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('import_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Date filter state (default to current month)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const sortOptions = [
    { value: 'import_date', label: 'Ngày nhập' },
    { value: 'import_id', label: 'Mã phiếu' },
    { value: 'total_imported_amt', label: 'Tổng tiền' },
    { value: 'supplier', label: 'Nhà cung cấp' },
    { value: 'product_id', label: 'Sản phẩm' },
  ];

  useEffect(() => {
    fetchImports();
    fetchProducts();
  }, [search, productId, status, sortBy, sortOrder, page, startDate, endDate]);

  const fetchImports = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page,
        limit: '20',
        ...(search && { search }),
        ...(productId && { product_id: productId }),
        ...(status && { status }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/imports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách phiếu nhập');
      }

      const data = await response.json();
      setImports(data.data.imports);
      setTotalPages(data.data.pagination.total_pages);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.products || [];
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const handleAddImport = () => {
    setEditingImport(null);
    setShowModal(true);
  };

  const handleEditImport = (importDoc) => {
    setEditingImport(importDoc);
    setShowModal(true);
  };

  const handleDeleteImport = async (importDoc) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phiếu nhập "${importDoc.import_id}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/imports/${importDoc._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa phiếu nhập');
      }

      fetchImports();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const url = editingImport
        ? `/api/imports/${editingImport._id}`
        : '/api/imports';

      const method = editingImport ? 'PUT' : 'POST';

      console.log('Submitting form data:', JSON.stringify(formData, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('API Error Response:', data);
        if (data.errors) {
          console.error('Validation errors:', data.errors);
        }
        throw new Error(data.message || 'Không thể lưu phiếu nhập');
      }

      setShowModal(false);
      fetchImports();
    } catch (error) {
      setError(error.message);
      console.error('Form submission error:', error);
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

  const columns = [
    {
      header: 'Mã phiếu',
      accessor: 'import_id',
    },
    {
      header: 'Ngày nhập',
      accessor: 'import_date',
      render: (value) => formatDate(value),
    },
    {
      header: 'Sản phẩm',
      accessor: 'product_id',
    },
    {
      header: 'Số lượng',
      accessor: 'qty_imported',
      render: (value) => `${parseFloat(value).toLocaleString('vi-VN')}`,
    },
    {
      header: 'Giá nhập',
      accessor: 'price_imported',
      render: (value) => formatCurrency(value),
    },
    {
      header: 'Tổng tiền',
      accessor: 'total_imported_amt',
      render: (value) => formatCurrency(value),
    },
    {
      header: 'Nhà cung cấp',
      accessor: 'supplier',
      render: (value, row) => {
        // If supplier_id is populated, show supplier code and name
        if (row.supplier_id && row.supplier_id.name) {
          return `${row.supplier_id.supplier_code} - ${row.supplier_id.name}`;
        }
        // Fallback to supplier field
        return value || '-';
      },
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

  const renderActions = (importDoc) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleEditImport(importDoc)}
        disabled={importDoc.status === 'completed'}
      >
        Sửa
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDeleteImport(importDoc)}
        disabled={importDoc.status === 'completed'}
      >
        Xóa
      </Button>
    </div>
  );

  // Calculate statistics
  const stats = {
    totalImports: imports.length,
    completedImports: imports.filter(i => i.status === 'completed').length,
    totalValue: imports.reduce((sum, imp) => sum + imp.total_imported_amt, 0),
    pendingImports: imports.filter(i => i.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý nhập hàng</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý các phiếu nhập hàng và theo dõi nhà cung cấp
          </p>
        </div>
        <Button onClick={handleAddImport} className="mt-4 sm:mt-0">
          Tạo phiếu nhập mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng phiếu nhập</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalImports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                <p className="text-2xl font-bold text-green-600">{stats.completedImports}</p>
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
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingImports}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="md:col-span-1"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="md:col-span-1"
          />
          <Input
            type="text"
            placeholder="Tìm kiếm phiếu nhập..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:col-span-2"
          />

          <Input
            type="text"
            placeholder="Mã sản phẩm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />

          <Select
            placeholder="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
          />

          <Select
            placeholder="Sắp xếp theo"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={sortOptions}
          />
        </div>
      </div>

      {/* Imports Table */}
      <Table
        columns={columns}
        data={imports}
        loading={loading}
        emptyMessage="Không có phiếu nhập nào"
        actions={renderActions}
        onRowClick={handleEditImport}
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

      {/* Import Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingImport ? 'Cập nhật phiếu nhập' : 'Tạo phiếu nhập mới'}
        size="lg"
      >
        <ImportForm
          importDoc={editingImport}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
};

export default ImportList;