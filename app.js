// app.js for Iowa Weather Radar and Traffic Camera Application

// Initialize map
const map = L.map('map').setView([41.5868, -93.6250], 7);

// Set up tiles from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Radar overlay
const radarLayer = L.imageOverlay('url_to_radar_image', [[41.50, -93.80], [41.60, -93.50]]);
 radarLayer.addTo(map);

// Adding traffic camera markers
const trafficCams = [
    {lat: 41.6000, lng: -93.7000, description: 'Camera 1'},
    {lat: 41.6050, lng: -93.7400, description: 'Camera 2'},
    // more cameras
];

trafficCams.forEach(cam => {
    const marker = L.marker([cam.lat, cam.lng]).addTo(map);
    marker.bindPopup(cam.description);
});

// Create interactive panel
const panel = document.getElementById('infoPanel');

map.on('click', function(e) {
    panel.innerHTML = `You clicked on the map at ${e.latlng}`;
});

// Other application logic can go here...