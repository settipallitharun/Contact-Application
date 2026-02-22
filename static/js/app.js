let contacts = [];
let filteredContacts = [];
let showFavoritesOnly = false;

async function loadContacts() {
    try {
        const response = await fetch('/api/contacts');
        contacts = await response.json();
        filteredContacts = contacts;
        renderContacts();
        updateStats();
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function renderContacts() {
    const grid = document.getElementById('contactsGrid');
    
    if (filteredContacts.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: white; font-size: 1.5em; padding: 50px;">No contacts found</div>';
        return;
    }
    
    grid.innerHTML = filteredContacts.map(contact => `
        <div class="contact-card">
            <div class="contact-header">
                <div class="contact-name">${contact.name}</div>
                <div class="favorite-icon" onclick="toggleFavorite('${contact.id}')">
                    ${contact.favorite ? '⭐' : '☆'}
                </div>
            </div>
            <div class="contact-info"><strong>📞</strong> ${contact.phone}</div>
            <div class="contact-info"><strong>📧</strong> ${contact.email}</div>
            <span class="category-badge category-${contact.category}">${contact.category}</span>
            <div class="contact-info" style="font-size: 0.9em; color: #999;">
                Created: ${new Date(contact.created_at).toLocaleDateString()}
            </div>
            <div class="contact-actions">
                <button class="btn-edit" onclick='editContact(${JSON.stringify(contact)})'>✏️ Edit</button>
                <button class="btn-delete" onclick="deleteContact('${contact.id}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('totalContacts').textContent = contacts.length;
    document.getElementById('favoriteCount').textContent = contacts.filter(c => c.favorite).length;
}

function filterContacts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm) || 
                            contact.phone.includes(searchTerm) || 
                            contact.email.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || contact.category === category;
        const matchesFavorite = !showFavoritesOnly || contact.favorite;
        
        return matchesSearch && matchesCategory && matchesFavorite;
    });
    
    renderContacts();
}

function toggleFavorites() {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = event.target;
    btn.style.background = showFavoritesOnly ? '#ff6b6b' : '#ffd700';
    filterContacts();
}

async function toggleFavorite(id) {
    const contact = contacts.find(c => c.id === id);
    contact.favorite = !contact.favorite;
    
    try {
        await fetch(`/api/contacts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contact)
        });
        loadContacts();
    } catch (error) {
        console.error('Error updating favorite:', error);
    }
}

function openModal() {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Add New Contact';
    document.getElementById('contactForm').reset();
    document.getElementById('contactId').value = '';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function editContact(contact) {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Edit Contact';
    document.getElementById('contactId').value = contact.id;
    document.getElementById('name').value = contact.name;
    document.getElementById('phone').value = contact.phone;
    document.getElementById('email').value = contact.email;
    document.getElementById('category').value = contact.category;
    document.getElementById('favorite').checked = contact.favorite;
}

async function saveContact(event) {
    event.preventDefault();
    
    const contactId = document.getElementById('contactId').value;
    const contactData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        category: document.getElementById('category').value,
        favorite: document.getElementById('favorite').checked
    };
    
    try {
        if (contactId) {
            await fetch(`/api/contacts/${contactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
        } else {
            await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
        }
        
        closeModal();
        loadContacts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
        loadContacts();
    } catch (error) {
        console.error('Error deleting contact:', error);
    }
}

function exportContacts() {
    const dataStr = JSON.stringify(contacts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

loadContacts();
