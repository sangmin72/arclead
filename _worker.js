// Cloudflare Pages Functions Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle admin routes
    if (url.pathname.startsWith('/admin/')) {
      return handleAdminRequest(request, env, url);
    }
    
    // Handle asset requests from R2
    if (url.pathname.startsWith('/assets/')) {
      return handleAssetRequest(request, env, url);
    }
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }
    
    // For all other requests, let Pages handle them normally
    return env.ASSETS.fetch(request);
  }
};

async function handleAdminRequest(request, env, url) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    switch (url.pathname) {
      case '/admin/files':
        return handleAdminFilesList(request, env, corsHeaders);
      case '/admin/upload':
        return handleAdminUpload(request, env, corsHeaders);
      case '/admin/replace':
        return handleAdminReplace(request, env, corsHeaders);
      case '/admin/sync':
        return handleAdminSync(request, env, corsHeaders);
      case '/admin/clear':
        return handleAdminClear(request, env, corsHeaders);
      default:
        if (url.pathname.startsWith('/admin/files/')) {
          return handleAdminFileDelete(request, env, url, corsHeaders);
        }
        return new Response('Not Found', { 
          status: 404, 
          headers: corsHeaders 
        });
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// List all files in R2 bucket
async function handleAdminFilesList(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const objects = await env.ARCLEAD_ASSETS.list();
    const files = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      lastModified: obj.uploaded,
      etag: obj.etag
    }));

    return new Response(JSON.stringify(files), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return new Response(JSON.stringify({ error: 'Failed to list files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Upload file to R2 bucket
async function handleAdminUpload(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path') || '';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Clean up the path
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const key = cleanPath ? `${cleanPath}/${file.name}` : file.name;

    // Upload to R2
    await env.ARCLEAD_ASSETS.put(key, file);

    return new Response(JSON.stringify({ 
      success: true, 
      key: key,
      message: `File uploaded successfully as ${key}` 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Delete file from R2 bucket
async function handleAdminFileDelete(request, env, url, corsHeaders) {
  if (request.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const key = decodeURIComponent(url.pathname.replace('/admin/files/', ''));
    
    if (!key) {
      return new Response(JSON.stringify({ error: 'No file key provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    await env.ARCLEAD_ASSETS.delete(key);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `File ${key} deleted successfully` 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Auto sync from local files
async function handleAdminSync(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    let uploaded = 0;
    let skipped = 0;

    // Define local files mapping to R2 paths
    const localFiles = [
      // Core images (root level)
      { local: 'img/core-img/logo-horizon-arclead.png', r2: 'logo-horizon-arclead.png' },
      { local: 'img/core-img/favicon.ico', r2: 'favicon-arclead.ico' },
      { local: 'img/core-img/envelope.png', r2: 'envelope.png' },
      { local: 'img/core-img/logo-icon.png', r2: 'logo-icon.png' },
      { local: 'img/core-img/map.png', r2: 'map.png' },
      { local: 'img/core-img/smartphone.png', r2: 'smartphone.png' },
      { local: 'img/core-img/envelope-2.png', r2: 'envelope-2.png' },
      { local: 'img/core-img/logo.png', r2: 'logo.png' },
      { local: 'img/core-img/search.png', r2: 'search.png' },
      { local: 'img/core-img/heart.png', r2: 'heart.png' },
      { local: 'img/core-img/photo-camera.png', r2: 'photo-camera.png' },
      { local: 'img/core-img/video-camera.png', r2: 'video-camera.png' },
      { local: 'img/core-img/gallery.png', r2: 'gallery.png' },
      { local: 'img/core-img/favorite.png', r2: 'favorite.png' },
      { local: 'img/core-img/photo-camera-2.png', r2: 'photo-camera-2.png' },
      { local: 'img/core-img/rocket-launch.png', r2: 'rocket-launch.png' },
      { local: 'img/core-img/logo-icon-2.png', r2: 'logo-icon-2.png' },
      { local: 'img/core-img/logo-icon-4.png', r2: 'logo-icon-4.png' },
      { local: 'img/core-img/active.png', r2: 'active.png' },
      { local: 'img/core-img/preloader.png', r2: 'preloader.png' },
      
      // Background images for slides
      { local: 'img/bg-img/1.jpg', r2: 'slides/1.png' },
      { local: 'img/bg-img/2.jpg', r2: 'slides/2.png' },
      { local: 'img/bg-img/3.jpg', r2: 'slides/3.png' },
      { local: 'img/bg-img/4.jpg', r2: 'slides/4.png' },
      { local: 'img/bg-img/5.jpg', r2: 'slides/5.png' },
      { local: 'img/bg-img/6.jpg', r2: 'slides/6.png' },
      { local: 'img/bg-img/7.jpg', r2: 'slides/7.png' },
      { local: 'img/bg-img/8.jpg', r2: 'slides/8.png' },
      { local: 'img/bg-img/9.jpg', r2: 'slides/9.png' },
      { local: 'img/bg-img/10.jpg', r2: 'slides/10.png' },
      { local: 'img/bg-img/11.jpg', r2: 'slides/11.png' },
      { local: 'img/bg-img/12.jpg', r2: 'slides/12.png' },
      { local: 'img/bg-img/13.jpg', r2: 'slides/13.png' },
      
      // Artist images
      { local: 'img/bg-img/1.jpg', r2: 'artists/1.png' },
      { local: 'img/bg-img/2.jpg', r2: 'artists/2.png' },
      { local: 'img/bg-img/3.jpg', r2: 'artists/3.png' },
      { local: 'img/bg-img/4.jpg', r2: 'artists/4.png' },
      { local: 'img/bg-img/5.jpg', r2: 'artists/5.png' },
      { local: 'img/bg-img/6.jpg', r2: 'artists/6.png' },
      { local: 'img/bg-img/7.jpg', r2: 'artists/7.png' },
      { local: 'img/bg-img/8.jpg', r2: 'artists/8.png' },
      { local: 'img/bg-img/9.jpg', r2: 'artists/9.png' }
    ];

    // Check existing files in R2
    const existingFiles = await env.ARCLEAD_ASSETS.list();
    const existingKeys = new Set(existingFiles.objects.map(obj => obj.key));

    // Upload files
    for (const fileMapping of localFiles) {
      try {
        if (existingKeys.has(fileMapping.r2)) {
          skipped++;
          continue;
        }

        // Fetch the local file from the static assets
        const localResponse = await env.ASSETS.fetch(new Request(`https://dummy.com/${fileMapping.local}`));
        
        if (localResponse.ok) {
          await env.ARCLEAD_ASSETS.put(fileMapping.r2, localResponse.body);
          uploaded++;
        } else {
          console.log(`Local file not found: ${fileMapping.local}`);
          skipped++;
        }
      } catch (error) {
        console.error(`Error syncing ${fileMapping.local}:`, error);
        skipped++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      uploaded,
      skipped,
      message: `Sync completed: ${uploaded} uploaded, ${skipped} skipped` 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error during sync:', error);
    return new Response(JSON.stringify({ error: 'Sync failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Clear all files from R2 bucket
async function handleAdminClear(request, env, corsHeaders) {
  if (request.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const objects = await env.ARCLEAD_ASSETS.list();
    let deleted = 0;

    for (const obj of objects.objects) {
      try {
        await env.ARCLEAD_ASSETS.delete(obj.key);
        deleted++;
      } catch (error) {
        console.error(`Error deleting ${obj.key}:`, error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      deleted,
      message: `Cleared ${deleted} files from bucket` 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error clearing bucket:', error);
    return new Response(JSON.stringify({ error: 'Failed to clear bucket' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Replace/update file in R2 bucket
async function handleAdminReplace(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const key = formData.get('key');

    if (!file || !key) {
      return new Response(JSON.stringify({ error: 'File and key are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Replace the file (overwrite existing)
    await env.ARCLEAD_ASSETS.put(key, file);

    return new Response(JSON.stringify({ 
      success: true, 
      key: key,
      message: `File ${key} replaced successfully` 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error replacing file:', error);
    return new Response(JSON.stringify({ error: 'Failed to replace file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleAssetRequest(request, env, url) {
  try {
    // Extract the file path from /assets/path/to/file.ext
    const assetPath = url.pathname.replace('/assets/', '');
    
    if (!assetPath) {
      return new Response('Asset path required', { status: 400 });
    }

    // Get the object from R2 bucket
    const object = await env.ARCLEAD_ASSETS.get(assetPath);
    
    if (!object) {
      return new Response('Asset not found', { status: 404 });
    }

    // Determine content type based on file extension
    const contentType = getContentType(assetPath);
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    headers.set('Access-Control-Allow-Origin', '*');
    
    // Add ETag if available
    if (object.etag) {
      headers.set('ETag', object.etag);
    }
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch && object.etag && ifNoneMatch === object.etag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(object.body, { headers });
    
  } catch (error) {
    console.error('Asset request error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function getContentType(filePath) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'webm': 'video/webm'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

async function handleApiRequest(request, env, url) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (url.pathname.startsWith('/api/artists')) {
      return handleArtistsRequest(request, env, url, corsHeaders);
    }

    switch (url.pathname) {
      case '/api/slides':
        return handleSlidesRequest(request, env, corsHeaders);
      case '/api/contact':
        return handleContactRequest(request, env, corsHeaders);
      default:
        return new Response('Not Found', { 
          status: 404, 
          headers: corsHeaders 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// Handle artists API requests
async function handleArtistsRequest(request, env, url, corsHeaders) {
  const pathParts = url.pathname.split('/');
  // /api/artists or /api/artists/{artistId}
  
  if (pathParts.length === 3) {
    // /api/artists
    switch (request.method) {
      case 'GET':
        return handleGetAllArtists(request, env, corsHeaders);
      case 'POST':
        return handleCreateArtist(request, env, corsHeaders);
      default:
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }
  } else if (pathParts.length === 4) {
    // /api/artists/{artistId}
    const artistId = pathParts[3];
    switch (request.method) {
      case 'GET':
        return handleGetArtist(request, env, artistId, corsHeaders);
      case 'PUT':
        return handleUpdateArtist(request, env, artistId, corsHeaders);
      case 'DELETE':
        return handleDeleteArtist(request, env, artistId, corsHeaders);
      default:
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }
  }
  
  return new Response('Not Found', { status: 404, headers: corsHeaders });
}

// Get all artists
async function handleGetAllArtists(request, env, corsHeaders) {
  try {
    let artists = [];
    
    // Load from R2
    try {
      const r2Object = await env.ARCLEAD_ASSETS.get('artists-data.json');
      if (r2Object) {
        const text = await r2Object.text();
        artists = JSON.parse(text);
        console.log(`Loaded ${artists.length} artists from R2`);
      } else {
        console.log('No artists data found in R2');
      }
    } catch (error) {
      console.log('Error loading artists from R2:', error.message);
    }

    return new Response(JSON.stringify(artists), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error getting artists:', error);
    return new Response(JSON.stringify({ error: 'Failed to get artists' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Get single artist
async function handleGetArtist(request, env, artistId, corsHeaders) {
  try {
    let artists = [];
    
    // Load from R2
    try {
      const r2Object = await env.ARCLEAD_ASSETS.get('artists-data.json');
      if (r2Object) {
        const text = await r2Object.text();
        artists = JSON.parse(text);
        console.log(`Loaded ${artists.length} artists from R2`);
      }
    } catch (error) {
      console.log('Error loading artists from R2:', error.message);
    }

    // If still no data, return sample data for testing
    if (artists.length === 0) {
      artists = [
        {
          id: 'kim-sigyeong',
          name: '김시경',
          nameEn: 'KIM SIGYEONG',
          images: ['profile1.jpg', 'profile2.jpg', 'profile3.jpg'],
          filmography: {
            movies: {
              '2024': ['웃으면 사랑하자 주인공 미리역', '기면뒤 어둠 조연', '서울 하늘아래 수련역'],
              '2023': ['사랑한 후에 미열역'],
              '2022': ['조용한 거리 길거리 행인 3역', '사람, 사람, 사람 단역']
            },
            dramas: {
              '2024': ['웃으면 사랑하자 주인공 미리역', '기면뒤 어둠 조연'],
              '2023': ['사랑한 후에 미열역']
            },
            commercials: {
              '2024': ['브랜드A 광고', '브랜드B 광고']
            }
          }
        }
      ];
    }

    const artist = artists.find(a => a.id === artistId);
    
    if (!artist) {
      return new Response(JSON.stringify({ error: 'Artist not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify(artist), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error getting artist:', error);
    return new Response(JSON.stringify({ error: 'Failed to get artist' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Save artists data to R2
async function saveArtistsData(artists, env) {
  const artistsJson = JSON.stringify(artists, null, 2);
  
  try {
    await env.ARCLEAD_ASSETS.put('artists-data.json', artistsJson, {
      httpMetadata: {
        contentType: 'application/json',
      },
    });
    console.log(`Successfully saved ${artists.length} artists to R2`);
  } catch (error) {
    console.error('Failed to save to R2:', error);
    throw error;
  }
}

// Load existing artists data from R2
async function loadExistingArtists(env) {
  let artists = [];
  
  try {
    const r2Object = await env.ARCLEAD_ASSETS.get('artists-data.json');
    if (r2Object) {
      const text = await r2Object.text();
      artists = JSON.parse(text);
      console.log(`Loaded ${artists.length} artists from R2`);
    } else {
      console.log('No existing artists data in R2');
    }
  } catch (error) {
    console.log('Error loading existing artists data:', error.message);
  }

  return artists;
}

// Create new artist
async function handleCreateArtist(request, env, corsHeaders) {
  try {
    console.log('Creating new artist...');
    const formData = await request.formData();
    const artistDataStr = formData.get('artistData');
    
    if (!artistDataStr) {
      return new Response(JSON.stringify({ error: 'Artist data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const artistData = JSON.parse(artistDataStr);
    console.log('Artist data:', artistData);
    
    // Validate required fields
    if (!artistData.id || !artistData.name) {
      return new Response(JSON.stringify({ error: 'Artist ID and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validate ID format
    if (!/^[a-zA-Z0-9-]+$/.test(artistData.id)) {
      return new Response(JSON.stringify({ error: 'Invalid artist ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get existing artists
    const artists = await loadExistingArtists(env);

    // Check for duplicate ID
    if (artists.some(a => a.id === artistData.id)) {
      return new Response(JSON.stringify({ error: 'Artist ID already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Handle image uploads
    const imageFiles = formData.getAll('images');
    const uploadedImages = [];
    console.log(`Uploading ${imageFiles.length} images...`);

    for (const imageFile of imageFiles) {
      if (imageFile && imageFile.size > 0) {
        const fileExtension = imageFile.name.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const imagePath = `artists/${artistData.id}/${fileName}`;
        
        try {
          await env.ARCLEAD_ASSETS.put(imagePath, imageFile);
          uploadedImages.push(fileName);
          console.log(`Uploaded image: ${fileName}`);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }

    // Create artist object
    const newArtist = {
      ...artistData,
      images: uploadedImages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to artists array
    artists.push(newArtist);

    // Save data
    await saveArtistsData(artists, env);

    console.log(`Successfully created artist: ${newArtist.name}`);

    return new Response(JSON.stringify({ 
      success: true, 
      artist: newArtist,
      message: 'Artist created successfully' 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error creating artist:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create artist',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Update artist
async function handleUpdateArtist(request, env, artistId, corsHeaders) {
  try {
    console.log(`Updating artist: ${artistId}`);
    const formData = await request.formData();
    const artistDataStr = formData.get('artistData');
    
    if (!artistDataStr) {
      return new Response(JSON.stringify({ error: 'Artist data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const artistData = JSON.parse(artistDataStr);

    // Get existing artists
    const artists = await loadExistingArtists(env);

    const artistIndex = artists.findIndex(a => a.id === artistId);
    if (artistIndex === -1) {
      return new Response(JSON.stringify({ error: 'Artist not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const existingArtist = artists[artistIndex];

    // Handle new image uploads
    const imageFiles = formData.getAll('images');
    const newImages = [];

    for (const imageFile of imageFiles) {
      if (imageFile && imageFile.size > 0) {
        const fileExtension = imageFile.name.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const imagePath = `artists/${artistId}/${fileName}`;
        
        try {
          await env.ARCLEAD_ASSETS.put(imagePath, imageFile);
          newImages.push(fileName);
          console.log(`Uploaded new image: ${fileName}`);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }

    // Update artist object
    const updatedArtist = {
      ...existingArtist,
      ...artistData,
      id: artistId, // Keep original ID
      images: [...(existingArtist.images || []), ...newImages],
      updatedAt: new Date().toISOString()
    };

    // Update in artists array
    artists[artistIndex] = updatedArtist;

    // Save data
    await saveArtistsData(artists, env);

    console.log(`Successfully updated artist: ${updatedArtist.name}`);

    return new Response(JSON.stringify({ 
      success: true, 
      artist: updatedArtist,
      message: 'Artist updated successfully' 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error updating artist:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update artist',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Delete artist
async function handleDeleteArtist(request, env, artistId, corsHeaders) {
  try {
    console.log(`Deleting artist: ${artistId}`);

    // Get existing artists
    const artists = await loadExistingArtists(env);

    const artistIndex = artists.findIndex(a => a.id === artistId);
    if (artistIndex === -1) {
      return new Response(JSON.stringify({ error: 'Artist not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const artist = artists[artistIndex];

    // Delete artist images from R2
    if (artist.images && artist.images.length > 0) {
      for (const image of artist.images) {
        try {
          await env.ARCLEAD_ASSETS.delete(`artists/${artistId}/${image}`);
          console.log(`Deleted image: ${image}`);
        } catch (error) {
          console.error(`Error deleting image ${image}:`, error);
        }
      }
    }

    // Remove artist from array
    artists.splice(artistIndex, 1);

    // Save data
    await saveArtistsData(artists, env);

    console.log(`Successfully deleted artist: ${artist.name}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Artist deleted successfully' 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error deleting artist:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete artist',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleSlidesRequest(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  // Sample slide data - you can modify this or store it in KV/D1
  const slideData = {
    slides: [
      { text_big: "김시경", text_small: "KIM SIGYEONG" },
      { text_big: "02.", text_small: "Believe you can fly" },
      { text_big: "03.", text_small: "Believe you can fly" },
      { text_big: "04.", text_small: "Believe you can fly" },
      { text_big: "05.", text_small: "Believe you can fly" },
      { text_big: "06.", text_small: "Believe you can fly" },
      { text_big: "07.", text_small: "Believe you can fly" },
      { text_big: "08.", text_small: "Believe you can fly" },
      { text_big: "09.", text_small: "Believe you can fly" },
      { text_big: "10.", text_small: "Believe you can fly" },
      { text_big: "11.", text_small: "Believe you can fly" },
      { text_big: "12.", text_small: "Believe you can fly" },
      { text_big: "13.", text_small: "Believe you can fly" }
    ]
  };

  return new Response(JSON.stringify(slideData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      ...corsHeaders
    }
  });
}

async function handleContactRequest(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const formData = await request.formData();
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown'
    };

    // Validate required fields
    if (!contactData.name || !contactData.email || !contactData.message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Name, email, and message are required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Store contact data (you can use KV, D1, or send email)
    console.log('Contact form submission:', contactData);
    
    // If you have KV storage configured:
    // await env.CONTACT_STORAGE.put(
    //   `contact_${Date.now()}`, 
    //   JSON.stringify(contactData)
    // );

    // If you want to send email using MailChannels (Cloudflare Workers Email):
    // await sendContactEmail(contactData, env);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Thank you for your message!' 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to process contact form' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Optional: Email sending function using MailChannels
async function sendContactEmail(contactData, env) {
  const emailPayload = {
    personalizations: [{
      to: [{ email: env.CONTACT_EMAIL || 'admin@arclead.com' }],
      subject: `Contact Form: ${contactData.subject || 'New Message'}`
    }],
    from: { email: 'noreply@arclead.com', name: 'Arclead Website' },
    content: [{
      type: 'text/html',
      value: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Subject:</strong> ${contactData.subject || 'N/A'}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message.replace(/\n/g, '<br>')}</p>
        <p><strong>Submitted:</strong> ${contactData.timestamp}</p>
        <p><strong>IP:</strong> ${contactData.ip}</p>
      `
    }]
  };

  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      throw new Error(`MailChannels API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw - just log the error so the contact form still works
  }
} 