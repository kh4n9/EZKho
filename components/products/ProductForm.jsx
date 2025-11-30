'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const ProductForm = ({ product, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    unit: 'kg',
    description: '',
    current_stock: 0,
    average_cost: 0,
    is_active: true,
    reorder_level: 100,
    preferred_supplier_id: null,
    lead_time_days: 7,
  });

  const [errors, setErrors] = useState({});
  const [reorderLevel, setReorderLevel] = useState(100);
  const [preferredSupplierId, setPreferredSupplierId] = useState(null);
  const [leadTimeDays, setLeadTimeDays] = useState(7);

  const units = [
    { value: 'kg', label: 'Kilogam' },
    { value: 'tấn', label: 'Tấn' },
    { value: 'bao', label: 'Bao' },
    { value: 'gói', label: 'Gói' },
  ];

  useEffect(() => {
    if (product) {
      setFormData({
        product_id: product.product_id || '',
        product_name: product.product_name || '',
        unit: product.unit || 'kg',
        description: product.description || '',
        current_stock: product.current_stock || 0,
        average_cost: product.average_cost || 0,
        is_active: product.is_active !== false,
      });
      
      // Set reorder level when editing a product
      setReorderLevel(product.reorder_level || 100);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_id.trim()) {
      newErrors.product_id = 'Mã sản phẩm là bắt buộc';
    }

    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Tên sản phẩm là bắt buộc';
    }

    if (!formData.unit) {
      newErrors.unit = 'Đơn vị tính là bắt buộc';
    }

    if (formData.current_stock < 0) {
      newErrors.current_stock = 'Số lượng tồn kho không thể âm';
    }

    if (formData.average_cost < 0) {
      newErrors.average_cost = 'Giá trung bình không thể âm';
    }

    // Validate reorder level
    if (reorderLevel <= 0) {
      newErrors.reorder_level = 'Mức tái đặt hàng phải lớn hơn 0';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const dataToSubmit = { ...formData };
    // These fields are managed by transactions, not direct edits.
    delete dataToSubmit.current_stock;
    delete dataToSubmit.average_cost;
    
    // Add reorder level to the submission data
    dataToSubmit.reorder_level = reorderLevel;

    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="product_id">Mã sản phẩm</Label>
          <Input
            type="text"
            id="product_id"
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            placeholder="Nhập mã sản phẩm"
            required
            disabled={!!product}
            className={errors.product_id ? 'border-destructive' : ''}
          />
          {errors.product_id && <p className="text-sm text-destructive">{errors.product_id}</p>}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="product_name">Tên sản phẩm</Label>
          <Input
            type="text"
            id="product_name"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            placeholder="Nhập tên sản phẩm"
            required
            className={errors.product_name ? 'border-destructive' : ''}
          />
          {errors.product_name && <p className="text-sm text-destructive">{errors.product_name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Đơn vị tính"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          options={units}
          required
          error={errors.unit}
        />

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="current_stock">Số lượng tồn kho</Label>
          <Input
            type="number"
            id="current_stock"
            name="current_stock"
            value={formData.current_stock}
            onChange={handleChange}
            placeholder="0"
            min="0"
            disabled
            className={errors.current_stock ? 'border-destructive' : ''}
          />
          {errors.current_stock && <p className="text-sm text-destructive">{errors.current_stock}</p>}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="average_cost">Giá trung bình</Label>
          <Input
            type="number"
            id="average_cost"
            name="average_cost"
            value={formData.average_cost}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="1000"
            disabled
            className={errors.average_cost ? 'border-destructive' : ''}
          />
          {errors.average_cost && <p className="text-sm text-destructive">{errors.average_cost}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả sản phẩm
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Nhập mô tả sản phẩm (không bắt buộc)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="reorder_level" className="flex items-center gap-1">
          Mức tái đặt hàng
          <span className="text-xs text-gray-500 cursor-help" title="Mức tồn kho tối thiểu trước khi cần đặt hàng lại">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </span>
        </Label>
        <Input
          type="number"
          id="reorder_level"
          name="reorder_level"
          value={reorderLevel}
          onChange={(e) => {
            setReorderLevel(parseInt(e.target.value) || 0);
            handleChange(e);
          }}
          placeholder="100"
          min="0"
          className={errors.reorder_level ? 'border-destructive' : ''}
        />
        {errors.reorder_level && <p className="text-sm text-destructive">{errors.reorder_level}</p>}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Sản phẩm đang kinh doanh
        </label>
      </div>

      {Object.values(errors).some(error => error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            Vui lòng sửa các lỗi trước khi tiếp tục.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {product ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;