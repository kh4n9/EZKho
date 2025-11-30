import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Import, Product } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET single import by ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const importDoc = await Import.findOne({
      _id: params.id,
      user_id: user._id
    });

    if (!importDoc) {
      return ApiResponse.notFound('Import not found');
    }

    return ApiResponse.success(importDoc, 'Import retrieved successfully');

  } catch (error) {
    console.error('Get import error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve import', 500);
  }
}

// PUT update import
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();

    // Find import
    const importDoc = await Import.findOne({
      _id: params.id,
      user_id: user._id
    });

    if (!importDoc) {
      return ApiResponse.notFound('Import not found');
    }

    // Only allow updates for pending imports
    if (importDoc.status === 'completed') {
      return ApiResponse.error('Cannot update completed import', 400);
    }

    // Store old values for stock adjustment
    const oldQty = importDoc.qty_imported;
    const oldPrice = importDoc.price_imported;

    // Update fields
    const allowedFields = [
      'qty_imported', 'price_imported', 'discount', 'supplier', 'supplier_info',
      'expiration_date', 'notes', 'status'
    ];

    const updateData = getValidatedFields(body, allowedFields);

    // Handle import_id change with validation
    if (body.import_id && body.import_id !== importDoc.import_id) {
      const existingImport = await Import.findOne({
        user_id: user._id,
        import_id: body.import_id.trim(),
        _id: { $ne: params.id }
      });

      if (existingImport) {
        return ApiResponse.error('Import ID already exists', 409);
      }

      updateData.import_id = body.import_id.trim();
    }

    Object.assign(importDoc, updateData);
    await importDoc.save();

    // Update product stock if quantities changed and status is completed
    if (importDoc.status === 'completed') {
      const product = await Product.findOne({
        user_id: user._id,
        product_id: importDoc.product_id
      });

      if (product) {
        // Remove old stock addition
        await product.updateStock(-oldQty, oldPrice, 'export');
        // Add new stock addition
        await product.updateStock(
          importDoc.qty_imported,
          importDoc.price_imported,
          'import'
        );
      }
    }

    return ApiResponse.success(importDoc, 'Import updated successfully');

  } catch (error) {
    console.error('Update import error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    return ApiResponse.error(error.message || 'Failed to update import', 500);
  }
}

// DELETE import
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const importDoc = await Import.findOne({
      _id: params.id,
      user_id: user._id
    });

    if (!importDoc) {
      return ApiResponse.notFound('Import not found');
    }

    // Cannot delete completed imports
    if (importDoc.status === 'completed') {
      return ApiResponse.error('Cannot delete completed import', 400);
    }

    await Import.findByIdAndDelete(params.id);

    return ApiResponse.noContent('Import deleted successfully');

  } catch (error) {
    console.error('Delete import error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error(error.message || 'Failed to delete import', 500);
  }
}