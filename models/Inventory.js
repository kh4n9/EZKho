const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product_id: {
        type: String,
        required: true,
        ref: 'Product'
    },
    opening_stock: {
        type: Number,
        default: 0,
        min: 0
    },
    opening_value: {
        type: Number,
        default: 0,
        min: 0
    },
    total_imported: {
        type: Number,
        default: 0,
        min: 0
    },
    total_imported_value: {
        type: Number,
        default: 0,
        min: 0
    },
    total_exported: {
        type: Number,
        default: 0,
        min: 0
    },
    total_exported_value: {
        type: Number,
        default: 0,
        min: 0
    },
    closing_stock: {
        type: Number,
        default: 0,
        min: 0
    },
    closing_value: {
        type: Number,
        default: 0,
        min: 0
    },
    average_cost: {
        type: Number,
        default: 0,
        min: 0
    },
    valuation_method: {
        type: String,
        enum: ['FIFO', 'LIFO', 'WEIGHTED_AVERAGE'],
        default: 'WEIGHTED_AVERAGE'
    },
    last_updated: {
        type: Date,
        default: Date.now
    },
    period_year: {
        type: Number,
        required: true
    },
    period_month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    }
}, {
    timestamps: true
});

// Indexes for better query performance
inventorySchema.index({ user_id: 1, product_id: 1, period_year: 1, period_month: 1 }, { unique: true });
inventorySchema.index({ user_id: 1, period_year: 1, period_month: 1 });
inventorySchema.index({ user_id: 1, product_id: 1 });
inventorySchema.index({ user_id: 1, closing_stock: 1 });
inventorySchema.index({ user_id: 1, closing_value: 1 });
inventorySchema.index({ product_id: 1 });

// Virtual for stock status
inventorySchema.virtual('stock_status').get(function() {
    if (this.closing_stock === 0) return 'Hết hàng';
    if (this.closing_stock < 100) return 'Sắp hết hàng';
    return 'Còn hàng';
});

// Virtual for turnover rate
inventorySchema.virtual('turnover_rate').get(function() {
    const avgStock = (this.opening_stock + this.closing_stock) / 2;
    if (avgStock > 0) {
        return (this.total_exported / avgStock).toFixed(2);
    }
    return 0;
});

// Static method to calculate inventory for a specific period
inventorySchema.statics.calculateInventory = async function(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all products
    const Product = mongoose.model('Product');
    const Import = mongoose.model('Import');
    const Export = mongoose.model('Export');

    const products = await Product.find({ is_active: true });

    const inventoryPromises = products.map(async (product) => {
        // Get imports for the period
        const imports = await Import.aggregate([
            {
                $match: {
                    product_id: product.product_id,
                    import_date: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total_qty: { $sum: '$qty_imported' },
                    total_value: { $sum: '$total_imported_amt' }
                }
            }
        ]);

        // Get exports for the period
        const exports = await Export.aggregate([
            {
                $match: {
                    product_id: product.product_id,
                    export_date: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total_qty: { $sum: '$qty_exported' },
                    total_value: { $sum: '$total_exported_amt' }
                }
            }
        ]);

        const importData = imports[0] || { total_qty: 0, total_value: 0 };
        const exportData = exports[0] || { total_qty: 0, total_value: 0 };

        // Get opening stock (previous period closing stock or initial)
        let openingStock = product.current_stock || 0;
        let openingValue = product.current_stock * (product.average_cost || 0);

        // Check if there's previous period inventory
        const prevInventory = await this.findOne({
            product_id: product.product_id,
            $or: [
                { period_year: { $lt: year } },
                { period_year: year, period_month: { $lt: month } }
            ]
        }).sort({ period_year: -1, period_month: -1 });

        if (prevInventory) {
            openingStock = prevInventory.closing_stock;
            openingValue = prevInventory.closing_value;
        }

        const closingStock = openingStock + importData.total_qty - exportData.total_qty;
        const averageCost = openingStock + importData.total_qty > 0 ?
            (openingValue + importData.total_value) / (openingStock + importData.total_qty) : 0;
        const closingValue = closingStock * averageCost;

        return {
            product_id: product.product_id,
            opening_stock: openingStock,
            opening_value: openingValue,
            total_imported: importData.total_qty,
            total_imported_value: importData.total_value,
            total_exported: exportData.total_qty,
            total_exported_value: exportData.total_value,
            closing_stock: Math.max(0, closingStock),
            closing_value: Math.max(0, closingValue),
            average_cost: averageCost,
            period_year: year,
            period_month: month
        };
    });

    const inventoryData = await Promise.all(inventoryPromises);

    // Update or create inventory records
    for (const data of inventoryData) {
        await this.findOneAndUpdate(
            {
                product_id: data.product_id,
                period_year: data.period_year,
                period_month: data.period_month
            },
            data,
            { upsert: true, new: true }
        );
    }

    return this.find({
        period_year: year,
        period_month: month
    }).populate('product_id', 'product_name unit');
};

// Static method to get low stock products
inventorySchema.statics.getLowStockProducts = function(threshold = 100) {
    return this.find({
        closing_stock: { $lt: threshold },
        closing_stock: { $gt: 0 }
    }).populate('product_id', 'product_name unit')
     .sort({ closing_stock: 1 });
};

// Static method to get inventory value summary
inventorySchema.statics.getInventoryValueSummary = function(year, month) {
    return this.aggregate([
        {
            $match: {
                period_year: year,
                period_month: month
            }
        },
        {
            $group: {
                _id: null,
                total_products: { $sum: 1 },
                total_stock: { $sum: '$closing_stock' },
                total_value: { $sum: '$closing_value' },
                avg_cost_per_unit: { $avg: '$average_cost' }
            }
        }
    ]);
};

// Prevent model overwrite in development
const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;