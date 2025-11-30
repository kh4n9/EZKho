'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import CustomerForm from './CustomerForm';
import CustomerStats from './CustomerStats';
import CustomerReports from './CustomerReports';

const CustomersList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'reports'

    const fetchCustomers = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                search
            });

            const response = await fetch(`/api/dashboard/customers?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setCustomers(data.data.customers);
                setPagination(data.data.pagination);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCustomers(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/dashboard/customers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchCustomers(pagination.page);
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Quản lý thông tin khách hàng và đối tác
                    </p>
                </div>
                {activeTab === 'list' && (
                    <Button onClick={() => { setEditingCustomer(null); setShowForm(true); }} className="mt-4 sm:mt-0">
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm khách hàng
                    </Button>
                )}
            </div>

            <div className="flex space-x-2 border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'list'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('list')}
                >
                    Danh sách
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'reports'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('reports')}
                >
                    Báo cáo
                </button>
            </div>

            {activeTab === 'reports' ? (
                <CustomerReports />
            ) : (
                <>
                    <CustomerStats stats={stats} />

                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm theo tên, số điện thoại, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 max-w-md"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Mã KH</th>
                                        <th className="px-6 py-3">Tên khách hàng</th>
                                        <th className="px-6 py-3">Liên hệ</th>
                                        <th className="px-6 py-3">Địa chỉ</th>
                                        <th className="px-6 py-3">Trạng thái</th>
                                        <th className="px-6 py-3 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center">Đang tải...</td>
                                        </tr>
                                    ) : customers.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                Chưa có khách hàng nào
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((customer) => (
                                            <tr key={customer._id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {customer.customer_code}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                                    {customer.contact_person && (
                                                        <div className="text-xs text-gray-500">LH: {customer.contact_person}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col space-y-1">
                                                        {customer.phone && (
                                                            <div className="flex items-center text-gray-500">
                                                                <Phone className="h-3 w-3 mr-1" />
                                                                {customer.phone}
                                                            </div>
                                                        )}
                                                        {customer.email && (
                                                            <div className="flex items-center text-gray-500">
                                                                <Mail className="h-3 w-3 mr-1" />
                                                                {customer.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-gray-500 max-w-xs truncate">
                                                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {[
                                                                customer.address?.street,
                                                                customer.address?.city,
                                                                customer.address?.province
                                                            ].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {customer.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => { setEditingCustomer(customer); setShowForm(true); }}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(customer._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center p-4 border-t">
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === 1}
                                        onClick={() => fetchCustomers(pagination.page - 1)}
                                    >
                                        Trước
                                    </Button>
                                    <span className="flex items-center px-4 text-sm text-gray-600">
                                        Trang {pagination.page} / {pagination.pages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === pagination.pages}
                                        onClick={() => fetchCustomers(pagination.page + 1)}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {showForm && (
                <CustomerForm
                    customer={editingCustomer}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => fetchCustomers(pagination.page)}
                />
            )}
        </div>
    );
};

export default CustomersList;
