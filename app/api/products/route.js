import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET all products for authenticated user
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
    const is_active = searchParams.get('is_active');
    const sort_by = searchParams.get('sort_by') || 'product_name';
    const sort_order = searchParams.get('sort_order') || 'asc';

    // Build query
    const query = { user_id: user._id };

    if (search) {
      query.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { product_id: { $regex: search, $options: 'i' } }
      ];
    }

    if (is_active !== null && is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    // Build sort
    const sort = {};
    sort[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return ApiResponse.success({
      products,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }, 'Products retrieved successfully');

  } catch (error) {
    console.error('Get products error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve products', 500);
  }
}

// POST create new product
export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Check subscription limits
    if (user.subscription.plan === 'free') {
      const hasReachedLimit = await user.hasReachedProductLimit();
      if (hasReachedLimit) {
        return ApiResponse.error('Product limit reached for free plan', 429);
      }
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['product_id', 'product_name', 'unit'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return ApiResponse.validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if product_id already exists for this user
    const existingProduct = await Product.findOne({
      user_id: user._id,
      product_id: body.product_id.trim()
    });

    if (existingProduct) {
      return ApiResponse.error('Product ID already exists', 409);
    }

    // Create product data
    const productData = getValidatedFields(body, [
      'product_id', 'product_name', 'unit', 'description',
      'current_stock', 'average_cost', 'total_value', 'is_active',
      'reorder_level'
    ]);

    productData.user_id = user._id;
    productData.product_id = productData.product_id.trim();
    productData.product_name = productData.product_name.trim();

    // Set default values
    productData.current_stock = productData.current_stock || 0;
    productData.average_cost = productData.average_cost || 0;
    productData.total_value = productData.total_value || 0;
    productData.is_active = productData.is_active !== false;
    // Use user's default low stock threshold if not provided
    productData.reorder_level = productData.reorder_level !== undefined
      ? productData.reorder_level
      : (user.settings?.low_stock_threshold || 100);

    const product = new Product(productData);
    await product.save();

    return ApiResponse.created(product, 'Product created successfully');

  } catch (error) {
    console.error('Create product error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return ApiResponse.validationError(errors);
    }

    if (error.code === 11000) {
      return ApiResponse.error('Product ID already exists', 409);
    }

    return ApiResponse.error('Failed to create product', 500);
  }
}