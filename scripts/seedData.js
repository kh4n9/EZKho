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

// Sample data
const sampleProducts = [
  {
    product_id: 'SP001',
    product_name: 'Gạo ST25',
    unit: 'kg',
    description: 'Gạo ST25 loại 1',
    current_stock: 500,
    average_cost: 25000,
    total_value: 12500000,
    reorder_level: 100,
    lead_time_days: 7
  },
  {
    product_id: 'SP002',
    product_name: 'Gạo Jasmine',
    unit: 'kg',
    description: 'Gạo Jasmine thơm',
    current_stock: 300,
    average_cost: 22000,
    total_value: 6600000,
    reorder_level: 100,
    lead_time_days: 7
  },
  {
    product_id: 'SP003',
    product_name: 'Gạo Nàng Hương',
    unit: 'kg',
    description: 'Gạo Nàng Hương đặc sản',
    current_stock: 50,
    average_cost: 30000,
    total_value: 1500000,
    reorder_level: 100,
    lead_time_days: 7
  },
  {
    product_id: 'SP004',
    product_name: 'Gạo Lứt',
    unit: 'kg',
    description: 'Gạo lứt dinh dưỡng',
    current_stock: 200,
    average_cost: 18000,
    total_value: 3600000,
    reorder_level: 100,
    lead_time_days: 7
  },
  {
    product_id: 'SP005',
    product_name: 'Gạo Tẻ',
    unit: 'kg',
    description: 'Gạo tẻ thường',
    current_stock: 0,
    average_cost: 15000,
    total_value: 0,
    reorder_level: 100,
    lead_time_days: 7
  }
];

const sampleExpenses = [
  {
    expense_id: 'TC001',
    expense_type: 'lương',
    expense_date: new Date('2025-11-15'),
    amount: 15000000,
    description: 'Lương nhân viên tháng 11',
    category: 'cố định',
    payment_method: 'transfer',
    recipient: 'Nhân viên A',
    created_by: 'admin'
  },
  {
    expense_id: 'TC002',
    expense_type: 'mặt bằng',
    expense_date: new Date('2025-11-05'),
    amount: 5000000,
    description: 'Tiền thuê mặt bằng tháng 11',
    category: 'cố định',
    payment_method: 'transfer',
    recipient: 'Chủ nhà',
    created_by: 'admin'
  },
  {
    expense_id: 'TC003',
    expense_type: 'vận chuyển',
    expense_date: new Date('2025-11-10'),
    amount: 2000000,
    description: 'Chi phí vận chuyển hàng',
    category: 'biến đổi',
    payment_method: 'cash',
    created_by: 'admin'
  },
  {
    expense_id: 'TC004',
    expense_type: 'điện nước',
    expense_date: new Date('2025-11-20'),
    amount: 1500000,
    description: 'Tiền điện nước tháng 11',
    category: 'cố định',
    payment_method: 'transfer',
    created_by: 'admin'
  },
  {
    expense_id: 'TC005',
    expense_type: 'marketing',
    expense_date: new Date('2025-11-25'),
    amount: 3000000,
    description: 'Quảng cáo online',
    category: 'biến đổi',
    payment_method: 'card',
    created_by: 'admin'
  }
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qlkhohang';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

async function createUserData(userId, userType) {
    console.log(`Creating data for ${userType} user:`, userId);
    
    // Clear existing data for this user
    await Product.deleteMany({ user_id: userId });
    await Import.deleteMany({ user_id: userId });
    await Export.deleteMany({ user_id: userId });
    await Expense.deleteMany({ user_id: userId });
    
    // Wait a bit for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Cleared existing data');
    
    // Insert products
    const products = sampleProducts.map(product => ({
      ...product,
      user_id: userId
    }));
    
    const insertedProducts = await Product.insertMany(products);
    console.log(`Inserted ${insertedProducts.length} products`);
    
    // Insert imports (nhập hàng)
    const imports = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    for (let i = 0; i < 10; i++) {
      // Create dates within the current month to match report filter
      const importDate = new Date(currentYear, currentMonth, Math.floor(Math.random() * 28) + 1);
      
      const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const qty = Math.floor(Math.random() * 200) + 50;
      const price = randomProduct.average_cost * (0.9 + Math.random() * 0.2); // ±10% variation
      
      imports.push({
        user_id: userId,
        import_date: importDate,
        product_id: randomProduct.product_id,
        qty_imported: qty,
        price_imported: price,
        total_imported_amt: qty * price,
        supplier: `Nhà cung cấp ${Math.floor(Math.random() * 3) + 1}`,
        supplier_info: {
          name: `Nhà cung cấp ${Math.floor(Math.random() * 3) + 1}`,
          phone: `09xxxxxxxx`,
          email: `supplier${Math.floor(Math.random() * 3) + 1}@example.com`
        },
        created_by: 'admin',
        status: 'completed'
      });
    }
    
    // Generate unique import IDs
    const importsWithIds = imports.map((importData, index) => ({
      ...importData,
      import_id: `PN${String(index + 1).padStart(4, '0')}`
    }));
    
    const insertedImports = await Import.insertMany(importsWithIds);
    console.log(`Inserted ${insertedImports.length} imports`);
    
    // Insert exports (xuất hàng)
    const exports = [];
    
    for (let i = 0; i < 15; i++) {
      // Create dates within the current month to match report filter
      const exportDate = new Date(currentYear, currentMonth, Math.floor(Math.random() * 28) + 1);
      
      const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const qty = Math.floor(Math.random() * 50) + 10;
      const sellPrice = randomProduct.average_cost * (1.2 + Math.random() * 0.3); // 20-50% profit margin
      
      exports.push({
        user_id: userId,
        export_date: exportDate,
        product_id: randomProduct.product_id,
        qty_exported: qty,
        price_exported: sellPrice,
        total_exported_amt: qty * sellPrice,
        cost_price: randomProduct.average_cost,
        profit: qty * (sellPrice - randomProduct.average_cost),
        customer: `Khách hàng ${Math.floor(Math.random() * 5) + 1}`,
        customer_info: {
          name: `Khách hàng ${Math.floor(Math.random() * 5) + 1}`,
          phone: `09xxxxxxxx`,
          email: `customer${Math.floor(Math.random() * 5) + 1}@example.com`
        },
        payment_method: ['cash', 'transfer'][Math.floor(Math.random() * 2)],
        payment_status: 'paid',
        created_by: 'admin',
        status: 'completed'
      });
    }
    
    // Generate unique export IDs
    const exportsWithIds = exports.map((exportData, index) => ({
      ...exportData,
      export_id: `PX${String(index + 1).padStart(4, '0')}`
    }));
    
    const insertedExports = await Export.insertMany(exportsWithIds);
    console.log(`Inserted ${insertedExports.length} exports`);
    
    // Insert expenses
    const expenses = sampleExpenses.map(expense => ({
      ...expense,
      user_id: userId,
      expense_date: new Date(expense.expense_date)
    }));
    
    const insertedExpenses = await Expense.insertMany(expenses);
    console.log(`Inserted ${insertedExpenses.length} expenses`);
    
    console.log('Seed data completed successfully!');
    console.log('Data created for current month to match report filters.');
    console.log('You can now test the reports page with sample data.');
}

async function seedData() {
  try {
    await seedDatabase();
    
    // Get a test user (or create one if doesn't exist)
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        store_name: 'Cửa hàng test',
        store_address: 'Địa chỉ test',
        role: 'owner'
      });
      await testUser.save();
      console.log('Test user created');
    }
    
    // Also get the current user that's logged in
    const currentUser = await User.findById('69198304195344db40bf3690');
    if (currentUser) {
      console.log('Found current user:', currentUser.email);
      // We'll use both users - test user and current user
      await createUserData(testUser._id, 'test');
      await createUserData(currentUser._id, 'current');
    } else {
      console.log('Current user not found, only creating test user data');
      await createUserData(testUser._id, 'test');
    }
  } catch (error) {
    console.error('Error in seedData:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed function
seedData();