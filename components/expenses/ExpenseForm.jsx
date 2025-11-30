'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const ExpenseForm = ({ expense, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    expense_id: '',
    expense_type: '',
    amount: '',
    description: '',
    category: 'biến đổi',
    payment_method: 'cash',
    recipient: '',
    invoice_number: '',
    related_product: '',
    department: '',
    notes: '',
    status: 'approved',
    recurring: false,
    recurring_period: '',
  });

  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const expenseTypeOptions = [
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
    { value: 'cố định', label: 'Chi phí cố định' },
    { value: 'biến đổi', label: 'Chi phí biến đổi' },
    { value: 'đột xuất', label: 'Chi phí đột xuất' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'transfer', label: 'Chuyển khoản' },
    { value: 'card', label: 'Thẻ' },
    { value: 'other', label: 'Khác' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
  ];

  const recurringPeriodOptions = [
    { value: 'daily', label: 'Hàng ngày' },
    { value: 'weekly', label: 'Hàng tuần' },
    { value: 'monthly', label: 'Hàng tháng' },
    { value: 'yearly', label: 'Hàng năm' },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (expense) {
      setFormData({
        expense_id: expense.expense_id || '',
        expense_type: expense.expense_type || '',
        amount: expense.amount || '',
        description: expense.description || '',
        category: expense.category || 'biến đổi',
        payment_method: expense.payment_method || 'cash',
        recipient: expense.recipient || '',
        invoice_number: expense.invoice_number || '',
        related_product: expense.related_product || '',
        department: expense.department || '',
        notes: expense.notes || '',
        status: expense.status || 'approved',
        recurring: expense.recurring || false,
        recurring_period: expense.recurring_period || '',
      });
    }
  }, [expense]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/products?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

    if (!formData.expense_id.trim()) {
      newErrors.expense_id = 'Mã chi phí là bắt buộc';
    }

    if (!formData.expense_type) {
      newErrors.expense_type = 'Loại chi phí là bắt buộc';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả chi phí là bắt buộc';
    }

    if (formData.recurring && !formData.recurring_period) {
      newErrors.recurring_period = 'Vui lòng chọn chu kỳ lặp lại';
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
      amount: parseFloat(formData.amount),
      recurring: formData.recurring || false,
      recurring_period: formData.recurring ? formData.recurring_period : null,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="expense_id">Mã chi phí</Label>
          <Input
            type="text"
            id="expense_id"
            name="expense_id"
            value={formData.expense_id}
            onChange={handleChange}
            placeholder="Nhập mã chi phí"
            required
            disabled={!!expense}
            className={errors.expense_id ? 'border-destructive' : ''}
          />
          {errors.expense_id && <p className="text-sm text-destructive">{errors.expense_id}</p>}
        </div>

        <Select
          label="Loại chi phí"
          name="expense_type"
          value={formData.expense_type}
          onChange={handleChange}
          options={expenseTypeOptions}
          required
          error={errors.expense_type}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="amount">Số tiền (VND)</Label>
          <Input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Nhập số tiền"
            required
            min="1000"
            step="1000"
            className={errors.amount ? 'border-destructive' : ''}
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
        </div>

        <Select
          label="Danh mục"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categoryOptions}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="description">Mô tả chi phí</Label>
        <Input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Nhập mô tả chi phí"
          required
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="recipient">Người nhận</Label>
          <Input
            type="text"
            id="recipient"
            name="recipient"
            value={formData.recipient}
            onChange={handleChange}
            placeholder="Nhập tên người nhận"
          />
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="invoice_number">Số hóa đơn</Label>
          <Input
            type="text"
            id="invoice_number"
            name="invoice_number"
            value={formData.invoice_number}
            onChange={handleChange}
            placeholder="Nhập số hóa đơn (nếu có)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Phương thức thanh toán"
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          options={paymentMethodOptions}
        />

        <Select
          label="Sản phẩm liên quan"
          name="related_product"
          value={formData.related_product}
          onChange={handleChange}
          options={products.map(p => ({
            value: p.product_id,
            label: `${p.product_id} - ${p.product_name}`
          }))}
          disabled={productsLoading}
        />

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="department">Bộ phận</Label>
          <Input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Nhập bộ phận (nếu có)"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Chi phí lặp lại</h4>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="recurring"
            name="recurring"
            checked={formData.recurring}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900">
            Đây là chi phí lặp lại
          </label>
        </div>

        {formData.recurring && (
          <Select
            label="Chu kỳ lặp lại"
            name="recurring_period"
            value={formData.recurring_period}
            onChange={handleChange}
            options={recurringPeriodOptions}
            required
            error={errors.recurring_period}
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Nhập ghi chú thêm (không bắt buộc)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {!expense && (
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
          {expense ? 'Cập nhật' : 'Tạo chi phí'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;