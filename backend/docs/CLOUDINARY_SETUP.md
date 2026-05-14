# Cloudinary Image Upload Integration – Setup & Deployment Guide

## 1. Environment Variables

Add these to your backend `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Get these from [Cloudinary Console → Dashboard](https://console.cloudinary.com/).

## 2. NPM Install

Run inside `backend/`:

```bash
npm install
```

This installs `cloudinary` (already listed in `package.json`).

## 3. How It Works

| Step | What happens |
|------|--------------|
| Admin selects image in frontend | Existing image picker UI stays unchanged |
| Frontend sends `FormData` | Same as before, no UI changes |
| `upload.middleware.js` (multer) | Validates file type (JPEG, PNG, GIF, WebP, SVG) & size (≤5MB). Stores in **memory** (no temp disk writes) |
| `upload.controller.js` | Receives buffer, calls `cloudinary.service.js` |
| `cloudinary.service.js` | Pre-compresses via `sharp` → streams to Cloudinary via upload stream |
| Cloudinary returns `secure_url` | URL is saved in MySQL (`products.images` JSON, `products.featured_image` VARCHAR) |
| Frontend displays image | Uses the Cloudinary URL directly; no local file serving needed |

## 4. Backend File Changes Summary

- **`backend/config/cloudinary.js`** – SDK config with secure mode.
- **`backend/services/cloudinary.service.js`** – Upload, delete, URL optimization, `extractPublicId`, `getOptimizedUrl`, `getSrcSet`.
- **`backend/middleware/upload.middleware.js`** – Multer memoryStorage + validation wrapper with proper error messages.
- **`backend/controllers/upload.controller.js`** – Refactored to Cloudinary; same JSON response shape.
- **`backend/controllers/product.controller.js`** – `createProduct` & `updateProduct` now accept direct file uploads (multipart) in addition to JSON URLs. `deleteProduct` can optionally clean up Cloudinary images via `?cleanupImages=true`.
- **`backend/routes/upload.routes.js`** – Added multer middleware before controllers.
- **`backend/app.js`** – CSP `imgSrc` updated to allow `*.cloudinary.com` & `res.cloudinary.com`.

## 5. API Endpoints

All existing endpoints preserved. New behavior:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/uploads/single` | Upload single image → returns Cloudinary URL |
| POST | `/api/v1/uploads/multiple` | Upload up to 10 images |
| POST | `/api/v1/uploads/product-image` | Upload product image with eager transforms |
| POST | `/api/v1/uploads/category-image` | Upload category image |
| POST | `/api/v1/uploads/banner` | Upload banner (desktop + mobile eager) |
| POST | `/api/v1/uploads/payment-proof` | Upload payment proof |
| DELETE | `/api/v1/uploads/:filename` | Delete image from Cloudinary |

## 6. Image Optimization (Automatic)

Cloudinary delivers images with:
- **`f_auto`** – Serves WebP/AVIF when browser supports it.
- **`q_auto`** – Automatic quality compression.
- **Eager transforms** – Pre-generated 600×600, 1200×1200, 300×300 for products.

Use `getOptimizedUrl(url, { width, height })` in frontend or backend to build responsive URLs.

## 7. GoDaddy / VPS Deployment Recommendations

1. **Node.js Process Manager**
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name "little-shop-api"
   pm2 startup
   pm2 save
   ```

2. **Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   server {
       listen 443 ssl;
       server_name yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           client_max_body_size 10M;
       }
   }
   ```

3. **No local upload folder needed** – All images are on Cloudinary. You can remove `backend/uploads` from the server entirely.

4. **Security**
   - Keep `CLOUDINARY_API_SECRET` private; never expose it in frontend.
   - Restrict upload presets in Cloudinary console if needed.
   - Use signed uploads for extra security (advanced).

5. **Performance**
   - Cloudinary's CDN delivers images globally with edge caching.
   - Use `getOptimizedUrl()` for responsive sizing instead of serving full-resolution images.
   - Enable HTTP/2 in Nginx for faster asset loading.

## 8. Zero Frontend Changes

- Existing frontend image picker, product forms, and display logic **remain exactly the same**.
- Frontend receives Cloudinary URLs in the same JSON shape (`data.url`, `data.fullUrl`).
- If you ever need to switch image sources, only backend configuration changes.

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cloudinary environment variables missing` warning | Add `CLOUDINARY_*` keys to `.env` |
| File too large error | Reduce image size or increase `MAX_FILE_SIZE` in `.env` |
| Invalid file type | Only JPEG, JPG, PNG, GIF, WebP, SVG allowed |
| Images not showing on frontend | Check CSP in `app.js` includes `*.cloudinary.com` |

---

**Status:** Integration complete. Run `npm install` in `backend/` and add your Cloudinary credentials to `.env` to activate.
