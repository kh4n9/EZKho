'use client';

import React, { useState, useEffect } from 'react';
import Table from '@/components/ui/Table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ProductForm from './ProductForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'true', label: 'Đang kinh doanh' },
    { value: 'false', label: 'Ngừng kinh doanh' },
  ];

  const sortOptions = [
    { value: 'product_name', label: 'Tên sản phẩm' },
    { value: 'product_id', label: 'Mã sản phẩm' },
    { value: 'current_stock', label: 'Tồn kho' },
    { value: 'average_cost', label: 'Giá trung bình' },
    { value: 'total_value', label: 'Tổng giá trị' },
    { value: 'reorder_level', label: 'Mức tái đặt hàng' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [search, isActive, sortBy, sortOrder, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page,
        limit: '20',
        ...(search && { search }),
        ...(isActive && { is_active: isActive }),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Không có sản phẩm nào - không phải lỗi
          setProducts([]);
          setTotalPages(1);
          return;
        }
        const data = await response.json();
        throw new Error(data.message || 'Không thể tải danh sách sản phẩm');
      }

      const data = await response.json();
      setProducts(data.data.products || []);
      setTotalPages(data.data.pagination?.total_pages || 1);
    } catch (error) {
      if (error.message !== 'Không thể tải danh sách sản phẩm' || error.message.includes('authorization')) {
        setError(error.message);
      } else {
        // Xử lý trường hợp không có dữ liệu một cách thân thiện
        setProducts([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.product_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa sản phẩm');
      }

      fetchProducts();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const url = editingProduct
        ? `/api/products/${editingProduct._id}`
        : '/api/products';

      const method = editingProduct ? 'PUT' : 'POST';

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
        throw new Error(data.message || 'Không thể lưu sản phẩm');
      }

      setShowModal(false);
      fetchProducts();
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

  const columns = [
    {
      header: 'Mã sản phẩm',
      accessor: 'product_id',
    },
    {
      header: 'Tên sản phẩm',
      accessor: 'product_name',
    },
    {
      header: 'Đơn vị',
      accessor: 'unit',
      render: (value) => {
        const unitMap = {
          'kg': 'Kilogam',
          'tấn': 'Tấn',
          'bao': 'Bao',
          'gói': 'Gói',
        };
        return unitMap[value] || value;
      },
    },
    {
      header: 'Tồn kho',
      accessor: 'current_stock',
      render: (value, row) => (
        <span className={`font-medium ${
          value === 0 ? 'text-red-600' :
          value < 100 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {value.toLocaleString('vi-VN')} {row.unit}
        </span>
      ),
    },
    {
      header: 'Giá TB',
      accessor: 'average_cost',
      render: (value) => formatCurrency(value),
    },
    {
      header: 'Tổng giá trị',
      accessor: 'total_value',
      render: (value) => formatCurrency(value),
    },
    {
      header: 'Mức tái đặt hàng',
      accessor: 'reorder_level',
      render: (value, row) => {
        // Xử lý trường hợp value là undefined hoặc null
        const safeValue = value !== undefined && value !== null ? value : 100; // Giá trị mặc định
        
        return (
          <span className={`font-medium ${
            row.current_stock <= safeValue ? 'text-red-600' : 'text-gray-600'
          }`}>
            {safeValue.toLocaleString('vi-VN')} {row.unit}
          </span>
        );
      },
    },
    {
      header: 'Trạng thái',
      accessor: 'is_active',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Đang KD' : 'Ngừng KD'}
        </span>
      ),
    },
  ];

  const renderActions = (product) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleEditProduct(product)}
      >
        Sửa
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDeleteProduct(product)}
        disabled={product.current_stock > 0}
      >
        Xóa
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý danh sách sản phẩm và thông tin tồn kho
          </p>
        </div>
        <Button onClick={handleAddProduct} className="mt-4 sm:mt-0">
          Thêm sản phẩm mới
        </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            placeholder="Trạng thái"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            options={statusOptions}
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

      {/* Products Table */}
      <Table
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="Không có sản phẩm nào"
        actions={renderActions}
        onRowClick={handleEditProduct}
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

      {/* Product Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
        size="md"
      >
        <ProductForm
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
};

export default ProductList;