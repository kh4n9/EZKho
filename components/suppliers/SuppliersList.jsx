'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Phone,
    Mail,
    MapPin
} from 'lucide-react';
import SupplierForm from './SupplierForm';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';

const SuppliersList = () => {
    const { token } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchSuppliers();
        }
    }, [token, pagination.page, searchTerm]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });

            const response = await fetch(`/api/dashboard/suppliers?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setSuppliers(data.data.suppliers);
                setPagination(prev => ({
                    ...prev,
                    total: data.data.pagination.total,
                    pages: data.data.pagination.pages
                }));
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Không thể tải danh sách nhà cung cấp');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleAdd = () => {
        setSelectedSupplier(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;

        try {
            const response = await fetch(`/api/dashboard/suppliers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Xóa nhà cung cấp thành công');
                fetchSuppliers();
            } else {
                toast.error('Không thể xóa nhà cung cấp');
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
            toast.error('Lỗi khi xóa nhà cung cấp');
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            setFormLoading(true);
            const url = selectedSupplier
                ? `/api/dashboard/suppliers/${selectedSupplier._id}`
                : '/api/dashboard/suppliers';

            const method = selectedSupplier ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(selectedSupplier ? 'Cập nhật thành công' : 'Thêm mới thành công');
                setIsDialogOpen(false);
                fetchSuppliers();
            } else {
                toast.error(data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Lỗi khi lưu thông tin');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Nhà cung cấp"
                description="Quản lý danh sách nhà cung cấp và thông tin liên hệ"
                actionLabel="Thêm mới"
                onAction={handleAdd}
            />

            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm theo tên, mã, SĐT..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã NCC</TableHead>
                            <TableHead>Tên nhà cung cấp</TableHead>
                            <TableHead>Liên hệ</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    Chưa có nhà cung cấp nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier._id}>
                                    <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-gray-900">{supplier.name}</p>
                                            {supplier.tax_code && (
                                                <p className="text-xs text-gray-500">MST: {supplier.tax_code}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            {supplier.contact_person && (
                                                <p className="font-medium">{supplier.contact_person}</p>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {supplier.phone}
                                                </div>
                                            )}
                                            {supplier.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {supplier.email}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${supplier.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {supplier.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDelete(supplier._id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                    >
                        Trước
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                        Trang {pagination.page} / {pagination.pages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                    >
                        Sau
                    </Button>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{selectedSupplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}</DialogTitle>
                    </DialogHeader>
                    <SupplierForm
                        supplier={selectedSupplier}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setIsDialogOpen(false)}
                        loading={formLoading}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuppliersList;
