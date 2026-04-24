// --- Admin Settings Panel ---
// Control panel for admin features including location sharing

class AdminSettings {
    constructor() {
        this.isAdmin = false;
        this.modal = null;
        this.locationSharingEnabled = false;
        
        this.initialize();
    }

    initialize() {
        this.createSettingsModal();
        this.createFloatingButton();
        this.createStatusBanner();
        this.checkAdminStatus();
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+S to open settings
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.openSettings();
            }
        });
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'admin-settings-modal';
        modal.id = 'adminSettingsModal';
        modal.innerHTML = `
            <div class="admin-settings-content">
                <div class="settings-header">
                    <h2>
                        <i data-lucide="settings"></i>
                        Admin Settings
                    </h2>
                    <button class="settings-close" onclick="adminSettings.closeSettings()">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="settings-section">
                    <h3>
                        <i data-lucide="shield-check"></i>
                        Admin Status
                    </h3>
                    <div class="settings-item">
                        <div class="settings-info">
                            <h4>Administrator Mode</h4>
                            <p>Enable admin features and location sharing</p>
                        </div>
                        <div class="settings-control">
                            <div class="admin-toggle-switch" id="adminModeToggle" onclick="adminSettings.toggleAdminMode()"></div>
                            <div class="status-indicator" id="adminStatusIndicator">
                                <div class="status-dot"></div>
                                <span id="adminStatusText">Inactive</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>
                        <i data-lucide="map-pin"></i>
                        Location Sharing
                    </h3>
                    <div class="settings-item">
                        <div class="settings-info">
                            <h4>Share My Location</h4>
                            <p>Allow team members to see where you're working from</p>
                        </div>
                        <div class="settings-control">
                            <div class="admin-toggle-switch" id="locationSharingToggle" onclick="adminSettings.toggleLocationSharing()"></div>
                            <div class="status-indicator" id="locationStatusIndicator">
                                <div class="status-dot"></div>
                                <span id="locationStatusText">Disabled</span>
                            </div>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-info">
                            <h4>Update Frequency</h4>
                            <p>How often to update your location</p>
                        </div>
                        <div class="settings-control">
                            <select id="updateFrequency" onchange="adminSettings.updateFrequency(this.value)">
                                <option value="30">30 seconds</option>
                                <option value="60">1 minute</option>
                                <option value="300">5 minutes</option>
                                <option value="900">15 minutes</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>
                        <i data-lucide="users"></i>
                        Team Access
                    </h3>
                    <div class="settings-item">
                        <div class="settings-info">
                            <h4>Team Members</h4>
                            <p>Manage who can see your location</p>
                        </div>
                        <div class="settings-control">
                            <button class="btn-primary" onclick="adminSettings.manageTeamMembers()">
                                <i data-lucide="users"></i>
                                Manage
                            </button>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>
                        <i data-lucide="activity"></i>
                        Activity Monitoring
                    </h3>
                    <div class="settings-item">
                        <div class="settings-info">
                            <h4>Activity Tracking</h4>
                            <p>Monitor system usage and performance</p>
                        </div>
                        <div class="settings-control">
                            <div class="admin-toggle-switch active" id="activityTrackingToggle" onclick="adminSettings.toggleActivityTracking()"></div>
                        </div>
                    </div>
                </div>

                <div class="privacy-warning">
                    <h4>
                        <i data-lucide="alert-triangle"></i>
                        Privacy Notice
                    </h4>
                    <p>
                        Location sharing is only visible to authorized team members. 
                        Your location data is encrypted and stored securely. 
                        You can disable location sharing at any time.
                    </p>
                </div>

                <div class="settings-section">
                    <button class="btn-primary" onclick="adminSettings.saveSettings()" style="width: 100%;">
                        <i data-lucide="save"></i>
                        Save Settings
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
    }

    createFloatingButton() {
        const fab = document.createElement('div');
        fab.className = 'fab-settings';
        fab.id = 'fabSettings';
        fab.innerHTML = '<i data-lucide="settings"></i>';
        fab.onclick = () => this.openSettings();
        
        document.body.appendChild(fab);
    }

    createStatusBanner() {
        const banner = document.createElement('div');
        banner.className = 'admin-status-banner';
        banner.id = 'adminStatusBanner';
        banner.innerHTML = `
            <i data-lucide="shield-check"></i>
            <span id="adminBannerText">Admin Mode: Inactive</span>
        `;
        
        document.body.appendChild(banner);
    }

    async checkAdminStatus() {
        try {
            // Check admin status from localStorage
            const adminStatus = localStorage.getItem('isAdmin');
            this.isAdmin = adminStatus === 'true';
            
            // Check location sharing status
            const locationStatus = localStorage.getItem('locationSharingEnabled');
            this.locationSharingEnabled = locationStatus === 'true';
            
            this.updateUI();
            
            // If admin, show banner
            if (this.isAdmin) {
                this.showAdminBanner();
            }
            
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }

    updateUI() {
        // Update admin toggle
        const adminToggle = document.getElementById('adminModeToggle');
        const adminIndicator = document.getElementById('adminStatusIndicator');
        const adminText = document.getElementById('adminStatusText');
        const adminBannerText = document.getElementById('adminBannerText');
        
        if (adminToggle) {
            adminToggle.classList.toggle('active', this.isAdmin);
        }
        
        if (adminIndicator) {
            adminIndicator.classList.toggle('active', this.isAdmin);
        }
        
        if (adminText) {
            adminText.textContent = this.isAdmin ? 'Active' : 'Inactive';
        }
        
        if (adminBannerText) {
            adminBannerText.textContent = `Admin Mode: ${this.isAdmin ? 'Active' : 'Inactive'}`;
        }
        
        // Update location sharing toggle
        const locationToggle = document.getElementById('locationSharingToggle');
        const locationIndicator = document.getElementById('locationStatusIndicator');
        const locationText = document.getElementById('locationStatusText');
        
        if (locationToggle) {
            locationToggle.classList.toggle('active', this.locationSharingEnabled);
            locationToggle.disabled = !this.isAdmin;
        }
        
        if (locationIndicator) {
            locationIndicator.classList.toggle('active', this.locationSharingEnabled);
        }
        
        if (locationText) {
            locationText.textContent = this.locationSharingEnabled ? 'Enabled' : 'Disabled';
        }
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    toggleAdminMode() {
        this.isAdmin = !this.isAdmin;
        localStorage.setItem('isAdmin', this.isAdmin.toString());
        
        this.updateUI();
        
        if (this.isAdmin) {
            this.showAdminBanner();
            this.showNotification('Admin mode enabled', 'success');
            
            // Enable location sharing system
            if (window.locationSharing) {
                window.locationSharing.enableAdminMode();
            }
        } else {
            this.hideAdminBanner();
            this.showNotification('Admin mode disabled', 'info');
            
            // Disable location sharing system
            if (window.locationSharing) {
                window.locationSharing.disableAdminMode();
            }
        }
    }

    toggleLocationSharing() {
        if (!this.isAdmin) {
            this.showNotification('Admin mode required to enable location sharing', 'error');
            return;
        }
        
        this.locationSharingEnabled = !this.locationSharingEnabled;
        localStorage.setItem('locationSharingEnabled', this.locationSharingEnabled.toString());
        
        this.updateUI();
        
        if (this.locationSharingEnabled) {
            this.showNotification('Location sharing enabled', 'success');
            
            // Start location sharing
            if (window.locationSharing) {
                window.locationSharing.isSharing = true;
                window.locationSharing.startLocationSharing();
            }
        } else {
            this.showNotification('Location sharing disabled', 'info');
            
            // Stop location sharing
            if (window.locationSharing) {
                window.locationSharing.isSharing = false;
                window.locationSharing.stopLocationSharing();
            }
        }
    }

    toggleActivityTracking() {
        const toggle = document.getElementById('activityTrackingToggle');
        const isActive = toggle.classList.contains('active');
        
        toggle.classList.toggle('active', !isActive);
        
        this.showNotification(
            `Activity tracking ${!isActive ? 'enabled' : 'disabled'}`,
            !isActive ? 'success' : 'info'
        );
    }

    updateFrequency(frequency) {
        localStorage.setItem('locationUpdateFrequency', frequency);
        this.showNotification(`Update frequency set to ${frequency / 60} minute(s)`, 'success');
        
        // Update location sharing system
        if (window.locationSharing && window.locationSharing.isSharing) {
            // Restart location sharing with new frequency
            window.locationSharing.stopLocationSharing();
            window.locationSharing.startLocationSharing();
        }
    }

    manageTeamMembers() {
        this.showNotification('Team member management coming soon', 'info');
    }

    saveSettings() {
        this.showNotification('Settings saved successfully', 'success');
        this.closeSettings();
    }

    openSettings() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }

    closeSettings() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    showAdminBanner() {
        const banner = document.getElementById('adminStatusBanner');
        if (banner) {
            banner.classList.add('show');
        }
    }

    hideAdminBanner() {
        const banner = document.getElementById('adminStatusBanner');
        if (banner) {
            banner.classList.remove('show');
        }
    }

    showNotification(message, type) {
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
        this.updateUI();
        this.showAdminBanner();
        this.showNotification('Admin mode enabled', 'success');
    }

    disableAdminMode() {
        this.isAdmin = false;
        localStorage.setItem('isAdmin', 'false');
        this.updateUI();
        this.hideAdminBanner();
        this.showNotification('Admin mode disabled', 'info');
    }

    getLocationSharingStatus() {
        return {
            isAdmin: this.isAdmin,
            isSharing: this.locationSharingEnabled
        };
    }
}

// Initialize admin settings
let adminSettings;

document.addEventListener('DOMContentLoaded', function() {
    adminSettings = new AdminSettings();
    
    // Make it globally available
    window.adminSettings = adminSettings;
    
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('adminSettingsModal');
        if (modal && modal.style.display === 'flex' && !modal.contains(event.target) && !event.target.closest('#fabSettings')) {
            adminSettings.closeSettings();
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
    
    .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-primary:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
    }
    
    select {
        padding: 8px 12px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    select:focus {
        outline: none;
        border-color: var(--primary);
    }
`;
document.head.appendChild(style);
