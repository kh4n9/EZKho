const mongoose = require('mongoose');

const profitLossSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    },
    total_revenue: {
        type: Number,
        default: 0,
        min: 0
    },
    cost_of_goods_sold: {
        type: Number,
        default: 0,
        min: 0
    },
    gross_profit: {
        type: Number,
        default: 0
    },
    total_expenses: {
        type: Number,
        default: 0,
        min: 0
    },
    operating_expenses: {
        type: Number,
        default: 0,
        min: 0
    },
    net_profit: {
        type: Number,
        default: 0
    },
    gross_profit_margin: {
        type: Number,
        default: 0
    },
    net_profit_margin: {
        type: Number,
        default: 0
    },
    inventory_change: {
        type: Number,
        default: 0
    },
    total_orders: {
        type: Number,
        default: 0,
        min: 0
    },
    average_order_value: {
        type: Number,
        default: 0,
        min: 0
    },
    top_selling_products: [{
        product_id: String,
        product_name: String,
        quantity: Number,
        revenue: Number
    }],
    expense_breakdown: [{
        expense_type: String,
        amount: Number,
        percentage: Number
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
profitLossSchema.index({ user_id: 1, period_year: 1, period_month: 1 }, { unique: true });
profitLossSchema.index({ user_id: 1, net_profit: -1 });
profitLossSchema.index({ user_id: 1, total_revenue: -1 });
profitLossSchema.index({ period_year: 1, period_month: 1 });

// Virtual for period display
profitLossSchema.virtual('period_display').get(function() {
    return `Tháng ${this.period_month}/${this.period_year}`;
});

// Virtual for formatted amounts
profitLossSchema.virtual('total_revenue_formatted').get(function() {
    return this.total_revenue.toLocaleString('vi-VN') + ' VNĐ';
});

profitLossSchema.virtual('net_profit_formatted').get(function() {
    return this.net_profit.toLocaleString('vi-VN') + ' VNĐ';
});

// Pre-save middleware to calculate derived values
profitLossSchema.pre('save', function(next) {
    // Calculate gross profit
    this.gross_profit = this.total_revenue - this.cost_of_goods_sold;

    // Calculate net profit
    this.net_profit = this.gross_profit - this.total_expenses;

    // Calculate profit margins
    if (this.total_revenue > 0) {
        this.gross_profit_margin = (this.gross_profit / this.total_revenue) * 100;
        this.net_profit_margin = (this.net_profit / this.total_revenue) * 100;
    }

    // Calculate average order value
    if (this.total_orders > 0) {
        this.average_order_value = this.total_revenue / this.total_orders;
    }

    next();
});

// Static method to calculate profit/loss for a specific period
profitLossSchema.statics.calculateProfitLoss = async function(year, month) {
    const Export = mongoose.model('Export');
    const Expense = mongoose.model('Expense');
    const Inventory = mongoose.model('Inventory');
    const Product = mongoose.model('Product');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Calculate total revenue from exports
    const revenueData = await Export.aggregate([
        {
            $match: {
                export_date: { $gte: startDate, $lte: endDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                total_revenue: { $sum: '$total_exported_amt' },
                total_orders: { $sum: 1 },
                cost_of_goods_sold: {
                    $sum: { $multiply: ['$qty_exported', '$cost_price'] }
                }
            }
        }
    ]);

    // Calculate total expenses
    const expenseData = await Expense.aggregate([
        {
            $match: {
                expense_date: { $gte: startDate, $lte: endDate },
                status: 'approved'
            }
        },
        {
            $group: {
                _id: null,
                total_expenses: { $sum: '$amount' }
            }
        }
    ]);

    // Get expense breakdown by type
    const expenseBreakdown = await Expense.aggregate([
        {
            $match: {
                expense_date: { $gte: startDate, $lte: endDate },
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$expense_type',
                amount: { $sum: '$amount' }
            }
        },
        {
            $sort: { amount: -1 }
        }
    ]);

    // Get top selling products
    const topProducts = await Export.aggregate([
        {
            $match: {
                export_date: { $gte: startDate, $lte: endDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$product_id',
                quantity: { $sum: '$qty_exported' },
                revenue: { $sum: '$total_exported_amt' }
            }
        },
        {
            $sort: { revenue: -1 }
        },
        {
            $limit: 10
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
        },
        {
            $project: {
                product_id: '$_id',
                product_name: '$product.product_name',
                quantity: 1,
                revenue: 1
            }
        }
    ]);

    const revenue = revenueData[0] || { total_revenue: 0, total_orders: 0, cost_of_goods_sold: 0 };
    const expenses = expenseData[0] || { total_expenses: 0 };

    // Calculate expense percentages
    const totalExpenses = expenses.total_expenses;
    const expenseBreakdownWithPercentage = expenseBreakdown.map(item => ({
        expense_type: item._id,
        amount: item.amount,
        percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
    }));

    // Get inventory change
    const currentInventory = await Inventory.findOne({
        period_year: year,
        period_month: month
    });

    let inventoryChange = 0;
    if (currentInventory) {
        const prevInventory = await Inventory.findOne({
            $or: [
                { period_year: { $lt: year } },
                { period_year: year, period_month: { $lt: month } }
            ]
        }).sort({ period_year: -1, period_month: -1 });

        if (prevInventory) {
            inventoryChange = currentInventory.closing_value - prevInventory.closing_value;
        }
    }

    const profitLossData = {
        period_year: year,
        period_month: month,
        total_revenue: revenue.total_revenue,
        cost_of_goods_sold: revenue.cost_of_goods_sold,
        total_expenses: expenses.total_expenses,
        total_orders: revenue.total_orders,
        inventory_change: inventoryChange,
        top_selling_products: topProducts,
        expense_breakdown: expenseBreakdownWithPercentage,
        last_updated: new Date()
    };

    // Update or create profit/loss record
    return this.findOneAndUpdate(
        { period_year: year, period_month: month },
        profitLossData,
        { upsert: true, new: true }
    );
};

// Static method to get year-to-date profit/loss summary
profitLossSchema.statics.getYTDSummary = function(year) {
    return this.aggregate([
        {
            $match: {
                period_year: year
            }
        },
        {
            $group: {
                _id: null,
                total_revenue: { $sum: '$total_revenue' },
                cost_of_goods_sold: { $sum: '$cost_of_goods_sold' },
                gross_profit: { $sum: '$gross_profit' },
                total_expenses: { $sum: '$total_expenses' },
                net_profit: { $sum: '$net_profit' },
                total_orders: { $sum: '$total_orders' }
            }
        }
    ]);
};

// Static method to get monthly trend
profitLossSchema.statics.getMonthlyTrend = function(year) {
    return this.find({ period_year: year })
        .sort({ period_month: 1 })
        .select('period_month total_revenue gross_profit net_profit total_orders');
};

// Prevent model overwrite in development
const ProfitLoss = mongoose.models.ProfitLoss || mongoose.model('ProfitLoss', profitLossSchema);
module.exports = ProfitLoss;