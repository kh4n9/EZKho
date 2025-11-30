import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Export, Product, Customer } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET all exports for authenticated user
export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search');
    const product_id = searchParams.get('product_id');
    const customer = searchParams.get('customer');
    const status = searchParams.get('status');
    const payment_status = searchParams.get('payment_status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const sort_by = searchParams.get('sort_by') || 'export_date';
    const sort_order = searchParams.get('sort_order') || 'desc';

    // Build query
    const query = { user_id: user._id };

    if (search) {
      query.$or = [
        { export_id: { $regex: search, $options: 'i' } },
        { customer: { $regex: search, $options: 'i' } },
      ];
    }

    if (product_id) {
      query.product_id = product_id;
    }

    if (customer && !search) { // Avoid overwriting search if customer is also part of it
      query.customer = { $regex: customer, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (payment_status) {
      query.payment_status = payment_status;
    }

    if (start_date || end_date) {
      query.export_date = {};
      if (start_date) {
        query.export_date.$gte = new Date(start_date);
      }
      if (end_date) {
        query.export_date.$lte = new Date(end_date);
      }
    }

    // Build sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const exports = await Export.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Export.countDocuments(query);

    return ApiResponse.success({
      exports,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }, 'Exports retrieved successfully');

  } catch (error) {
    console.error('Get exports error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve exports', 500);
  }
}

// POST create new export
export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Validate required fields (export_id is now optional)
    const requiredFields = ['product_id', 'qty_exported', 'price_exported'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.log('POST /api/exports - Missing fields:', missingFields);
      return ApiResponse.validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if export_id already exists for this user (only if export_id is provided)
    if (body.export_id && body.export_id.trim()) {
      const existingExport = await Export.findOne({
        user_id: user._id,
        export_id: body.export_id.trim()
      });

      if (existingExport) {
        return ApiResponse.error('Export ID already exists', 409);
      }
    }

    // Verify product exists and belongs to user
    const product = await Product.findOne({
      user_id: user._id,
      product_id: body.product_id
    });

    if (!product) {
      return ApiResponse.error('Product not found', 404);
    }

    // Check stock availability
    if (product.current_stock < body.qty_exported) {
      return ApiResponse.error('Insufficient stock available', 400);
    }

    // Handle customer validation and population
    let customerInfo = null;
    if (body.customer_id) {
      console.log('POST /api/exports - Looking for customer:', body.customer_id);
      customerInfo = await Customer.findOne({
        _id: body.customer_id,
        user_id: user._id
      });

      if (!customerInfo) {
        console.log('POST /api/exports - Customer not found:', body.customer_id);
        return ApiResponse.error('Customer not found', 404);
      }
    }

    // Create export data
    const exportData = getValidatedFields(body, [
      'product_id', 'qty_exported', 'price_exported', 'discount', 'total_exported_amt', 'customer_id',
      'customer', 'customer_info', 'payment_method', 'payment_status',
      'notes', 'status'
    ]);

    exportData.user_id = user._id;

    // Only include export_id if it's provided and not empty
    if (body.export_id && body.export_id.trim()) {
      exportData.export_id = body.export_id.trim();
    }
    // If export_id is not provided or empty, the pre-save middleware will generate it

    exportData.cost_price = product.average_cost || 0;

    // Set required created_by field
    exportData.created_by = user.username || user.email || 'unknown';

    // Auto-populate customer info if customer_id is provided
    if (customerInfo) {
      exportData.customer = customerInfo.name;
      exportData.customer_info = {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        address: customerInfo.full_address || ''
      };
    } else {
      // If no customer_id, set customer fields to null/empty
      exportData.customer = body.customer || '';
      exportData.customer_info = body.customer_info || {
        name: '',
        phone: '',
        email: '',
        address: ''
      };
    }

    // Set default values
    exportData.status = exportData.status || 'completed';

    const exportDoc = new Export(exportData);
    await exportDoc.save();

    // Update product stock
    await product.updateStock(
      exportData.qty_exported,
      exportData.cost_price,
      'export'
    );

    // Update customer statistics if customer_id is provided
    if (customerInfo) {
      await customerInfo.updateOrderStats(exportData.total_exported_amt);
    }

    // Check for and update related purchase orders
    if (body.product_id) {
      const { PurchaseOrder } = require('@/models');

      // Find pending purchase orders for this product
      const pendingOrders = await PurchaseOrder.find({
        user_id: user._id,
        product_id: body.product_id,
        status: 'approved'
      });

      // Update purchase orders to 'received' status
      if (pendingOrders.length > 0) {
        await PurchaseOrder.updateMany(
          { _id: { $in: pendingOrders.map(order => order._id) } },
          {
            status: 'received',
            notes: `Nhận hàng theo xuất kho ${exportData.export_id || ''}`
          }
        );
      }
    }

    // Return populated export document
    const populatedExport = await Export.findById(exportDoc._id)
      .populate('customer_id', 'customer_code name contact_person phone email');

    return ApiResponse.created(populatedExport, 'Export created successfully');

  } catch (error) {
    console.error('Create export error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    if (error.code === 11000) {
      return ApiResponse.error('Export ID already exists', 409);
    }

    return ApiResponse.error('Failed to create export', 500);
  }
}