// app.js

// Iowa cities database
const cities = [
    { name: 'Des Moines', id: 1 },
    { name: 'Cedar Rapids', id: 2 },
    { name: 'Davenport', id: 3 },
    { name: 'Sioux City', id: 4 },
    { name: 'Iowa City', id: 5 },
    { name: 'West Des Moines', id: 6 },
    { name: 'Ames', id: 7 },
    { name: 'Ankeny', id: 8 },
    { name: 'Urbandale', id: 9 },
    { name: 'Waterloo', id: 10 },
    { name: 'Council Bluffs', id: 11 },
    { name: 'Dubuque', id: 12 },
    { name: 'South Sioux City', id: 13 },
    { name: 'Fort Dodge', id: 14 },
    { name: 'Mason City', id: 15 }
];

// DOM Elements
const cityInput = document.getElementById('citySearch');
const cityDropdown = document.getElementById('cityDropdown');
const radarToggle = document.getElementById('radarToggle');
const map = L.map('mapId').setView([42.0245, -93.2272], 7);

// Debounce utility
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// HTML escaping utility
function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// City search functionality
cityInput.addEventListener('input', debounce(function() {
    const searchTerm = escapeHTML(this.value).toLowerCase();
    cityDropdown.innerHTML = '';
    if (searchTerm) {
        const filteredCities = cities.filter(city => city.name.toLowerCase().includes(searchTerm));
        filteredCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            cityDropdown.appendChild(option);
        });
    }
}, 300));

// NWS weather API integration
async function fetchWeather(city) {
    const apiKey = 'YOUR_NWS_API_KEY'; // Replace with your NWS API key
    const response = await fetch(`https://api.weather.gov/points/${city.latitude},${city.longitude}`);
    const data = await response.json();
    return data;
}

// Radar toggle functionality
radarToggle.addEventListener('click', () => {
    // Logic to toggle radar layer on the map
});

// Map click handling for weather forecasts
map.on('click', async function(e) {
    const city = await fetchWeather({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
    });
    // Display the weather info
});

// Leaflet marker cluster integration
const markers = L.markerClusterGroup();
// Add traffic cameras to markers if available
map.addLayer(markers);

// Mobile-friendly event handlers
window.addEventListener('resize', function() {
    // Adjust map for mobile devices
});
