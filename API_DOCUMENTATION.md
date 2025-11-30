# API Documentation - Quản Lý Kho Hàng

## Overview
API endpoints for inventory management system with multi-user support. Each user has their own isolated data (store).

## Authentication
All API endpoints (except auth endpoints) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
http://localhost:3000/api
```

## Authentication Endpoints

### Register User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string",
  "store_name": "string",
  "phone": "string (optional)",
  "store_address": "string (optional)",
  "store_phone": "string (optional)",
  "store_email": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

### Get Current User
```
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": { ... }
}
```

### Refresh Token
```
POST /api/auth/refresh
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": { ... },
    "token": "new-jwt-token"
  }
}
```

## Product Management

### Get Products
```
GET /api/products
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search by product name or ID
- `is_active` (boolean): Filter by active status
- `sort_by` (string): Sort field (default: product_name)
- `sort_order` (string): asc or desc (default: asc)

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [...],
    "pagination": { ... }
  }
}
```

### Create Product
```
POST /api/products
```

**Request Body:**
```json
{
  "product_id": "string",
  "product_name": "string",
  "unit": "kg|tấn|bao|gói",
  "description": "string (optional)",
  "current_stock": "number (default: 0)",
  "average_cost": "number (default: 0)",
  "is_active": "boolean (default: true)"
}
```

### Get Product by ID
```
GET /api/products/{id}
```

### Update Product
```
PUT /api/products/{id}
```

### Delete Product
```
DELETE /api/products/{id}
```

## Import Management

### Get Imports
```
GET /api/imports
```

**Query Parameters:**
- `page`, `limit`, `product_id`, `supplier`, `status`
- `start_date`, `end_date`, `sort_by`, `sort_order`

### Create Import
```
POST /api/imports
```

**Request Body:**
```json
{
  "import_id": "string",
  "product_id": "string",
  "qty_imported": "number",
  "price_imported": "number",
  "supplier": "string (optional)",
  "supplier_info": { ... } (optional),
  "batch_number": "string (optional)",
  "expiration_date": "string (optional)",
  "notes": "string (optional)",
  "status": "pending|completed|cancelled (default: completed)"
}
```

### Get Monthly Import Totals
```
GET /api/imports/monthly?year=2024&month=1
```

## Export Management

### Get Exports
```
GET /api/exports
```

**Query Parameters:**
- `page`, `limit`, `product_id`, `customer`, `status`, `payment_status`
- `start_date`, `end_date`, `sort_by`, `sort_order`

### Create Export
```
POST /api/exports
```

**Request Body:**
```json
{
  "export_id": "string",
  "product_id": "string",
  "qty_exported": "number",
  "price_exported": "number",
  "customer": "string (optional)",
  "customer_info": { ... } (optional),
  "payment_method": "cash|transfer|credit|other (default: cash)",
  "payment_status": "paid|unpaid|partial (default: paid)",
  "notes": "string (optional)",
  "status": "pending|completed|cancelled (default: completed)"
}
```

### Get Monthly Export Totals
```
GET /api/exports/monthly?year=2024&month=1
```

### Get Customer Statistics
```
GET /api/exports/customers?year=2024&month=1
```

## Expense Management

### Get Expenses
```
GET /api/expenses
```

**Query Parameters:**
- `page`, `limit`, `expense_type`, `category`, `status`, `recurring`
- `start_date`, `end_date`, `sort_by`, `sort_order`

### Create Expense
```
POST /api/expenses
```

**Request Body:**
```json
{
  "expense_id": "string",
  "expense_type": "lương|mặt bằng|vận chuyển|điện nước|văn phòng phẩm|marketing|bảo trì|thuế|khác",
  "amount": "number",
  "description": "string",
  "category": "cố định|biến đổi|đột xuất (default: biến đổi)",
  "payment_method": "cash|transfer|card|other (default: cash)",
  "recipient": "string (optional)",
  "invoice_number": "string (optional)",
  "notes": "string (optional)",
  "recurring": "boolean (default: false)",
  "recurring_period": "daily|weekly|monthly|yearly (optional)"
}
```

### Get Monthly Expense Totals
```
GET /api/expenses/monthly?year=2024&month=1
```

### Get Year-to-Date Expenses
```
GET /api/expenses/ytd?year=2024
```

## Inventory Management

### Get Inventory
```
GET /api/inventory
```

**Query Parameters:**
- `page`, `limit`, `year`, `month`, `product_id`, `stock_status`
- `sort_by`, `sort_order`

**Stock Status Options:**
- `out_of_stock`: Stock = 0
- `low_stock`: 0 < Stock < 100
- `in_stock`: Stock >= 100

### Calculate Inventory
```
POST /api/inventory
```

**Request Body:**
```json
{
  "year": "number",
  "month": "number (1-12)"
}
```

### Get Low Stock Products
```
GET /api/inventory/low-stock?threshold=100&year=2024&month=1
```

### Get Inventory Summary
```
GET /api/inventory/summary?year=2024&month=1
```

## Profit & Loss Management

### Get Profit/Loss Reports
```
GET /api/profitloss
```

**Query Parameters:**
- `page`, `limit`, `year`, `month`, `sort_by`, `sort_order`

### Calculate Profit/Loss
```
POST /api/profitloss
```

**Request Body:**
```json
{
  "year": "number",
  "month": "number (1-12)"
}
```

### Get Year-to-Date Summary
```
GET /api/profitloss/ytd?year=2024
```

### Get Specific Period
```
GET /api/profitloss/{YYYY-MM}
```

## User Management

### Get User Profile
```
GET /api/users/profile
```

### Update User Profile
```
PUT /api/users/profile
```

**Request Body:**
```json
{
  "full_name": "string (optional)",
  "phone": "string (optional)",
  "store_name": "string (optional)",
  "store_address": "string (optional)",
  "store_phone": "string (optional)",
  "store_email": "string (optional)",
  "preferences": { ... } (optional),
  "settings": { ... } (optional)
}
```

### Change Password
```
POST /api/users/change-password
```

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

### Get User Statistics (Admin Only)
```
GET /api/users/stats
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] (optional),
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (duplicate)
- `429`: Too Many Requests
- `500`: Internal Server Error

## Pagination

Paginated responses include:

```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20
  }
}
```

## Rate Limiting

API requests are limited to prevent abuse:
- Window: 15 minutes
- Max requests: 100 per window

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- All data is isolated per user
- Input validation is performed on all endpoints
- CORS is configured for security