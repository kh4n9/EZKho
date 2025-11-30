const mongoose = require('mongoose');

const inventoryCheckSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    check_code: {
        type: String,
        required: true,
        unique: true
    },
    check_date: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'completed', 'cancelled'],
        default: 'draft'
    },
    products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        product_name: String, // Snapshot for history
        unit: String,
        system_stock: {
            type: Number,
            required: true
        },
        actual_stock: {
            type: Number,
            required: true
        },
        difference: {
            type: Number,
            required: true
        },
        reason: String
    }],
    notes: String,
    created_by: String
}, {
    timestamps: true
});

// Indexes
inventoryCheckSchema.index({ user_id: 1, check_code: 1 }, { unique: true });
inventoryCheckSchema.index({ user_id: 1, check_date: -1 });
inventoryCheckSchema.index({ user_id: 1, status: 1 });

// Generate check code middleware


const InventoryCheck = mongoose.models.InventoryCheck || mongoose.model('InventoryCheck', inventoryCheckSchema);
module.exports = InventoryCheck;
