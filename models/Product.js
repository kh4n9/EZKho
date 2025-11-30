const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product_id: {
        type: String,
        required: true,
        trim: true
    },
    product_name: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'tấn', 'bao', 'gói'],
        default: 'kg'
    },
    description: {
        type: String,
        trim: true
    },
    current_stock: {
        type: Number,
        default: 0,
        min: 0
    },
    average_cost: {
        type: Number,
        default: 0,
        min: 0
    },
    total_value: {
        type: Number,
        default: 0,
        min: 0
    },
    reorder_level: {
        type: Number,
        default: 100,
        min: 0,
        required: true
    },
    preferred_supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    lead_time_days: {
        type: Number,
        default: 7,
        min: 1
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
productSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
productSchema.index({ user_id: 1, product_name: 1 });
productSchema.index({ user_id: 1, is_active: 1 });
productSchema.index({ product_id: 1 });

// Virtual for formatted unit
productSchema.virtual('unit_display').get(function() {
    const unitMap = {
        'kg': 'Kilogam',
        'tấn': 'Tấn',
        'bao': 'Bao',
        'gói': 'Gói'
    };
    return unitMap[this.unit] || this.unit;
});

// Method to update stock and average cost
productSchema.methods.updateStock = function(qty, cost, type = 'import') {
    if (type === 'import') {
        const totalValue = this.current_stock * this.average_cost + qty * cost;
        this.current_stock += qty;
        this.average_cost = this.current_stock > 0 ? totalValue / this.current_stock : 0;
    } else if (type === 'export') {
        this.current_stock -= qty;
    }
    this.total_value = this.current_stock * this.average_cost;
    return this.save();
};

// Method to check if reorder is needed
productSchema.methods.needsReorder = function() {
    return this.current_stock <= this.reorder_level;
};

// Method to calculate recommended order quantity
productSchema.methods.calculateReorderQuantity = function() {
    // Calculate quantity needed to reach optimal stock level
    // Optimal level is typically 2-3 times the reorder level
    const optimalLevel = this.reorder_level * 2.5;
    const recommendedQty = Math.max(0, optimalLevel - this.current_stock);
    return recommendedQty;
};

// Prevent model overwrite in development
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;