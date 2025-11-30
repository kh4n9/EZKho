'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, CreditCard, Activity } from "lucide-react";

const StatCard = ({ title, value, change, changeType, icon }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'positive' ? '+' : ''}{change} so với tháng trước
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardStats = ({ stats }) => {
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Tổng sản phẩm"
        value={stats?.totalProducts || 0}
        change={stats?.productChange || 0}
        changeType="positive"
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
      />

      <StatCard
        title="Giá trị tồn kho"
        value={formatCurrency(stats?.inventoryValue)}
        change={stats?.inventoryChange || '0%'}
        changeType={stats?.inventoryChangeType || 'positive'}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />

      <StatCard
        title="Doanh thu tháng"
        value={formatCurrency(stats?.monthlyRevenue)}
        change={stats?.revenueChange || '0%'}
        changeType={stats?.revenueChangeType || 'positive'}
        icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
      />

      <StatCard
        title="Lợi nhuận tháng"
        value={formatCurrency(stats?.monthlyProfit)}
        change={stats?.profitChange || '0%'}
        changeType={stats?.profitChangeType || 'positive'}
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
};

export default DashboardStats;