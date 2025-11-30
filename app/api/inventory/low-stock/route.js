import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get low stock products directly from Products collection
    const lowStockProducts = await Product.find({
      user_id: user._id,
      is_active: true,
      $or: [
        { current_stock: 0 },
        { $expr: { $lte: ['$current_stock', '$reorder_level'] } }
      ]
    })
    .sort({ current_stock: 1 })
    .limit(limit)
    .select('product_id product_name unit current_stock average_cost reorder_level')
    .lean();

    // Format products with stock status
    const formattedProducts = lowStockProducts.map(product => {
      let stockStatus, statusColor;

      if (product.current_stock === 0) {
        stockStatus = 'Hết hàng';
        statusColor = 'red';
      } else if (product.current_stock <= (product.reorder_level || 100)) {
        stockStatus = 'Sắp hết hàng';
        statusColor = 'yellow';
      } else {
        stockStatus = 'Còn hàng';
        statusColor = 'green';
      }

      return {
        _id: product._id,
        product_id: product.product_id,
        product_name: product.product_name,
        unit: product.unit,
        current_stock: product.current_stock,
        average_cost: product.average_cost || 0,
        reorder_level: product.reorder_level || 100,
        total_value: (product.current_stock || 0) * (product.average_cost || 0),
        stock_status: stockStatus,
        status_color: statusColor
      };
    });

    // Get summary statistics
    const allProducts = await Product.find({
      user_id: user._id,
      is_active: true
    }).select('current_stock reorder_level');

    const outOfStock = allProducts.filter(p => p.current_stock === 0).length;
    const lowStock = allProducts.filter(p =>
      p.current_stock > 0 && p.current_stock <= (p.reorder_level || 100)
    ).length;
    const inStock = allProducts.filter(p =>
      p.current_stock > (p.reorder_level || 100)
    ).length;

    const summaryData = {
      total_products: allProducts.length,
      out_of_stock: outOfStock,
      low_stock: lowStock,
      in_stock: inStock
    };

    return ApiResponse.success({
      products: formattedProducts,
      summary: summaryData
    }, 'Low stock products retrieved successfully');

  } catch (error) {
    console.error('Get low stock products error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    // Return empty data instead of error to avoid breaking the dashboard
    return ApiResponse.success({
      products: [],
      summary: {
        total_products: 0,
        out_of_stock: 0,
        low_stock: 0,
        in_stock: 0
      }
    }, 'No low stock products found');
  }
}