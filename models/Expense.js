const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expense_id: {
        type: String,
        required: true,
        trim: true
    },
    expense_type: {
        type: String,
        required: true,
        enum: [
            'lương',
            'mặt bằng',
            'vận chuyển',
            'điện nước',
            'văn phòng phẩm',
            'marketing',
            'bảo trì',
            'thuế',
            'khác'
        ]
    },
    expense_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['cố định', 'biến đổi', 'đột xuất'],
        default: 'biến đổi'
    },
    payment_method: {
        type: String,
        enum: ['cash', 'transfer', 'card', 'other'],
        default: 'cash'
    },
    recipient: {
        type: String,
        trim: true
    },
    invoice_number: {
        type: String,
        trim: true
    },
    related_product: {
        type: String,
        ref: 'Product'
    },
    department: {
        type: String,
        trim: true
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
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    recurring: {
        type: Boolean,
        default: false
    },
    recurring_period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
    }
}, {
    timestamps: true
});

// Indexes for better query performance
expenseSchema.index({ user_id: 1, expense_id: 1 }, { unique: true });
expenseSchema.index({ user_id: 1, expense_date: -1 });
expenseSchema.index({ user_id: 1, expense_type: 1 });
expenseSchema.index({ user_id: 1, category: 1 });
expenseSchema.index({ user_id: 1, status: 1 });
expenseSchema.index({ user_id: 1, recurring: 1 });
expenseSchema.index({ expense_id: 1 });

// Virtual for formatted date
expenseSchema.virtual('expense_date_formatted').get(function() {
    return this.expense_date.toLocaleDateString('vi-VN');
});

// Virtual for expense type display
expenseSchema.virtual('expense_type_display').get(function() {
    const typeMap = {
        'lương': 'Lương nhân viên',
        'mặt bằng': 'Chi phí mặt bằng',
        'vận chuyển': 'Chi phí vận chuyển',
        'điện nước': 'Điện, nước',
        'văn phòng phẩm': 'Văn phòng phẩm',
        'marketing': 'Marketing & quảng cáo',
        'bảo trì': 'Bảo trì, sửa chữa',
        'thuế': 'Thuế, phí',
        'khác': 'Chi phí khác'
    };
    return typeMap[this.expense_type] || this.expense_type;
});

// Static method to get monthly expense totals
expenseSchema.statics.getMonthlyTotals = function(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.aggregate([
        {
            $match: {
                expense_date: { $gte: startDate, $lte: endDate },
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$expense_type',
                total_amount: { $sum: '$amount' },
                count: { $sum: 1 },
                avg_amount: { $avg: '$amount' }
            }
        },
        {
            $sort: { total_amount: -1 }
        }
    ]);
};

// Static method to get expense summary by category
expenseSchema.statics.getExpenseSummaryByCategory = function(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.aggregate([
        {
            $match: {
                expense_date: { $gte: startDate, $lte: endDate },
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$category',
                total_amount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { total_amount: -1 }
        }
    ]);
};

// Static method to get year-to-date expenses
expenseSchema.statics.getYTDExpenses = function(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return this.aggregate([
        {
            $match: {
                expense_date: { $gte: startDate, $lte: endDate },
                status: 'approved'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$expense_date' },
                    month: { $month: '$expense_date' }
                },
                total_amount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);
};

// Prevent model overwrite in development
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
module.exports = Expense;