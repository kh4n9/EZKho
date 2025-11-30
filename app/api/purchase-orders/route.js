import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PurchaseOrder, Product, Supplier } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

// GET all purchase orders for authenticated user
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
    const supplier = searchParams.get('supplier');
    const product_id = searchParams.get('product_id');
    const sort_by = searchParams.get('sort_by') || 'order_date';
    const sort_order = searchParams.get('sort_order') || 'desc';

    // Build query
    const query = { user_id: user._id };

    if (status) {
      query.status = status;
    }

    if (supplier) {
      query.supplier_id = supplier;
    }

    if (product_id) {
      query.product_id = product_id;
    }

    // Build sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const orders = await PurchaseOrder.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('supplier_id', 'name contact_person phone')
      .populate('product_id', 'product_name unit');

    const total = await PurchaseOrder.countDocuments(query);

    return ApiResponse.success({
      orders,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }, 'Purchase orders retrieved successfully');

  } catch (error) {
    console.error('Get purchase orders error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve purchase orders', 500);
  }
}

// POST create new purchase order
export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['product_id', 'quantity', 'unit_price'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.log('POST /api/purchase-orders - Missing fields:', missingFields);
      return ApiResponse.validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Verify product exists and belongs to user
    const product = await Product.findOne({
      user_id: user._id,
      product_id: body.product_id
    });

    if (!product) {
      return ApiResponse.error('Product not found', 404);
    }

    // Verify supplier exists and belongs to user
    let supplierInfo = null;
    if (body.supplier_id) {
      supplierInfo = await Supplier.findOne({
        _id: body.supplier_id,
        user_id: user._id
      });

      if (!supplierInfo) {
        return ApiResponse.error('Supplier not found', 404);
      }
    }

    // Create purchase order data
    const purchaseOrderData = {
      user_id: user._id,
      product_id: body.product_id,
      supplier_id: body.supplier_id,
      quantity: parseFloat(body.quantity),
      unit_price: parseFloat(body.unit_price),
      total_amount: parseFloat(body.quantity) * parseFloat(body.unit_price),
      status: body.status || 'pending',
      expected_delivery_date: body.expected_delivery_date ? new Date(body.expected_delivery_date) : null,
      notes: body.notes || '',
      created_by: user.username || user.email || 'unknown',
      auto_generated: true,
      product_name: product.product_name
    };

    const purchaseOrder = new PurchaseOrder(purchaseOrderData);
    await purchaseOrder.save();

    // Return populated purchase order
    const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier_id', 'name contact_person phone')
      .populate('product_id', 'product_name unit');

    return ApiResponse.created(populatedOrder, 'Purchase order created successfully');

  } catch (error) {
    console.error('Create purchase order error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    return ApiResponse.error('Failed to create purchase order', 500);
  }
}

// PUT update purchase order status
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);
    const body = await request.json();
    const { id } = params;

    // Find the purchase order
    const order = await PurchaseOrder.findOne({
      _id: id,
      user_id: user._id
    });

    if (!order) {
      return ApiResponse.notFound('Purchase order not found');
    }

    // Update status
    const allowedStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled'];
    if (body.status && allowedStatuses.includes(body.status)) {
      order.status = body.status;
      
      // If order is being approved, create related export when received
      if (body.status === 'approved') {
        order.related_export_id = null; // Will be set when export is created
      }
    }

    // Update other fields
    if (body.notes !== undefined) {
      order.notes = body.notes;
    }

    if (body.expected_delivery_date !== undefined) {
      order.expected_delivery_date = new Date(body.expected_delivery_date);
    }

    await order.save();

    // Return updated order
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