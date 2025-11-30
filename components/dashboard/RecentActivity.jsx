'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpFromLine, ArrowDownToLine, CircleDollarSign, ClipboardList } from 'lucide-react';

const RecentActivity = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'import':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <ArrowUpFromLine className="w-4 h-4 text-green-600" />
          </div>
        );
      case 'export':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <ArrowDownToLine className="w-4 h-4 text-blue-600" />
          </div>
        );
      case 'expense':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <CircleDollarSign className="w-4 h-4 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-gray-600" />
          </div>
        );
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.length > 0 ? (
            activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  {activity.amount && (
                    <p className="text-sm text-gray-600">
                      {formatAmount(activity.amount)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có hoạt động nào</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;