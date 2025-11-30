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

const ExportForm = ({ exportDoc, onSubmit, onCancel, loading }) => {
  const { token, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    product_id: '',
    qty_exported: '',
    price_exported: '',
    discount: '',
    customer_id: '',
    customer: '',
    customer_info: {
      name: '',
      phone: '',
      email: '',
      address: '',
    },
    payment_method: 'cash',
    payment_status: 'paid',
    notes: '',
    status: 'completed',
  });

  const [customerType, setCustomerType] = useState('existing'); // 'existing', 'new', 'walkin'
  const [newCustomerName, setNewCustomerName] = useState('');
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const paymentMethodOptions = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'transfer', label: 'Chuyển khoản' },
    { value: 'credit', label: 'Công nợ' },
    { value: 'other', label: 'Khác' },
  ];

  const paymentStatusOptions = [
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'partial', label: 'Thanh toán một phần' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchProducts();
      fetchCustomers();
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (exportDoc) {
      setFormData({
        product_id: exportDoc.product_id || '',
        qty_exported: exportDoc.qty_exported || '',
        price_exported: exportDoc.price_exported || '',
        discount: exportDoc.discount || '',
        customer_id: exportDoc.customer_id?._id || exportDoc.customer_id || '',
        customer: exportDoc.customer || '',
        customer_info: {
          name: exportDoc.customer_info?.name || '',
          phone: exportDoc.customer_info?.phone || '',
          email: exportDoc.customer_info?.email || '',
          address: exportDoc.customer_info?.address || '',
        },
        payment_method: exportDoc.payment_method || 'cash',
        payment_status: exportDoc.payment_status || 'paid',
        notes: exportDoc.notes || '',
        status: exportDoc.status || 'completed',
      });

      // Determine customer type based on existing data
      if (exportDoc.customer_id) {
        setCustomerType('existing');
      } else if (exportDoc.customer === 'Khách vãng lai') {
        setCustomerType('walkin');
      } else if (exportDoc.customer) {
        setCustomerType('new');
        setNewCustomerName(exportDoc.customer);
      } else {
        setCustomerType('existing');
      }
    }
  }, [exportDoc]);

  useEffect(() => {
    if (formData.product_id && products.length > 0) {
      const product = products.find(p => p.product_id === formData.product_id);
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  }, [formData.product_id, products]);

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

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await fetch('/api/dashboard/customers?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Function to load customers for searchable select
  const loadCustomerOptions = async (searchValue) => {
    try {
      const response = await fetch(`/api/dashboard/customers?search=${encodeURIComponent(searchValue)}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return (data.data.customers || []).map(customer => ({
          value: customer._id,
          label: `${customer.customer_code} - ${customer.name}`,
          customer: customer
        }));
      } else {
        console.error('Failed to search customers:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('customer_info.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customer_info: {
          ...prev.customer_info,
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

  // Handle customer type change
  const handleCustomerTypeChange = (e) => {
    const type = e.target.value;
    setCustomerType(type);

    // Reset customer-related fields when type changes
    setFormData(prev => ({
      ...prev,
      customer_id: '',
      customer: '',
      customer_info: {
        name: '',
        phone: '',
        email: '',
        address: '',
      }
    }));
    setNewCustomerName('');

    // Clear customer-related errors
    if (errors.customer_id || errors.customer || errors.newCustomerName) {
      setErrors(prev => ({
        ...prev,
        customer_id: '',
        customer: '',
        newCustomerName: ''
      }));
    }
  };

  // Handle customer selection change
  const handleCustomerChange = (customerId) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customerId || ''
    }));

    // Clear error for customer_id
    if (errors.customer_id) {
      setErrors(prev => ({
        ...prev,
        customer_id: ''
      }));
    }
  };

  // Handle new customer name change
  const handleNewCustomerNameChange = (e) => {
    const name = e.target.value;
    setNewCustomerName(name);

    // Update customer info name field
    setFormData(prev => ({
      ...prev,
      customer_info: {
        ...prev.customer_info,
        name: name
      }
    }));

    // Clear error for newCustomerName
    if (errors.newCustomerName) {
      setErrors(prev => ({
        ...prev,
        newCustomerName: ''
      }));
    }
  };

  // Create new customer
  const createNewCustomer = async (customerName) => {
    if (!customerName.trim()) return null;

    try {
      setCreatingCustomer(true);
      const response = await fetch('/api/dashboard/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: customerName.trim(),
          phone: formData.customer_info.phone || '',
          email: formData.customer_info.email || '',
          address: formData.customer_info.address || '',
          business_type: 'individual',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        console.error('Failed to create customer:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      return null;
    } finally {
      setCreatingCustomer(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Remove export_id validation for new exports as it will be automatically generated
    // export_id is only needed when editing existing exports

    if (!formData.product_id) {
      newErrors.product_id = 'Sản phẩm là bắt buộc';
    }

    if (!formData.qty_exported || parseFloat(formData.qty_exported) <= 0) {
      newErrors.qty_exported = 'Số lượng phải lớn hơn 0';
    }

    if (selectedProduct && parseFloat(formData.qty_exported) > selectedProduct.current_stock) {
      newErrors.qty_exported = `Số lượng xuất vượt quá tồn kho (${selectedProduct.current_stock} ${selectedProduct.unit})`;
    }

    if (!formData.price_exported || parseFloat(formData.price_exported) <= 0) {
      newErrors.price_exported = 'Giá bán phải lớn hơn 0';
    }

    // Customer validation based on type
    if (customerType === 'existing') {
      if (!formData.customer_id) {
        newErrors.customer_id = 'Vui lòng chọn khách hàng';
      }
    } else if (customerType === 'new') {
      if (!newCustomerName.trim()) {
        newErrors.newCustomerName = 'Tên khách hàng là bắt buộc';
      }
    }
    // No validation needed for walkin type

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let submitData = {
      ...formData,
      qty_exported: parseFloat(formData.qty_exported),
      price_exported: parseFloat(formData.price_exported),
      discount: parseFloat(formData.discount) || 0,
      total_exported_amt: calculateTotal(),
    };

    // Only include export_id when editing an existing export
    if (exportDoc && exportDoc.export_id) {
      submitData.export_id = exportDoc.export_id;
    }

    // Handle customer based on type
    if (customerType === 'existing') {
      // Use existing customer
      if (submitData.customer_id) {
        delete submitData.customer;
        delete submitData.customer_info;
      }
    } else if (customerType === 'new') {
      // Create new customer first
      const newCustomer = await createNewCustomer(newCustomerName);
      if (newCustomer) {
        submitData.customer_id = newCustomer._id;
        delete submitData.customer;
        delete submitData.customer_info;
      } else {
        setErrors(prev => ({
          ...prev,
          newCustomerName: 'Không thể tạo khách hàng mới. Vui lòng thử lại.'
        }));
        return;
      }
    } else if (customerType === 'walkin') {
      // Use walk-in customer
      submitData.customer = 'Khách vãng lai';
      submitData.customer_info = {
        name: 'Khách vãng lai',
        phone: '',
        email: '',
        address: ''
      };
      submitData.customer_id = null;
    }

    onSubmit(submitData);
  };

  const calculateTotal = () => {
    const qty = parseFloat(formData.qty_exported) || 0;
    const price = parseFloat(formData.price_exported) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return (qty * price) - discount;
  };

  const calculateProfit = () => {
    const qty = parseFloat(formData.qty_exported) || 0;
    const sellingPrice = parseFloat(formData.price_exported) || 0;
    const costPrice = selectedProduct?.average_cost || 0;
    return (sellingPrice - costPrice) * qty;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Only show export_id field when editing existing export */}
      {exportDoc && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="export_id">Mã phiếu xuất</Label>
          <Input
            type="text"
            id="export_id"
            name="export_id"
            value={exportDoc.export_id || ''}
            disabled={true} // Always disabled when editing
            className="bg-gray-100 text-gray-600"
          />
          <p className="text-sm text-gray-500">Mã phiếu xuất không thể thay đổi</p>
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
            label: `${p.product_id} - ${p.product_name} (Tồn: ${p.current_stock} ${p.unit})`
          }))}
          required
          error={errors.product_id}
          disabled={productsLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="qty_exported">Số lượng xuất</Label>
          <Input
            type="number"
            id="qty_exported"
            name="qty_exported"
            value={formData.qty_exported}
            onChange={handleChange}
            placeholder="Nhập số lượng"
            required
            min="0.01"
            step="0.01"
            className={errors.qty_exported ? 'border-destructive' : ''}
          />
          {errors.qty_exported && <p className="text-sm text-destructive">{errors.qty_exported}</p>}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="price_exported">Giá bán (VND)</Label>
          <Input
            type="number"
            id="price_exported"
            name="price_exported"
            value={formData.price_exported}
            onChange={handleChange}
            placeholder="Nhập giá bán"
            required
            min="1000"
            step="1000"
            className={errors.price_exported ? 'border-destructive' : ''}
          />
          {errors.price_exported && <p className="text-sm text-destructive">{errors.price_exported}</p>}
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

      {/* Price Information */}
      {selectedProduct && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Thông tin giá</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Giá vốn:</span>
              <span className="ml-2 font-medium">
                {selectedProduct.average_cost.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
            <div>
              <span className="text-blue-700">Giá bán:</span>
              <span className="ml-2 font-medium">
                {formData.price_exported ? parseFloat(formData.price_exported).toLocaleString('vi-VN') : 0} VNĐ
              </span>
            </div>
            <div>
              <span className="text-blue-700">Lợi nhuận dự kiến:</span>
              <span className={`ml-2 font-medium ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculateProfit().toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Tổng tiền:</span>
          <span className="text-lg font-bold text-blue-600">
            {calculateTotal().toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label>Loại khách hàng</Label>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="existing"
                checked={customerType === 'existing'}
                onChange={handleCustomerTypeChange}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Khách hàng có sẵn</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="new"
                checked={customerType === 'new'}
                onChange={handleCustomerTypeChange}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Khách hàng mới</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="walkin"
                checked={customerType === 'walkin'}
                onChange={handleCustomerTypeChange}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Khách vãng lai</span>
            </label>
          </div>
        </div>

        {/* Existing Customer Selection */}
        {customerType === 'existing' && (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="customer_id">Chọn khách hàng</Label>
            <SearchableSelect
              id="customer_id"
              value={formData.customer_id}
              onChange={handleCustomerChange}
              loadOptions={loadCustomerOptions}
              placeholder="Tìm kiếm và chọn khách hàng..."
              isLoading={customersLoading}
              noOptionsMessage="Không tìm thấy khách hàng"
              loadingMessage="Đang tìm kiếm khách hàng..."
              minSearchLength={1}
              defaultOption={
                exportDoc?.customer_id && typeof exportDoc.customer_id === 'object'
                  ? {
                    value: exportDoc.customer_id._id,
                    label: `${exportDoc.customer_id.customer_code || 'KH'} - ${exportDoc.customer_id.name}`,
                    customer: exportDoc.customer_id
                  }
                  : null
              }
            />
            {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
          </div>
        )}

        {/* New Customer Input */}
        {customerType === 'new' && (
          <div className="space-y-3">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="newCustomerName">Tên khách hàng mới</Label>
              <Input
                type="text"
                id="newCustomerName"
                value={newCustomerName}
                onChange={handleNewCustomerNameChange}
                placeholder="Nhập tên khách hàng mới..."
                className={errors.newCustomerName ? 'border-destructive' : ''}
              />
              {errors.newCustomerName && <p className="text-sm text-destructive">{errors.newCustomerName}</p>}
              <p className="text-xs text-gray-500">Khách hàng mới sẽ được tự động tạo trong hệ thống</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="customer_info.phone">Điện thoại</Label>
                <Input
                  type="text"
                  id="customer_info.phone"
                  name="customer_info.phone"
                  value={formData.customer_info.phone}
                  onChange={handleChange}
                  placeholder="Số điện thoại (không bắt buộc)"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="customer_info.email">Email</Label>
                <Input
                  type="email"
                  id="customer_info.email"
                  name="customer_info.email"
                  value={formData.customer_info.email}
                  onChange={handleChange}
                  placeholder="Email (không bắt buộc)"
                />
              </div>

              <div className="grid w-full items-center gap-1.5 md:col-span-2">
                <Label htmlFor="customer_info.address">Địa chỉ</Label>
                <Input
                  type="text"
                  id="customer_info.address"
                  name="customer_info.address"
                  value={formData.customer_info.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ (không bắt buộc)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Walk-in Customer Info */}
        {customerType === 'walkin' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Khách vãng lai</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Sẽ sử dụng "Khách vãng lai" làm tên khách hàng</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Phương thức thanh toán"
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          options={paymentMethodOptions}
        />

        <Select
          label="Trạng thái thanh toán"
          name="payment_status"
          value={formData.payment_status}
          onChange={handleChange}
          options={paymentStatusOptions}
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

      {!exportDoc && (
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
          disabled={loading || creatingCustomer}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          loading={loading || creatingCustomer}
          disabled={creatingCustomer}
        >
          {creatingCustomer ? 'Đang tạo khách hàng...' : (exportDoc ? 'Cập nhật' : 'Tạo phiếu xuất')}
        </Button>
      </div>
    </form>
  );
};

export default ExportForm;