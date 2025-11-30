'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming this exists or use Input
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
import { Search, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const InventoryCheckForm = ({ check, onSubmit, onCancel, loading }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        check_date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'draft',
        products: []
    });

    // Initialize form data if editing
    useEffect(() => {
        if (check) {
            setFormData({
                check_date: new Date(check.check_date).toISOString().split('T')[0],
                notes: check.notes || '',
                status: check.status,
                products: check.products.map(p => ({
                    ...p,
                    difference: p.actual_stock - p.system_stock
                }))
            });
        }
    }, [check]);

    const handleProductSelect = (option) => {
        if (!option) return;

        // Check if product already exists
        if (formData.products.some(p => p.product_id === option.value)) {
            toast.error('Sản phẩm này đã có trong danh sách kiểm kê');
            return;
        }

        const newProduct = {
            product_id: option.value,
            product_name: option.label.split(' - ')[0], // Assuming label format "Name - Code"
            unit: option.unit || 'kg',
            system_stock: option.current_stock || 0,
            actual_stock: option.current_stock || 0,
            difference: 0,
            reason: ''
        };

        setFormData(prev => ({
            ...prev,
            products: [...prev.products, newProduct]
        }));
    };

    const handleStockChange = (index, value) => {
        const actualStock = parseFloat(value) || 0;
        setFormData(prev => {
            const newProducts = [...prev.products];
            const product = newProducts[index];
            product.actual_stock = actualStock;
            product.difference = actualStock - product.system_stock;
            return { ...prev, products: newProducts };
        });
    };

    const handleReasonChange = (index, value) => {
        setFormData(prev => {
            const newProducts = [...prev.products];
            newProducts[index].reason = value;
            return { ...prev, products: newProducts };
        });
    };

    const removeProduct = (index) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (status) => {
        if (formData.products.length === 0) {
            toast.error('Vui lòng thêm ít nhất một sản phẩm để kiểm kê');
            return;
        }

        onSubmit({
            ...formData,
            status
        });
    };

    const loadProductOptions = async (inputValue) => {
        try {
            const response = await fetch(`/api/products?search=${inputValue}&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!data.success) return [];

            return data.data.products.map(product => ({
                value: product._id,
                label: `${product.product_name} - ${product.product_id}`,
                unit: product.unit,
                current_stock: product.current_stock
            }));
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    };

    const isReadOnly = check && (check.status === 'completed' || check.status === 'cancelled');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày kiểm kho
                    </label>
                    <Input
                        type="date"
                        value={formData.check_date}
                        onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
                        disabled={isReadOnly}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ghi chú
                    </label>
                    <Input
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Nhập ghi chú..."
                        disabled={isReadOnly}
                    />
                </div>
            </div>

            {!isReadOnly && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thêm sản phẩm kiểm kê
                    </label>
                    <SearchableSelect
                        placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
                        loadOptions={loadProductOptions}
                        onChange={handleProductSelect}
                        value={null} // Always reset after selection
                        returnFullOption={true}
                    />
                </div>
            )}

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead className="text-right">Tồn hệ thống</TableHead>
                            <TableHead className="text-right w-32">Thực tế</TableHead>
                            <TableHead className="text-right">Chênh lệch</TableHead>
                            <TableHead>Lý do</TableHead>
                            {!isReadOnly && <TableHead className="w-12"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formData.products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Chưa có sản phẩm nào trong danh sách kiểm kê
                                </TableCell>
                            </TableRow>
                        ) : (
                            formData.products.map((item, index) => (
                                <TableRow key={item.product_id}>
                                    <TableCell className="font-medium">
                                        {item.product_name}
                                        <span className="text-xs text-gray-500 block">{item.unit}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.system_stock}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            className="text-right"
                                            value={item.actual_stock}
                                            onChange={(e) => handleStockChange(index, e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${item.difference > 0 ? 'text-green-600' :
                                        item.difference < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {item.difference > 0 ? '+' : ''}{item.difference}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.reason || ''}
                                            onChange={(e) => handleReasonChange(index, e.target.value)}
                                            placeholder="Lý do chênh lệch..."
                                            disabled={isReadOnly}
                                        />
                                    </TableCell>
                                    {!isReadOnly && (
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeProduct(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Hủy bỏ
                </Button>
                {!isReadOnly && (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit('draft')}
                            disabled={loading}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Lưu nháp
                        </Button>
                        <Button
                            onClick={() => handleSubmit('completed')}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Hoàn thành & Cân bằng kho
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default InventoryCheckForm;
