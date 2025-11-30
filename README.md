# EZKho - Hệ thống Quản lý Kho hàng Chuyên nghiệp

![EZKho Banner](/public/banner.png) <!-- Bạn có thể thêm ảnh banner vào đây -->

**EZKho** là giải pháp phần mềm quản lý kho hàng toàn diện, được thiết kế để giúp các doanh nghiệp vừa và nhỏ tối ưu hóa quy trình nhập xuất, kiểm soát tồn kho chính xác và theo dõi hiệu quả kinh doanh theo thời gian thực.

---

## 🚀 Tính năng Nổi bật

### 📦 Quản lý Kho hàng
- **Nhập kho**: Tạo và quản lý phiếu nhập hàng từ nhà cung cấp. Hỗ trợ chiết khấu và theo dõi công nợ.
- **Xuất kho**: Tạo đơn hàng xuất kho, in hóa đơn và theo dõi doanh thu.
- **Kiểm kho**: Quy trình kiểm kê kho thông minh, tự động tính toán chênh lệch và cập nhật tồn kho thực tế.
- **Cảnh báo tồn kho**: Tự động cảnh báo khi hàng hóa sắp hết hoặc vượt quá định mức.

### 👥 Quản lý Đối tác
- **Nhà cung cấp**: Lưu trữ thông tin chi tiết, lịch sử nhập hàng và công nợ.
- **Khách hàng**: Quản lý thông tin khách hàng, lịch sử mua hàng và phân loại khách hàng tiềm năng.

### 📊 Báo cáo & Phân tích
- **Dashboard tổng quan**: Theo dõi nhanh doanh thu, lợi nhuận, và các chỉ số quan trọng.
- **Báo cáo chi tiết**:
    - **Nhập/Xuất**: Phân tích xu hướng nhập xuất theo thời gian.
    - **Tài chính**: Báo cáo doanh thu, chi phí và lợi nhuận ròng.
    - **Tồn kho**: Giá trị tồn kho hiện tại và lịch sử biến động.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

### Frontend (FE)
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Lucide React](https://lucide.dev/) (Icons), Custom UI Components
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Hooks (Context API)

### Backend (BE)
- **Runtime**: Node.js
- **Framework**: Next.js API Routes (Serverless functions)
- **Database**: [MongoDB](https://www.mongodb.com/) (với Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)

---

## 📖 Hướng dẫn Cài đặt & Sử dụng

### Yêu cầu hệ thống
- Node.js 18.0.0 trở lên
- MongoDB (Local hoặc Atlas)

### Các bước cài đặt

1.  **Clone dự án**
    ```bash
    git clone https://github.com/your-username/qlkhohang.git
    cd qlkhohang
    ```

2.  **Cài đặt dependencies**
    ```bash
    npm install
    ```

3.  **Cấu hình môi trường**
    Tạo file `.env.local` tại thư mục gốc và thêm các biến sau:
    ```env
    MONGODB_URI=mongodb://localhost:27017/qlkhohang
    JWT_SECRET=your_super_secret_key
    NEXT_PUBLIC_BASE_URL=http://localhost:3000
    ```

4.  **Chạy dự án**
    ```bash
    npm run dev
    ```
    Truy cập [http://localhost:3000](http://localhost:3000) để bắt đầu sử dụng.

---

## 🔌 Tài liệu API (API Documentation)

Hệ thống cung cấp các API RESTful để tích hợp và mở rộng.

### Xác thực (Authentication)
Tất cả các API (trừ đăng nhập/đăng ký) đều yêu cầu header `Authorization`:
```
Authorization: Bearer <your_token>
```

### Endpoints chính

#### 1. Sản phẩm (Products)
- `GET /api/products`: Lấy danh sách sản phẩm (hỗ trợ phân trang, tìm kiếm).
- `POST /api/products`: Thêm sản phẩm mới.
- `GET /api/products/[id]`: Lấy chi tiết sản phẩm.
- `PUT /api/products/[id]`: Cập nhật sản phẩm.

#### 2. Nhập kho (Imports)
- `GET /api/imports`: Lấy danh sách phiếu nhập.
- `POST /api/imports`: Tạo phiếu nhập mới.
    - **Body**:
      ```json
      {
        "supplier_id": "...",
        "import_date": "2023-10-27",
        "details": [
          { "product_id": "...", "qty_imported": 10, "price_imported": 50000 }
        ],
        "discount": 100000
      }
      ```

#### 3. Xuất kho (Exports)
- `GET /api/exports`: Lấy danh sách phiếu xuất.
- `POST /api/exports`: Tạo phiếu xuất mới.

#### 4. Báo cáo (Reports)
- `GET /api/dashboard/reports`: Lấy dữ liệu báo cáo tổng hợp.
    - **Params**:
        - `type`: `overview` | `imports` | `exports` | `financials` | `partners` | `inventory`
        - `period`: `current_month` | `last_month` | `custom` (kèm `startDate`, `endDate`)

---

## 📂 Cấu trúc Dự án

```
qlkhohang/
├── app/                    # Next.js App Router
│   ├── api/                # Backend API Routes
│   ├── dashboard/          # Dashboard Pages
│   ├── auth/               # Authentication Pages
│   ├── layout.tsx          # Root Layout
│   └── page.tsx            # Landing Page
├── components/             # Reusable React Components
│   ├── ui/                 # Basic UI Elements (Button, Input, Card...)
│   ├── reports/            # Report Components
│   └── ...
├── lib/                    # Utilities & Helpers
│   ├── mongodb.js          # Database Connection
│   ├── auth.js             # Auth Logic
│   └── ...
├── models/                 # Mongoose Models (Schema)
│   ├── Product.js
│   ├── Import.js
│   └── ...
└── public/                 # Static Assets
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo Pull Request hoặc mở Issue để thảo luận về các thay đổi.

---

## 📄 Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.
