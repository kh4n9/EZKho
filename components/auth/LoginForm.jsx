'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const LoginForm = ({ onToggleMode }) => {
  const { login, loading, error, clearError } = useAuth();
  const router = useRouter(); // Initialize useRouter
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    console.log('Submitting login form with email:', formData.email);
    const result = await login(formData.email, formData.password);
    console.log('Login result:', result);

    if (result.success) {
      console.log('Login successful, redirecting to dashboard');
      router.push('/dashboard'); // Redirect to dashboard on successful login
    } else {
      console.log('Login failed:', result.error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Đăng nhập
        </h2>
        <p className="mt-2 text-gray-600">
          Chào mừng quay trở lại! Vui lòng đăng nhập vào tài khoản của bạn.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email của bạn"
            required
          />
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu của bạn"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={!formData.email || !formData.password}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;