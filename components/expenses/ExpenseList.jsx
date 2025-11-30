'use client';

import React, { useState, useEffect } from 'react';
import Table from '@/components/ui/Table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ExpenseForm from './ExpenseForm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { Card, CardContent } from '@/components/ui/card';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [recurring, setRecurring] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const expenseTypeOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'lương', label: 'Lương nhân viên' },
    { value: 'mặt bằng', label: 'Chi phí mặt bằng' },
    { value: 'vận chuyển', label: 'Chi phí vận chuyển' },
    { value: 'điện nước', label: 'Điện, nước' },
    { value: 'văn phòng phẩm', label: 'Văn phòng phẩm' },
    { value: 'marketing', label: 'Marketing & quảng cáo' },
    { value: 'bảo trì', label: 'Bảo trì, sửa chữa' },
    { value: 'thuế', label: 'Thuế, phí' },
    { value: 'khác', label: 'Chi phí khác' },
  ];

  const categoryOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'cố định', label: 'Chi phí cố định' },
    { value: 'biến đổi', label: 'Chi phí biến đổi' },
    { value: 'đột xuất', label: 'Chi phí đột xuất' },
  ];

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
  ];

  const recurringOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'true', label: 'Lặp lại' },
    { value: 'false', label: 'Một lần' },
  ];

  const sortOptions = [
    { value: 'expense_date', label: 'Ngày chi' },
    { value: 'expense_id', label: 'Mã chi phí' },
    { value: 'amount', label: 'Số tiền' },
    { value: 'expense_type', label: 'Loại chi phí' },
    { value: 'category', label: 'Danh mục' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, [search, expenseType, category, status, recurring, sortBy, sortOrder, page]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page,
        limit: '20',
        ...(search && { search }),
        ...(expenseType && { expense_type: expenseType }),
        ...(category && { category }),
        ...(status && { status }),
        ...(recurring && { recurring }),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/expenses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách chi phí');
      }

      const data = await response.json();
      setExpenses(data.data.expenses);
      setTotalPages(data.data.pagination.total_pages);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleDeleteExpense = async (expense) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chi phí "${expense.expense_id}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expense._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa chi phí');
      }

      fetchExpenses();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const url = editingExpense
        ? `/api/expenses/${editingExpense._id}`
        : '/api/expenses';

      const method = editingExpense ? 'PUT' : 'POST';

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
        throw new Error(data.message || 'Không thể lưu chi phí');
      }

      setShowModal(false);
      fetchExpenses();
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

  const getExpenseTypeDisplay = (type) => {
    const typeMap = {
      'lương': 'Lương nhân viên',
      'mặt bằng': 'Chi phí mặt bằng',
      'vận chuyển': 'Chi phí vận chuyển',
      'điện nước': 'Điện, nước',
      'văn phòng phẩm': 'Văn phòng phẩm',
      'marketing': 'Marketing & quảng cáo',
      'bảo trì': 'Bảo trì, sửa chữa',
      'thuế': 'Thuế, phí',
      'khác': 'Chi phí khác',
    };
    return typeMap[type] || type;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'cố định':
        return 'bg-blue-100 text-blue-800';
      case 'biến đổi':
        return 'bg-green-100 text-green-800';
      case 'đột xuất':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      header: 'Mã chi phí',
      accessor: 'expense_id',
    },
    {
      header: 'Ngày chi',
      accessor: 'expense_date',
      render: (value) => formatDate(value),
    },
    {
      header: 'Loại chi phí',
      accessor: 'expense_type',
      render: (value) => getExpenseTypeDisplay(value),
    },
    {
      header: 'Danh mục',
      accessor: 'category',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      header: 'Số tiền',
      accessor: 'amount',
      render: (value) => (
        <span className="font-medium text-red-600">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      header: 'Mô tả',
      accessor: 'description',
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      header: 'Người nhận',
      accessor: 'recipient',
      render: (value) => value || '-',
    },
    {
      header: 'Lặp lại',
      accessor: 'recurring',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Có' : 'Không'}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value === 'approved' ? 'Đã duyệt' : value === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
        </span>
      ),
    },
  ];

  const renderActions = (expense) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleEditExpense(expense)}
      >
        Sửa
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDeleteExpense(expense)}
      >
        Xóa
      </Button>
    </div>
  );

  // Calculate statistics
  const stats = {
    totalExpenses: expenses.length,
    approvedExpenses: expenses.filter(e => e.status === 'approved').length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    recurringExpenses: expenses.filter(e => e.recurring).length,
  };

  // Group expenses by type for chart
  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.expense_type] = (acc[expense.expense_type] || 0) + expense.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý chi phí</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý các khoản chi phí và theo dõi thanh toán
          </p>
        </div>
        <Button onClick={handleAddExpense} className="mt-4 sm:mt-0">
          Thêm chi phí mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng chi phí</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedExpenses}</p>
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
                <p className="text-sm font-medium text-gray-600">Tổng tiền</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chi phí lặp lại</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recurringExpenses}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
            placeholder="Tìm kiếm chi phí..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            placeholder="Loại chi phí"
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
            options={expenseTypeOptions}
          />

          <Select
            placeholder="Danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categoryOptions}
          />

          <Select
            placeholder="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
          />

          <Select
            placeholder="Lặp lại"
            value={recurring}
            onChange={(e) => setRecurring(e.target.value)}
            options={recurringOptions}
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

      {/* Expenses Table */}
      <Table
        columns={columns}
        data={expenses}
        loading={loading}
        emptyMessage="Không có chi phí nào"
        actions={renderActions}
        onRowClick={handleEditExpense}
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

      {/* Expense Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingExpense ? 'Cập nhật chi phí' : 'Tạo chi phí mới'}
        size="lg"
      >
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
};

export default ExpenseList;