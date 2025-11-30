'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Store, Settings, Shield, Bell } from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    // User info
    full_name: '',
    email: '',
    phone: '',

    // Store info
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',

    // Preferences
    language: 'vi',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',

    // Settings
    low_stock_threshold: 100,
    auto_backup: true,
    email_notifications: true,
    low_stock_alerts: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        store_name: user.store_name || '',
        store_address: user.store_address || '',
        store_phone: user.store_phone || '',
        store_email: user.store_email || '',
        language: user.preferences?.language || 'vi',
        currency: user.preferences?.currency || 'VND',
        timezone: user.preferences?.timezone || 'Asia/Ho_Chi_Minh',
        low_stock_threshold: user.settings?.low_stock_threshold || 100,
        auto_backup: user.settings?.auto_backup ?? true,
        email_notifications: user.settings?.email_notifications ?? true,
        low_stock_alerts: user.settings?.low_stock_alerts ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data.data.user);
        setMessage('Cài đặt đã được lưu thành công!');
      } else {
        setMessage(data.message || 'Lưu cài đặt thất bại');
      }
    } catch (error) {
      setMessage('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="mt-1 text-sm text-gray-600">
          Quản lý thông tin tài khoản và cài đặt hệ thống
        </p>
      </div>

      {message && (
        <Alert className={message.includes('thành công') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.includes('thành công') ? 'text-green-800' : 'text-red-800'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ và tên</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Thông tin cửa hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_name">Tên cửa hàng</Label>
              <Input
                id="store_name"
                name="store_name"
                value={formData.store_name}
                onChange={handleChange}
                placeholder="Nhập tên cửa hàng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_address">Địa chỉ cửa hàng</Label>
              <Input
                id="store_address"
                name="store_address"
                value={formData.store_address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ cửa hàng"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store_phone">Điện thoại cửa hàng</Label>
                <Input
                  id="store_phone"
                  name="store_phone"
                  value={formData.store_phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại cửa hàng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_email">Email cửa hàng</Label>
                <Input
                  id="store_email"
                  name="store_email"
                  type="email"
                  value={formData.store_email}
                  onChange={handleChange}
                  placeholder="Nhập email cửa hàng"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Tùy chọn hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ</Label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Tiền tệ</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Múi giờ</Label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Cài đặt hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Ngưỡng cảnh báo tồn kho thấp mặc định</Label>
              <Input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="0"
              />
              <p className="text-xs text-gray-500">
                Giá trị này sẽ được áp dụng tự động cho các sản phẩm mới nếu không được thiết lập riêng.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="auto_backup"
                  name="auto_backup"
                  checked={formData.auto_backup}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="auto_backup">Tự động sao lưu dữ liệu</Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="email_notifications"
                  name="email_notifications"
                  checked={formData.email_notifications}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="email_notifications">Nhận thông báo email</Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="low_stock_alerts"
                  name="low_stock_alerts"
                  checked={formData.low_stock_alerts}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="low_stock_alerts">Cảnh báo tồn kho thấp</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;