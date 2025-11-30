const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer_code: {
        type: String,
        required: false,
        trim: true,
        sparse: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    contact_person: {
        type: String,
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        trim: true,
        required: false,
        match: [/^[0-9\-\+\s\(\)]{10,15}$/, 'Please fill a valid phone number']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: false,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    address: {
        street: { type: String, trim: true },
        ward: { type: String, trim: true },
        district: { type: String, trim: true },
        city: { type: String, trim: true },
        province: { type: String, trim: true },
        postal_code: { type: String, trim: true },
        country: { type: String, trim: true, default: 'Việt Nam' }
    },
    tax_code: {
        type: String,
        trim: true,
        maxlength: 50
    },
    website: {
        type: String,
        trim: true
    },
    bank_info: {
        bank_name: { type: String, trim: true },
        account_number: { type: String, trim: true },
        account_holder: { type: String, trim: true }
    },
    business_type: {
        type: String,
        enum: ['individual', 'company', 'cooperative', 'other'],
        default: 'individual'
    },
    category: {
        type: String,
        enum: ['retail', 'wholesale', 'online', 'distributor', 'other'],
        default: 'other'
    },
    specialties: [{
        type: String,
        trim: true,
        maxlength: 100
    }],
    payment_terms: {
        type: String,
        enum: ['cod', 'net_7', 'net_15', 'net_30', 'net_60', 'custom'],
        default: 'cod'
    },
    custom_payment_terms: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blacklisted', 'pending'],
        default: 'active'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    last_order_date: {
        type: Date
    },
    total_orders: {
        type: Number,
        default: 0,
        min: 0
    },
    total_purchase_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    average_order_value: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
customerSchema.index({ user_id: 1, name: 1 });
customerSchema.index({ user_id: 1, status: 1 });
customerSchema.index({ user_id: 1, category: 1 });
customerSchema.index({ user_id: 1, business_type: 1 });
customerSchema.index({ user_id: 1, is_active: 1 });

// Virtual for full address
customerSchema.virtual('full_address').get(function () {
    const parts = [];
    if (this.address.street) parts.push(this.address.street);
    if (this.address.ward) parts.push(this.address.ward);
    if (this.address.district) parts.push(this.address.district);
    if (this.address.city) parts.push(this.address.city);
    if (this.address.province) parts.push(this.address.province);
    return parts.join(', ');
});

// Virtual for formatted total purchase amount
customerSchema.virtual('formatted_total_purchase').get(function () {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.total_purchase_amount);
});

// Virtual for last order formatted date
customerSchema.virtual('last_order_formatted').get(function () {
    if (!this.last_order_date) return 'Chưa có đơn hàng';
    return this.last_order_date.toLocaleDateString('vi-VN');
    return this.last_order_date.toLocaleDateString('vi-VN');
});

// Pre-save middleware to generate customer code
customerSchema.pre('save', async function (next) {
    // Only generate code if it's a new document and customer_code is not provided
    if (this.isNew && (!this.customer_code || this.customer_code === '')) {
        try {
            console.log('Generating customer code for user:', this.user_id);
            // Generate date code: YYMMDD
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const dateCode = `${yy}${mm}${dd}`;
            const prefix = `KH-${dateCode}-`;

            // Count existing customers for this user TODAY (matching the prefix)
            const regex = new RegExp(`^${prefix}`);
            const count = await this.constructor.countDocuments({
                user_id: this.user_id,
                customer_code: regex
            });

            const code = `${prefix}${String(count + 1).padStart(4, '0')}`;
            this.customer_code = code;
            console.log('Generated customer code:', code);
        } catch (error) {
            console.error('Error generating customer code:', error);
            // Fallback to timestamp-based code
            this.customer_code = `KH-${Date.now()}`;
        }
    }
    next();
});

// Static method to get customer statistics
customerSchema.statics.getCustomerStats = function (userId) {
    return this.aggregate([
        { $match: { user_id: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total_amount: { $sum: '$total_purchase_amount' }
            }
        }
    ]);
};

// Static method to get top customers by purchase amount
customerSchema.statics.getTopCustomers = function (userId, limit = 10) {
    return this.find({
        user_id: userId,
        is_active: true,
        status: 'active'
    })
        .sort({ total_purchase_amount: -1 })
        .limit(limit)
        .select('name contact_person phone email total_purchase_amount total_orders rating');
};

// Instance method to update order statistics
customerSchema.methods.updateOrderStats = function (orderAmount) {
    this.last_order_date = new Date();
    this.total_orders += 1;
    this.total_purchase_amount += orderAmount;
    this.average_order_value = this.total_purchase_amount / this.total_orders;
    return this.save();
};

// Instance method to get customer performance score
customerSchema.methods.getPerformanceScore = function () {
    let score = 0;

    // Rating component (40%)
    score += (this.rating / 5) * 40;

    // Order frequency component (30%)
    const daysSinceLastOrder = this.last_order_date ?
        (Date.now() - this.last_order_date) / (1000 * 60 * 60 * 24) : 365;
    const orderFrequencyScore = Math.max(0, 30 - (daysSinceLastOrder / 12));
    score += orderFrequencyScore;

    // Purchase volume component (30%)
    const volumeScore = Math.min(30, (this.total_purchase_amount / 10000000) * 30);
    score += volumeScore;

    return Math.round(score);
};

// Prevent model overwrite in development
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
module.exports = Customer;