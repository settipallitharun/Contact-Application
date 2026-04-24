# 📱 Advanced Contact Manager

A professional contact management system with **two interfaces**: a command-line application and a modern web-based interface.

## 🚀 Features

### Core Features (Both Versions)
- ✅ Add contacts with validation
- 📋 View all contacts
- 🔍 Search contacts by name
- ✏️ Update contact information
- 🗑️ Delete contacts
- 📧 Email validation
- 📞 Phone number validation (minimum 10 digits)
- 💾 JSON file-based storage or Supabase cloud storage

### Web Version Exclusive Features
- ⭐ Mark contacts as favorites
- 🏷️ Categorize contacts (Family, Friends, Work, General)
- 📊 Real-time statistics dashboard
- 📥 Export contacts to JSON/CSV
- 🎨 Modern responsive UI with animations
- 📱 Mobile-friendly design
- 🔍 Advanced search with filters
- 📈 Analytics and insights
- 🤖 AI-powered suggestions and duplicate detection
- 📦 Bulk import/export operations
- 🔄 Bulk update and delete operations

### Advanced Interfaces
- ⚡ **Ultra Pro Interface** (`/ultra-pro`): 3D holographic UI with neural networks
- 🧠 **AI Dashboard** (`/ai-dashboard`): AI-powered contact intelligence platform

## 📦 Installation

1. **Clone or download the project**

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## 🎯 Usage

### Option 1: Command Line Interface (CLI)

Run the CLI version:
```bash
python app.py
```

**CLI Menu:**
```
1. Add Contact
2. View Contacts
3. Search Contact
4. Update Contact
5. Delete Contact
6. Exit
```

**Example Usage:**
- Select option 1 to add a new contact
- Enter name, phone (10+ digits), and valid email
- View all contacts with option 2
- Search by name with option 3
- Update or delete using contact ID

### Option 2: Web Application

Run the Flask web server:
```bash
python web_app.py
```

Open your browser and navigate to:
```
http://localhost:5000
```

**Web Interface Features:**
- Click **"➕ Add Contact"** to create new contacts
- Use the **search bar** to find contacts instantly
- **Filter by category** using the dropdown menu
- Click **"⭐ Favorites"** to show only starred contacts
- Click **"📥 Export"** to download all contacts as JSON
- **Edit or delete** contacts using card buttons
- Click the **star icon** to mark/unmark favorites

## 🛠️ Tech Stack

### Backend
- **Python 3.x**
- **Flask** (Web framework)
- **JSON** (Data storage)

### Frontend (Web Version)
- **HTML5**
- **CSS3** (Gradient backgrounds, animations)
- **JavaScript** (Vanilla JS)

### Libraries
- `uuid` - Unique contact IDs
- `re` - Email validation
- `datetime` - Timestamps


## 🔧 API Endpoints (Web Version)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main web interface |
| GET | `/ultra-pro` | Ultra Pro holographic interface |
| GET | `/ai-dashboard` | AI-powered dashboard |
| GET | `/api/contacts` | Get all contacts |
| POST | `/api/contacts` | Add new contact |
| PUT | `/api/contacts/<id>` | Update contact |
| DELETE | `/api/contacts/<id>` | Delete contact |
| GET | `/api/contacts/search` | Advanced search with filters |
| GET | `/api/analytics` | Contact analytics and insights |
| GET | `/api/ai/suggestions` | AI-powered suggestions |
| GET | `/api/export` | Export contacts (JSON/CSV) |
| POST | `/api/contacts/bulk` | Bulk import contacts |
| POST | `/api/contacts/bulk/delete` | Bulk delete contacts |
| POST | `/api/contacts/bulk/update` | Bulk update contacts |
| GET | `/api/contacts/<id>/notes` | Get contact notes |
| POST | `/api/contacts/<id>/notes` | Add note to contact |

## ✅ Validation Rules

- **Phone:** Must be numeric and at least 10 digits
- **Email:** Must match standard email format (user@domain.com)
- **Name:** Required field

## 💡 Key Differences

| Feature | CLI (app.py) | Web (web_app.py) |
|---------|--------------|------------------|
| Interface | Terminal | Browser |
| Categories | ❌ | ✅ |
| Favorites | ❌ | ✅ |
| Export | ❌ | ✅ |
| Statistics | ❌ | ✅ |
| Responsive Design | N/A | ✅ |
| Real-time Search | ❌ | ✅ |

## 🎨 Screenshots

### CLI Version
```
📞 Advanced Contact Manager
1. Add Contact
2. View Contacts
3. Search Contact
4. Update Contact
5. Delete Contact
6. Exit
```

### Web Version
- Modern card-based layout
- Gradient backgrounds
- Smooth animations
- Mobile responsive

## 📝 Data Storage

Contacts are stored in `contacts.json` with the following structure:

```json
[
  {
    "id": "unique-uuid",
    "name": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "category": "Work",
    "favorite": false,
    "created_at": "2024-01-01 12:00:00"
  }
]
```

## 🚦 Getting Started

**For beginners:**
1. Start with the CLI version (`app.py`) to understand basic functionality
2. Move to the web version (`web_app.py`) for a modern interface

**For developers:**
- Both versions share the same data file (`contacts.json`)
- You can switch between CLI and web interface seamlessly
- Modify the code to add custom features

## 🤝 Contributing

Feel free to fork this project and add your own features!

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Created as a demonstration of Python CLI and Flask web development.

---

**Choose your preferred interface and start managing your contacts efficiently!** 🎉
