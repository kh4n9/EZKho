'use client';

import React, { useState, useEffect } from 'react';
import Table from '@/components/ui/Table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertCircle, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [minStockFilter, setMinStockFilter] = useState('');
  const [maxStockFilter, setMaxStockFilter] = useState('');
  const [minValueFilter, setMinValueFilter] = useState('');
  const [maxValueFilter, setMaxValueFilter] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const stockFilterOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'out_of_stock', label: 'Hết hàng' },
    { value: 'low_stock', label: 'Sắp hết hàng' },
    { value: 'in_stock', label: 'Còn hàng' },
  ];

  const unitFilterOptions = [
    { value: '', label: 'Tất cả đơn vị' },
    { value: 'kg', label: 'Kilogam' },
    { value: 'tấn', label: 'Tấn' },
    { value: 'bao', label: 'Bao' },
    { value: 'gói', label: 'Gói' },
  ];

  const sortOptions = [
    { value: 'product_name', label: 'Tên sản phẩm' },
    { value: 'current_stock', label: 'Tồn kho' },
    { value: 'total_value', label: 'Tổng giá trị' },
    { value: 'reorder_level', label: 'Mức tái đặt hàng' },
  ];

  // Sử dụng debounce cho tìm kiếm để tối ưu hiệu suất
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchInventory();
  }, [debouncedSearch, stockFilter, unitFilter, minStockFilter, maxStockFilter, minValueFilter, maxValueFilter, sortBy, sortOrder, page]);

  // Lưu trạng thái lọc vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('inventory-filters', JSON.stringify({
      search, stockFilter, unitFilter, minStockFilter, maxStockFilter,
      minValueFilter, maxValueFilter, sortBy, sortOrder
    }));
  }, [search, stockFilter, unitFilter, minStockFilter, maxStockFilter, minValueFilter, maxValueFilter, sortBy, sortOrder]);

  // Khôi phục trạng thái lọc từ localStorage khi mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('inventory-filters');
    if (savedFilters) {
      try {
        const {
          search: savedSearch, stockFilter: savedStockFilter, unitFilter: savedUnitFilter,
          minStockFilter: savedMinStock, maxStockFilter: savedMaxStock,
          minValueFilter: savedMinValue, maxValueFilter: savedMaxValue,
          sortBy: savedSortBy, sortOrder: savedSortOrder
        } = JSON.parse(savedFilters);
        setSearch(savedSearch || '');
        setStockFilter(savedStockFilter || '');
        setUnitFilter(savedUnitFilter || '');
        setMinStockFilter(savedMinStock || '');
        setMaxStockFilter(savedMaxStock || '');
        setMinValueFilter(savedMinValue || '');
        setMaxValueFilter(savedMaxValue || '');
        setSortBy(savedSortBy || 'product_name');
        setSortOrder(savedSortOrder || 'asc');
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page,
        limit: '20',
        ...(search && { search }),
        ...(stockFilter && { stock_filter: stockFilter }),
        ...(unitFilter && { unit_filter: unitFilter }),
        ...(minStockFilter && { min_stock: minStockFilter }),
        ...(maxStockFilter && { max_stock: maxStockFilter }),
        ...(minValueFilter && { min_value: minValueFilter }),
        ...(maxValueFilter && { max_value: maxValueFilter }),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Không có dữ liệu tồn kho - không phải lỗi
          setInventory([]);
          setTotalPages(1);
          return;
        }
        const data = await response.json();
        throw new Error(data.message || 'Không thể tải dữ liệu tồn kho');
      }

      const data = await response.json();
      setInventory(data.data.inventory || []);
      setTotalPages(data.data.pagination?.total_pages || 1);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStockStatus = (currentStock, reorderLevel) => {
    if (currentStock === 0) {
      return {
        status: 'out_of_stock',
        label: 'Hết hàng',
        color: 'text-red-600 bg-red-100'
      };
    } else if (currentStock <= reorderLevel) {
      return {
        status: 'low_stock',
        label: 'Sắp hết hàng',
        color: 'text-yellow-600 bg-yellow-100'
      };
    } else {
      return {
        status: 'in_stock',
        label: 'Còn hàng',
        color: 'text-green-600 bg-green-100'
      };
    }
  };

  // Hàm reset tất cả bộ lọc
  const resetFilters = () => {
    setSearch('');
    setStockFilter('');
    setUnitFilter('');
    setMinStockFilter('');
    setMaxStockFilter('');
    setMinValueFilter('');
    setMaxValueFilter('');
    setSortBy('product_name');
    setSortOrder('asc');
    setPage(1);
  };

  // Hàm retry khi có lỗi
  const handleRetry = () => {
    setError('');
    fetchInventory();
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
          value <= row.reorder_level ? 'text-yellow-600' : 'text-green-600'
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
      render: (value, row) => (
        <span className="text-gray-600">
          {value.toLocaleString('vi-VN')} {row.unit}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'current_stock',
      render: (value, row) => {
        const stockStatus = getStockStatus(value, row.reorder_level);
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tồn kho</h1>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi số lượng tồn kho và cảnh báo hàng sắp hết
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventory.length.toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Còn hàng</p>
              <p className="text-2xl font-semibold text-green-600">
                {inventory.filter(item => item.current_stock > item.reorder_level).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sắp hết hàng</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {inventory.filter(item => item.current_stock > 0 && item.current_stock <= item.reorder_level).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hết hàng</p>
              <p className="text-2xl font-semibold text-red-600">
                {inventory.filter(item => item.current_stock === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium text-gray-900">Bộ lọc</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-2 sm:mt-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Xóa bộ lọc
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            <Select
              placeholder="Trạng thái tồn kho"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              options={stockFilterOptions}
            />

            <Select
              placeholder="Đơn vị"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              options={unitFilterOptions}
            />

            <Select
              placeholder="Sắp xếp theo"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={sortOptions}
            />
          </div>

          {/* Bộ lọc nâng cao */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Bộ lọc nâng cao</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng tồn kho</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Tối thiểu"
                    value={minStockFilter}
                    onChange={(e) => setMinStockFilter(e.target.value)}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Tối đa"
                    value={maxStockFilter}
                    onChange={(e) => setMaxStockFilter(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng giá trị</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Tối thiểu"
                    value={minValueFilter}
                    onChange={(e) => setMinValueFilter(e.target.value)}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Tối đa"
                    value={maxValueFilter}
                    onChange={(e) => setMaxValueFilter(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  options={[
                    { value: 'asc', label: 'Tăng dần' },
                    { value: 'desc', label: 'Giảm dần' },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Hiển thị bộ lọc đang hoạt động */}
          {(search || stockFilter || unitFilter || minStockFilter || maxStockFilter || minValueFilter || maxValueFilter) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-gray-500">Đang lọc:</span>
              {search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tìm kiếm: {search}
                  <button
                    onClick={() => setSearch('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {stockFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Trạng thái: {stockFilterOptions.find(opt => opt.value === stockFilter)?.label}
                  <button
                    onClick={() => setStockFilter('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {unitFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Đơn vị: {unitFilterOptions.find(opt => opt.value === unitFilter)?.label}
                  <button
                    onClick={() => setUnitFilter('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(minStockFilter || maxStockFilter) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tồn kho: {minStockFilter || '0'} - {maxStockFilter || '∞'}
                  <button
                    onClick={() => { setMinStockFilter(''); setMaxStockFilter(''); }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(minValueFilter || maxValueFilter) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Giá trị: {minValueFilter || '0'} - {maxValueFilter || '∞'}
                  <button
                    onClick={() => { setMinValueFilter(''); setMaxValueFilter(''); }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <Table
        columns={columns}
        data={inventory}
        loading={loading}
        emptyMessage="Không có dữ liệu tồn kho"
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
    </div>
  );
};

export default InventoryList;