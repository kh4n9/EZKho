'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const RegisterForm = ({ onToggleMode }) => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    store_name: '',
    phone: '',
    store_address: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username) {
      errors.username = 'Tên đăng nhập là bắt buộc';
    }

    if (!formData.email) {
      errors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!formData.full_name) {
      errors.full_name = 'Họ và tên là bắt buộc';
    }

    if (!formData.store_name) {
      errors.store_name = 'Tên cửa hàng là bắt buộc';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registerData } = formData;

    await register(registerData);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Đăng ký tài khoản
        </h2>
        <p className="mt-2 text-gray-600">
          Tạo tài khoản mới để bắt đầu quản lý kho hàng của bạn.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              required
              className={validationErrors.username ? 'border-destructive' : ''}
            />
            {validationErrors.username && <p className="text-sm text-destructive">{validationErrors.username}</p>}
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              required
              className={validationErrors.email ? 'border-destructive' : ''}
            />
            {validationErrors.email && <p className="text-sm text-destructive">{validationErrors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
              className={validationErrors.password ? 'border-destructive' : ''}
            />
            {validationErrors.password && <p className="text-sm text-destructive">{validationErrors.password}</p>}
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              required
              className={validationErrors.confirmPassword ? 'border-destructive' : ''}
            />
            {validationErrors.confirmPassword && <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>}
          </div>
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="full_name">Họ và tên</Label>
          <Input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            required
            className={validationErrors.full_name ? 'border-destructive' : ''}
          />
          {validationErrors.full_name && <p className="text-sm text-destructive">{validationErrors.full_name}</p>}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="store_name">Tên cửa hàng</Label>
          <Input
            type="text"
            id="store_name"
            name="store_name"
            value={formData.store_name}
            onChange={handleChange}
            placeholder="Nhập tên cửa hàng"
            required
            className={validationErrors.store_name ? 'border-destructive' : ''}
          />
          {validationErrors.store_name && <p className="text-sm text-destructive">{validationErrors.store_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="store_address">Địa chỉ cửa hàng</Label>
            <Input
              type="text"
              id="store_address"
              name="store_address"
              value={formData.store_address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ cửa hàng"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;