// Iowa Weather Radar and Traffic Cameras - Main Application Script

// ==================== CONFIGURATION ====================
const CONFIG = {
    IOWA_CENTER: [42.0347, -93.6200],
    DEFAULT_ZOOM: 7,
    RADAR_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
    RADAR_OPACITY: 0.6,
    CAMERA_LOAD_DEBOUNCE: 500,
    RAINVIEWER_API: 'https://api.rainviewer.com/public/weather-maps.json',
    IOWA_DOT_API: 'https://gis.iowadot.gov/public/rest/services/public/Traffic_Cameras/MapServer/0/query'
};

// ==================== GLOBAL STATE ====================
let map;
let radarLayer = null;
let cameraMarkers = L.markerClusterGroup();
let cameraDataCache = [];
let lastRadarUpdate = 0;
let cameraLoadTimeout;
let radarRefreshTimer;

// ==================== MAP INITIALIZATION ====================
function initializeMap() {
    // Create map centered on Iowa
    map = L.map('map').setView(CONFIG.IOWA_CENTER, CONFIG.DEFAULT_ZOOM);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors',
        className: 'map-tiles'
    }).addTo(map);

    // Add marker cluster group to map
    map.addLayer(cameraMarkers);

    // Load initial data
    loadRadar();
    loadCameras();

    // Set up event listeners
    map.on('moveend', debounce(loadCameras, CONFIG.CAMERA_LOAD_DEBOUNCE));

    // Set up periodic radar refresh
    radarRefreshTimer = setInterval(loadRadar, CONFIG.RADAR_REFRESH_INTERVAL);
}

// ==================== RADAR FUNCTIONS ====================
/**
 * Load and display weather radar overlay
 */
async function loadRadar() {
    try {
        // Prevent excessive API calls
        const now = Date.now();
        if (now - lastRadarUpdate < 60000) {
            console.log('Radar updated recently, skipping');
            return;
        }
        lastRadarUpdate = now;

        console.log('Fetching radar data...');
        
        const response = await fetch(CONFIG.RAINVIEWER_API);
        if (!response.ok) throw new Error('Failed to fetch radar data');
        
        const data = await response.json();
        
        if (!data.radar || data.radar.nowcast.length === 0) {
            console.warn('No radar data available');
            return;
        }

        // Get the latest radar frame
        const latestRadar = data.radar.nowcast[data.radar.nowcast.length - 1];
        const radarUrl = `${data.host}${latestRadar.path}/512/{z}/{x}/{y}/2/1_1.png`;

        // Remove old radar layer if it exists
        if (radarLayer) {
            map.removeLayer(radarLayer);
        }

        // Add new radar layer
        radarLayer = L.tileLayer(radarUrl, {
            maxZoom: 18,
            opacity: CONFIG.RADAR_OPACITY,
            attribution: 'Radar © RainViewer',
            className: 'radar-layer'
        }).addTo(map);

        console.log('Radar layer updated successfully');

    } catch (error) {
        console.error('Error loading radar:', error);
    }
}

// ==================== TRAFFIC CAMERA FUNCTIONS ====================
/**
 * Load traffic cameras within current map bounds
 */
async function loadCameras() {
    try {
        const bounds = map.getBounds();
        
        // Build query parameters for ArcGIS API
        const params = new URLSearchParams({
            where: '1=1',
            outFields: '*',
            f: 'json',
            geometry: JSON.stringify({
                xmin: bounds.getWest(),
                ymin: bounds.getSouth(),
                xmax: bounds.getEast(),
                ymax: bounds.getNorth(),
                spatialReference: { wkid: 4326 }
            }),
            geometryType: 'esriGeometryEnvelope',
            spatialRel: 'esriSpatialRelIntersects',
            returnGeometry: true,
            geometryPrecision: 6
        });

        console.log('Fetching traffic cameras...');
        
        const response = await fetch(`${CONFIG.IOWA_DOT_API}?${params}`);
        if (!response.ok) throw new Error('Failed to fetch camera data');
        
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'API error');
        }

        // Clear existing markers
        cameraMarkers.clearLayers();
        cameraDataCache = [];

        // Add camera markers
        if (data.features && data.features.length > 0) {
            data.features.forEach(feature => {
                addCameraMarker(feature);
            });
            console.log(`Loaded ${data.features.length} camera(s)`);
        } else {
            console.log('No cameras found in current view');
        }

    } catch (error) {
        console.error('Error loading cameras:', error);
    }
}

/**
 * Add a single camera marker to the map
 */
function addCameraMarker(feature) {
    try {
        const geometry = feature.geometry;
        const attributes = feature.attributes;

        if (!geometry || geometry.x === undefined || geometry.y === undefined) {
            console.warn('Invalid geometry for camera:', attributes);
            return;
        }

        const lat = geometry.y;
        const lng = geometry.x;
        const cameraName = attributes.CAMERA_NAME || attributes.CAMERANAME || 'Traffic Camera';
        const videoUrl = attributes.VIDEO_URL || attributes.VIDEOURL || '';
        const imageUrl = attributes.IMAGE_URL || attributes.IMAGEURL || '';

        // Create custom marker icon
        const customIcon = L.divIcon({
            html: `
                <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0C7.2 0 0 6.9 0 15.2c0 8.3 16 25 16 25s16-16.7 16-25C32 6.9 24.8 0 16 0z" fill="#667eea"/>
                    <circle cx="16" cy="15" r="6" fill="white"/>
                </svg>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -40],
            className: 'custom-marker'
        });

        // Create marker
        const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(`<strong>${escapeHtml(cameraName)}</strong><br/>Click for details`)
            .on('click', () => showCameraDetails(cameraName, imageUrl, videoUrl, lat, lng));

        cameraMarkers.addLayer(marker);

        // Cache camera data
        cameraDataCache.push({
            name: cameraName,
            image: imageUrl,
            video: videoUrl,
            lat: lat,
            lng: lng
        });

    } catch (error) {
        console.error('Error adding camera marker:', error);
    }
}

// ==================== UI FUNCTIONS ====================
/**
 * Display camera details in the side panel
 */
function showCameraDetails(name, imageUrl, videoUrl, lat, lng) {
    const panel = document.getElementById('side-panel');
    let content = document.getElementById('side-panel-content');

    if (!content) {
        content = document.createElement('div');
        content.id = 'side-panel-content';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'panel-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => {
            panel.classList.remove('active');
        };
        
        content.appendChild(closeBtn);
        panel.appendChild(content);
    }

    // Build the content HTML
    let html = `
        <h2>${escapeHtml(name)}</h2>
        <p><strong>Coordinates:</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
    `;

    // Add image if available
    if (imageUrl && imageUrl.trim() !== '') {
        html += `<img id="camera-image" src="${escapeHtml(imageUrl)}" alt="Camera feed" onerror="this.style.display='none'">`;
    } else {
        html += '<div class="no-image">No image available</div>';
    }

    // Add video link if available
    if (videoUrl && videoUrl.trim() !== '') {
        html += `<a id="video-link" href="${escapeHtml(videoUrl)}" target="_blank">▶ Play Video Stream</a>`;
    }

    // Update content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Preserve close button
    const closeBtn = content.querySelector('.panel-close-btn');
    content.innerHTML = '';
    if (closeBtn) content.appendChild(closeBtn);
    
    // Add new content
    while (tempDiv.firstChild) {
        content.appendChild(tempDiv.firstChild);
    }

    // Show panel
    panel.classList.add('active');
}

// ==================== UTILITY FUNCTIONS ====================
/**
 * Debounce function to limit event firing
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>\