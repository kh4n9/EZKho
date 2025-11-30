import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Import, Product, Supplier } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { getValidatedFields } from '@/lib/apiResponse';

// GET all imports for authenticated user
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
    const supplier_id = searchParams.get('supplier_id');
    const supplier = searchParams.get('supplier');
    const status = searchParams.get('status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const sort_by = searchParams.get('sort_by') || 'import_date';
    const sort_order = searchParams.get('sort_order') || 'desc';

    // Build query
    const query = { user_id: user._id };

    if (search) {
      query.$or = [
        { import_id: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }

    if (product_id) {
      query.product_id = product_id;
    }

    if (supplier_id) {
      query.supplier_id = supplier_id;
    } else if (supplier && !search) { // Avoid overwriting search if supplier is also part of it
      query.supplier = { $regex: supplier, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (start_date || end_date) {
      query.import_date = {};
      if (start_date) {
        query.import_date.$gte = new Date(start_date);
      }
      if (end_date) {
        query.import_date.$lte = new Date(end_date);
      }
    }

    // Build sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const imports = await Import.find(query)
      .populate('supplier_id', 'supplier_code name contact_person phone email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Import.countDocuments(query);

    return ApiResponse.success({
      imports,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }, 'Imports retrieved successfully');

  } catch (error) {
    console.error('Get imports error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.error('Failed to retrieve imports', 500);
  }
}

// POST create new import
export async function POST(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    const body = await request.json();


    // Validate required fields (import_id is now optional)
    const requiredFields = ['product_id', 'qty_imported', 'price_imported'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.log('POST /api/imports - Missing fields:', missingFields);
      return ApiResponse.validationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if import_id already exists for this user (only if import_id is provided)
    if (body.import_id && body.import_id.trim()) {
      const existingImport = await Import.findOne({
        user_id: user._id,
        import_id: body.import_id.trim()
      });

      if (existingImport) {
        return ApiResponse.error('Import ID already exists', 409);
      }
    }

    // Verify product exists and belongs to user
    const product = await Product.findOne({
      user_id: user._id,
      product_id: body.product_id
    });

    if (!product) {
      console.log('POST /api/imports - Product not found:', body.product_id);
      return ApiResponse.error('Product not found', 404);
    }

    // Handle supplier validation and population
    let supplierInfo = null;
    if (body.supplier_id) {
      console.log('POST /api/imports - Looking for supplier:', body.supplier_id);
      supplierInfo = await Supplier.findOne({
        _id: body.supplier_id,
        user_id: user._id
      });

      if (!supplierInfo) {
        console.log('POST /api/imports - Supplier not found:', body.supplier_id);
        return ApiResponse.error('Supplier not found', 404);
      }
    }

    // Create import data
    const importData = getValidatedFields(body, [
      'product_id', 'qty_imported', 'price_imported', 'discount', 'supplier_id',
      'expiration_date', 'notes', 'status'
    ]);

    importData.user_id = user._id;

    // Only include import_id if it's provided and not empty
    if (body.import_id && body.import_id.trim()) {
      importData.import_id = body.import_id.trim();
    }
    // If import_id is not provided or empty, the pre-save middleware will generate it


    // Calculate total imported amount
    importData.total_imported_amt = (importData.qty_imported * importData.price_imported) - (importData.discount || 0);

    // Set required created_by field
    importData.created_by = user.username || user.email || 'unknown';

    // Auto-populate supplier info if supplier_id is provided
    if (supplierInfo) {
      importData.supplier = supplierInfo.name;
      importData.supplier_info = {
        name: supplierInfo.name,
        phone: supplierInfo.phone,
        email: supplierInfo.email,
        address: supplierInfo.full_address || ''
      };
    } else {
      // If no supplier_id, set supplier fields to null/empty
      importData.supplier = body.supplier || '';
      importData.supplier_info = body.supplier_info || {
        name: '',
        phone: '',
        email: '',
        address: ''
      };
    }

    // Set default values
    importData.status = importData.status || 'completed';


    const importDoc = new Import(importData);
    await importDoc.save();

    // Update product stock
    await product.updateStock(
      importData.qty_imported,
      importData.price_imported,
      'import'
    );

    // Update supplier statistics if supplier_id is provided
    if (supplierInfo) {
      await supplierInfo.updateOrderStats(importData.total_imported_amt);
    }

    // Return populated import document
    const populatedImport = await Import.findById(importDoc._id)
      .populate('supplier_id', 'supplier_code name contact_person phone email');

    return ApiResponse.created(populatedImport, 'Import created successfully');

  } catch (error) {
    console.error('Create import error:', error);
    console.error('Error stack:', error.stack);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', errors);
      console.error('Validation error details:', error.errors);
      return ApiResponse.validationError(errors);
    }

    if (error.code === 11000) {
      return ApiResponse.error('Import ID already exists', 409);
    }

    return ApiResponse.error(error.message || 'Failed to create import', 500);
  }
}