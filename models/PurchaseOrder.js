const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_id: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                // For new documents, if order_id is not provided, that's okay
                // The pre-save middleware will generate it
                if (this.isNew && (!v || v === null || v === '')) {
                    return true;
                }
                // For existing documents or if order_id is provided, ensure it's not empty
                return v && v.trim().length > 0;
            },
            message: 'Order ID cannot be empty when provided'
        }
    },
    order_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    product_id: {
        type: String,
        required: true,
        ref: 'Product'
    },
    product_name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    unit_price: {
        type: Number,
        required: true,
        min: 0
    },
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'ordered', 'received', 'cancelled'],
        default: 'pending'
    },
    expected_delivery_date: {
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
    auto_generated: {
        type: Boolean,
        default: false
    },
    // Reference to the export that triggered this order
    related_export_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Export'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
purchaseOrderSchema.index({ user_id: 1, order_date: -1 });
purchaseOrderSchema.index({ user_id: 1, status: 1 });
purchaseOrderSchema.index({ user_id: 1, supplier_id: 1 });
purchaseOrderSchema.index({ user_id: 1, product_id: 1 });

purchaseOrderSchema.pre('save', async function (next) {
    // Calculate total amount
    if (this.quantity && this.unit_price) {
        this.total_amount = this.quantity * this.unit_price;
    }

    next();
});

// Virtual for formatted date
purchaseOrderSchema.virtual('order_date_formatted').get(function () {
    return this.order_date.toLocaleDateString('vi-VN');
});

// Static method to get pending orders for user
purchaseOrderSchema.statics.getPendingOrders = function (userId) {
    return this.find({
        user_id: userId,
        status: 'pending'
    }).sort({ order_date: 1 }).populate('supplier_id', 'name contact_person phone');
};

// Static method to get orders by status
purchaseOrderSchema.statics.getOrdersByStatus = function (userId, status) {
    return this.find({
        user_id: userId,
        status: status
    }).sort({ order_date: -1 }).populate('supplier_id product_id', 'name product_name supplier_name');
};

// Static method to get order statistics
purchaseOrderSchema.statics.getOrderStats = function (userId) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);

    return this.aggregate([
        {
            $match: {
                user_id: mongoose.Types.ObjectId(userId),
                order_date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total_amount: { $sum: '$total_amount' }
            }
        }
    ]);
};

// Prevent model overwrite in development
const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
module.exports = PurchaseOrder;