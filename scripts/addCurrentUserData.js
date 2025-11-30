
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

async function addCurrentUserData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qlkhohang';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

