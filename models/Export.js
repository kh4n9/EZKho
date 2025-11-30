const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    export_id: {
        type: String,
        required: false,
        trim: true,
        default: null,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                // For new documents, if export_id is not provided, that's okay
                // The pre-save middleware will generate it
                if (this.isNew && (!v || v === null || v === '')) {
                    return true;
                }
                // For existing documents or if export_id is provided, ensure it's not empty
                return v && v.trim().length > 0;
            },
            message: 'Export ID cannot be empty when provided'
        }
    },
    export_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    product_id: {
        type: String,
        required: true,
        ref: 'Product'
    },
    qty_exported: {
        type: Number,
        required: true,
        min: 0.01
    },
    price_exported: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total_exported_amt: {
        type: Number,
        required: true,
        min: 0
    },
    cost_price: {
        type: Number,
        required: true,
        min: 0
    },
    profit: {
        type: Number,
        default: 0
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customer: {
        type: String,
        trim: true
    },
    customer_info: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true },
        address: { type: String, trim: true }
    },
    payment_method: {
        type: String,
        enum: ['cash', 'transfer', 'credit', 'other'],
        default: 'cash'
    },
    payment_status: {
        type: String,
        enum: ['paid', 'unpaid', 'partial'],
        default: 'paid'
    },
    notes: {
        type: String,
        trim: true
    },
    created_by: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'completed'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
exportSchema.index({ user_id: 1, export_id: 1 }, { unique: true, sparse: true });
exportSchema.index({ user_id: 1, customer_id: 1 });
exportSchema.index({ user_id: 1, export_date: -1 });
exportSchema.index({ user_id: 1, product_id: 1, export_date: -1 });
exportSchema.index({ user_id: 1, customer: 1 });
exportSchema.index({ user_id: 1, payment_status: 1 });
exportSchema.index({ user_id: 1, status: 1 });
// export_id index is already defined in schema options with unique: true

// Pre-validation middleware to generate export_id before validation
exportSchema.pre('validate', async function (next) {
    // Generate export_id if it's a new document and export_id is not provided or is null
    if (this.isNew && (!this.export_id || this.export_id === '' || this.export_id === null)) {
        try {
            // Generate date code: YYMMDD
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const dateCode = `${yy}${mm}${dd}`;
            const prefix = `PX-${dateCode}-`;

            // Count existing exports for this user TODAY (matching the prefix)
            // This ensures the sequence resets every day
            const regex = new RegExp(`^${prefix}`);
            const count = await this.constructor.countDocuments({
                user_id: this.user_id,
                export_id: regex
            });

            this.export_id = `${prefix}${String(count + 1).padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generating export ID:', error);
            // Fallback to timestamp-based code
            this.export_id = `PX-${Date.now()}`;
        }
    }

    next();
});

// Pre-save middleware to calculate total amount and profit and check for duplicates
exportSchema.pre('save', async function (next) {
    // Calculate total amount
    if (this.qty_exported && this.price_exported) {
        this.total_exported_amt = (this.qty_exported * this.price_exported) - (this.discount || 0);
    }
    if (this.qty_exported && this.cost_price) {
        // Profit = Revenue - Cost
        // Revenue is already discounted
        this.profit = this.total_exported_amt - (this.qty_exported * this.cost_price);
    }

    // Check for duplicate export_id for existing documents
    if (this.export_id && !this.isNew) {
        try {
            const existing = await this.constructor.findOne({
                _id: { $ne: this._id },
                user_id: this.user_id,
                export_id: this.export_id
            });
            if (existing) {
                const error = new Error('Export ID already exists');
                error.name = 'ValidationError';
                return next(error);
            }
        } catch (error) {
            return next(error);
        }
    }

    next();
});

// Virtual for formatted date
exportSchema.virtual('export_date_formatted').get(function () {
    return this.export_date.toLocaleDateString('vi-VN');
});

// Virtual for profit margin
exportSchema.virtual('profit_margin').get(function () {
    if (this.total_exported_amt > 0) {
        return ((this.profit / this.total_exported_amt) * 100).toFixed(2);
    }
    return 0;
});

// Static method to get monthly export totals
exportSchema.statics.getMonthlyTotals = function (year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.aggregate([
        {
            $match: {
                export_date: { $gte: startDate, $lte: endDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$product_id',
                total_quantity: { $sum: '$qty_exported' },
                total_revenue: { $sum: '$total_exported_amt' },
                total_profit: { $sum: '$profit' },
                avg_price: { $avg: '$price_exported' }
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'product_id',
                as: 'product'
            }
        },
        {
            $unwind: '$product'
        }
    ]);
};

// Static method to get customer statistics
exportSchema.statics.getCustomerStats = function (year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.aggregate([
        {
            $match: {
                export_date: { $gte: startDate, $lte: endDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$customer',
                total_orders: { $sum: 1 },
                total_quantity: { $sum: '$qty_exported' },
                total_amount: { $sum: '$total_exported_amt' },
                avg_order_value: { $avg: '$total_exported_amt' }
            }
        },
        {
            $sort: { total_amount: -1 }
        },
        {
            $limit: 20
        }
    ]);
};

// Prevent model overwrite in development
const Export = mongoose.models.Export || mongoose.model('Export', exportSchema);
module.exports = Export;