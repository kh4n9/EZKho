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
    Eye,
    FileText
} from 'lucide-react';
import InventoryCheckForm from './InventoryCheckForm';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import { format } from 'date-fns';

const InventoryCheckList = () => {
    const { token } = useAuth();
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCheck, setSelectedCheck] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchChecks();
        }
    }, [token, pagination.page, searchTerm]);

    const fetchChecks = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });

            const response = await fetch(`/api/dashboard/inventory-checks?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setChecks(data.data.checks);
                setPagination(prev => ({
                    ...prev,
                    total: data.data.pagination.total,
                    pages: data.data.pagination.pages
                }));
            }
        } catch (error) {
            console.error('Error fetching inventory checks:', error);
            toast.error('Không thể tải danh sách phiếu kiểm kho');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleAdd = () => {
        setSelectedCheck(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (check) => {
        setSelectedCheck(check);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phiếu kiểm kho này?')) return;

        try {
            const response = await fetch(`/api/dashboard/inventory-checks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Xóa phiếu kiểm kho thành công');
                fetchChecks();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Không thể xóa phiếu kiểm kho');
            }
        } catch (error) {
            console.error('Error deleting inventory check:', error);
            toast.error('Lỗi khi xóa phiếu kiểm kho');
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            setFormLoading(true);
            const url = selectedCheck
                ? `/api/dashboard/inventory-checks/${selectedCheck._id}`
                : '/api/dashboard/inventory-checks';

            const method = selectedCheck ? 'PUT' : 'POST';

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
                toast.success(selectedCheck ? 'Cập nhật thành công' : 'Tạo phiếu thành công');
                setIsDialogOpen(false);
                fetchChecks();
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Đã hoàn thành</span>;
            case 'cancelled':
                return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Đã hủy</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Nháp</span>;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Kiểm kho"
                description="Quản lý và đối soát tồn kho thực tế"
                actionLabel="Tạo phiếu kiểm"
                onAction={handleAdd}
            />

            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm theo mã phiếu..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm min-h-[400px]">
                <Table containerClassName="overflow-visible">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã phiếu</TableHead>
                            <TableHead>Ngày kiểm</TableHead>
                            <TableHead>Số lượng SP</TableHead>
                            <TableHead>Ghi chú</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : checks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Chưa có phiếu kiểm kho nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            checks.map((check) => (
                                <TableRow key={check._id}>
                                    <TableCell className="font-medium">{check.check_code}</TableCell>
                                    <TableCell>
                                        {format(new Date(check.check_date), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        {check.products?.length || 0} sản phẩm
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {check.notes || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(check.status)}
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
                                                <DropdownMenuItem onClick={() => handleEdit(check)}>
                                                    {check.status === 'draft' ? (
                                                        <><Pencil className="mr-2 h-4 w-4" /> Sửa phiếu</>
                                                    ) : (
                                                        <><Eye className="mr-2 h-4 w-4" /> Xem chi tiết</>
                                                    )}
                                                </DropdownMenuItem>
                                                {check.status === 'draft' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleDelete(check._id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Xóa phiếu
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCheck
                                ? (selectedCheck.status === 'draft' ? 'Cập nhật phiếu kiểm kho' : 'Chi tiết phiếu kiểm kho')
                                : 'Tạo phiếu kiểm kho mới'}
                        </DialogTitle>
                    </DialogHeader>
                    <InventoryCheckForm
                        check={selectedCheck}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setIsDialogOpen(false)}
                        loading={formLoading}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InventoryCheckList;
