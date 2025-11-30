'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TriangleAlert } from "lucide-react"
import Link from 'next/link';

const LowStockAlert = ({ lowStockProducts }) => {
  if (!lowStockProducts || lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Cảnh báo tồn kho thấp</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Cảnh báo</AlertTitle>
          <AlertDescription>
            Có {lowStockProducts.length} sản phẩm sắp hết hàng!
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {lowStockProducts.slice(0, 5).map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {product.product_name}
                </p>
                <p className="text-xs text-gray-600">
                  Còn lại: {product.closing_stock} {product.unit}
                </p>
              </div>
              <div className="text-xs text-yellow-600 font-medium">
                Cần nhập hàng
              </div>
            </div>
          ))}
        </div>

        {lowStockProducts.length > 5 && (
          <div className="mt-4 text-center">
            <Link
              href="/inventory?filter=low-stock"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Xem tất cả ({lowStockProducts.length} sản phẩm) →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockAlert;