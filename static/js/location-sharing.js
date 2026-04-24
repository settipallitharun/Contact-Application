// --- Location Sharing System ---
// Real-time admin location tracking and sharing

class LocationSharingSystem {
    constructor() {
        this.isAdmin = false;
        this.isSharing = false;
        this.currentLocation = null;
        this.locationHistory = [];
        this.watchId = null;
        this.updateInterval = null;
        this.map = null;
        this.marker = null;
        this.websocket = null;
        
        this.initialize();
    }

    async initialize() {
        // Check if user is admin
        await this.checkAdminStatus();
        
        // Create UI components
        this.createLocationPanel();
        
        // Initialize WebSocket for real-time updates
        this.initializeWebSocket();
        
        // Start location tracking if enabled
        if (this.isSharing) {
            this.startLocationSharing();
        }
        
        // Request location permission
        this.requestLocationPermission();
    }

    async checkAdminStatus() {
        try {
            // In a real app, this would check with the backend
            // For demo, we'll check localStorage
            const adminStatus = localStorage.getItem('isAdmin');
            this.isAdmin = adminStatus === 'true';
            
            // Check if location sharing is enabled
            const sharingStatus = localStorage.getItem('locationSharingEnabled');
            this.isSharing = sharingStatus === 'true';
            
            console.log('Admin status:', this.isAdmin, 'Sharing enabled:', this.isSharing);
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }

    createLocationPanel() {
        // Create location sharing panel
        const panel = document.createElement('div');
        panel.className = 'location-sharing-panel';
        panel.id = 'locationSharingPanel';
        
        if (this.isAdmin) {
            panel.innerHTML = this.getAdminPanelHTML();
        } else {
            panel.innerHTML = this.getUserPanelHTML();
        }
        
        document.body.appendChild(panel);
        
        // Add event listeners
        this.addEventListeners();
        
        // Initialize mini map
        this.initializeMiniMap();
    }

    getAdminPanelHTML() {
        return `
            <div class="location-sharing-header">
                <div class="location-sharing-title">
                    <i data-lucide="map-pin"></i>
                    <span>Location Sharing</span>
                </div>
                <button class="minimize-btn" onclick="locationSharing.togglePanel()">
                    <i data-lucide="minimize-2"></i>
                </button>
            </div>
            
            <div class="admin-controls">
                <div class="admin-toggle">
                    <span>Share my location</span>
                    <div class="toggle-switch ${this.isSharing ? 'active' : ''}" onclick="locationSharing.toggleSharing()"></div>
                </div>
                <div class="location-accuracy">
                    <i data-lucide="target"></i>
                    Accuracy: ±10 meters
                </div>
            </div>
            
            <div class="location-display">
                <div class="location-map-mini" id="adminMiniMap"></div>
                <div class="location-info">
                    <div class="address" id="adminAddress">Location not available</div>
                    <div class="coordinates" id="adminCoordinates">--°--'--"N, --°--'--"W</div>
                    <div class="last-updated" id="adminLastUpdated">Last updated: Never</div>
                </div>
            </div>
            
            <div class="location-history">
                <div class="history-title">Recent Activity</div>
                <div id="locationHistoryList">
                    <div class="history-item">
                        <i data-lucide="clock"></i>
                        <span>System initialized</span>
                    </div>
                </div>
            </div>
            
            <div class="privacy-notice">
                <i data-lucide="shield-check"></i>
                Your location is only shared with team members who have access to this system.
            </div>
        `;
    }

    getUserPanelHTML() {
        return `
            <div class="location-sharing-header">
                <div class="location-sharing-title">
                    <i data-lucide="map"></i>
                    <span>Team Location</span>
                </div>
                <button class="minimize-btn" onclick="locationSharing.togglePanel()">
                    <i data-lucide="minimize-2"></i>
                </button>
            </div>
            
            <div class="user-location-view">
                <div class="admin-info">
                    <div class="admin-avatar">
                        <i data-lucide="user"></i>
                    </div>
                    <div class="admin-details">
                        <h4>System Administrator</h4>
                        <p>Currently working</p>
                    </div>
                </div>
                
                <div class="work-status ${this.isSharing ? '' : 'inactive'}" id="adminWorkStatus">
                    <i data-lucide="activity"></i>
                    <span>${this.isSharing ? 'Active Now' : 'Offline'}</span>
                </div>
                
                <div class="location-map-mini" id="userMiniMap"></div>
                <div class="location-info">
                    <div class="address" id="userAddress">No location shared</div>
                    <div class="coordinates" id="userCoordinates">--°--'--"N, --°--'--"W</div>
                    <div class="last-updated" id="userLastUpdated">Last updated: Never</div>
                </div>
            </div>
            
            <div class="privacy-notice">
                <i data-lucide="info"></i>
                Location sharing is controlled by the system administrator.
            </div>
        `;
    }

    addEventListeners() {
        // Add minimize button functionality
        const minimizeBtn = document.querySelector('.minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.togglePanel());
        }
    }

    initializeMiniMap() {
        // Initialize mini map for location display
        setTimeout(() => {
            const mapId = this.isAdmin ? 'adminMiniMap' : 'userMiniMap';
            const mapContainer = document.getElementById(mapId);
            
            if (mapContainer && typeof L !== 'undefined') {
                try {
                    // Create mini map
                    this.map = L.map(mapId, {
                        center: [40.7128, -74.0060], // Default to NYC
                        zoom: 13,
                        zoomControl: false,
                        attributionControl: false
                    });

                    // Add tile layer
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(this.map);

                    // Add marker if location is available
                    if (this.currentLocation) {
                        this.updateMapMarker(this.currentLocation);
                    }

                    console.log('Mini map initialized');
                } catch (error) {
                    console.error('Error initializing mini map:', error);
                }
            }
        }, 1000);
    }

    async requestLocationPermission() {
        if ('geolocation' in navigator) {
            try {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                console.log('Location permission:', permission.state);
                
                if (permission.state === 'granted') {
                    this.getCurrentLocation();
                }
            } catch (error) {
                console.error('Error checking location permission:', error);
            }
        } else {
            console.error('Geolocation not supported');
        }
    }

    toggleSharing() {
        this.isSharing = !this.isSharing;
        
        // Update UI
        const toggleSwitch = document.querySelector('.toggle-switch');
        if (toggleSwitch) {
            toggleSwitch.classList.toggle('active', this.isSharing);
        }
        
        // Save to localStorage
        localStorage.setItem('locationSharingEnabled', this.isSharing.toString());
        
        if (this.isSharing) {
            this.startLocationSharing();
            this.showNotification('Location sharing enabled', 'success');
        } else {
            this.stopLocationSharing();
            this.showNotification('Location sharing disabled', 'info');
        }
        
        // Notify other users via WebSocket
        if (this.websocket) {
            this.websocket.send(JSON.stringify({
                type: 'sharing_status',
                enabled: this.isSharing,
                timestamp: Date.now()
            }));
        }
    }

    startLocationSharing() {
        if (!navigator.geolocation) {
            this.showNotification('Geolocation not supported', 'error');
            return;
        }

        // Get initial location
        this.getCurrentLocation();
        
        // Start watching position
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handleLocationUpdate(position),
            (error) => this.handleLocationError(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
        
        // Update location every 30 seconds
        this.updateInterval = setInterval(() => {
            this.getCurrentLocation();
        }, 30000);
        
        console.log('Location sharing started');
    }

    stopLocationSharing() {
        // Clear watch
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        // Clear interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('Location sharing stopped');
    }

    getCurrentLocation() {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(
            (position) => this.handleLocationUpdate(position),
            (error) => this.handleLocationError(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    handleLocationUpdate(position) {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
        };
        
        this.currentLocation = location;
        
        // Update UI
        this.updateLocationDisplay(location);
        
        // Update map
        this.updateMapMarker(location);
        
        // Add to history
        this.addToHistory('Location updated');
        
        // Send to WebSocket
        if (this.websocket) {
            this.websocket.send(JSON.stringify({
                type: 'location_update',
                location: location,
                timestamp: Date.now()
            }));
        }
        
        console.log('Location updated:', location);
    }

    handleLocationError(error) {
        console.error('Location error:', error);
        
        let message = 'Unable to get location';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location unavailable';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out';
                break;
        }
        
        this.showNotification(message, 'error');
    }

    updateLocationDisplay(location) {
        if (this.isAdmin) {
            this.updateAdminDisplay(location);
        } else {
            this.updateUserDisplay(location);
        }
    }

    updateAdminDisplay(location) {
        const addressEl = document.getElementById('adminAddress');
        const coordsEl = document.getElementById('adminCoordinates');
        const lastUpdatedEl = document.getElementById('adminLastUpdated');
        
        if (addressEl) {
            addressEl.textContent = 'Getting address...';
            this.reverseGeocode(location.latitude, location.longitude, (address) => {
                if (addressEl) addressEl.textContent = address;
            });
        }
        
        if (coordsEl) {
            coordsEl.textContent = this.formatCoordinates(location.latitude, location.longitude);
        }
        
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    updateUserDisplay(location) {
        const addressEl = document.getElementById('userAddress');
        const coordsEl = document.getElementById('userCoordinates');
        const lastUpdatedEl = document.getElementById('userLastUpdated');
        const statusEl = document.getElementById('adminWorkStatus');
        
        if (addressEl) {
            addressEl.textContent = 'Getting address...';
            this.reverseGeocode(location.latitude, location.longitude, (address) => {
                if (addressEl) addressEl.textContent = address;
            });
        }
        
        if (coordsEl) {
            coordsEl.textContent = this.formatCoordinates(location.latitude, location.longitude);
        }
        
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
        
        if (statusEl) {
            statusEl.className = 'work-status';
            statusEl.innerHTML = `
                <i data-lucide="activity"></i>
                <span>Active Now</span>
            `;
        }
    }

    updateMapMarker(location) {
        if (!this.map) return;
        
        // Remove existing marker
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }
        
        // Add new marker
        this.marker = L.marker([location.latitude, location.longitude])
            .addTo(this.map)
            .bindPopup('Current Location');
        
        // Center map on location
        this.map.setView([location.latitude, location.longitude], 15);
        
        // Add pulse effect
        const markerElement = this.marker.getElement();
        if (markerElement) {
            markerElement.classList.add('location-marker-live');
        }
    }

    reverseGeocode(lat, lng, callback) {
        // Using Nominatim reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                callback(address);
            })
            .catch(error => {
                console.error('Reverse geocoding error:', error);
                callback(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            });
    }

    formatCoordinates(lat, lng) {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        
        const latAbs = Math.abs(lat);
        const lngAbs = Math.abs(lng);
        
        const latDeg = Math.floor(latAbs);
        const latMin = Math.floor((latAbs - latDeg) * 60);
        const latSec = ((latAbs - latDeg) * 60 - latMin) * 60;
        
        const lngDeg = Math.floor(lngAbs);
        const lngMin = Math.floor((lngAbs - lngDeg) * 60);
        const lngSec = ((lngAbs - lngDeg) * 60 - lngMin) * 60;
        
        return `${latDeg}°${latMin}'${latSec.toFixed(0)}"${latDir}, ${lngDeg}°${lngMin}'${lngSec.toFixed(0)}"${lngDir}`;
    }

    addToHistory(action) {
        const historyList = document.getElementById('locationHistoryList');
        if (!historyList) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <i data-lucide="map-pin"></i>
            <span>${action} - ${new Date().toLocaleTimeString()}</span>
        `;
        
        historyList.insertBefore(historyItem, historyList.firstChild);
        
        // Keep only last 5 items
        while (historyList.children.length > 5) {
            historyList.removeChild(historyList.lastChild);
        }
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initializeWebSocket() {
        // In a real app, this would connect to a WebSocket server
        // For demo, we'll simulate WebSocket functionality
        console.log('WebSocket initialized (simulated)');
        
        // Simulate receiving location updates
        if (!this.isAdmin) {
            setInterval(() => {
                if (this.isSharing) {
                    // Simulate receiving location updates from admin
                    this.simulateLocationUpdate();
                }
            }, 5000);
        }
    }

    simulateLocationUpdate() {
        // Simulate location updates for demo purposes
        const mockLocations = [
            { lat: 40.7128, lng: -74.0060, address: "New York, NY, USA" },
            { lat: 40.7580, lng: -73.9855, address: "Times Square, New York, NY, USA" },
            { lat: 40.7831, lng: -73.9712, address: "Central Park, New York, NY, USA" }
        ];
        
        const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
        
        const location = {
            latitude: randomLocation.lat + (Math.random() - 0.5) * 0.01,
            longitude: randomLocation.lng + (Math.random() - 0.5) * 0.01,
            accuracy: 10 + Math.random() * 20,
            timestamp: Date.now()
        };
        
        this.currentLocation = location;
        this.updateUserDisplay(location);
        this.updateMapMarker(location);
    }

    togglePanel() {
        const panel = document.getElementById('locationSharingPanel');
        if (panel) {
            panel.classList.toggle('minimized');
        }
    }

    showNotification(message, type) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Public methods
    enableAdminMode() {
        this.isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        
        // Recreate panel with admin view
        const panel = document.getElementById('locationSharingPanel');
        if (panel) {
            panel.remove();
        }
        this.createLocationPanel();
        
        this.showNotification('Admin mode enabled', 'success');
    }

    disableAdminMode() {
        this.isAdmin = false;
        localStorage.setItem('isAdmin', 'false');
        
        // Recreate panel with user view
        const panel = document.getElementById('locationSharingPanel');
        if (panel) {
            panel.remove();
        }
        this.createLocationPanel();
        
        this.showNotification('Admin mode disabled', 'info');
    }
}

// Initialize location sharing system
let locationSharing;

document.addEventListener('DOMContentLoaded', function() {
    locationSharing = new LocationSharingSystem();
    
    // Make it globally available
    window.locationSharing = locationSharing;
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+L to toggle location sharing
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            if (locationSharing.isAdmin) {
                locationSharing.toggleSharing();
            }
        }
        
        // Ctrl+Shift+L to toggle admin mode (for demo)
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            if (locationSharing.isAdmin) {
                locationSharing.disableAdminMode();
            } else {
                locationSharing.enableAdminMode();
            }
        }
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
