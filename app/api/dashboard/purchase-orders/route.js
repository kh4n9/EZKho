import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { PurchaseOrderService } from '@/lib/services/purchaseOrderService';

// GET purchase orders for dashboard
export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');

    let orders;
    let total = 0;

    if (status === 'pending') {
      orders = await PurchaseOrderService.getPendingOrders(user._id);
      total = await PurchaseOrder.countDocuments({ user_id: user._id, status: 'pending' });
    } else {
      orders = await PurchaseOrderService.getPurchaseOrderStats(user._id);
      total = await PurchaseOrder.countDocuments({ user_id: user._id });
    }

    return ApiResponse.success({
      orders,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      },
      stats: status === 'pending' ? { pending_count: total } : orders
    }, 'Purchase orders retrieved successfully');

  } catch (error) {
    console.error('Get purchase orders error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve purchase orders', 500);
  }
}

// POST approve purchase order
export async function POST(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);
    const { id } = params;

    const body = await request.json();

    // Find the purchase order
    const order = await PurchaseOrder.findOne({
      _id: id,
      user_id: user._id
    });

    if (!order) {
      return ApiResponse.notFound('Purchase order not found');
    }

    if (order.status !== 'pending') {
      return ApiResponse.error('Only pending orders can be approved', 400);
    }

    // Update order status to approved
    const updatedOrder = await PurchaseOrderService.updateOrderStatus(
      id,
      'approved',
      'Đã duyệt bởi ' + (user.username || user.email)
    );

    return ApiResponse.success(updatedOrder, 'Purchase order approved successfully');

  } catch (error) {
    console.error('Approve purchase order error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to approve purchase order', 500);
  }
}

// PUT update purchase order
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);
    const { id } = params;
    const body = await request.json();

    // Find the purchase order
    const order = await PurchaseOrder.findOne({
      _id: id,
      user_id: user._id
    });

    if (!order) {
      return ApiResponse.notFound('Purchase order not found');
    }

    // Update order
    const allowedStatuses = ['pending', 'approved', 'ordered'];
    if (body.status && allowedStatuses.includes(body.status)) {
      order.status = body.status;
      if (body.notes) {
        order.notes = body.notes;
      }
      await order.save();
    }

    const updatedOrder = await PurchaseOrder.findById(order._id)
      .populate('supplier_id', 'name contact_person phone')
      .populate('product_id', 'product_name unit');

    return ApiResponse.success(updatedOrder, 'Purchase order updated successfully');

  } catch (error) {
    console.error('Update purchase order error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to update purchase order', 500);
  }
}