import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Export, Product, Customer } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET single export by ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // Authenticate user
    const user = await authenticateUser(request);

    const exportDoc = await Export.findOne({
      _id: id,
      user_id: user._id
    })
      .populate('customer_id', 'customer_code name contact_person phone email');

    if (!exportDoc) {
      return ApiResponse.notFound('Export not found');
    }

    return ApiResponse.success(exportDoc, 'Export retrieved successfully');

  } catch (error) {
    console.error('Get export error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve export', 500);
  }
}

// PUT update export
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Find export
    const exportDoc = await Export.findOne({
      _id: id,
      user_id: user._id
    });

    if (!exportDoc) {
      return ApiResponse.notFound('Export not found');
    }

    // Only allow updates for pending exports
    if (exportDoc.status === 'completed') {
      return ApiResponse.error('Cannot update completed export', 400);
    }

    // Store old values for stock adjustment
    const oldQty = exportDoc.qty_exported;

    // Update fields
    const allowedFields = [
      'qty_exported', 'price_exported', 'discount', 'customer', 'customer_info',
      'payment_method', 'payment_status', 'notes', 'status'
    ];

    const updateData = getValidatedFields(body, allowedFields);

    // Handle export_id change with validation
    if (body.export_id && body.export_id !== exportDoc.export_id) {
      const existingExport = await Export.findOne({
        user_id: user._id,
        export_id: body.export_id.trim(),
        _id: { $ne: id }
      });

      if (existingExport) {
        return ApiResponse.error('Export ID already exists', 409);
      }

      updateData.export_id = body.export_id.trim();
    }

    // Handle customer_id change with validation
    if (body.customer_id && body.customer_id !== exportDoc.customer_id?.toString()) {
      const customerInfo = await Customer.findOne({
        _id: body.customer_id,
        user_id: user._id
      });

      if (!customerInfo) {
        return ApiResponse.error('Customer not found', 404);
      }

      updateData.customer_id = body.customer_id;
      updateData.customer = customerInfo.name;
      updateData.customer_info = {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        address: customerInfo.full_address || ''
      };
    }

    // Update cost price if quantity or status changes
    if (updateData.status === 'completed' || updateData.qty_exported) {
      const product = await Product.findOne({
        user_id: user._id,
        product_id: exportDoc.product_id
      });

      if (product) {
        updateData.cost_price = product.average_cost || 0;

        // Check stock availability if updating quantity
        if (updateData.qty_exported && product.current_stock < updateData.qty_exported - oldQty) {
          return ApiResponse.error('Insufficient stock available', 400);
        }
      }
    }

    Object.assign(exportDoc, updateData);
    await exportDoc.save();

    // Update product stock if quantities changed and status is completed
    if (exportDoc.status === 'completed') {
      const product = await Product.findOne({
        user_id: user._id,
        product_id: exportDoc.product_id
      });

      if (product) {
        // Add back old quantity
        await product.updateStock(oldQty, exportDoc.cost_price, 'import');
        // Remove new quantity
        await product.updateStock(
          exportDoc.qty_exported,
          exportDoc.cost_price,
          'export'
        );
      }
    }

    // Update customer statistics if customer_id changed and status is completed
    if (exportDoc.status === 'completed' && updateData.customer_id && updateData.customer_id !== exportDoc.customer_id?.toString()) {
      const oldCustomer = await Customer.findById(exportDoc.customer_id);
      const newCustomer = await Customer.findById(updateData.customer_id);

      if (oldCustomer) {
        // Subtract from old customer
        oldCustomer.total_orders = Math.max(0, oldCustomer.total_orders - 1);
        oldCustomer.total_purchase_amount = Math.max(0, oldCustomer.total_purchase_amount - exportDoc.total_exported_amt);
        oldCustomer.average_order_value = oldCustomer.total_orders > 0 ? oldCustomer.total_purchase_amount / oldCustomer.total_orders : 0;
        await oldCustomer.save();
      }

      if (newCustomer) {
        // Add to new customer
        await newCustomer.updateOrderStats(exportDoc.total_exported_amt);
      }
    }

    // Return populated export document
    const populatedExport = await Export.findById(exportDoc._id)
      .populate('customer_id', 'customer_code name contact_person phone email');

    return ApiResponse.success(populatedExport, 'Export updated successfully');

  } catch (error) {
    console.error('Update export error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    return ApiResponse.error('Failed to update export', 500);
  }
}

// DELETE export
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // Authenticate user
    const user = await authenticateUser(request);

    const exportDoc = await Export.findOne({
      _id: id,
      user_id: user._id
    });

    if (!exportDoc) {
      return ApiResponse.notFound('Export not found');
    }

    // Cannot delete completed exports
    if (exportDoc.status === 'completed') {
      return ApiResponse.error('Cannot delete completed export', 400);
    }

    await Export.findByIdAndDelete(id);

    return ApiResponse.noContent('Export deleted successfully');

  } catch (error) {
    console.error('Delete export error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to delete export', 500);
  }
}