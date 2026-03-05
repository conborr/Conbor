// app.js

// Initialize the map
let map = L.map('map').setView([41.5868, -93.6250], 7); // Initial view set to Iowa

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    maxZoom: 19, 
}).addTo(map);

// Function to fetch weather data
async function fetchWeather(city) {
    const response = await fetch(`https://api.weather.gov/points/${city.latitude},${city.longitude}`);
    const data = await response.json();
    return data;
}

// List of 15 Iowa cities and their coordinates
const iowaCities = [
    { name: 'Des Moines', latitude: 41.5868, longitude: -93.6250 },
    { name: 'Cedar Rapids', latitude: 41.9773, longitude: -91.6656 },
    { name: 'Davenport', latitude: 41.5236, longitude: -90.5776 },
    { name: 'Sioux City', latitude: 42.4995, longitude: -96.4003 },
    { name: 'Waterloo', latitude: 42.4928, longitude: -92.3421 },
    { name: 'Iowa City', latitude: 41.6611, longitude: -91.5302 },
    { name: 'Council Bluffs', latitude: 41.2619, longitude: -95.8608 },
    { name: 'Ames', latitude: 42.0342, longitude: -93.6320 },
    { name: 'West Des Moines', latitude: 41.5772, longitude: -93.7113 },
    { name: 'Ankeny', latitude: 41.7312, longitude: -93.6051 },
    { name: 'Urbandale', latitude: 41.6247, longitude: -93.7124 },
    { name: 'Marion', latitude: 42.0334, longitude: -92.0402 },
    { name: 'Burlington', latitude: 40.8097, longitude: -91.1626 },
    { name: 'Marion', latitude: 42.0364, longitude: -92.0397 },
    { name: 'Charles City', latitude: 43.0672, longitude: -92.6280 } 
];

// Function to fetch radar data (mockup)
function toggleRadar() {
    // Toggle radar display logic
}

// Function to load traffic cameras
async function loadTrafficCameras() {
    const response = await fetch('https://iowadot.gov/arcgis/rest/services/TrafficCam/MapServer/0/query?where=1=1&outFields=*&f=json');
    const data = await response.json();
    // Cluster markers and display
}

// Setup map click handler
map.on('click', function (e) {
    // Fetch weather forecast based on clicked location
});

// Mobile responsiveness logic
window.addEventListener('resize', function() {
    // Adjust map and elements for mobile view
});
