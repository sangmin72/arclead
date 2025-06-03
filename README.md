# Arclead Entertainment Website

This website has been migrated from Firebase to Cloudflare Pages with R2 Bucket storage.

## Migration Overview

The site has been converted from Firebase to use:
- **Cloudflare Pages** for hosting
- **R2 Bucket** for asset storage (images, videos, etc.)
- **Cloudflare Workers** for backend API functionality and image serving
- **KV Storage** for contact form data (optional)
- **Admin Panel** for R2 bucket management

## Setup Instructions

You need to complete the following setup steps in Cloudflare:

### 1. R2 Bucket Setup
Your R2 bucket is named: **`arclead`**

### 2. Upload Assets to R2 (Automatic!)
**🚀 No manual upload needed!** Use the admin panel's auto-sync feature:

1. Go to `/admin.html` after deployment
2. Click "🔄 Auto Sync from Local" 
3. All files will be automatically uploaded to R2 with correct paths

**Files that will be uploaded:**
- **Root level**: `logo-horizon-arclead.png`, `favicon-arclead.ico`, `envelope.png`, etc.
- **`/slides/` folder**: `1.png` ~ `13.png` (from `img/bg-img/1.jpg` ~ `13.jpg`)
- **`/artists/` folder**: `1.png` ~ `9.png` (from `img/bg-img/1.jpg` ~ `9.jpg`)

### 3. R2 Bucket Binding (You'll configure this yourself)
You'll need to bind the R2 bucket in Cloudflare Pages settings:
- Binding name: `ARCLEAD_ASSETS`
- Bucket name: `arclead`

### 4. Environment Variables (Optional)
Set these environment variables in Cloudflare Pages dashboard:
- `CONTACT_EMAIL`: Email address to receive contact form submissions

### 5. KV Storage (Optional)
If you want to store contact form submissions, create a KV namespace in Cloudflare dashboard and bind it to your Pages project.

### 6. Deploy to Cloudflare Pages
1. Connect your repository to Cloudflare Pages
2. Set build output directory to `.` (root)
3. Configure your R2 bindings and environment variables
4. Deploy!

## Admin Panel Features

### 🎛️ Access Admin Panel
Visit `/admin.html` to access the R2 Bucket management interface.

### 📁 File Management
- **View all files** in R2 bucket with thumbnails
- **Upload new files** with custom paths
- **Delete files** individually
- **File information** (size, last modified, etc.)

### 🔄 Auto Sync Features
- **Auto Sync from Local**: Automatically uploads all local files to R2
- **Smart Upload**: Skips files that already exist in R2
- **Batch Operations**: Upload multiple files at once
- **Clear Bucket**: Remove all files (with double confirmation)

### 🎯 Auto Sync File Mapping
The auto-sync feature automatically maps local files to R2 paths:

```
img/core-img/logo-horizon-arclead.png  →  logo-horizon-arclead.png
img/core-img/favicon.ico               →  favicon-arclead.ico
img/bg-img/1.jpg                       →  slides/1.png
img/bg-img/1.jpg                       →  artists/1.png
... and more
```

## How It Works

### Image Serving via Worker
- **No custom domain needed!** 🎉
- All images are served through the Worker at `/assets/` endpoint
- Examples:
  - `/assets/logo-horizon-arclead.png` → R2: `logo-horizon-arclead.png`
  - `/assets/slides/1.png` → R2: `slides/1.png`
  - `/assets/artists/1.png` → R2: `artists/1.png`

### Benefits:
- ✅ **No CORS issues** - Same domain serving
- ✅ **No custom domain setup required**
- ✅ **Automatic caching** with ETag support
- ✅ **Proper Content-Type headers**
- ✅ **24-hour browser cache**
- ✅ **Easy file management** via admin panel

## File Structure Changes

### Removed:
- All Firebase SDK imports and configurations
- Firebase Storage and Database integration
- Need for R2 custom domain setup
- Manual file upload process

### Added:
- `_worker.js` - Cloudflare Pages Functions for API endpoints and image serving
- `admin.html` - R2 Bucket management interface
- R2 bucket integration for all assets via Worker proxy
- Auto-sync functionality from local files

### Modified:
- `index.html` - Updated to use `/assets/` paths for all images
- `artists-all.html` - Updated image references to `/assets/` paths
- All image references changed from local/Firebase to Worker-served paths

## API Endpoints

The worker provides these endpoints:

### Image Assets
- `GET /assets/{path}` - Serves images from R2 bucket
  - Supports proper Content-Type headers
  - ETag caching for performance
  - 24-hour browser cache

### Admin API
- `GET /admin/files` - List all files in R2 bucket
- `POST /admin/upload` - Upload file to R2 bucket
- `DELETE /admin/files/{key}` - Delete specific file
- `POST /admin/sync` - Auto-sync local files to R2
- `DELETE /admin/clear` - Clear all files from bucket

### Public API Routes  
- `GET /api/slides` - Returns slide text data
- `POST /api/contact` - Handles contact form submissions

## Features

- **Image Loading**: All images served from R2 via Worker proxy
- **Contact Forms**: Processed by Cloudflare Workers
- **Slide Management**: Dynamic slide text loading via API
- **Email Integration**: Optional MailChannels integration for contact forms
- **Performance**: Automatic caching and optimization
- **Admin Interface**: Easy R2 bucket management
- **Auto Sync**: One-click upload from local files

## Development

To modify slide data, edit the `slideData` object in `_worker.js`. For a more dynamic solution, consider using Cloudflare D1 database or KV storage.

## Quick Start Guide

1. **Deploy to Cloudflare Pages** (connect GitHub repo)
2. **Configure R2 binding** (`ARCLEAD_ASSETS` → `arclead`)
3. **Visit `/admin.html`**
4. **Click "🔄 Auto Sync from Local"**
5. **Done!** Your site is fully functional

## Troubleshooting

1. **Images not loading**: 
   - Check R2 bucket binding is configured correctly
   - Use admin panel to verify files are uploaded
   - Check browser console for 404 errors

2. **Auto sync not working**:
   - Verify R2 binding is properly configured
   - Check that local files exist in `img/` folders
   - Use admin panel to manually upload if needed

3. **Admin panel errors**: 
   - Check Cloudflare Workers logs in dashboard
   - Verify R2 permissions are correctly set

4. **API errors**: Check Cloudflare Workers logs in dashboard

5. **Contact form not working**: Verify environment variables are set

---

**Original Theme Information:**

Thanks for downloading this theme!

## Other Useful Links

**ThemeWagon** is a great source for downloading free HTML templates built with the latest technology.

To download free templates, follow this link: https://themewagon.com/theme_tag/free/

Besides that, you can buy our premium templates for making your web development experience unforgettable.

Visit the store from here: https://themewagon.com/theme-categories/premium-templates/

Alternatively, here's our top most trending and selling items:

* [**Sparrow**](https://themewagon.com/themes/sparrow/) - A multipurpose template made with Bootstrap 4.1 and world's finest animation.
* [**Posh**](https://themewagon.com/themes/posh-html5-bootstrap-4-template/) - Bootstrap 4 template with a myriad number of ready-to-deploy sections. 
* [**Elixir**](https://themewagon.com/themes/elixir-elegant-html5-bootstrap-template-consultancy-agency-website/) - Bootstrap 4 agency template. Best for smooth animated scrolling. 
* [**Freya**](https://themewagon.com/themes/bootstrap-4-premium-interior-design-template-freya/) - Interior design template made with Bootstrap 4. 
* [**Reign Pro**](https://themewagon.com/themes/reign-pro-premium-corporate-agency-html5-template/) - A corporate template with a visually unique design scheme. 
* [**Boots4**](https://themewagon.com/themes/first-ever-bootstrap-4-template/) - One of the first Bootstrap 4 templates ever made on earth. 
* [**Hideaway**](https://themewagon.com/themes/hideaway/) - A template for resorts. Built with Bootstrap 4. 
* [**Baikal**](https://themewagon.com/themes/bootstrap-4-startup-small-business-website-template/) - A smart Bootstrap template for start-up. 
* [**Mega Discount**](https://themewagon.com/themes/mega-discount-bundle/) - A bundle of 26 HTML5 templates; best value for your money. 


