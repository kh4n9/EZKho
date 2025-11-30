'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Truck,
  ClipboardCheck,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Store
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState({
    'Tổng quan': true,
    'Quản lý hàng hóa': true,
    'Giao dịch': true,
    'Đối tác': true,
    'Báo cáo': true,
    'Hệ thống': true,
  });

  const toggleGroup = (groupTitle) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const sidebarGroups = [
    {
      title: 'Tổng quan',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Quản lý hàng hóa',
      items: [
        { name: 'Sản phẩm', href: '/dashboard/products', icon: Package },
        { name: 'Nhập hàng', href: '/dashboard/imports', icon: ArrowDownToLine },
        { name: 'Kiểm kho', href: '/dashboard/inventory-check', icon: ClipboardCheck },
      ]
    },
    {
      title: 'Giao dịch',
      items: [
        { name: 'Xuất hàng', href: '/dashboard/exports', icon: ArrowUpFromLine },
      ]
    },
    {
      title: 'Đối tác',
      items: [
        { name: 'Khách hàng', href: '/dashboard/customers', icon: Users },
        { name: 'Nhà cung cấp', href: '/dashboard/suppliers', icon: Truck },
      ]
    },
    {
      title: 'Báo cáo',
      items: [
        { name: 'Báo cáo', href: '/dashboard/reports', icon: BarChart3 },
      ]
    },
    {
      title: 'Hệ thống',
      items: [
        { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
      ]
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      {/* Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-shrink-0 w-64 flex-col border-r border-gray-200 bg-white shadow-sm transition-all duration-300">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto custom-scrollbar">
            <nav className="mt-2 flex-1 px-3 space-y-6">
              {sidebarGroups.map((group) => (
                <div key={group.title}>
                  <div
                    className="flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={() => toggleGroup(group.title)}
                  >
                    {group.title}
                    {openGroups[group.title] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </div>

                  {openGroups[group.title] && (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        let isActive = false;
                        if (item.href === '/dashboard') {
                          isActive = pathname === '/dashboard';
                        } else {
                          isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        }

                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`
                              group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                              ${isActive
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }
                            `}
                          >
                            <Icon
                              className={`
                                mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200
                                ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                              `}
                            />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Store Info */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center w-full">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.store_name || 'Cửa hàng của bạn'}
                </p>
                <div className="flex items-center mt-0.5">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${user?.subscription?.plan === 'premium' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.subscription?.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;