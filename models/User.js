const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    full_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Please fill a valid phone number']
    },
    store_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    store_address: {
        type: String,
        trim: true,
        maxlength: 200
    },
    store_phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Please fill a valid phone number']
    },
    store_email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    role: {
        type: String,
        enum: ['admin', 'owner', 'staff'],
        default: 'owner'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    last_login: {
        type: Date
    },
    avatar: {
        type: String,
        default: null
    },
    preferences: {
        language: {
            type: String,
            enum: ['vi', 'en'],
            default: 'vi'
        },
        currency: {
            type: String,
            enum: ['VND', 'USD'],
            default: 'VND'
        },
        timezone: {
            type: String,
            default: 'Asia/Ho_Chi_Minh'
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        }
    },
    settings: {
        low_stock_threshold: {
            type: Number,
            default: 100,
            min: 0
        },
        auto_backup: {
            type: Boolean,
            default: true
        },
        email_notifications: {
            type: Boolean,
            default: true
        },
        low_stock_alerts: {
            type: Boolean,
            default: true
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled', 'expired'],
            default: 'active'
        },
        expires_at: {
            type: Date
        },
        max_products: {
            type: Number,
            default: 50
        },
        max_users: {
            type: Number,
            default: 1
        }
    },
    reset_password_token: {
        type: String,
        default: null
    },
    reset_password_expires: {
        type: Date,
        default: null
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    email_verification_token: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
// Note: username and email already have unique: true, which automatically creates indexes
// No need to create duplicate indexes for these fields
userSchema.index({ store_name: 1 });
userSchema.index({ is_active: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'subscription.status': 1 });

// Virtual for store info display
userSchema.virtual('store_info_display').get(function() {
    return `${this.store_name} - ${this.store_address || 'Chưa có địa chỉ'}`;
});

// Virtual for full display name
userSchema.virtual('display_name').get(function() {
    return this.full_name || this.username;
});

// Virtual for formatted last login
userSchema.virtual('last_login_formatted').get(function() {
    if (!this.last_login) return 'Chưa đăng nhập';
    return this.last_login.toLocaleDateString('vi-VN') + ' ' + this.last_login.toLocaleTimeString('vi-VN');
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user data without sensitive information
userSchema.methods.toSafeObject = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.reset_password_token;
    delete userObject.reset_password_expires;
    delete userObject.email_verification_token;
    return userObject;
};

// Method to check if user has reached product limit
userSchema.methods.hasReachedProductLimit = async function() {
    if (this.subscription.plan === 'free') {
        const Product = mongoose.model('Product');
        const productCount = await Product.countDocuments({ user_id: this._id });
        return productCount >= this.subscription.max_products;
    }
    return false;
};

// Method to check subscription status
userSchema.methods.isSubscriptionActive = function() {
    if (this.subscription.plan === 'free') return true;
    return this.subscription.status === 'active' &&
           (!this.subscription.expires_at || this.subscription.expires_at > new Date());
};

// Static method to find users with expired subscriptions
userSchema.statics.findExpiredSubscriptions = function() {
    return this.find({
        'subscription.plan': { $ne: 'free' },
        'subscription.expires_at': { $lt: new Date() },
        'subscription.status': 'active'
    });
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$subscription.plan',
                count: { $sum: 1 },
                active_users: {
                    $sum: {
                        $cond: [{ $eq: ['$is_active', true] }, 1, 0]
                    }
                }
            }
        }
    ]);
};

// Prevent model overwrite in development
const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;