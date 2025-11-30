# QLKhoHang - Frontend Documentation

## Overview
Frontend của hệ thống quản lý kho hàng được xây dựng với Next.js 14, TypeScript và Tailwind CSS.

## 🚀 Features

### Authentication
- Đăng ký/Đăng nhập người dùng
- JWT token-based authentication
- Multi-tenant architecture (mỗi user có data riêng biệt)
- Automatic authentication state management

### Dashboard
- Tổng quan thống kê kinh doanh
- Hiển thị các chỉ số quan trọng (tổng sản phẩm, giá trị tồn kho, doanh thu, lợi nhuận)
- Hoạt động gần đây
- Cảnh báo tồn kho thấp
- Thao tác nhanh

### UI Components
- Responsive design cho mobile và desktop
- Modern UI với Tailwind CSS
- Reusable components
- Loading states và error handling
- Vietnamese localization

## 📁 Project Structure

```
app/
├── api/                    # API Routes (Next.js API routes)
│   ├── auth/              # Authentication endpoints
│   ├── dashboard/         # Dashboard statistics
│   ├── products/          # Product management
│   ├── imports/           # Import management
│   ├── exports/           # Export management
│   ├── expenses/          # Expense management
│   ├── inventory/         # Inventory management
│   └── profitloss/        # Profit & Loss reports
├── auth/                  # Authentication pages
│   └── page.jsx           # Login/Register page
├── dashboard/             # Dashboard pages
│   ├── layout.jsx         # Dashboard layout wrapper
│   └── page.jsx           # Main dashboard
├── layout.tsx             # Root layout with AuthProvider
└── page.tsx               # Home page (redirect based on auth)

components/
├── auth/                  # Authentication components
│   ├── LoginForm.jsx      # Login form component
│   └── RegisterForm.jsx   # Registration form component
├── dashboard/             # Dashboard components
│   ├── DashboardStats.jsx # Statistics cards
│   ├── RecentActivity.jsx # Recent activity feed
│   └── LowStockAlert.jsx  # Low stock warnings
├── layout/                # Layout components
│   ├── Header.jsx         # Application header
│   └── DashboardLayout.jsx # Main dashboard layout
└── ui/                    # Reusable UI components
    ├── Button.jsx         # Custom button component
    ├── Input.jsx          # Custom input component
    ├── Card.jsx           # Card component
    └── Alert.jsx          # Alert component

contexts/
└── AuthContext.js         # Authentication state management

lib/                       # Utility libraries
├── auth.js               # Authentication helpers
├── mongodb.js            # Database connection
└── apiResponse.js        # API response standardization

models/                     # MongoDB schemas
├── User.js               # User model
├── Product.js            # Product model
├── Import.js             # Import model
├── Export.js             # Export model
├── Expense.js            # Expense model
├── Inventory.js          # Inventory model
└── ProfitLoss.js         # Profit & Loss model
```

## 🔧 Technologies Used

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Context API** - State management

### Backend (Integrated)
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 🎨 UI Components

### Button Component
```jsx
<Button variant="primary" size="md" loading={false} disabled={false}>
  Button Text
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean

### Input Component
```jsx
<Input
  label="Field Label"
  type="text"
  name="fieldName"
  value={value}
  onChange={handleChange}
  required
  error="Error message"
/>
```

### Card Component
```jsx
<Card title="Card Title" subtitle="Card subtitle" padding="normal" shadow="md">
  Card content
</Card>
```

### Alert Component
```jsx
<Alert type="info" dismissible onDismiss={handleDismiss}>
  Alert message
</Alert>
```

## 🔐 Authentication Flow

1. **Login/Registration**: Users authenticate via `/api/auth/login` or `/api/auth/register`
2. **Token Storage**: JWT token stored in localStorage
3. **Auto-redirect**: Home page redirects based on authentication status
4. **Protected Routes**: Dashboard routes require authentication
5. **Token Refresh**: Automatic token refresh functionality

## 📊 Dashboard Features

### Statistics Cards
- Total Products
- Inventory Value
- Monthly Revenue
- Monthly Profit

### Recent Activity
- Combined feed of imports, exports, and expenses
- Real-time updates
- Sorted by latest activity

### Low Stock Alerts
- Automatic detection of low inventory
- Quick links to inventory management
- Threshold-based notifications

### Quick Actions
- Easy access to common operations
- One-click navigation to key features

## 🎯 State Management

### AuthContext
- Global authentication state
- User data management
- Login/Logout functions
- Automatic localStorage sync

### Local State
- Component-level state with useState
- Form state management
- Loading and error states

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 📱 Responsive Design

- **Mobile-first approach**
- **Breakpoints**:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
- **Collapsible sidebar** for mobile
- **Touch-friendly** interface

## 🎨 Design System

### Color Palette
- **Primary**: Blue (blue-600)
- **Success**: Green (green-600)
- **Warning**: Yellow (yellow-600)
- **Error**: Red (red-600)
- **Neutral**: Gray scale

### Typography
- **Font**: Geist Sans (system font stack)
- **Headings**: Bold, larger sizes
- **Body**: Regular weight, readable sizes

### Spacing
- **Consistent spacing** using Tailwind classes
- **Modular scale** for harmonious design
- **Responsive spacing** based on screen size

## 🔧 Customization

### Adding New Pages
1. Create new route in `app/` directory
2. Add authentication check if needed
3. Use DashboardLayout for authenticated pages
4. Follow existing component patterns

### Adding New Components
1. Create component in `components/ui/` or appropriate subdirectory
2. Follow existing naming conventions
3. Include TypeScript props if needed
4. Make components reusable

### API Integration
1. Use fetch with proper error handling
2. Include JWT token in headers
3. Handle loading and error states
4. Follow API response standardization

## 🐛 Troubleshooting

### Common Issues
1. **Authentication not working**: Check JWT token in localStorage
2. **API errors**: Check network tab and API endpoints
3. **Styling issues**: Verify Tailwind CSS classes
4. **Routing issues**: Check Next.js file-based routing

### Debug Tips
1. Use browser dev tools for network requests
2. Check console for JavaScript errors
3. Verify environment variables
4. Test API endpoints separately

## 📈 Performance Optimizations

- **Code splitting**: Automatic with Next.js
- **Image optimization**: Next.js Image component
- **Bundle analysis**: webpack-bundle-analyzer
- **Caching**: API response caching where appropriate

## 🔒 Security Considerations

- **JWT security**: Proper token handling
- **Input validation**: Client and server-side
- **XSS protection**: Built-in with React
- **CSRF protection**: Consider for forms
- **HTTPS**: Required for production

## 📝 Future Enhancements

- **PWA support**: Offline functionality
- **Real-time updates**: WebSocket integration
- **Advanced charts**: Chart.js or D3.js
- **File uploads**: Product images, documents
- **Export functionality**: PDF, Excel reports
- **Advanced search**: Full-text search
- **Notifications**: Push notifications
- **Multi-language**: i18n support