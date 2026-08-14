# Cloudinary Media Migration Guide

This document outlines the migration from MongoDB data URLs to **Cloudinary** for all media storage in the STUN-FI Skins application.

## Overview

All media (images, designs, uploads) are now stored exclusively in **Cloudinary**. The application no longer stores binary data or data URLs in MongoDB - only Cloudinary URLs are stored.

### Benefits:
- ✅ Reduced MongoDB storage usage
- ✅ Faster image delivery via CDN
- ✅ Automatic image optimization
- ✅ Easier media management and deletion
- ✅ Better scalability for large files
- ✅ Reduced database payload size

## Setup Instructions

### 1. Cloudinary Account Setup

If you don't have a Cloudinary account:
1. Sign up at [https://cloudinary.com](https://cloudinary.com)
2. Create a free account (includes generous free tier)
3. Navigate to **Dashboard > Settings > API Keys**
4. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Environment Configuration

Add your Cloudinary credentials to `.env`:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**⚠️ Important:** All three variables are **REQUIRED**. The application will fail to start without them.

### 3. Verify Setup

Test your Cloudinary configuration by starting the server:

```bash
cd Backend
npm install
npm start
```

If Cloudinary is not properly configured, you'll see an error message with the missing variables.

## API Endpoints

### Order Management (Existing)

#### POST `/api/orders`
Create a new order with file uploads.

**Request:**
```
Content-Type: multipart/form-data
- orderPayload: JSON string with order data
- files: Image files (JPEG, PNG, WebP, GIF)
```

**Constraints:**
- Max file size: 10MB per file
- Max files: 10 per upload
- Allowed formats: JPEG, PNG, WebP, GIF

**Response:**
```json
{
  "success": true,
  "orderId": "STN-1234",
  "order": { /* order object */ }
}
```

#### GET `/api/orders`
Fetch all orders with optional filters.

#### GET `/api/orders/:orderId`
Fetch a specific order.

#### PATCH `/api/orders/:orderId/status`
Update order status.

#### DELETE `/api/orders/:orderId`
Delete an order (does NOT delete Cloudinary media).

### Media Management (New)

#### DELETE `/api/orders/media/:mediaId`
Delete a specific media file from Cloudinary by its public ID.

**Example:**
```bash
DELETE /api/orders/media/stunfi-skins%2Fdesigns%2Fabc123
```

#### DELETE `/api/orders/media/url/:encodedUrl`
Delete a media file by passing its Cloudinary URL (must be URL-encoded).

**Example:**
```bash
DELETE /api/orders/media/url/https%3A%2F%2Fres.cloudinary.com%2Fcloud-name%2Fimage%2Fupload%2Fv123%2Fstunfi-skins%2Fdesigns%2Fabc123.jpg
```

#### GET `/api/orders/media/list`
List all media files in the `stunfi-skins` folder.

**Response:**
```json
{
  "success": true,
  "count": 42,
  "media": [
    {
      "publicId": "stunfi-skins/designs/abc123",
      "url": "https://res.cloudinary.com/...",
      "format": "jpg",
      "width": 1920,
      "height": 1080,
      "bytes": 524288,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST `/api/orders/media/optimize`
Get an optimized URL for responsive images.

**Request:**
```json
{
  "url": "https://res.cloudinary.com/.../image.jpg",
  "width": 400,
  "height": 300,
  "quality": "auto",
  "format": "auto",
  "fit": "scale"
}
```

**Response:**
```json
{
  "success": true,
  "originalUrl": "https://res.cloudinary.com/.../image.jpg",
  "optimizedUrl": "https://res.cloudinary.com/.../c_scale,h_300,q_auto,w_400/image.jpg"
}
```

## File Validation

All uploaded files are validated against these constraints:

### Allowed MIME Types
- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/webp` (.webp)
- `image/gif` (.gif)

### Size Limits
- Individual orders: Max 10MB per file
- Wholesale orders: Max 15MB per file
- Maximum 10 files per upload

### Error Handling
If validation fails, the API returns a 400 error with details:

```json
{
  "success": false,
  "error": "Invalid file type: application/pdf. Allowed types: JPEG, PNG, WebP, GIF"
}
```

## Code Examples

### JavaScript/Node.js - Create Order with Files

```javascript
const formData = new FormData();

// Add order data
formData.append('orderPayload', JSON.stringify({
  mode: 'individual',
  clientName: 'John Doe',
  deviceModel: 'MacBook Pro',
  category: 'Laptop Wrap',
  surfaces: [
    { name: 'top-lid', imageUrl: '' },
  ],
  items: [],
}));

// Add image file
const fileInput = document.querySelector('input[type="file"]');
formData.append('files', fileInput.files[0]);

// Submit
const response = await fetch('/api/orders', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Order created:', data.orderId);
```

### Delete Media by URL

```javascript
const mediaUrl = 'https://res.cloudinary.com/cloud/image/upload/v123/stunfi-skins/designs/abc.jpg';
const encodedUrl = encodeURIComponent(mediaUrl);

const response = await fetch(`/api/orders/media/url/${encodedUrl}`, {
  method: 'DELETE',
});

const data = await response.json();
if (data.success) {
  console.log('Media deleted:', data.publicId);
}
```

### Get Optimized Image URL

```javascript
const response = await fetch('/api/orders/media/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://res.cloudinary.com/cloud/image/upload/v123/stunfi-skins/designs/abc.jpg',
    width: 300,
    height: 200,
    quality: 'auto',
    format: 'webp',
  }),
});

const data = await response.json();
console.log('Optimized URL:', data.optimizedUrl);
```

## Cloudinary Features & URL Transformations

Cloudinary URLs support on-the-fly transformations. The `media/optimize` endpoint uses these patterns:

### Common Transformations

**Responsive Image (Width & Height):**
```
/upload/w_400,h_300,c_scale/
```

**Format Conversion (Auto-optimal):**
```
/upload/f_auto,q_auto/
```

**Quality Optimization:**
```
/upload/q_80/   (80% quality)
/upload/q_auto/ (auto-optimal based on browser)
```

**Crop & Fit Options:**
- `c_scale` - Scale to fit
- `c_fill` - Fill and crop
- `c_fit` - Intelligent fit

### Direct Cloudinary Documentation
For advanced transformations, see: [Cloudinary URL Transformations](https://cloudinary.com/documentation/image_transformation_reference)

## Frontend Integration

### Using Cloudinary URLs in Images

No special changes needed! Use Cloudinary URLs like any regular image URL:

```jsx
<img 
  src="https://res.cloudinary.com/cloud/image/upload/v123/stunfi-skins/designs/abc.jpg"
  alt="Design preview"
  loading="lazy"
  decoding="async"
/>
```

### Responsive Images with `srcset`

```jsx
<img
  src="https://res.cloudinary.com/cloud/image/upload/w_800/stunfi-skins/designs/abc.jpg"
  srcSet={`
    https://res.cloudinary.com/cloud/image/upload/w_400/stunfi-skins/designs/abc.jpg 400w,
    https://res.cloudinary.com/cloud/image/upload/w_800/stunfi-skins/designs/abc.jpg 800w,
    https://res.cloudinary.com/cloud/image/upload/w_1600/stunfi-skins/designs/abc.jpg 1600w
  `}
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Design"
/>
```

## Monitoring & Management

### Via Cloudinary Dashboard
1. Visit [https://cloudinary.com/console/media_library](https://cloudinary.com/console/media_library)
2. Browse all uploaded media
3. View storage usage and bandwidth
4. Delete files individually

### Via API
Use the `/api/orders/media/list` endpoint to programmatically fetch all media files.

## Migration Notes

### Existing Data
- Previously stored data URLs in MongoDB are **no longer valid**
- To migrate existing data, contact support or manually re-upload media
- New orders will automatically use Cloudinary

### Database Cleanup (Optional)
If you want to clean up old data URLs from MongoDB:

```javascript
// Clear all data URLs from orders
db.orders.updateMany(
  { "surfaces.imageUrl": /^data:/ },
  { $set: { "surfaces.imageUrl": "" } }
)
```

## Troubleshooting

### Error: "Missing required Cloudinary environment variables"
**Solution:** Ensure all three variables are in your `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value
CLOUDINARY_API_SECRET=your_value
```

### Error: "Failed to upload file"
**Solution:** Check:
1. File type is JPEG, PNG, WebP, or GIF
2. File size is under 10MB (or 15MB for wholesale)
3. Cloudinary credentials are correct
4. Network connectivity is working

### Error: "File too large"
**Solution:** Compress the image before uploading or split into multiple files. Use online tools like TinyPNG or ImageOptim.

### Images not loading in frontend
**Solution:** Ensure the Cloudinary URL is:
1. Correct (check in MongoDB or API response)
2. Not expired (Cloudinary URLs don't expire)
3. Accessible by browser (check CORS if needed)

## Support & Resources

- **Cloudinary Documentation:** https://cloudinary.com/documentation
- **Cloudinary API Reference:** https://cloudinary.com/documentation/image_upload_api_reference
- **Upload Widget:** https://cloudinary.com/documentation/upload_widget
- **Free Tier Limits:** https://cloudinary.com/pricing

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Media Storage | MongoDB (data URLs) | Cloudinary (URLs) |
| File Size Limit | N/A | 10-15MB |
| Database Size | Large | Small (only URLs) |
| Delivery Speed | Slower | Faster (CDN) |
| Image Optimization | Manual | Automatic |
| Media Deletion | Manual from DB | API endpoint |

---

**Last Updated:** 2024
**Status:** Active
