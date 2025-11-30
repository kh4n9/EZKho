# MongoDB Models for Inventory Management System

## Overview
This directory contains MongoDB schemas for a comprehensive inventory management system for rice/warehouse products.

## Models

### 1. Product (`Product.js`)
**Purpose**: Manages product information and current stock levels.

**Key Fields**:
- `product_id`: Unique product identifier
- `product_name`: Product name
- `unit`: Unit of measurement (kg, tấn, bao, gói)
- `current_stock`: Current stock quantity
- `average_cost`: Weighted average cost per unit
- `total_value`: Total value of current stock

**Methods**:
- `updateStock(qty, cost, type)`: Updates stock and average cost

### 2. Import (`Import.js`)
**Purpose**: Records goods received from suppliers.

**Key Fields**:
- `import_id`: Unique import document ID
- `import_date`: Date of import
- `product_id`: Reference to product
- `qty_imported`: Quantity imported
- `price_imported`: Unit price
- `total_imported_amt`: Total amount (auto-calculated)
- `supplier`: Supplier information

**Static Methods**:
- `getMonthlyTotals(year, month)`: Get monthly import totals by product

### 3. Export (`Export.js`)
**Purpose**: Records goods sold to customers.

**Key Fields**:
- `export_id`: Unique export document ID
- `export_date`: Date of export
- `product_id`: Reference to product
- `qty_exported`: Quantity exported
- `price_exported`: Unit selling price
- `total_exported_amt`: Total amount (auto-calculated)
- `cost_price`: Cost price at time of sale
- `profit`: Profit per transaction (auto-calculated)
- `customer`: Customer information

**Static Methods**:
- `getMonthlyTotals(year, month)`: Get monthly export totals by product
- `getCustomerStats(year, month)`: Get customer purchase statistics

### 4. Expense (`Expense.js`)
**Purpose**: Records business expenses.

**Key Fields**:
- `expense_id`: Unique expense ID
- `expense_type`: Type of expense (lương, mặt bằng, vận chuyển, etc.)
- `expense_date`: Date of expense
- `amount`: Expense amount
- `description`: Description of expense
- `category`: Expense category (cố định, biến đổi, đột xuất)

**Static Methods**:
- `getMonthlyTotals(year, month)`: Get monthly expenses by type
- `getExpenseSummaryByCategory(year, month)`: Get expense summary by category
- `getYTDExpenses(year)`: Get year-to-date expenses by month

### 5. Inventory (`Inventory.js`)
**Purpose**: Calculates and stores periodic inventory valuations.

**Key Fields**:
- `product_id`: Reference to product
- `opening_stock`: Opening stock quantity
- `total_imported`: Total imports during period
- `total_exported`: Total exports during period
- `closing_stock`: Closing stock quantity (calculated)
- `closing_value`: Closing stock value (calculated)
- `average_cost`: Average cost per unit
- `valuation_method`: Method used (FIFO, LIFO, WEIGHTED_AVERAGE)
- `period_year`, `period_month`: Period for the record

**Static Methods**:
- `calculateInventory(year, month)`: Calculate inventory for a specific period
- `getLowStockProducts(threshold)`: Get products with low stock
- `getInventoryValueSummary(year, month)`: Get inventory value summary

### 6. ProfitLoss (`ProfitLoss.js`)
**Purpose**: Generates profit and loss statements.

**Key Fields**:
- `period_year`, `period_month`: Reporting period
- `total_revenue`: Total revenue from sales
- `cost_of_goods_sold`: Cost of goods sold
- `gross_profit`: Gross profit (calculated)
- `total_expenses`: Total expenses
- `net_profit`: Net profit (calculated)
- `gross_profit_margin`: Gross profit margin percentage
- `net_profit_margin`: Net profit margin percentage
- `total_orders`: Number of orders
- `average_order_value`: Average order value
- `top_selling_products`: Top 10 selling products
- `expense_breakdown`: Expenses by type with percentages

**Static Methods**:
- `calculateProfitLoss(year, month)`: Calculate P&L for a specific period
- `getYTDSummary(year)`: Get year-to-date summary
- `getMonthlyTrend(year)`: Get monthly trend for the year

## Usage Examples

```javascript
// Import models
const { Product, Import, Export, Expense, Inventory, ProfitLoss } = require('./models');

// Create a new product
const product = new Product({
    product_id: 'G001',
    product_name: 'Gạo ST25',
    unit: 'kg'
});
await product.save();

// Record an import
const importDoc = new Import({
    import_id: 'IMP001',
    product_id: 'G001',
    qty_imported: 1000,
    price_imported: 25000,
    supplier: 'Nhà cung cấp A'
});
await importDoc.save();

// Record an export
const exportDoc = new Export({
    export_id: 'EXP001',
    product_id: 'G001',
    qty_exported: 500,
    price_exported: 30000,
    cost_price: 25000,
    customer: 'Khách hàng B'
});
await exportDoc.save();

// Calculate monthly inventory
await Inventory.calculateInventory(2024, 1);

// Calculate monthly profit/loss
await ProfitLoss.calculateProfitLoss(2024, 1);

// Get monthly reports
const monthlyImports = await Import.getMonthlyTotals(2024, 1);
const monthlyExports = await Export.getMonthlyTotals(2024, 1);
const monthlyExpenses = await Expense.getMonthlyTotals(2024, 1);
```

## Key Features

1. **Auto-calculations**: Most monetary fields are automatically calculated
2. **Indexes**: Optimized indexes for better query performance
3. **References**: Proper foreign key relationships between collections
4. **Validation**: Data validation to ensure data integrity
5. **Aggregations**: Built-in methods for common reporting needs
6. **Period-based reporting**: Support for monthly and yearly reporting
7. **Multi-language support**: Vietnamese field names and display methods

## Important Notes

- All date fields use JavaScript Date objects
- Currency amounts are stored in VND (Vietnamese Dong)
- The system uses weighted average cost method by default
- Period-based calculations should be run monthly for accurate reporting
- Inventory and ProfitLoss records are generated automatically through static methods