'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const SupplierForm = ({ supplier, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_code: '',
        notes: '',
        status: 'active',
    });
    const [errors, setErrors] = useState({});

    const statusOptions = [
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'inactive', label: 'Ngừng hoạt động' },
    ];

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || '',
                contact_person: supplier.contact_person || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                tax_code: supplier.tax_code || '',
                notes: supplier.notes || '',
                status: supplier.status || 'active',
            });
        }
    }, [supplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Tên nhà cung cấp là bắt buộc';
        }

        // Basic email validation if provided
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {supplier && (
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="supplier_code">Mã nhà cung cấp</Label>
                    <Input
                        type="text"
                        id="supplier_code"
                        value={supplier.supplier_code}
                        disabled
                        className="bg-gray-100"
                    />
                </div>
            )}

            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="name">Tên nhà cung cấp <span className="text-red-500">*</span></Label>
                <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập tên nhà cung cấp"
                    className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="contact_person">Người liên hệ</Label>
                    <Input
                        type="text"
                        id="contact_person"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        placeholder="Tên người liên hệ"
                    />
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="tax_code">Mã số thuế</Label>
                    <Input
                        type="text"
                        id="tax_code"
                        name="tax_code"
                        value={formData.tax_code}
                        onChange={handleChange}
                        placeholder="Mã số thuế"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Số điện thoại"
                    />
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
            </div>

            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Địa chỉ"
                />
            </div>

            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="notes">Ghi chú</Label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ghi chú thêm..."
                />
            </div>

            <div className="grid w-full items-center gap-1.5">
                <Select
                    label="Trạng thái"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={statusOptions}
                />
            </div>

            {Object.values(errors).some(error => error) && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                        Vui lòng kiểm tra lại thông tin.
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
                    {supplier ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </div>
        </form>
    );
};

export default SupplierForm;
