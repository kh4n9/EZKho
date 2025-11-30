const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    supplier_code: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    contact_person: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        trim: true
    },
    tax_code: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    total_purchase_amount: {
        type: Number,
        default: 0
    },
    total_orders: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
supplierSchema.index({ user_id: 1, supplier_code: 1 }, { unique: true });
supplierSchema.index({ user_id: 1, name: 'text', phone: 'text', email: 'text', supplier_code: 'text' });

// Pre-save middleware to generate supplier_code if not provided
supplierSchema.pre('validate', async function (next) {
    if (this.isNew && !this.supplier_code) {
        try {
            // Generate date code: YYMMDD
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const dateCode = `${yy}${mm}${dd}`;
            const prefix = `NCC-${dateCode}-`;

            // Count existing suppliers for this user TODAY (matching the prefix)
            const regex = new RegExp(`^${prefix}`);
            const count = await this.constructor.countDocuments({
                user_id: this.user_id,
                supplier_code: regex
            });

            this.supplier_code = `${prefix}${String(count + 1).padStart(4, '0')}`;
        } catch (error) {
            this.supplier_code = `NCC-${Date.now()}`;
        }
    }
    next();
});

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;