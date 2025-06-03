# Arclead Entertainment Website

This website has been migrated from Firebase to Cloudflare Pages with R2 Bucket storage.

## Migration Overview

The site has been converted from Firebase to use:
- **Cloudflare Pages** for hosting
- **R2 Bucket** for asset storage (images, videos, etc.) and data storage
- **Cloudflare Workers** for backend API functionality and image serving
- **Admin Panel** for R2 bucket management and artist management

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

### 5. Deploy to Cloudflare Pages
1. Connect your repository to Cloudflare Pages
2. Set build output directory to `.` (root)
3. Configure your R2 bindings and environment variables
4. Deploy!

## Admin Panel Features

### 🎛️ Access Admin Panels
- **File Management**: Visit `/admin.html` to access the R2 Bucket management interface
- **Artist Management**: Visit `/admin-artists.html` to manage artists and their filmography

### 📁 File Management (`/admin.html`)
- **View all files** in R2 bucket with thumbnails
- **Upload new files** with custom paths
- **Delete files** individually
- **Replace files** with new versions
- **File information** (size, last modified, etc.)

### 🎭 Artist Management (`/admin-artists.html`)
- **Add new artists** with photos and filmography
- **Edit existing artists** and their information
- **Delete artists** and all associated images
- **Dynamic filmography** management (movies, dramas, commercials)
- **Image gallery** for each artist
- **Import/Export** artist data
- **Statistics** and overview

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

### Data Storage
- **All data stored in R2 Bucket** as JSON files
- **Artist data**: Stored as `artists-data.json` in R2
- **Images**: Organized in folders like `artists/{artist-id}/`
- **No external database required**

### Image Serving via Worker
- **No custom domain needed!** 🎉
- All images are served through the Worker at `/assets/` endpoint
- Examples:
  - `/assets/logo-horizon-arclead.png` → R2: `logo-horizon-arclead.png`
  - `/assets/slides/1.png` → R2: `slides/1.png`
  - `/assets/artists/{artist-id}/{image}` → R2: `artists/{artist-id}/{image}`

### Artist System
- **Dynamic artist pages**: `/artist.html?id={artist-id}`
- **Grid-based artist listing**: `/artists-all.html`
- **Comprehensive admin interface**: `/admin-artists.html`
- **Automatic image management**: Images stored in organized R2 folders

### Benefits:
- ✅ **No CORS issues** - Same domain serving
- ✅ **No external database required** - All data in R2
- ✅ **No custom domain setup required**
- ✅ **Automatic caching** with ETag support
- ✅ **Proper Content-Type headers**
- ✅ **24-hour browser cache**
- ✅ **Easy management** via admin panels
- ✅ **Scalable data storage** in R2

## File Structure Changes

### Removed:
- All Firebase SDK imports and configurations
- Firebase Storage and Database integration
- Need for R2 custom domain setup
- Manual file upload process
- KV Storage dependency

### Added:
- `_worker.js` - Cloudflare Pages Functions for API endpoints and image serving
- `admin.html` - R2 Bucket management interface
- `admin-artists.html` - Artist management interface
- `artist.html` - Dynamic artist page template
- R2 bucket integration for all assets and data via Worker proxy
- Auto-sync functionality from local files
- Complete artist management system

### Modified:
- `index.html` - Updated to use `/assets/` paths for all images
- `artists-all.html` - Updated to dynamic grid loading from API
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
- `POST /admin/replace` - Replace existing file
- `DELETE /admin/files/{key}` - Delete specific file
- `POST /admin/sync` - Auto-sync local files to R2
- `DELETE /admin/clear` - Clear all files from bucket

### Artist API
- `GET /api/artists` - Get all artists
- `GET /api/artists/{id}` - Get specific artist
- `POST /api/artists` - Create new artist
- `PUT /api/artists/{id}` - Update artist
- `DELETE /api/artists/{id}` - Delete artist

### Public API Routes  
- `GET /api/slides` - Returns slide text data
- `POST /api/contact` - Handles contact form submissions

## Features

- **Dynamic Artist System**: Complete CRUD operations for artists
- **Image Management**: All images served from R2 via Worker proxy
- **Contact Forms**: Processed by Cloudflare Workers
- **Slide Management**: Dynamic slide text loading via API
- **Email Integration**: Optional MailChannels integration for contact forms
- **Performance**: Automatic caching and optimization
- **Admin Interfaces**: Easy R2 bucket and artist management
- **Auto Sync**: One-click upload from local files
- **Pure R2 Storage**: No external database dependencies

## Development

To modify slide data, edit the `slideData` object in `_worker.js`. For artists, use the admin panel at `/admin-artists.html`.

## Quick Start Guide

1. **Deploy to Cloudflare Pages** (connect GitHub repo)
2. **Configure R2 binding** (`ARCLEAD_ASSETS` → `arclead`)
3. **Visit `/admin.html`**
4. **Click "🔄 Auto Sync from Local"**
5. **Visit `/admin-artists.html`** to add artists
6. **Done!** Your site is fully functional

## Data Storage Structure

### R2 Bucket Structure:
```
arclead/
├── artists-data.json           # All artist data
├── logo-horizon-arclead.png    # Site assets
├── favicon-arclead.ico
├── slides/
│   ├── 1.png
│   ├── 2.png
│   └── ...
└── artists/
    ├── kim-sigyeong/
    │   ├── profile1.jpg
    │   └── profile2.jpg
    └── other-artist/
        └── images...
```

## Troubleshooting

1. **Images not loading**: 
   - Check R2 bucket binding is configured correctly
   - Use admin panel to verify files are uploaded
   - Check browser console for 404 errors

2. **Artist data not saving**:
   - Verify R2 binding (`ARCLEAD_ASSETS`) is properly configured
   - Check Cloudflare Workers logs for errors
   - Ensure bucket has write permissions

3. **Auto sync not working**:
   - Verify R2 binding is properly configured
   - Check that local files exist in `img/` folders
   - Use admin panel to manually upload if needed

4. **Admin panel errors**: 
   - Check Cloudflare Workers logs in dashboard
   - Verify R2 permissions are correctly set

5. **API errors**: Check Cloudflare Workers logs in dashboard

6. **Contact form not working**: Verify environment variables are set

---

**Technical Configuration:**

- **R2 Bucket**: `arclead`
- **R2 Binding Variable**: `ARCLEAD_ASSETS`
- **Data Storage**: Pure R2 (no KV required)
- **Image Serving**: Worker proxy at `/assets/`
- **Artist Data**: JSON file in R2 (`artists-data.json`)

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


