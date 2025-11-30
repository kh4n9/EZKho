import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models';
import { ApiResponse } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

// GET inventory for authenticated user
export async function GET(request) {
  try {
    await connectToDatabase();

    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const product_id = searchParams.get('product_id');
    const stock_filter = searchParams.get('stock_filter');
    const unit_filter = searchParams.get('unit_filter');
    const min_stock = searchParams.get('min_stock');
    const max_stock = searchParams.get('max_stock');
    const min_value = searchParams.get('min_value');
    const max_value = searchParams.get('max_value');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'product_name';
    const sort_order = searchParams.get('sort_order') || 'asc';

    // Build query for Products collection
    const query = {
      user_id: user._id,
      is_active: true
    };

    if (product_id) {
      query.product_id = product_id;
    }

    if (search) {
      query.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { product_id: { $regex: search, $options: 'i' } }
      ];
    }

    let useAggregation = false;
    if (stock_filter) {
      if (stock_filter === 'out_of_stock') {
        query.current_stock = 0;
      } else if (stock_filter === 'low_stock' || stock_filter === 'in_stock') {
        // Sử dụng aggregation để so sánh với reorder_level của từng sản phẩm
        useAggregation = true;
      }
    }

    // Kiểm tra các bộ lọc khác cần aggregation
    if (unit_filter || min_stock || max_stock || min_value || max_value) {
      useAggregation = true;
    }

    // Xử lý các bộ lọc đơn giản
    if (unit_filter) {
      query.unit = unit_filter;
    }

    // Build sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let products, total;

    if (useAggregation) {
      // Sử dụng aggregation pipeline cho các trường hợp lọc phức tạp
      const pipeline = [];
      
      // Match cơ bản
      pipeline.push({
        $match: {
          user_id: user._id,
          is_active: true,
          ...(product_id && { product_id }),
          ...(unit_filter && { unit: unit_filter }),
          ...(search && {
            $or: [
              { product_name: { $regex: search, $options: 'i' } },
              { product_id: { $regex: search, $options: 'i' } }
            ]
          })
        }
      });

      // Thêm lọc theo trạng thái tồn kho
      if (stock_filter === 'low_stock') {
        pipeline.push({
          $match: {
            $expr: {
              $and: [
                { $gt: ['$current_stock', 0] },
                { $lte: ['$current_stock', '$reorder_level'] }
              ]
            }
          }
        });
      } else if (stock_filter === 'in_stock') {
        pipeline.push({
          $match: {
            $expr: {
              $gt: ['$current_stock', '$reorder_level']
            }
          }
        });
      }

      // Thêm các bộ lọc nâng cao
      const filterConditions = [];
      
      if (min_stock || max_stock) {
        const stockCondition = {};
        if (min_stock) stockCondition.$gte = parseFloat(min_stock);
        if (max_stock) stockCondition.$lte = parseFloat(max_stock);
        filterConditions.push({ current_stock: stockCondition });
      }

      if (min_value || max_value) {
        const valueCondition = {};
        if (min_value) valueCondition.$gte = parseFloat(min_value);
        if (max_value) valueCondition.$lte = parseFloat(max_value);
        filterConditions.push({ total_value: valueCondition });
      }

      if (filterConditions.length > 0) {
        pipeline.push({
          $match: {
            $and: filterConditions
          }
        });
      }

      // Lấy tổng số documents cho pagination
      const countPipeline = [...pipeline];
      countPipeline.push({ $count: 'total' });
      const countResult = await Product.aggregate(countPipeline);
      total = countResult.length > 0 ? countResult[0].total : 0;

      // Thêm sort và pagination
      pipeline.push({ $sort: sort });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Chỉ chọn các trường cần thiết
      pipeline.push({
        $project: {
          product_id: 1,
          product_name: 1,
          unit: 1,
          current_stock: 1,
          average_cost: 1,
          reorder_level: 1,
          preferred_supplier_id: 1,
          lead_time_days: 1
        }
      });

      products = await Product.aggregate(pipeline);
    } else {
      // Sử dụng query đơn giản cho các trường hợp khác
      products = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('product_id product_name unit current_stock average_cost reorder_level preferred_supplier_id lead_time_days')
        .lean();

      total = await Product.countDocuments(query);
    }

    // Format inventory data
    const inventory = products.map(product => {
      const needsReorder = product.needsReorder ? product.needsReorder() : false;
      const reorderQuantity = product.calculateReorderQuantity ? product.calculateReorderQuantity() : 0;
      
      return {
        _id: product._id,
        product_id: product.product_id,
        product_name: product.product_name,
        unit: product.unit,
        current_stock: product.current_stock || 0,
        average_cost: product.average_cost || 0,
        reorder_level: product.reorder_level || 100,
        preferred_supplier_id: product.preferred_supplier_id || null,
        lead_time_days: product.lead_time_days || 7,
        total_value: (product.current_stock || 0) * (product.average_cost || 0),
        needs_reorder: needsReorder,
        stock_status: needsReorder ? 'critical' : (product.current_stock <= product.reorder_level) ? 'low' : 'normal'
      };
    });

    return ApiResponse.success({
      inventory,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    }, 'Inventory retrieved successfully');

  } catch (error) {
    console.error('Get inventory error:', error);

    if (error.message.includes('Authentication failed')) {
      return ApiResponse.unauthorized(error.message);
    }

    // Return empty data instead of error to avoid breaking the UI
    return ApiResponse.success({
      inventory: [],
      pagination: {
        current_page: 1,
        total_pages: 0,
        total_items: 0,
        items_per_page: limit
      }
    }, 'No inventory data found');
  }
}