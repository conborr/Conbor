// Iowa Weather Radar and Traffic Cameras implementation

// HTML Escaping Helper Functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/\/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize Map with OpenStreetMap Tiles
var map = L.map('map').setView([41.5834, -93.6319], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// RainViewer Radar Integration with Auto-Refresh
function loadRadar() {
    setInterval(function() {
        // Fetch radar data from RainViewer API
        // Update map layer with new radar information
    }, 60000); // Refresh every 60 seconds
}
loadRadar();

// Iowa DOT Traffic Camera Loading with Clustering
var markers = L.markerClusterGroup();
function loadTrafficCameras() {
    // Fetch traffic camera data from Iowa DOT
    // Add camera markers to the map using clustering
}
loadTrafficCameras();

// NWS Weather Forecast Integration
function loadWeatherForecast() {
    // Fetch weather forecast from NWS
    // Display forecast data on the webpage
}
loadWeatherForecast();
