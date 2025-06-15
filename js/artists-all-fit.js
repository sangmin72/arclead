/**
 * Artists All Fit Page JavaScript
 * Simplified and optimized layout management
 */

class ArtistsPage {
    constructor() {
        this.artists = [];
        this.isLoading = false;
        this.gridContainer = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.gridContainer = document.getElementById('artistsGrid');
            this.loadArtists();
            this.setupResponsiveHandlers();
        });
    }

    /**
     * Load artists from API with error handling
     */
    async loadArtists() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch('/api/artists');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.artists = await response.json();
            this.renderArtists();
            
        } catch (error) {
            console.error('Failed to load artists:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render artists grid with optimized layout
     */
    renderArtists() {
        if (!this.gridContainer) return;

        if (this.artists.length === 0) {
            this.showEmptyState();
            return;
        }

        // Generate artist cards HTML
        const artistsHTML = this.artists.map(artist => this.createArtistCard(artist)).join('');
        this.gridContainer.innerHTML = artistsHTML;

        // Apply any post-render optimizations
        this.optimizeLayout();
    }

    /**
     * Create individual artist card HTML
     */
    createArtistCard(artist) {
        const imageUrl = this.getArtistImageUrl(artist);
        const imageAlt = `${artist.name} ${artist.nameEn || ''}`.trim();
        
        return `
            <div class="artist-item" onclick="artistsPage.navigateToArtist('${artist.id}')" role="button" tabindex="0" aria-label="View ${artist.name} profile">
                <div class="artist-info">
                    <div class="artist-tag-name">
                        <span class="artist-name-ko">${this.escapeHtml(artist.name)}</span>
                        ${artist.nameEn ? `<span class="artist-name-en">${this.escapeHtml(artist.nameEn)}</span>` : ''}
                    </div>
                </div>
                <img src="${imageUrl}" 
                     alt="${this.escapeHtml(imageAlt)}" 
                     loading="lazy"
                     onerror="this.src='/assets/logo-icon.png'; this.onerror=null;">
                <div class="artist-overlay"></div>
            </div>
        `;
    }

    /**
     * Get appropriate image URL for artist
     */
    getArtistImageUrl(artist) {
        // Priority: representative image > first image > default logo
        if (artist.representativeImages?.artists) {
            return `/assets/artists/${artist.id}/${artist.representativeImages.artists}`;
        }
        
        if (artist.images && artist.images.length > 0) {
            return `/assets/artists/${artist.id}/${artist.images[0]}`;
        }
        
        return '/assets/logo-icon.png';
    }

    /**
     * Navigate to individual artist page
     */
    navigateToArtist(artistId) {
        if (!artistId) return;
        window.location.href = `artist.html?id=${encodeURIComponent(artistId)}`;
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (!this.gridContainer) return;
        
        this.gridContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner" aria-hidden="true"></div>
                <p>아티스트 정보를 불러오는 중...</p>
            </div>
        `;
    }

    /**
     * Show error state with retry option
     */
    showError(errorMessage = '알 수 없는 오류가 발생했습니다') {
        if (!this.gridContainer) return;
        
        this.gridContainer.innerHTML = `
            <div class="error-container">
                <h3>오류가 발생했습니다</h3>
                <p>아티스트 정보를 불러오는데 실패했습니다.</p>
                <p class="error-detail">${this.escapeHtml(errorMessage)}</p>
                <button class="retry-button" onclick="artistsPage.loadArtists()">다시 시도</button>
            </div>
        `;
    }

    /**
     * Show empty state when no artists are available
     */
    showEmptyState() {
        if (!this.gridContainer) return;
        
        this.gridContainer.innerHTML = `
            <div class="error-container">
                <h3>등록된 아티스트가 없습니다</h3>
                <p>관리자 페이지에서 아티스트를 추가해주세요.</p>
            </div>
        `;
    }

    /**
     * Setup responsive behavior handlers
     */
    setupResponsiveHandlers() {
        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.optimizeLayout();
            }, 150);
        });

        // Keyboard navigation support
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const focusedElement = document.activeElement;
                if (focusedElement && focusedElement.classList.contains('artist-item')) {
                    event.preventDefault();
                    focusedElement.click();
                }
            }
        });
    }

    /**
     * Post-render layout optimizations
     */
    optimizeLayout() {
        if (!this.gridContainer) return;

        // Apply CSS custom properties for dynamic sizing if needed
        const artistItems = this.gridContainer.querySelectorAll('.artist-item');
        const viewportWidth = window.innerWidth;
        
        // Dynamic adjustments based on content and viewport
        if (viewportWidth > 1400 && this.artists.length <= 4) {
            this.gridContainer.style.setProperty('--grid-columns', this.artists.length.toString());
        } else {
            this.gridContainer.style.removeProperty('--grid-columns');
        }

        // Ensure images are properly loaded
        artistItems.forEach(item => {
            const img = item.querySelector('img');
            if (img && !img.complete) {
                img.addEventListener('load', () => {
                    item.classList.add('loaded');
                }, { once: true });
            } else if (img) {
                item.classList.add('loaded');
            }
        });
    }

    /**
     * Utility function to escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Public method to refresh the page
     */
    refresh() {
        this.loadArtists();
    }
}

// Initialize the artists page
const artistsPage = new ArtistsPage();

// Add CSS for loading spinner
const loadingStyles = `
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #333;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .artist-item {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.6s ease forwards;
    }
    
    .artist-item:nth-child(odd) {
        animation-delay: 0.1s;
    }
    
    .artist-item:nth-child(even) {
        animation-delay: 0.2s;
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .artist-item.loaded img {
        opacity: 1;
        transition: opacity 0.3s ease;
    }
    
    .error-detail {
        font-size: 0.8em;
        color: #999;
        margin-top: 10px;
        font-style: italic;
    }
`;

// Inject loading styles
const styleSheet = document.createElement('style');
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet); 