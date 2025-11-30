const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const Product = require('../models/Product');
const Import = require('../models/Import');
const Export = require('../models/Export');
const Expense = require('../models/Expense');
const User = require('../models/User');

// Import database connection
const connectToDatabase = require('../lib/mongodb');

async function testReports() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qlkhohang';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('Test user not found. Please run seedData.js first.');
      return;
    }

    const userId = testUser._id;
    console.log('Testing reports for user:', testUser.email);

    // Test date range for current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log('\n=== Testing Date Range ===');
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    // Test imports
    console.log('\n=== Testing Imports ===');
    const importFilter = {
      user_id: userId,
      import_date: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    const imports = await Import.find(importFilter);
    console.log('Found imports:', imports.length);
    
    const importRevenue = await Import.aggregate([
      { $match: importFilter },
      { $group: { _id: null, total: { $sum: '$total_imported_amt' }, count: { $sum: 1 } } }
    ]);
    console.log('Import summary:', importRevenue[0] || { total: 0, count: 0 });

    // Test exports
    console.log('\n=== Testing Exports ===');
    const exportFilter = {
      user_id: userId,
      export_date: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    const exports = await Export.find(exportFilter);
    console.log('Found exports:', exports.length);

    const exportRevenue = await Export.aggregate([
      { $match: exportFilter },
      { $group: { _id: null, total: { $sum: '$total_exported_amt' }, count: { $sum: 1 }, totalProfit: { $sum: '$profit' } } }
    ]);
    console.log('Export summary:', exportRevenue[0] || { total: 0, count: 0, totalProfit: 0 });

    // Test expenses
    console.log('\n=== Testing Expenses ===');
    const expenseFilter = {
      user_id: userId,
      expense_date: { $gte: startDate, $lte: endDate },
      status: 'approved'
    };

    const expenses = await Expense.find(expenseFilter);
    console.log('Found expenses:', expenses.length);

    const expenseTotal = await Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    console.log('Expense summary:', expenseTotal[0] || { total: 0, count: 0 });

    // Test top selling products
    console.log('\n=== Testing Top Selling Products ===');
    const topProducts = await Export.aggregate([
      { $match: exportFilter },
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: 'product_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$product_id',
          name: { $first: '$productInfo.product_name' },
          totalQuantity: { $sum: '$qty_exported' },
          totalRevenue: { $sum: '$total_exported_amt' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ]);
    console.log('Top selling products:', topProducts);

    // Test inventory summary
    console.log('\n=== Testing Inventory Summary ===');
    const lowStockThreshold = 100;
    const inventorySummary = await Product.aggregate([
      { $match: { user_id: userId, is_active: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$current_stock' },
          totalValue: { $sum: { $multiply: ['$current_stock', '$average_cost'] } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$current_stock', 0] }, { $lte: ['$current_stock', lowStockThreshold] }] },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ['$current_stock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);
    console.log('Inventory summary:', inventorySummary[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    });

    // Summary report
    console.log('\n=== FINAL REPORT SUMMARY ===');
    const totalRevenue = exportRevenue[0]?.total || 0;
    const totalExpenses = expenseTotal[0]?.total || 0;
    const totalProfit = exportRevenue[0]?.totalProfit || 0;
    const totalImports = imports.length;
    const totalExports = exports.length;

    console.log('Total Revenue:', totalRevenue.toLocaleString('vi-VN') + ' VND');
    console.log('Total Expenses:', totalExpenses.toLocaleString('vi-VN') + ' VND');
    console.log('Total Profit:', totalProfit.toLocaleString('vi-VN') + ' VND');
    console.log('Net Profit:', (totalProfit - totalExpenses).toLocaleString('vi-VN') + ' VND');
    console.log('Total Imports:', totalImports);
    console.log('Total Exports:', totalExports);

    console.log('\n✅ Reports test completed successfully!');
    console.log('If you see non-zero values above, the reports should now work correctly.');

  } catch (error) {
    console.error('Error testing reports:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testReports();