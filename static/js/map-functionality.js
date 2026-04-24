// Map using Leaflet (OpenStreetMap) - no API key required

let map = null;
let currentMarker = null;

function initializeMap() {
    setTimeout(() => {
        const mapElement = document.getElementById('locationMap');
        if (!mapElement) return;

        if (map) {
            map.invalidateSize();
            return;
        }

        map = L.map('locationMap').setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        map.on('click', function(e) {
            setMapLocation(e.latlng.lat, e.latlng.lng);
        });
    }, 400);
}

function setMapLocation(lat, lng, address) {
    if (!map) return;

    if (currentMarker) map.removeLayer(currentMarker);

    currentMarker = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 15);

    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;

    if (address) {
        document.getElementById('address').value = address;
        updateLocationDisplay(address);
    } else {
        // Reverse geocode using Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(r => r.json())
            .then(data => {
                const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                document.getElementById('address').value = addr;
                document.getElementById('city').value = data.address?.city || data.address?.town || '';
                document.getElementById('country').value = data.address?.country || '';
                updateLocationDisplay(addr);
                currentMarker.bindPopup(addr).openPopup();
            })
            .catch(() => updateLocationDisplay(`${lat.toFixed(5)}, ${lng.toFixed(5)}`));
    }
}

function searchLocation() {
    const query = document.getElementById('mapSearch').value.trim();
    if (!query) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(r => r.json())
        .then(results => {
            if (results.length === 0) {
                showNotification('Location not found', 'error');
                return;
            }
            const { lat, lon, display_name } = results[0];
            setMapLocation(parseFloat(lat), parseFloat(lon), display_name);
        })
        .catch(() => showNotification('Search failed', 'error'));
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation not supported', 'error');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => setMapLocation(pos.coords.latitude, pos.coords.longitude),
        () => showNotification('Could not get your location', 'error')
    );
}

function updateLocationDisplay(address) {
    const locationText = document.getElementById('locationText');
    const locationDiv = document.getElementById('selectedLocation');
    if (!locationText) return;

    locationText.innerHTML = `
        <i data-lucide="map-pin" style="width:18px;height:18px;margin-right:12px;flex-shrink:0;"></i>
        <span style="flex:1;word-break:break-word;">${address}</span>
    `;
    locationDiv?.classList.add('has-location');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function showNotification(message, type) {
    const n = document.createElement('div');
    n.textContent = message;
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;background:${type === 'error' ? '#ef4444' : '#10b981'};color:white;border-radius:8px;font-weight:500;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,.15)`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('mapSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') { e.preventDefault(); searchLocation(); }
        });
    }
});

window.initializeMap = initializeMap;
window.searchLocation = searchLocation;
window.getCurrentLocation = getCurrentLocation;
window.setMapLocation = setMapLocation;
