const mongoose = require('mongoose');

const importSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    import_id: {
        type: String,
        required: false,
        trim: true,
        default: null,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                // For new documents, if import_id is not provided, that's okay
                // The pre-save middleware will generate it
                if (this.isNew && (!v || v === null || v === '')) {
                    return true;
                }
                // For existing documents or if import_id is provided, ensure it's not empty
                return v && v.trim().length > 0;
            },
            message: 'Import ID cannot be empty when provided'
        }
    },
    import_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    product_id: {
        type: String,
        required: true,
        ref: 'Product'
    },
    qty_imported: {
        type: Number,
        required: true,
        min: 0.01
    },
    price_imported: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total_imported_amt: {
        type: Number,
        required: true,
        min: 0
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    supplier: {
        type: String,
        trim: true
    },
    supplier_info: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true },
        address: { type: String, trim: true }
    },
    expiration_date: {
        type: Date
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
importSchema.index({ user_id: 1, import_date: -1 });
importSchema.index({ user_id: 1, product_id: 1, import_date: -1 });
importSchema.index({ user_id: 1, supplier: 1 });
importSchema.index({ user_id: 1, status: 1 });
// Note: import_id index is already defined in the schema with unique: true

// Pre-validation middleware to generate import_id before validation
importSchema.pre('validate', async function (next) {
    // Generate import_id if it's a new document and import_id is not provided or is null
    if (this.isNew && (!this.import_id || this.import_id === '' || this.import_id === null)) {
        try {
            // Generate date code: YYMMDD
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const dateCode = `${yy}${mm}${dd}`;
            const prefix = `PN-${dateCode}-`;

            // Count existing imports for this user TODAY (matching the prefix)
            // This ensures the sequence resets every day
            const regex = new RegExp(`^${prefix}`);
            const count = await this.constructor.countDocuments({
                user_id: this.user_id,
                import_id: regex
            });

            this.import_id = `${prefix}${String(count + 1).padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generating import ID:', error);
            // Fallback to timestamp-based code
            this.import_id = `PN-${Date.now()}`;
        }
    }

    next();
});

// Pre-save middleware to calculate total amount and check for duplicates
importSchema.pre('save', async function (next) {
    // Calculate total amount
    if (this.qty_imported && this.price_imported) {
        this.total_imported_amt = (this.qty_imported * this.price_imported) - (this.discount || 0);
    }

    // Check for duplicate import_id for existing documents
    if (this.import_id && !this.isNew) {
        try {
            const existing = await this.constructor.findOne({
                _id: { $ne: this._id },
                user_id: this.user_id,
                import_id: this.import_id
            });
            if (existing) {
                const error = new Error('Import ID already exists');
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
importSchema.virtual('import_date_formatted').get(function () {
    return this.import_date.toLocaleDateString('vi-VN');
});

// Static method to get monthly import totals
importSchema.statics.getMonthlyTotals = function (year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.aggregate([
        {
            $match: {
                import_date: { $gte: startDate, $lte: endDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$product_id',
                total_quantity: { $sum: '$qty_imported' },
                total_amount: { $sum: '$total_imported_amt' },
                avg_price: { $avg: '$price_imported' }
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

// Prevent model overwrite in development
const Import = mongoose.models.Import || mongoose.model('Import', importSchema);
module.exports = Import;