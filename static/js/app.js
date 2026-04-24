let contacts = [];
let vaultActive = false;
let currentPin = "";
const VAULT_PIN = "1234";
let selectedContacts = new Set();
let isSelectionMode = false;

function updateSidebar() {
    const sidebar = document.getElementById('sidebarFavs');
    const favs = contacts.filter(c => c.favorite).slice(0, 5);
    
    if (favs.length === 0) {
        sidebar.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85em; text-align: center; padding: 20px;">No favorites yet. Star a contact to see them here!</p>';
        return;
    }

    sidebar.innerHTML = favs.map(contact => `
        <div class="mini-fav-card" onclick="copyToClipboard('${contact.phone}', 'Phone')">
            <div class="mini-avatar" style="background: ${getAvatarColor(contact.name)}; color: white">
                ${getInitials(contact.name)}
            </div>
            <div class="mini-info">
                <h4>${contact.name}</h4>
                <span>${contact.phone}</span>
            </div>
            <i data-lucide="phone" style="width: 14px; height: 14px; margin-left: auto; color: var(--primary); opacity: 0.6"></i>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- Smart Reminders Logic ---
function updateReminders() {
    const remindersSidebar = document.getElementById('sidebarReminders');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Filter contacts with a follow-up date today or in the future
    let upcoming = contacts.filter(c => c.follow_up_date)
        .map(c => {
            const dateObj = new Date(c.follow_up_date);
            return {
                ...c,
                parsedDate: dateObj,
                diffDays: Math.ceil((dateObj - today) / (1000 * 60 * 60 * 24))
            };
        })
        .filter(c => c.diffDays >= 0)
        .sort((a, b) => a.parsedDate - b.parsedDate)
        .slice(0, 5); // display next 5 upcoming

    if (upcoming.length === 0) {
        remindersSidebar.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85em; text-align: center; padding: 20px;">No upcoming events or follow-ups.</p>';
        return;
    }

    remindersSidebar.innerHTML = upcoming.map(c => {
        const dateStr = c.parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const labelStr = c.diffDays === 0 ? '<span style="color: var(--accent); font-weight: bold;">Today!</span>' :
                         c.diffDays === 1 ? 'Tomorrow' : `In ${c.diffDays} days`;
        
        return `
            <div class="mini-fav-card reminder-card">
                <div class="reminder-date">
                    <span class="r-mon">${c.parsedDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span class="r-day">${c.parsedDate.getDate()}</span>
                </div>
                <div class="mini-info">
                    <h4>${c.name}</h4>
                    <span style="font-size: 0.8em; opacity: 0.8;">${labelStr}</span>
                </div>
                <button class="action-btn" style="padding: 5px; background: transparent; border: 1px solid var(--accent); color: var(--accent); border-radius: 8px; font-size: 0.7em;" onclick="editContact(${JSON.stringify(c).replace(/"/g, '&quot;')})">View</button>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

// --- Security Vault Logic ---
function openVault() {
    document.getElementById('vaultStage').style.display = 'flex';
    clearPin();
}

function closeVault() {
    document.getElementById('vaultStage').style.display = 'none';
    currentPin = "";
}

function pressPin(num) {
    if (currentPin.length < 4) {
        currentPin += num;
        updatePinDisplay();
        
        if (currentPin.length === 4) {
            if (currentPin === VAULT_PIN) {
                showToast('Access Granted to Private Vault', 'success');
                setTimeout(closeVault, 500);
                // In a real app, logic to show hidden contacts would go here
            } else {
                showToast('Invalid Security PIN', 'danger');
                setTimeout(clearPin, 500);
            }
        }
    }
}

function clearPin() {
    currentPin = "";
    updatePinDisplay();
}

function updatePinDisplay() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index < currentPin.length) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('sortOrder').value = 'newest';
    showFavoritesOnly = false;
    document.getElementById('favToggleBtn').classList.remove('active');
    filterContacts();
    showToast('Filters cleared', 'success');
}
let filteredContacts = [];
let showFavoritesOnly = false;
let newlyAddedId = null;

// Confetti pieces for celebration
function triggerConfetti() {
    const container = document.body;
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: hsl(${Math.random() * 360}, 100%, 50%);
            left: ${Math.random() * 100}vw;
            top: -10px;
            border-radius: 2px;
            z-index: 9999;
            pointer-events: none;
            transform: rotate(${Math.random() * 360}deg);
            animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
        `;
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Add keyframes for confetti dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Avatar color palettes
const avatarGradients = [
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #2dd4bf)',
    'linear-gradient(135deg, #f43f5e, #fb923c)',
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ef4444)'
];

async function loadContacts() {
    try {
        const response = await fetch('/api/contacts');
        contacts = await response.json();
        filterContacts();
        updateStats();
        updateSidebar();
        updateReminders();
        lucide.createIcons();
    } catch (error) {
        showToast('Error loading contacts', 'danger');
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function showToast(message, type = 'primary') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'danger') icon = 'alert-circle';

    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Theme Switching Engine ---
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    const icon = document.getElementById('themeIcon');
    
    // Switch Icon
    if (isLight) {
        icon.setAttribute('data-lucide', 'sun');
        localStorage.setItem('theme', 'light');
    } else {
        icon.setAttribute('data-lucide', 'moon');
        localStorage.setItem('theme', 'dark');
    }
    
    lucide.createIcons();
    showToast(`${isLight ? 'Cloud White' : 'Midnight Navy'} Mode Active`, 'success');
}

// Initial Theme Loader
(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        // We'll update the icon in world space after window load
        window.addEventListener('load', () => {
            document.getElementById('themeIcon').setAttribute('data-lucide', 'sun');
            lucide.createIcons();
        });
    }
})();

function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Voice Search not supported in this browser", "danger");
        return;
    }

    const recognition = new SpeechRecognition();
    const btn = document.getElementById('voiceSearchBtn');
    const input = document.getElementById('searchInput');

    recognition.continuous = false;
    recognition.interimResults = true; // --- This enables real-time words ---

    recognition.onstart = () => {
        btn.classList.add('listening');
        input.placeholder = "Listening...";
        input.value = "";
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                input.value = event.results[i][0].transcript;
                filterContacts(); // Filter on final
            } else {
                interimTranscript += event.results[i][0].transcript;
                input.value = interimTranscript; // Show words as you speak them
            }
        }
    };

    recognition.onerror = () => {
        btn.classList.remove('listening');
        input.placeholder = "Search by name, phone or email...";
    };

    recognition.onend = () => {
        btn.classList.remove('listening');
        input.placeholder = "Search by name, phone or email...";
    };

    recognition.start();
}

function generateQRCode(name, phone, email) {
    const qrContainer = document.getElementById('qrcode');
    const qrOverlay = document.getElementById('qrOverlay');
    const qrNameLabel = document.getElementById('qrContactName');
    const qrPhoneLabel = document.getElementById('qrContactPhone');
    
    // Clear previous QR
    qrContainer.innerHTML = "";
    qrNameLabel.textContent = name;
    qrPhoneLabel.textContent = phone;
    
    // Create vCard string (Universal Format)
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;TYPE=CELL:${phone}
EMAIL:${email}
END:VCARD`;

    // Render QR Code
    new QRCode(qrContainer, {
        text: vCard,
        width: 200,
        height: 200,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    qrOverlay.style.display = 'flex';
    lucide.createIcons();
}

function closeQR() {
    document.getElementById('qrOverlay').style.display = 'none';
}

function selectChip(element, value) {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('category').value = value;
    
    // Inject Semantic Theme
    updateTheme(value);
}

function updateTheme(category) {
    document.body.classList.remove('theme-general', 'theme-family', 'theme-friends', 'theme-work');
    document.body.classList.add(`theme-${category.toLowerCase()}`);
}

function renderContacts() {
    const grid = document.getElementById('contactsGrid');
    const query = document.getElementById('searchInput').value.toLowerCase();

    if (filteredContacts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px; animation: fadeInScale 0.6s forwards;">
                <i data-lucide="search-x" style="width: 84px; height: 84px; opacity: 0.15; margin-bottom: 24px; color: var(--primary)"></i>
                <h2 style="color: var(--text-primary); margin-bottom: 10px;">No matches found</h2>
                <p style="color: var(--text-secondary)">Try adjusting your search or category filters.</p>
                <button class="btn-primary" onclick="resetFilters()" style="margin-top: 30px;">Clear All Filters</button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const highlightText = (text, q) => {
        if (!q) return text;
        const re = new RegExp(`(${q})`, 'gi');
        return String(text).replace(re, '<mark class="highlight">$1</mark>');
    }
    
    grid.innerHTML = filteredContacts.map((contact, index) => {
        const isNew = contact.id === newlyAddedId;
        const isSelected = selectedContacts.has(contact.id);
        const stagger = `animation-delay: ${index * 0.05}s`;

        return `
            <div class="contact-card ${isNew ? 'newly-added' : ''} ${isSelected ? 'selected' : ''}" style="${stagger}" onclick="${isSelectionMode ? `toggleContactSelection('${contact.id}', event)` : `openTimeline('${contact.id}')`}">
                ${isSelectionMode ? `<div class="contact-checkbox"><input type="checkbox" id="checkbox-${contact.id}" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleContactSelection('${contact.id}', event)"></div>` : ''}
                <div class="contact-header">
                    <div class="contact-avatar" style="background: ${getAvatarColor(contact.name)}">
                        ${getInitials(contact.name)}
                    </div>
                    <div class="contact-main-info">
                        <div class="contact-name">${highlightText(contact.name, query)}</div>
                        <span class="category-tag category-${contact.category.toLowerCase()}">${contact.category}</span>
                    </div>
                    <div class="header-tools">
                        <div class="favorite-icon" onclick="event.stopPropagation(); toggleFavorite('${contact.id}')" style="color: ${contact.favorite ? '#ffcc00' : 'var(--text-secondary)'}">
                            <i data-lucide="${contact.favorite ? 'star' : 'star'}"></i>
                        </div>
                        <button class="action-btn btn-qr" onclick="event.stopPropagation(); generateQRCode('${contact.name}', '${contact.phone}', '${contact.email}')" title="Sync to Phone">
                            <i data-lucide="qr-code" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
                
                <div class="contact-details">
                    <div class="detail-item clickable-copy" onclick="event.stopPropagation(); copyToClipboard('${contact.phone}', 'Phone number')">
                        <i data-lucide="phone" class="detail-icon"></i>
                        <span>${highlightText(contact.phone, query)}</span>
                        <i data-lucide="copy" class="mini-copy"></i>
                    </div>
                    <div class="detail-item clickable-copy" onclick="event.stopPropagation(); copyToClipboard('${contact.email}', 'Email address')">
                        <i data-lucide="mail" class="detail-icon"></i>
                        <span>${highlightText(contact.email, query)}</span>
                        <i data-lucide="copy" class="mini-copy"></i>
                    </div>
                </div>
                
                <div class="contact-actions">
                    ${isSelectionMode ? '' : `<button class="action-btn btn-edit" onclick='event.stopPropagation(); editContact(${JSON.stringify(contact).replace(/'/g, "&apos;")})'>
                        <i data-lucide="edit-3"></i> Edit
                    </button>
                    <button class="action-btn btn-delete" onclick="event.stopPropagation(); deleteContact('${contact.id}')">
                        <i data-lucide="trash-2"></i> Delete
                    </button>`}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
    
    // Update toolbar after rendering
    updateSelectionToolbar();

    // Clear new tag after a delay
    if (newlyAddedId) {
        setTimeout(() => {
            newlyAddedId = null;
        }, 5000);
    }
}

// --- Multi-Select Functions ---
function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    selectedContacts.clear();
    renderContacts();
    updateSelectionToolbar();
}

function toggleContactSelection(contactId, event) {
    if (!isSelectionMode) {
        isSelectionMode = true;
    }
    
    if (selectedContacts.has(contactId)) {
        selectedContacts.delete(contactId);
    } else {
        selectedContacts.add(contactId);
    }
    
    renderContacts();
    updateSelectionToolbar();
}

function selectAllContacts() {
    if (selectedContacts.size === filteredContacts.length) {
        selectedContacts.clear();
    } else {
        filteredContacts.forEach(c => selectedContacts.add(c.id));
    }
    renderContacts();
    updateSelectionToolbar();
}

function updateSelectionToolbar() {
    const toolbar = document.getElementById('selectionToolbar');
    const count = selectedContacts.size;
    const selectedCountSpan = document.getElementById('selectedCount');
    
    if (!toolbar) return;
    
    if (count > 0 && isSelectionMode) {
        // Show toolbar with count
        selectedCountSpan.textContent = count;
        toolbar.style.display = 'flex';
        
        // Update Select All button text
        const selectAllBtn = toolbar.querySelector('.btn-secondary');
        if (selectAllBtn && selectedContacts.size === filteredContacts.length) {
            selectAllBtn.textContent = 'Deselect All';
        }
    } else if (isSelectionMode && count === 0) {
        // Selection mode but no items selected
        selectedCountSpan.textContent = '0';
        toolbar.style.display = 'flex';
    } else {
        // Hide toolbar
        toolbar.style.display = 'none';
    }
}

async function bulkDeleteContacts() {
    if (selectedContacts.size === 0) {
        showToast('No contacts selected', 'danger');
        return;
    }
    
    const count = selectedContacts.size;
    const message = `Are you sure you want to delete ${count} contact${count !== 1 ? 's' : ''}? This cannot be undone!`;
    
    if (!confirm(message)) return;
    
    try {
        const ids = Array.from(selectedContacts);
        
        const response = await fetch('/api/contacts/bulk/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: ids })
        });
        
        if (response.ok) {
            const result = await response.json();
            selectedContacts.clear();
            isSelectionMode = false;
            await loadContacts();
            showToast(`✅ Deleted ${result.deleted} contact${result.deleted !== 1 ? 's' : ''}!`, 'success');
        } else {
            const err = await response.json();
            showToast(err.error || 'Failed to delete contacts', 'danger');
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        showToast('Error deleting contacts', 'danger');
    }
}

let networkChartInstance = null;

function updateStats() {
    document.getElementById('totalContacts').textContent = contacts.length;
    document.getElementById('favoriteCount').textContent = contacts.filter(c => c.favorite).length;

    const categories = ['General', 'Family', 'Friends', 'Work'];
    const counts = categories.map(cat => contacts.filter(c => c.category === cat).length);
    
    const ctx = document.getElementById('networkChart');
    if (!ctx) return;

    if (networkChartInstance) {
        networkChartInstance.destroy();
    }

    const isLightMode = document.body.classList.contains('light-mode');
    const textColor = isLightMode ? '#64748b' : '#94a3b8';

    networkChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: ['#818cf8', '#f87171', '#34d399', '#60a5fa'],
                borderColor: ['#6366f1', '#ef4444', '#10b981', '#3b82f6'],
                borderWidth: 2,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor, font: { family: "'Outfit', sans-serif" } }
                }
            }
        }
    });
}

function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${label} copied to clipboard`, 'success');
    });
}

function filterContacts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;

    filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm) ||
            contact.phone.includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || contact.category === category;
        const matchesFavorite = !showFavoritesOnly || contact.favorite;

        return matchesSearch && matchesCategory && matchesFavorite;
    });

    // Sort logic
    filteredContacts.sort((a, b) => {
        if (sortOrder === 'az') return a.name.localeCompare(b.name);
        if (sortOrder === 'za') return b.name.localeCompare(a.name);
        if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        return 0;
    });

    renderContacts();
}

function toggleFavorites() {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = document.getElementById('favToggleBtn');
    btn.classList.toggle('active', showFavoritesOnly);
    filterContacts();
}

async function toggleFavorite(id) {
    const contact = contacts.find(c => c.id === id);
    const updatedContact = { ...contact, favorite: !contact.favorite };

    try {
        const response = await fetch(`/api/contacts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedContact)
        });

        if (response.ok) {
            await loadContacts();
            showToast(updatedContact.favorite ? 'Marked as favorite' : 'Removed from favorites', 'success');
        }
    } catch (error) {
        showToast('Error updating favorite', 'danger');
    }
}

function openForm() {
    const listView = document.getElementById('listView');
    const formView = document.getElementById('formView');

    listView.classList.add('view-hidden');
    setTimeout(() => {
        listView.style.display = 'none';
        formView.style.display = 'block';
        formView.classList.remove('view-hidden');
        lucide.createIcons();
    }, 300);

    document.title = "ContactPro | Create";
    
    // Fully reset the form
    const form = document.getElementById('contactForm');
    if (form) {
        form.reset();
    }
    
    // Clear all field values explicitly
    document.getElementById('contactId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('followUpDate').value = '';
    document.getElementById('category').value = 'General';
    
    // Reset the save button
    const saveBtn = document.querySelector('.luxury-save');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="save"></i> Save Contact';
    }
    
    document.getElementById('formTitle').textContent = 'Create New Contact';
    
    // Reset to General chip
    const chips = document.querySelectorAll('.chip');
    chips.forEach(c => c.classList.remove('active'));
    if (chips[0]) chips[0].classList.add('active');
    
    updateTheme('General');
    lucide.createIcons();

    setTimeout(() => {
        const nameField = document.getElementById('name');
        if (nameField) nameField.focus();
        // Initialize the map for location selection
        if (typeof initializeMap === 'function') {
            initializeMap();
        }
    }, 400);
}

function closeForm() {
    const listView = document.getElementById('listView');
    const formView = document.getElementById('formView');
    
    updateTheme('General');
    formView.classList.add('view-hidden');
    setTimeout(() => {
        formView.style.display = 'none';
        listView.style.display = 'block';
        listView.classList.remove('view-hidden');
        lucide.createIcons();
    }, 300);
    document.title = "ContactPro | Dashboard";
}

function editContact(contact) {
    openForm();
    document.getElementById('formTitle').textContent = 'Edit Profile';
    document.getElementById('contactId').value = contact.id;
    document.getElementById('name').value = contact.name;
    document.getElementById('phone').value = contact.phone;
    document.getElementById('email').value = contact.email;
    document.getElementById('followUpDate').value = contact.follow_up_date || '';
    
    // Set active chip based on category
    const chips = document.querySelectorAll('.chip');
    chips.forEach(c => {
        c.classList.remove('active');
        if (c.textContent.trim() === contact.category) {
            c.classList.add('active');
        }
    });
    
    const category = contact.category || 'General';
    document.getElementById('category').value = category;
    updateTheme(category);
}

async function saveContact(event) {
    event.preventDefault();

    const contactId = document.getElementById('contactId').value;
    const saveBtn = document.querySelector('.luxury-save');
    
    // Collect only the fields that Supabase needs
    const contactData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: (document.getElementById('email').value || '').trim(),
        category: document.getElementById('category').value,
        favorite: false,
        follow_up_date: document.getElementById('followUpDate').value || null
    };

    // Validate required fields
    if (!contactData.name) {
        showToast('Name is required', 'danger');
        return;
    }
    if (!contactData.phone || contactData.phone.replace(/\D/g, '').length < 10) {
        showToast('Phone must have at least 10 digits', 'danger');
        return;
    }

    try {
        // Show saving indicator
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader"></i> Saving...';
        lucide.createIcons();

        const url = contactId ? `/api/contacts/${contactId}` : '/api/contacts';
        const method = contactId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        });

        if (response.ok) {
            const savedContact = await response.json();
            console.log('✅ Contact saved successfully:', savedContact);
            
            if (!contactId) {
                newlyAddedId = savedContact.id;
                triggerConfetti();
            }
            
            showToast(contactId ? '✅ Changes saved!' : '✅ Contact saved to Supabase!', 'success');
            
            // Reset form completely
            document.getElementById('contactForm').reset();
            document.getElementById('contactId').value = '';
            document.getElementById('category').value = 'General';
            document.getElementById('formTitle').textContent = 'Create New Contact';
            
            // Reset chips
            const chips = document.querySelectorAll('.chip');
            chips.forEach(c => c.classList.remove('active'));
            if (chips[0]) chips[0].classList.add('active');
            
            // Re-enable button BEFORE closing form
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            lucide.createIcons();
            
            // Close form after a short delay
            setTimeout(() => {
                closeForm();
            }, 300);
            
            // Reload contacts
            await loadContacts();
            
        } else {
            const err = await response.json();
            console.error('❌ Save error:', err);
            showToast(err.error || 'Failed to save - check fields and try again', 'danger');
            
            // Re-enable button on error
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        showToast('❌ Network error - check your connection', 'danger');
        
        // Re-enable button on error
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="save"></i> Save Contact';
        lucide.createIcons();
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
        const response = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadContacts();
            showToast('Contact deleted', 'success');
        }
    } catch (error) {
        showToast('Error deleting contact', 'danger');
    }
}

function exportContactsCSV() {
    if (contacts.length === 0) {
        showToast('No contacts to export', 'danger');
        return;
    }
    
    const headers = ['Name', 'Phone', 'Email', 'Category', 'Favorite'];
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    contacts.forEach(c => {
        const values = [
            `"${c.name}"`, 
            `"${c.phone}"`, 
            `"${c.email}"`, 
            `"${c.category}"`, 
            c.favorite ? 'Yes' : 'No'
        ];
        csvRows.push(values.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exporting to CSV...', 'success');
}



/* --- Timeline Drawer Logic --- */
async function openTimeline(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    document.getElementById('timelineContactId').value = contact.id;
    document.getElementById('timelineName').textContent = contact.name;
    document.getElementById('timelineCategory').textContent = contact.category;
    document.getElementById('timelineCategory').className = `category-tag category-${contact.category.toLowerCase()}`;
    
    const avatar = document.getElementById('timelineAvatar');
    avatar.style.background = getAvatarColor(contact.name);
    avatar.textContent = getInitials(contact.name);

    document.getElementById('timelineDrawer').classList.remove('view-hidden');
    document.getElementById('timelineDrawer').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Fetch notes
    await loadNotes(contactId);
}

function closeTimeline() {
    const drawer = document.getElementById('timelineDrawer');
    drawer.classList.add('view-hidden');
    setTimeout(() => {
        drawer.style.display = 'none';
        document.body.style.overflow = '';
    }, 400);
}

async function loadNotes(contactId) {
    const timelineList = document.getElementById('timelineList');
    timelineList.innerHTML = '<div style="color:var(--text-secondary); text-align:center;">Loading timeline...</div>';

    try {
        const res = await fetch(`/api/contacts/${contactId}/notes`);
        if (res.ok) {
            const notes = await res.json();
            if (notes.length === 0) {
                timelineList.innerHTML = '<div style="color:var(--text-secondary); text-align:center;">No notes yet. Add your first note!</div>';
            } else {
                timelineList.innerHTML = notes.map(note => `
                    <div class="note-card">
                        <div class="note-date">${new Date(note.created_at).toLocaleString()}</div>
                        <div class="note-text">${note.note_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </div>
                `).join('');
            }
        } else {
            timelineList.innerHTML = '<div style="color:var(--danger); text-align:center;">Failed to load notes. Please ensure the contact_notes table exists in Supabase.</div>';
        }
    } catch (err) {
        timelineList.innerHTML = '<div style="color:var(--danger); text-align:center;">Network error while loading notes.</div>';
    }
}

async function saveNote(event) {
    event.preventDefault();
    const contactId = document.getElementById('timelineContactId').value;
    const noteText = document.getElementById('noteText').value;

    if (!noteText.trim()) return;

    try {
        const res = await fetch(`/api/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note_text: noteText })
        });

        if (res.ok) {
            document.getElementById('noteText').value = '';
            showToast('Note added to timeline', 'success');
            await loadNotes(contactId);
        } else {
            const err = await res.json();
            showToast(err.error || 'Failed to save note. Ensure contact_notes table is created.', 'danger');
        }
    } catch (err) {
        showToast('Network error while saving note', 'danger');
    }
}


loadContacts();
