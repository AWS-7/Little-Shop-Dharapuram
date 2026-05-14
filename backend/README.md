# Little Shop Dharapuram - Backend API

## 🚀 Overview

Professional Node.js + Express.js + MySQL backend that replaces Supabase.
- **Tech Stack**: Node.js, Express.js, MySQL2, Firebase Auth, Multer
- **Architecture**: REST API with JWT authentication via Firebase
- **File Storage**: Local filesystem with image optimization
- **Deployment**: Optimized for GoDaddy hosting

---

## 📁 Folder Structure

```
backend/
├── config/
│   └── database.js          # MySQL connection pool
├── controllers/
│   ├── product.controller.js
│   ├── category.controller.js
│   ├── cart.controller.js
│   ├── order.controller.js
│   ├── address.controller.js
│   └── upload.controller.js
├── middleware/
│   └── auth.middleware.js   # Firebase token verification
├── routes/
│   ├── index.js            # Route aggregator
│   ├── product.routes.js
│   ├── category.routes.js
│   ├── cart.routes.js
│   ├── order.routes.js
│   ├── address.routes.js
│   └── upload.routes.js
├── uploads/                # File storage
│   ├── products/
│   ├── categories/
│   ├── hero-banners/
│   └── payment-proofs/
├── database/
│   └── schema.sql          # Complete MySQL schema
├── app.js                  # Express app configuration
├── server.js               # Server entry point
├── package.json
└── .env.example            # Environment variables template
```

---

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Setup MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE littleshop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema
mysql -u root -p littleshop_db < database/schema.sql
```

### 4. Get Firebase Admin SDK
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `project_id`, `client_email`, and `private_key`
5. Add to `.env` file

### 5. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

---

## 🔌 API Endpoints

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/featured` - Featured products
- `GET /api/v1/products/:slug` - Single product
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/:id` - Update product (Admin)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

### Categories
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/:slug` - Single category
- `POST /api/v1/categories` - Create category (Admin)

### Cart
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/add` - Add to cart
- `PUT /api/v1/cart/update/:id` - Update quantity
- `DELETE /api/v1/cart/remove/:id` - Remove item
- `DELETE /api/v1/cart/clear` - Clear cart

### Orders
- `GET /api/v1/orders/my-orders` - User orders
- `GET /api/v1/orders/:id` - Order details
- `POST /api/v1/orders` - Create order
- `PUT /api/v1/orders/:id/cancel` - Cancel order

### Addresses
- `GET /api/v1/addresses` - List addresses
- `POST /api/v1/addresses` - Create address
- `PUT /api/v1/addresses/:id` - Update address
- `DELETE /api/v1/addresses/:id` - Delete address

### Uploads
- `POST /api/v1/uploads/product-image` - Upload product image
- `POST /api/v1/uploads/banner` - Upload banner
- `POST /api/v1/uploads/payment-proof` - Upload payment proof

---

## 📊 Database Schema

### Core Tables
- **categories** - Product categories
- **products** - Product catalog
- **users** - User profiles (sync with Firebase)
- **addresses** - User addresses
- **carts** - Shopping cart items
- **orders** - Order records
- **order_items** - Order line items
- **coupons** - Discount coupons

### Content Tables
- **hero_banners** - Homepage banners
- **flash_sales** - Flash sale events
- **testimonials** - Customer reviews
- **notifications** - User notifications

### Settings Tables
- **site_settings** - Website configuration
- **upi_settings** - Payment settings

---

## 🔒 Authentication

Firebase Authentication is used for:
- User login/registration
- Token verification
- Session management

Backend verifies Firebase tokens and creates/syncs user records in MySQL.

---

## 📤 File Upload

### Supported File Types
- Images: JPEG, JPG, PNG, GIF, WebP
- Documents: PDF
- Max Size: 5MB per file

### Upload Directories
- `uploads/products/` - Product images (optimized)
- `uploads/categories/` - Category images
- `uploads/hero-banners/` - Homepage banners
- `uploads/payment-proofs/` - Payment screenshots

---

## 🚀 GoDaddy Deployment

### 1. Prepare Files
```bash
# Create production build
cd backend
npm install --production
```

### 2. Upload to GoDaddy
- Upload all backend files (excluding node_modules)
- Run `npm install` on server
- Update `.env` with production values

### 3. GoDaddy MySQL Setup
```bash
# In GoDaddy cPanel
# 1. Create MySQL database
# 2. Create database user
# 3. Import schema.sql
# 4. Update .env with credentials
```

### 4. Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
BASE_URL=https://your-domain.com

DB_HOST=localhost
DB_USER=your_godaddy_db_user
DB_PASSWORD=your_godaddy_db_password
DB_NAME=your_godaddy_db_name

FRONTEND_URL=https://your-domain.com
```

### 5. Start with PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start server.js --name littleshop-api

# Save PM2 config
pm2 save
pm2 startup
```

---

## 🔄 Migration from Supabase

### Frontend Changes
1. Replace Supabase imports with API service:
```javascript
// Old (Supabase)
import { supabase } from '../lib/supabase';

// New (Custom API)
import { productAPI, cartAPI, orderAPI } from '../services/api';
```

2. Update function calls:
```javascript
// Old
const { data } = await supabase.from('products').select('*');

// New
const { data } = await productAPI.getAll();
```

### Data Migration
1. Export data from Supabase
2. Transform to MySQL format
3. Import to MySQL database
4. Verify all records transferred

---

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `secret` |
| `DB_NAME` | Database name | `littleshop_db` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `my-project` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `admin@project.iam...` |
| `FIREBASE_PRIVATE_KEY` | Private key (with newlines) | `-----BEGIN...` |
| `FRONTEND_URL` | Frontend origin | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing secret | `super-secret-key` |
| `RAZORPAY_KEY_ID` | Razorpay key | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `secret` |

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check MySQL is running
sudo service mysql status

# Verify credentials in .env
# Test connection: mysql -u root -p
```

**Firebase Auth Error**
```bash
# Verify private key format (should include newlines)
# Check FIREBASE_PROJECT_ID matches your project
```

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Multer Documentation](https://github.com/expressjs/multer)

---

## 📄 License

MIT License - Little Shop Dharapuram
