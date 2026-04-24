// --- Advanced Enterprise Features ---

// Global State Management
let appState = {
    viewMode: 'grid',
    bulkMode: false,
    selectedContacts: new Set(),
    searchQuery: '',
    categoryFilter: '',
    sortOrder: 'newest',
    favoritesOnly: false,
    commandPaletteOpen: false,
    analyticsOpen: false,
    importModalOpen: false
};

// Command Palette
function openCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const input = document.getElementById('commandInput');
    palette.style.display = 'flex';
    input.value = '';
    input.focus();
    appState.commandPaletteOpen = true;
    
    // Show recent commands
    showCommandResults([
        { icon: 'plus', text: 'Add New Contact', action: 'openForm' },
        { icon: 'upload', text: 'Import Contacts', action: 'importContacts' },
        { icon: 'download', text: 'Export Contacts', action: 'exportContacts' },
        { icon: 'bar-chart-3', text: 'View Analytics', action: 'openAnalytics' },
        { icon: 'settings', text: 'Settings', action: 'openSettings' },
        { icon: 'shield-lock', text: 'Security Vault', action: 'openVault' }
    ]);
}

function closeCommandPalette() {
    document.getElementById('commandPalette').style.display = 'none';
    appState.commandPaletteOpen = false;
}

function handleCommandKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (appState.commandPaletteOpen) {
            closeCommandPalette();
        } else {
            openCommandPalette();
        }
    }
    
    if (event.key === 'Escape' && appState.commandPaletteOpen) {
        closeCommandPalette();
    }
}

function handleGlobalSearch() {
    const input = document.getElementById('globalSearchInput');
    const query = input.value.toLowerCase();
    
    if (query.startsWith('/')) {
        // Command mode
        handleCommand(query);
    } else {
        // Search mode
        appState.searchQuery = query;
        filterContacts();
    }
}

function handleCommand(command) {
    const cmd = command.substring(1).toLowerCase();
    const commands = {
        'add': openForm,
        'import': importContacts,
        'export': exportContacts,
        'analytics': openAnalytics,
        'settings': openSettings,
        'vault': openVault,
        'help': showHelp
    };
    
    if (commands[cmd]) {
        commands[cmd]();
        closeCommandPalette();
    }
}

function showCommandResults(results) {
    const container = document.getElementById('commandResults');
    container.innerHTML = results.map(result => `
        <div class="command-item" onclick="executeCommand('${result.action}')">
            <i data-lucide="${result.icon}"></i>
            <span>${result.text}</span>
        </div>
    `).join('');
    lucide.createIcons();
}

function executeCommand(action) {
    if (typeof window[action] === 'function') {
        window[action]();
    }
    closeCommandPalette();
}

// Advanced Search
function toggleAdvancedSearch() {
    const panel = document.getElementById('advancedSearchPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function applyAdvancedSearch() {
    const name = document.getElementById('advName').value.toLowerCase();
    const phone = document.getElementById('advPhone').value.toLowerCase();
    const email = document.getElementById('advEmail').value.toLowerCase();
    const category = document.getElementById('advCategory').value;
    const date = document.getElementById('advDate').value;
    const followUp = document.getElementById('advFollowUp').value;
    
    let filtered = contacts.filter(contact => {
        if (name && !contact.name.toLowerCase().includes(name)) return false;
        if (phone && !contact.phone.toLowerCase().includes(phone)) return false;
        if (email && !contact.email.toLowerCase().includes(email)) return false;
        if (category && contact.category !== category) return false;
        if (date && !contact.created_at.startsWith(date)) return false;
        if (followUp === 'yes' && !contact.follow_up_date) return false;
        if (followUp === 'no' && contact.follow_up_date) return false;
        return true;
    });
    
    filteredContacts = filtered;
    renderContacts();
}

// View Modes
function setViewMode(mode) {
    appState.viewMode = mode;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update grid class
    const grid = document.getElementById('contactsGrid');
    grid.className = `contacts-grid view-${mode}`;
    
    renderContacts();
}

// Bulk Operations
function toggleBulkMode() {
    appState.bulkMode = !appState.bulkMode;
    const bulkBar = document.getElementById('bulkActionsBar');
    
    if (appState.bulkMode) {
        bulkBar.style.display = 'flex';
        showToast('Bulk selection mode enabled', 'info');
    } else {
        bulkBar.style.display = 'none';
        clearBulkSelection();
    }
    
    renderContacts();
}

function selectContact(contactId) {
    if (!appState.bulkMode) return;
    
    if (appState.selectedContacts.has(contactId)) {
        appState.selectedContacts.delete(contactId);
    } else {
        appState.selectedContacts.add(contactId);
    }
    
    updateBulkSelection();
}

function updateBulkSelection() {
    const count = appState.selectedContacts.size;
    document.getElementById('selectedCount').textContent = `${count} selected`;
    
    // Update checkbox states
    appState.selectedContacts.forEach(id => {
        const checkbox = document.querySelector(`[data-contact-id="${id}"] .bulk-checkbox`);
        if (checkbox) checkbox.checked = true;
    });
}

function clearBulkSelection() {
    appState.selectedContacts.clear();
    document.getElementById('selectedCount').textContent = '0 selected';
    document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.checked = false);
}

function bulkFavoriteSelected() {
    const selectedContacts = Array.from(appState.selectedContacts);
    selectedContacts.forEach(id => {
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            contact.favorite = true;
            updateContact(id, { favorite: true });
        }
    });
    
    showToast(`Marked ${selectedContacts.length} contacts as favorite`, 'success');
    clearBulkSelection();
    renderContacts();
}

function bulkCategorySelected() {
    const category = prompt('Enter category (Family, Friends, Work, General):');
    if (!category) return;
    
    const selectedContacts = Array.from(appState.selectedContacts);
    selectedContacts.forEach(id => {
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            contact.category = category;
            updateContact(id, { category });
        }
    });
    
    showToast(`Updated ${selectedContacts.length} contacts to category: ${category}`, 'success');
    clearBulkSelection();
    renderContacts();
}

function bulkExportSelected() {
    const selectedContacts = Array.from(appState.selectedContacts).map(id => 
        contacts.find(c => c.id === id)
    );
    
    if (selectedContacts.length === 0) {
        showToast('No contacts selected', 'error');
        return;
    }
    
    exportContactsData(selectedContacts, `selected_contacts_${Date.now()}.json`);
    showToast(`Exported ${selectedContacts.length} contacts`, 'success');
}

function bulkDeleteSelected() {
    const count = appState.selectedContacts.size;
    if (!confirm(`Are you sure you want to delete ${count} contacts? This action cannot be undone.`)) {
        return;
    }
    
    const selectedContacts = Array.from(appState.selectedContacts);
    selectedContacts.forEach(id => {
        deleteContact(id);
    });
    
    showToast(`Deleted ${count} contacts`, 'success');
    clearBulkSelection();
    renderContacts();
}

// Analytics Dashboard
function openAnalytics() {
    document.getElementById('analyticsView').style.display = 'block';
    document.getElementById('listView').style.display = 'none';
    appState.analyticsOpen = true;
    initializeAnalytics();
}

function closeAnalytics() {
    document.getElementById('analyticsView').style.display = 'none';
    document.getElementById('listView').style.display = 'block';
    appState.analyticsOpen = false;
}

function initializeAnalytics() {
    updateAnalytics();
    renderAnalyticsCharts();
}

function updateAnalytics() {
    const period = document.getElementById('analyticsPeriod').value;
    // Filter contacts based on period
    const filtered = filterContactsByPeriod(contacts, period);
    
    // Update analytics data
    updateAnalyticsData(filtered);
}

function filterContactsByPeriod(contacts, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    return contacts.filter(contact => {
        const createdAt = new Date(contact.created_at);
        return createdAt >= cutoffDate;
    });
}

function updateAnalyticsData(filteredContacts) {
    // Update top contacts
    const topContacts = getTopEngagedContacts(filteredContacts);
    renderTopContacts(topContacts);
}

function getTopEngagedContacts(contacts) {
    // For now, return favorites as top engaged
    // In a real app, this would be based on interaction metrics
    return contacts
        .filter(c => c.favorite)
        .slice(0, 5)
        .map(contact => ({
            ...contact,
            engagement: Math.floor(Math.random() * 100) // Mock engagement score
        }))
        .sort((a, b) => b.engagement - a.engagement);
}

function renderTopContacts(topContacts) {
    const container = document.getElementById('topContacts');
    container.innerHTML = topContacts.map(contact => `
        <div class="top-contact-item">
            <div class="top-contact-avatar" style="background: ${getAvatarColor(contact.name)}">
                ${getInitials(contact.name)}
            </div>
            <div class="top-contact-info">
                <h4>${contact.name}</h4>
                <span>Engagement: ${contact.engagement}%</span>
            </div>
        </div>
    `).join('');
}

function renderAnalyticsCharts() {
    renderGrowthChart();
    renderCategoryChart();
    renderActivityChart();
}

function renderGrowthChart() {
    const ctx = document.getElementById('growthChart').getContext('2d');
    const data = getContactGrowthData();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Contacts Added',
                data: data.values,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const data = getCategoryDistribution();
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899',
                    '#10b981'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderActivityChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    const data = getActivityData();
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Activity',
                data: data.values,
                backgroundColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function getContactGrowthData() {
    // Mock data - in real app, calculate from actual contact creation dates
    return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [2, 5, 3, 8, 4, 6, 9]
    };
}

function getCategoryDistribution() {
    const categories = ['Family', 'Friends', 'Work', 'General'];
    const distribution = categories.map(cat => 
        contacts.filter(c => c.category === cat).length
    );
    
    return {
        labels: categories,
        values: distribution
    };
}

function getActivityData() {
    // Mock activity data
    return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [12, 19, 8, 15, 22, 18, 25]
    };
}

function exportAnalytics() {
    const analyticsData = {
        totalContacts: contacts.length,
        categoryDistribution: getCategoryDistribution(),
        favoriteCount: contacts.filter(c => c.favorite).length,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${Date.now()}.json`;
    a.click();
    
    showToast('Analytics report exported', 'success');
}

// Import/Export Features
function importContacts() {
    document.getElementById('importModal').style.display = 'block';
    appState.importModalOpen = true;
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
    appState.importModalOpen = false;
}

function importFromCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = handleCSVImport;
    input.click();
}

function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const contacts = parseCSV(csv);
        
        if (contacts.length > 0) {
            importContactsData(contacts);
            closeImportModal();
            showToast(`Imported ${contacts.length} contacts from CSV`, 'success');
        }
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = line.split(',').map(v => v.trim());
            const contact = {};
            
            headers.forEach((header, index) => {
                contact[header.toLowerCase()] = values[index] || '';
            });
            
            // Ensure required fields
            contact.id = generateId();
            contact.favorite = false;
            contact.created_at = new Date().toISOString();
            
            return contact;
        });
}

function importFromVCard() {
    showToast('vCard import coming soon', 'info');
}

function importFromGoogle() {
    showToast('Google Contacts sync coming soon', 'info');
}

function importContactsData(newContacts) {
    newContacts.forEach(contact => {
        // Validate and add contact
        if (contact.name && contact.phone && contact.email) {
            contacts.push(contact);
            saveContactToBackend(contact);
        }
    });
    
    renderContacts();
    updateStats();
    updateSidebar();
}

function exportContacts() {
    exportContactsData(contacts, `contacts_${Date.now()}.json`);
}

function exportContactsData(contactList, filename) {
    const blob = new Blob([JSON.stringify(contactList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Quick Actions
function bulkFavorite() {
    openCommandPalette();
    document.getElementById('commandInput').value = '/bulk-favorite';
}

function bulkCategory() {
    openCommandPalette();
    document.getElementById('commandInput').value = '/bulk-category';
}

function duplicateContacts() {
    showToast('Duplicate contacts feature coming soon', 'info');
}

function mergeContacts() {
    showToast('Merge contacts feature coming soon', 'info');
}

function backupData() {
    const backup = {
        contacts: contacts,
        settings: {
            theme: document.body.classList.contains('light-mode') ? 'light' : 'dark',
            viewMode: appState.viewMode
        },
        backupDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contactpro_backup_${Date.now()}.json`;
    a.click();
    
    showToast('Backup created successfully', 'success');
}

function syncContacts() {
    showToast('Sync feature coming soon', 'info');
}

// User Menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Settings
function openSettings() {
    showToast('Settings panel coming soon', 'info');
}

// About
function showAbout() {
    showToast('ContactPro X - Enterprise Edition v2.0', 'info');
}

// Smart Suggestions
function updateSmartSuggestions() {
    const container = document.getElementById('smartSuggestions');
    const suggestions = generateSmartSuggestions();
    
    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="executeSuggestion('${suggestion.action}')">
            <i data-lucide="${suggestion.icon}"></i>
            <div class="suggestion-content">
                <h4>${suggestion.title}</h4>
                <p>${suggestion.description}</p>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function generateSmartSuggestions() {
    const suggestions = [];
    
    // Suggest adding contacts if few exist
    if (contacts.length < 5) {
        suggestions.push({
            icon: 'user-plus',
            title: 'Grow Your Network',
            description: 'Add more contacts to build your professional network',
            action: 'openForm'
        });
    }
    
    // Suggest categorizing if uncategorized contacts exist
    const uncategorized = contacts.filter(c => c.category === 'General');
    if (uncategorized.length > 3) {
        suggestions.push({
            icon: 'tag',
            title: 'Organize Contacts',
            description: `${uncategorized.length} contacts need categorization`,
            action: 'bulkCategory'
        });
    }
    
    // Suggest backup if not done recently
    suggestions.push({
        icon: 'cloud-upload',
        title: 'Backup Your Data',
        description: 'Keep your contacts safe with regular backups',
        action: 'backupData'
    });
    
    return suggestions.slice(0, 3);
}

function executeSuggestion(action) {
    if (typeof window[action] === 'function') {
        window[action]();
    }
}

// Recent Activity
function updateRecentActivity() {
    const container = document.getElementById('recentActivityList');
    const activities = generateRecentActivities();
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color}">
                <i data-lucide="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function generateRecentActivities() {
    const activities = [];
    
    // Add recent contact additions
    contacts.slice(-3).reverse().forEach(contact => {
        activities.push({
            icon: 'user-plus',
            title: 'Contact Added',
            description: `${contact.name} was added to your network`,
            time: formatRelativeTime(contact.created_at),
            color: '#10b981'
        });
    });
    
    // Add recent favorites
    const recentFavorites = contacts.filter(c => c.favorite).slice(-2);
    recentFavorites.forEach(contact => {
        activities.push({
            icon: 'star',
            title: 'Contact Starred',
            description: `${contact.name} marked as favorite`,
            time: 'Recently',
            color: '#f59e0b'
        });
    });
    
    return activities.slice(0, 5);
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// Enhanced Rendering (used only by bulk/advanced features with explicit list)
function renderContactsAdvanced(contactsToRender) {
    if (!contactsToRender) return;
    const grid = document.getElementById('contactsGrid');
    
    if (contactsToRender.length === 0) {
        grid.style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
        return;
    }
    
    grid.style.display = 'grid';
    document.getElementById('emptyState').style.display = 'none';
    
    grid.innerHTML = contactsToRender.map(contact => createContactCard(contact)).join('');
    lucide.createIcons();
}

function createContactCard(contact) {
    const avatarColor = getAvatarColor(contact.name);
    const initials = getInitials(contact.name);
    
    return `
        <div class="contact-card ${appState.viewMode}" data-contact-id="${contact.id}">
            ${appState.bulkMode ? `
                <div class="bulk-checkbox-wrapper">
                    <input type="checkbox" class="bulk-checkbox" 
                           onchange="selectContact('${contact.id}')"
                           ${appState.selectedContacts.has(contact.id) ? 'checked' : ''}>
                </div>
            ` : ''}
            
            <div class="contact-avatar" style="background: ${avatarColor}">
                ${initials}
            </div>
            
            <div class="contact-info">
                <h3>${contact.name}</h3>
                <p>${contact.phone}</p>
                <span class="contact-email">${contact.email}</span>
            </div>
            
            <div class="contact-meta">
                <span class="category-tag ${contact.category.toLowerCase()}">${contact.category}</span>
                ${contact.favorite ? '<i data-lucide="star" class="favorite-icon"></i>' : ''}
            </div>
            
            <div class="contact-actions">
                <button onclick="editContact('${contact.id}')" class="action-btn-edit">
                    <i data-lucide="edit"></i>
                </button>
                <button onclick="deleteContact('${contact.id}')" class="action-btn-delete">
                    <i data-lucide="trash-2"></i>
                </button>
                <button onclick="openTimeline('${contact.id}')" class="action-btn-timeline">
                    <i data-lucide="history"></i>
                </button>
            </div>
        </div>
    `;
}

// Initialize advanced features
document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleCommandKeydown);
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('show');
        }
    });
    
    // Initialize smart features
    updateSmartSuggestions();
    updateRecentActivity();
    
    // Set up periodic updates
    setInterval(() => {
        updateSmartSuggestions();
        updateRecentActivity();
    }, 60000); // Update every minute
});

// Clear search function
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('globalSearchInput').value = '';
    appState.searchQuery = '';
    filterContacts();
}

// Copy contact details
function copyContactDetails() {
    // Implementation depends on which contact is being viewed
    showToast('Contact details copied to clipboard', 'success');
}

// Enhanced chart switching
function switchChart(type) {
    document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Re-render the network chart with the new type
    renderNetworkChart(type);
}

function renderNetworkChart(type) {
    const ctx = document.getElementById('networkChart').getContext('2d');
    const data = getCategoryDistribution();
    
    // Destroy existing chart if it exists
    if (window.networkChartInstance) {
        window.networkChartInstance.destroy();
    }
    
    window.networkChartInstance = new Chart(ctx, {
        type: type,
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899',
                    '#10b981'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: type !== 'pie',
                    position: type === 'bar' ? 'bottom' : 'right'
                }
            }
        }
    });
}
