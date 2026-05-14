# 🚀 COMPLETE DEPLOYMENT GUIDE
## Little Shop Dharapuram - Production Setup

**Goal**: Deploy full-stack application (Frontend + Node.js Backend + MySQL) to GoDaddy

---

# 📋 PHASE 1: LOCAL DEVELOPMENT SETUP

## Step 1: MySQL Database Setup (Local)

### 1.1 Install MySQL (if not installed)
```bash
# Windows: Download from https://dev.mysql.com/downloads/installer/
# Run installer and choose "Server Only" or "Full"
# Set root password during installation

# Verify installation
mysql --version
```

### 1.2 Create Database
```bash
# Open MySQL command line (or MySQL Workbench)
mysql -u root -p

# Enter your root password when prompted

# Create database
CREATE DATABASE littleshop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Verify database created
SHOW DATABASES;

# Exit MySQL
EXIT;
```

**✅ Verification**: You should see `littleshop_db` in the database list

### 1.3 Import Database Schema
```bash
# Navigate to project root
cd "c:\Users\vigne\OneDrive\Desktop\AWS BY Creation\Little-Shop-Dharapuram"

# Import schema
mysql -u root -p littleshop_db < backend/database/schema.sql

# Enter password when prompted
```

**✅ Verification**: Check tables created
```bash
mysql -u root -p
USE littleshop_db;
SHOW TABLES;
```

You should see 20+ tables including: `products`, `categories`, `users`, `orders`, `carts`, etc.

### 1.4 Create Database User (Recommended)
```sql
-- In MySQL
CREATE USER 'littleshop_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON littleshop_db.* TO 'littleshop_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify user
SELECT user FROM mysql.user;
EXIT;
```

---

## Step 2: Backend Configuration (Local)

### 2.1 Navigate to Backend Folder
```bash
cd backend
```

### 2.2 Install Dependencies
```bash
npm install
```

**⏳ This will take 2-5 minutes**

**✅ Verification**: Check node_modules folder created
```bash
dir node_modules
```

### 2.3 Configure Environment Variables
```bash
# Copy example file
copy .env.example .env

# Open .env in your code editor (VS Code)
code .env
```

**Edit these values in .env:**
```env
# Server
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# MySQL (use your credentials)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=littleshop_db

# Firebase (get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# Frontend
FRONTEND_URL=http://localhost:5173
```

**🔥 How to Get Firebase Private Key:**
1. Go to https://console.firebase.google.com
2. Select your project
3. Click gear icon ⚙️ → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate new private key"
6. Download JSON file
7. Open JSON file and copy:
   - `project_id`
   - `client_email`
   - `private_key` (entire value including BEGIN/END lines)

**⚠️ IMPORTANT**: The private_key must have actual newlines (\n) not the characters \ and n

### 2.4 Start Backend Server
```bash
# Development mode with auto-restart
npm run dev

# OR production mode
npm start
```

**✅ Verification**: You should see:
```
✅ MySQL Database connected successfully
🚀 Server running on port 5000
📁 Environment: development
🔗 API Base URL: http://localhost:5000/api/v1
📊 Health Check: http://localhost:5000/health
```

### 2.5 Test Backend APIs
```bash
# Open new terminal (don't close server terminal)

# Test health endpoint
curl http://localhost:5000/health

# Test products endpoint
curl http://localhost:5000/api/v1/products

# Test categories
curl http://localhost:5000/api/v1/categories
```

**✅ All should return JSON with `"success": true`**

---

## Step 3: Firebase Authentication Setup

### 3.1 Verify Firebase Project Settings
1. Go to https://console.firebase.google.com
2. Select your project
3. Click "Authentication" in left sidebar
4. Click "Sign-in method" tab
5. **Enable Google**: Click Google → Enable → Save
6. **Add Authorized Domains**:
   - Click "Settings" (gear icon)
   - Go to "Authorized domains" tab
   - Add these domains:
     - `localhost`
     - `127.0.0.1`
     - `your-domain.com` (your GoDaddy domain)

### 3.2 Get Firebase Config for Frontend
1. In Firebase Console → Project Settings
2. Go to "General" tab
3. Scroll to "Your apps" section
4. Click web app (</> icon)
5. Copy the config object

**It looks like:**
```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123"
}
```

### 3.3 Update Frontend .env
```bash
# In project root
code .env
```

**Add/Update:**
```env
VITE_FIREBASE_CONFIG={"apiKey":"AIzaSy...","authDomain":"your-project.firebaseapp.com","projectId":"your-project","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"1:123456789:web:abc123"}

# Backend API URL (local development)
VITE_API_URL=http://localhost:5000/api/v1
```

### 3.4 Test Firebase Login Locally
1. Start frontend: `npm run dev` (in project root)
2. Open browser: http://localhost:5173
3. Click "Login" or "Account"
4. Try Google login
5. **✅ Should login successfully**

---

## Step 4: Frontend Connection to Backend

### 4.1 Verify API Service is Imported Correctly
The file `src/services/api.js` should already be created. Check it exists:
```bash
dir src\services\api.js
```

### 4.2 Test Frontend-Backend Connection
1. Ensure backend is running (port 5000)
2. Ensure frontend is running (port 5173)
3. Open browser dev tools (F12)
4. Go to "Console" tab
5. Refresh page
6. **Look for any red errors**

### 4.3 Test API Calls
In browser console, test:
```javascript
// This should work if everything is connected
fetch('http://localhost:5000/api/v1/products')
  .then(r => r.json())
  .then(data => console.log(data));
```

**✅ Should return products array**

### 4.4 Fix CORS Issues (if any)
If you see CORS errors in console:
1. Check backend `.env` has correct `FRONTEND_URL`
2. Restart backend server
3. Clear browser cache (Ctrl+Shift+R)

---

## Step 5: File Upload System Setup

### 5.1 Create Upload Directories
```bash
# In backend folder
mkdir uploads\products
mkdir uploads\categories
mkdir uploads\hero-banners
mkdir uploads\payment-proofs
mkdir uploads\testimonials
```

### 5.2 Test File Upload API
```bash
# Test with curl (replace with actual image path)
curl -X POST http://localhost:5000/api/v1/uploads/product-image \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "file=@test-image.jpg"
```

**Get Firebase Token:**
1. Login to app in browser
2. Open Dev Tools → Console
3. Run:
```javascript
firebase.auth().currentUser.getIdToken().then(token => console.log(token))
```
4. Copy the long string token

### 5.3 Verify Upload Directory Permissions
On Windows, ensure these folders have write permissions:
- `backend/uploads/`
- All subfolders

---

# 🌐 PHASE 2: GODADDY HOSTING DEPLOYMENT

## Step 6: Prepare for Production

### 6.1 Build Frontend for Production
```bash
# In project root (not backend)
npm run build
```

**✅ Verification**: Check `dist` folder created with index.html and assets

### 6.2 Prepare Backend for Production
```bash
cd backend

# Install production dependencies only
npm install --production

# Create production .env file
copy .env .env.production

# Edit .env.production
```

**Production .env values:**
```env
NODE_ENV=production
PORT=5000
BASE_URL=https://your-domain.com

# GoDaddy MySQL (will get from cPanel)
DB_HOST=localhost
DB_USER=your_godaddy_db_user
DB_PASSWORD=your_godaddy_db_password
DB_NAME=your_godaddy_db_name

# Firebase (same as local)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Production frontend
FRONTEND_URL=https://your-domain.com
```

---

## Step 7: GoDaddy Hosting Setup

### 7.1 Login to GoDaddy cPanel
1. Go to https://godaddy.com
2. Login to your account
3. Go to "My Products"
4. Click "Web Hosting" → "Manage"
5. Click "cPanel Admin"

### 7.2 Create MySQL Database in cPanel
1. In cPanel, find "Databases" section
2. Click "MySQL Database Wizard"
3. **Step 1**: Enter database name → `littleshop_db` → Next
4. **Step 2**: Create database user:
   - Username: `littleshop_user`
   - Password: (generate strong password, SAVE IT!)
   - Click "Create User"
5. **Step 3**: Add user to database
   - Select user: `littleshop_user`
   - Select database: `littleshop_db`
   - Check "ALL PRIVILEGES"
   - Click "Make Changes"

**✅ Write down these credentials:**
- Database Name: (prefix)_littleshop_db
- Username: (prefix)_littleshop_user
- Password: (the one you created)
- Host: localhost

### 7.3 Import Database Schema via cPanel
1. In cPanel, click "phpMyAdmin"
2. Select your database from left sidebar
3. Click "Import" tab
4. Click "Choose File"
5. Select `backend/database/schema.sql`
6. Click "Go"

**✅ Verification**: Tables should appear in left sidebar

### 7.4 Setup Node.js in GoDaddy
1. In cPanel, find "Software" section
2. Click "Setup Node.js App"
3. Click "Create Application"
4. Fill form:
   - **Node.js version**: 18.x or 20.x
   - **Application root**: `backend`
   - **Application URL**: `https://your-domain.com`
   - **Application startup file**: `server.js`
   - **Environment variables**: Click "Add Variable"
     - Add all from your .env file
5. Click "Create"

### 7.5 Upload Files via File Manager
1. In cPanel, click "File Manager"
2. Navigate to `public_html`
3. **Upload Frontend**:
   - Click "Upload" button
   - Select all files from your local `dist` folder
   - Upload
4. **Upload Backend**:
   - Create folder: `backend`
   - Navigate into `backend`
   - Upload all backend files (excluding node_modules)
   - Upload package.json, server.js, app.js, etc.
   - Upload config/, controllers/, middleware/, routes/ folders
   - Upload .env file

**⚠️ DO NOT upload:**
- node_modules (will install on server)
- .git folder
- Local development files

### 7.6 Install Backend Dependencies on Server
1. In cPanel, find "Terminal" (or use SSH)
2. Or use "Setup Node.js App" → "Run NPM Install"

**Via SSH/Terminal:**
```bash
# SSH into GoDaddy (get credentials from cPanel)
ssh username@your-domain.com

cd backend
npm install --production
```

### 7.7 Start Backend Server
In GoDaddy Node.js setup:
1. Go back to "Setup Node.js App"
2. Find your application
3. Click "Run NPM Install" (if not done)
4. Click "Restart"

**✅ Verification**: Check logs for "Server running" message

---

## Step 8: Domain and SSL Configuration

### 8.1 Connect Domain (if not done)
1. GoDaddy should already have your domain connected
2. If using external domain:
   - Point A record to GoDaddy server IP
   - Point CNAME www to @

### 8.2 Enable SSL (HTTPS)
1. In cPanel, find "Security" section
2. Click "SSL/TLS Status"
3. Click "AutoSSL"
4. Click "Run AutoSSL"

**✅ Wait 5-10 minutes for SSL to propagate**

### 8.3 Verify HTTPS
Open: `https://your-domain.com`
Should show green lock icon 🔒

---

## Step 9: Firebase Production Configuration

### 9.1 Add Production Domain to Firebase
1. Go to Firebase Console → Authentication
2. Click "Settings" → "Authorized domains"
3. Click "Add domain"
4. Enter: `your-domain.com`
5. Click "Add"
6. Also add: `www.your-domain.com`

### 9.2 Update Frontend Firebase Config
In your deployed frontend, verify:
```javascript
// In browser console
console.log(firebase.auth().app.options.authDomain)
// Should show: your-project.firebaseapp.com
```

---

## Step 10: Final Testing

### 10.1 Test Checklist

**Website Loading:**
- [ ] Homepage loads without errors
- [ ] CSS/JS loading correctly
- [ ] Images displaying
- [ ] No console errors (F12)

**Authentication:**
- [ ] Google login works
- [ ] Login persists after refresh
- [ ] Logout works
- [ ] Protected pages require login

**Products:**
- [ ] Product list displays
- [ ] Product details page works
- [ ] Categories filter works
- [ ] Search works
- [ ] Images load

**Cart:**
- [ ] Add to cart works
- [ ] Cart page shows items
- [ ] Quantity update works
- [ ] Remove item works
- [ ] Cart persists (localStorage)

**Checkout:**
- [ ] Checkout page loads
- [ ] Address selection works
- [ ] Order creation works
- [ ] Order confirmation shows

**Admin (if applicable):**
- [ ] Admin login works
- [ ] Product CRUD works
- [ ] Order management works
- [ ] Image uploads work

### 10.2 API Testing Commands
```bash
# Test backend health
curl https://your-domain.com/health

# Test products
curl https://your-domain.com/api/v1/products

# Test categories
curl https://your-domain.com/api/v1/categories
```

---

# 🔧 TROUBLESHOOTING GUIDE

## Problem 1: MySQL Connection Error
**Symptoms:** Backend shows "Failed to connect to database"

**Solution:**
```bash
# 1. Verify MySQL is running
sudo service mysql status

# 2. Check credentials in .env
# 3. Test connection manually
mysql -u YOUR_USER -p -e "USE littleshop_db; SHOW TABLES;"

# 4. Check firewall (on GoDaddy, MySQL usually only accepts localhost)
# 5. Verify database user has proper permissions
```

## Problem 2: Node.js Server Won't Start
**Symptoms:** `npm start` fails with error

**Solution:**
```bash
# 1. Check port availability
lsof -i :5000

# 2. Kill process if needed
kill -9 $(lsof -ti:5000)

# 3. Check .env file exists and is valid
# 4. Check node_modules exists
npm install

# 5. Check for syntax errors
node -c server.js
```

## Problem 3: CORS Errors in Browser
**Symptoms:** Console shows "CORS policy" errors

**Solution:**
1. Check backend `.env` FRONTEND_URL matches actual frontend URL
2. Restart backend server
3. Clear browser cache (Ctrl+Shift+R)
4. Check backend/app.js CORS configuration

## Problem 4: Firebase Auth Fails
**Symptoms:** Google login doesn't work

**Solution:**
1. Verify domain is in Firebase Authorized Domains
2. Check Firebase config in frontend .env
3. Verify private_key in backend .env has correct format
4. Check Firebase Console → Authentication → Sign-in providers

## Problem 5: File Upload Fails
**Symptoms:** 500 error when uploading images

**Solution:**
```bash
# 1. Check upload directories exist
ls -la backend/uploads/

# 2. Check permissions
chmod 755 backend/uploads
chmod 755 backend/uploads/*

# 3. Check disk space
df -h

# 4. Check file size limits
# In backend .env: MAX_FILE_SIZE=5242880
```

## Problem 6: 500 Internal Server Error
**Symptoms:** API returns 500 status

**Solution:**
1. Check backend logs
2. Look for:
   - Database connection errors
   - Undefined variables
   - Missing environment variables
   - Syntax errors

## Problem 7: Frontend Not Connecting to Backend
**Symptoms:** Frontend shows "API not reachable"

**Solution:**
1. Check `VITE_API_URL` in frontend .env
2. Verify backend is running: `curl YOUR_API_URL/health`
3. Check firewall (port 5000 must be open)
4. Verify CORS settings

---

# 📊 MAINTENANCE & MONITORING

## Daily Checks
```bash
# Check server status
pm2 status

# Check logs
pm2 logs

# Check disk space
df -h
```

## Weekly Tasks
- [ ] Review error logs
- [ ] Check database backups
- [ ] Monitor API response times
- [ ] Update dependencies if needed

## Backup Strategy
```bash
# Database backup
mysqldump -u root -p littleshop_db > backup_$(date +%Y%m%d).sql

# File backup
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

## Security Updates
- [ ] Keep Node.js updated
- [ ] Update npm packages monthly
- [ ] Monitor Firebase security alerts
- [ ] Review admin access logs

---

# 🎉 SUCCESS CHECKLIST

- [ ] Backend running on GoDaddy
- [ ] Frontend accessible via domain
- [ ] HTTPS working (SSL)
- [ ] MySQL database connected
- [ ] Firebase auth working
- [ ] Products displaying
- [ ] Cart functional
- [ ] Orders creating
- [ ] Admin panel working
- [ ] Image uploads working
- [ ] Mobile responsive
- [ ] No console errors
- [ ] API responding < 500ms

**🚀 DEPLOYMENT COMPLETE!**

Your website is now fully functional with:
- ✅ Node.js + Express backend
- ✅ MySQL database
- ✅ Firebase Authentication
- ✅ GoDaddy hosting
- ✅ No Supabase dependency

---

## 📞 Need Help?

**Backend Issues:**
- Check logs: `pm2 logs`
- Test API: `curl https://your-domain.com/health`

**Database Issues:**
- Test connection: `mysql -u USER -p -e "SHOW DATABASES;"`

**Firebase Issues:**
- Check console: https://console.firebase.google.com

**Hosting Issues:**
- Check GoDaddy cPanel logs
- Verify file permissions
