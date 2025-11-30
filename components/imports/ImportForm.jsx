'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/Select';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const ImportForm = ({ importDoc, onSubmit, onCancel, loading }) => {
  const { token, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    product_id: '',
    qty_imported: '',
    price_imported: '',
    discount: '',
    supplier_id: '',
    supplier: '',
    supplier_info: {
      name: '',
      phone: '',
      email: '',
      address: '',
    },
    expiration_date: '',
    notes: '',
    status: 'completed',
  });

  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchProducts();
      fetchSuppliers();
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (importDoc) {
      setFormData({
        product_id: importDoc.product_id || '',
        qty_imported: importDoc.qty_imported || '',
        price_imported: importDoc.price_imported || '',
        discount: importDoc.discount || '',
        supplier_id: importDoc.supplier_id?._id || importDoc.supplier_id || '',
        supplier: importDoc.supplier || '',
        supplier_info: {
          name: importDoc.supplier_info?.name || '',
          phone: importDoc.supplier_info?.phone || '',
          email: importDoc.supplier_info?.email || '',
          address: importDoc.supplier_info?.address || '',
        },
        expiration_date: importDoc.expiration_date ?
          new Date(importDoc.expiration_date).toISOString().split('T')[0] : '',
        notes: importDoc.notes || '',
        status: importDoc.status || 'completed',
      });
    }
  }, [importDoc]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/products?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      console.log('Fetching suppliers...');
      const response = await fetch('/api/dashboard/suppliers?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Suppliers data received:', data);
        setSuppliers(data.data.suppliers || []);
      } else {
        console.error('Failed to fetch suppliers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Function to load suppliers for searchable select
  const loadSupplierOptions = async (searchValue) => {
    try {
      const response = await fetch(`/api/dashboard/suppliers?search=${encodeURIComponent(searchValue)}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return (data.data.suppliers || []).map(supplier => ({
          value: supplier._id,
          label: `${supplier.supplier_code} - ${supplier.name}`,
          supplier: supplier
        }));
      } else {
        console.error('Failed to search suppliers:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error searching suppliers:', error);
      return [];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('supplier_info.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        supplier_info: {
          ...prev.supplier_info,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle supplier selection change
  const handleSupplierChange = (supplierId) => {
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId || ''
    }));

    // Clear error for supplier_id
    if (errors.supplier_id) {
      setErrors(prev => ({
        ...prev,
        supplier_id: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Sản phẩm là bắt buộc';
    }

    if (!formData.qty_imported || parseFloat(formData.qty_imported) <= 0) {
      newErrors.qty_imported = 'Số lượng phải lớn hơn 0';
    }

    if (!formData.price_imported || parseFloat(formData.price_imported) <= 0) {
      newErrors.price_imported = 'Giá nhập phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      qty_imported: parseFloat(formData.qty_imported),
      price_imported: parseFloat(formData.price_imported),
      discount: parseFloat(formData.discount) || 0,
      expiration_date: formData.expiration_date ? new Date(formData.expiration_date) : null,
    };

    // Only include import_id when editing an existing import
    if (importDoc && importDoc.import_id) {
      submitData.import_id = importDoc.import_id;
    }

    // If supplier_id is selected, don't send empty supplier and supplier_info
    // The API will populate these from the supplier_id
    if (submitData.supplier_id) {
      delete submitData.supplier;
      delete submitData.supplier_info;
    }

    onSubmit(submitData);
  };

  const calculateTotal = () => {
    const qty = parseFloat(formData.qty_imported) || 0;
    const price = parseFloat(formData.price_imported) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return (qty * price) - discount;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Only show import_id field when editing existing import */}
      {importDoc && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="import_id">Mã phiếu nhập</Label>
          <Input
            type="text"
            id="import_id"
            name="import_id"
            value={importDoc.import_id || ''}
            disabled={true} // Always disabled when editing
            className="bg-gray-100 text-gray-600"
          />
          <p className="text-sm text-gray-500">Mã phiếu nhập không thể thay đổi</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Sản phẩm"
          name="product_id"
          value={formData.product_id}
          onChange={handleChange}
          options={products.map(p => ({
            value: p.product_id,
            label: `${p.product_id} - ${p.product_name}`
          }))}
          required
          error={errors.product_id}
          disabled={productsLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="qty_imported">Số lượng nhập</Label>
          <Input
            type="number"
            id="qty_imported"
            name="qty_imported"
            value={formData.qty_imported}
            onChange={handleChange}
            placeholder="Nhập số lượng"
            required
            min="0.01"
            step="0.01"
            className={errors.qty_imported ? 'border-destructive' : ''}
          />
          {errors.qty_imported && <p className="text-sm text-destructive">{errors.qty_imported}</p>}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="price_imported">Giá nhập (VND)</Label>
          <Input
            type="number"
            id="price_imported"
            name="price_imported"
            value={formData.price_imported}
            onChange={handleChange}
            placeholder="Nhập giá nhập"
            required
            min="1000"
            step="1000"
            className={errors.price_imported ? 'border-destructive' : ''}
          />
          {errors.price_imported && <p className="text-sm text-destructive">{errors.price_imported}</p>}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="discount">Chiết khấu (VND)</Label>
          <Input
            type="number"
            id="discount"
            name="discount"
            value={formData.discount}
            onChange={handleChange}
            placeholder="Nhập chiết khấu"
            min="0"
            step="1000"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Tổng tiền:</span>
          <span className="text-lg font-bold text-blue-600">
            {calculateTotal().toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="supplier_id">Nhà cung cấp</Label>
        <SearchableSelect
          id="supplier_id"
          value={formData.supplier_id}
          onChange={handleSupplierChange}
          loadOptions={loadSupplierOptions}
          placeholder="Tìm kiếm và chọn nhà cung cấp..."
          isLoading={suppliersLoading}
          noOptionsMessage="Không tìm thấy nhà cung cấp"
          loadingMessage="Đang tìm kiếm nhà cung cấp..."
          minSearchLength={1}
        />
        {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id}</p>}
      </div>

      {!formData.supplier_id && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Thông tin nhà cung cấp</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="supplier_info.name">Tên liên hệ</Label>
              <Input
                type="text"
                id="supplier_info.name"
                name="supplier_info.name"
                value={formData.supplier_info.name}
                onChange={handleChange}
                placeholder="Tên người liên hệ"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="supplier_info.phone">Điện thoại</Label>
              <Input
                type="text"
                id="supplier_info.phone"
                name="supplier_info.phone"
                value={formData.supplier_info.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="supplier_info.email">Email</Label>
              <Input
                type="email"
                id="supplier_info.email"
                name="supplier_info.email"
                value={formData.supplier_info.email}
                onChange={handleChange}
                placeholder="Email"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="supplier_info.address">Địa chỉ</Label>
              <Input
                type="text"
                id="supplier_info.address"
                name="supplier_info.address"
                value={formData.supplier_info.address}
                onChange={handleChange}
                placeholder="Địa chỉ"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="expiration_date">Hạn sử dụng</Label>
        <Input
          type="date"
          id="expiration_date"
          name="expiration_date"
          value={formData.expiration_date}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Nhập ghi chú (không bắt buộc)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {!importDoc && (
        <Select
          label="Trạng thái"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
        />
      )}

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
          {importDoc ? 'Cập nhật' : 'Tạo phiếu nhập'}
        </Button>
      </div>
    </form>
  );
};

export default ImportForm;
