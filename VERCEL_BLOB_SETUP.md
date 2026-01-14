# Vercel Blob Storage Setup Guide

## Overview
This project uses Vercel Blob Storage for image uploads. All images are uploaded to Vercel Blob and the URLs are stored in MongoDB.

## Setup Steps

### 1. Create Blob Store in Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database/Store**
4. Select **Blob** from the options
5. Give it a name (e.g., "gameon-images")
6. Select a region close to your users
7. Click **Create**

### 2. Environment Variables
Vercel automatically provides the `BLOB_READ_WRITE_TOKEN` environment variable when you create a Blob store. However, you should verify it's set:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Verify `BLOB_READ_WRITE_TOKEN` is present (it should be automatically added)

### 3. How It Works

#### Upload Flow
1. User selects an image file
2. Frontend sends the file to `/api/games/upload-image`, `/api/users/upload-image`, or `/api/reports/upload-image`
3. API route:
   - Validates the file (type, size)
   - Converts File to Buffer
   - Uploads to Vercel Blob using `put()` function
   - Returns the permanent URL
4. Frontend stores the URL in the database

#### Image Display
- Images are displayed using Next.js `Image` component
- External URLs (from Vercel Blob) use `unoptimized={true}` to bypass Next.js optimization
- Error handling falls back to placeholder images if loading fails

### 4. File Structure
Images are organized in folders:
- `games/` - Game images
- `profiles/` - User profile pictures
- `reports/` - Report evidence images

### 5. Security
- File type validation: Only JPEG, PNG, WebP, GIF allowed
- File size limit: 5MB maximum
- Authentication required for all upload endpoints
- CSP headers configured to allow images from Vercel Blob domains

### 6. Troubleshooting

#### Images Not Uploading
1. Check that `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables
2. Verify the Blob store is created and active
3. Check browser console for errors
4. Check Vercel function logs for upload errors

#### Images Appearing Gray in Production
1. Verify CSP headers allow images from `*.public.blob.vercel-storage.com`
2. Check that `unoptimized` prop is set for external URLs
3. Verify image URLs are accessible (try opening in new tab)
4. Check browser console for CSP violations

#### CSP Errors
If you see CSP errors in console:
1. Check `next.config.mjs` for CSP header configuration
2. Ensure `img-src` includes `https:` and `blob:`
3. For development, `http://localhost:*` is also allowed

### 7. Testing
1. Upload a test image through the UI
2. Verify the URL is returned correctly
3. Check that the image displays properly
4. Verify the image persists after page reload

### 8. Cost Considerations
- Vercel Blob has a free tier with generous limits
- Monitor usage in Vercel dashboard
- Consider implementing image optimization/compression if needed

## API Endpoints

### POST /api/games/upload-image
Uploads a game image.

**Request:**
- FormData with `image` field (File)

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://xxx.public.blob.vercel-storage.com/..."
}
```

### POST /api/users/upload-image
Uploads a user profile picture.

**Request:**
- FormData with `image` field (File)

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://xxx.public.blob.vercel-storage.com/..."
}
```

### POST /api/reports/upload-image
Uploads a report evidence image.

**Request:**
- FormData with `image` field (File)

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://xxx.public.blob.vercel-storage.com/..."
}
```
