/**
 * Artists All Fit Page JavaScript
 * Simplified and optimized layout management
 */

// Load artists from API
async function loadArtists() {
    try {
        const response = await fetch('/api/artists');
        const artists = await response.json();
        renderArtists(artists);
    } catch (error) {
        console.error('Error loading artists:', error);
        renderError();
    }
}

// Render artists grid
function renderArtists(artists) {
    const grid = document.getElementById('artistsGrid');
    
    if (artists.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                <h3>등록된 아티스트가 없습니다</h3>
                <p>관리자 페이지에서 아티스트를 추가해주세요.</p>
            </div>
        `;
        return;
    }

    // Calculate optimal grid layout for desktop
    if (window.innerWidth > 768) {
        const artistCount = artists.length;
        let columns, rows;
        
        // Calculate optimal grid dimensions to fill screen
        if (artistCount <= 4) {
            columns = artistCount;
            rows = 1;
        } else if (artistCount <= 8) {
            columns = 4;
            rows = 2;
        } else if (artistCount <= 12) {
            columns = 4;
            rows = 3;
        } else if (artistCount <= 16) {
            columns = 4;
            rows = 4;
        } else if (artistCount <= 20) {
            columns = 5;
            rows = 4;
        } else {
            columns = 6;
            rows = Math.ceil(artistCount / 6);
        }
        
        // Adjust grid template to fill available space
        grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        // Calculate available height more accurately
        const headerHeight = 180; // Fixed header space
        const bottomMargin = window.innerHeight * 0.1; // 10vh bottom margin
        const totalRowGaps = (rows - 1) * (window.innerHeight * 0.1); // 10vh between rows
        const availableHeight = window.innerHeight - headerHeight - bottomMargin - totalRowGaps;
        
        // Set the grid height to fit content properly
        grid.style.height = `${availableHeight}px`;
        grid.style.paddingBottom = `${bottomMargin}px`;
    }

    grid.innerHTML = artists.map(artist => {
        // Get representative image for artists page, fallback to first image, then default
        let imageUrl = '/assets/logo-icon.png'; // Use logo as default instead
        let imageSource = 'default logo';
        
        if (artist.representativeImages?.artists) {
            imageUrl = `/assets/artists/${artist.id}/${artist.representativeImages.artists}`;
            imageSource = `representative: ${artist.representativeImages.artists}`;
        } else if (artist.images && artist.images.length > 0) {
            imageUrl = `/assets/artists/${artist.id}/${artist.images[0]}`;
            imageSource = `first image: ${artist.images[0]}`;
        }
        
        console.log(`Artist ${artist.name} (${artist.id}): using ${imageSource} -> ${imageUrl}`);
        
        return `
            <div class="artist-item" onclick="goToArtist('${artist.id}')">
                <div class="artist-info">
                    <div class="artist-tag-name">
                        <span class="artist-name-ko">${artist.name}</span>
                        <span class="artist-name-en">${artist.nameEn || ''}</span>
                    </div>
                </div>
                <img src="${imageUrl}" 
                     alt="${artist.name}" 
                     onerror="console.error('Failed to load image: ${imageUrl}'); this.src='/assets/logo-icon.png'">
                <div class="artist-overlay"></div>
            </div>
        `;
    }).join('');
}

// Render error message
function renderError() {
    const grid = document.getElementById('artistsGrid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
            <h3>오류가 발생했습니다</h3>
            <p>아티스트 정보를 불러오는데 실패했습니다.</p>
            <button onclick="loadArtists()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">다시 시도</button>
        </div>
    `;
}

// Navigate to artist page
function goToArtist(artistId) {
    window.location.href = `artist.html?id=${artistId}`;
}

// Load artists when page loads
document.addEventListener('DOMContentLoaded', loadArtists); 