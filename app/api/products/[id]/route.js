import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product, Import, Export } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';
import { isValidObjectId } from 'mongoose';

// GET a single product
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const user = await authenticateUser(request);

    // Await params to get the id
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return ApiResponse.error('Invalid Product ID', 400);
    }
    
    const product = await Product.findOne({ _id: id, user_id: user._id });

    if (!product) {
      return ApiResponse.notFound('Product not found');
    }

    return ApiResponse.success(product, 'Product retrieved successfully');

  } catch (error) {
    console.error('Get product error:', error);
    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }
    return ApiResponse.error('Failed to retrieve product', 500);
  }
}

// PUT update a product
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const user = await authenticateUser(request);

    // Await params to get the id
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return ApiResponse.error('Invalid Product ID', 400);
    }

    const product = await Product.findOne({ _id: id, user_id: user._id });

    if (!product) {
      return ApiResponse.notFound('Product not found');
    }

    const body = await request.json();

    // Validate and get fields
    const allowedFields = ['product_name', 'unit', 'description', 'is_active', 'reorder_level'];
    const productData = getValidatedFields(body, allowedFields);

    if (productData.product_name) {
      product.product_name = productData.product_name.trim();
    }
    if (productData.unit) {
      product.unit = productData.unit;
    }
    if (productData.description !== undefined) {
      product.description = productData.description.trim();
    }
    if (productData.is_active !== undefined) {
      product.is_active = productData.is_active;
    }
    if (productData.reorder_level !== undefined) {
      product.reorder_level = productData.reorder_level;
    }
    
    await product.save();

    return ApiResponse.success(product, 'Product updated successfully');

  } catch (error) {
    console.error('Update product error:', error);
    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }
    return ApiResponse.error('Failed to update product', 500);
  }
}

// DELETE a product
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const user = await authenticateUser(request);

    // Await params to get id
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
        return ApiResponse.error('Invalid Product ID', 400);
    }

    const product = await Product.findOne({ _id: id, user_id: user._id });

    if (!product) {
      return ApiResponse.notFound('Product not found');
    }

    // Check if the product is used in any import or export records
    const inUseInImports = await Import.findOne({ user_id: user._id, 'items.product': product._id });
    const inUseInExports = await Export.findOne({ user_id: user._id, 'items.product': product._id });

    if (inUseInImports || inUseInExports) {
      return ApiResponse.error('Cannot delete product. It is referenced in import/export records.', 409);
    }
    
    // Additional check for safety, though the frontend seems to handle this
    if (product.current_stock > 0) {
        return ApiResponse.error('Cannot delete a product with stock greater than zero.', 409);
    }

    await Product.deleteOne({ _id: id, user_id: user._id });

    return ApiResponse.success(null, 'Product deleted successfully');

  } catch (error) {
    console.error('Delete product error:', error);
    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }
    return ApiResponse.error('Failed to delete product', 500);
  }
}
