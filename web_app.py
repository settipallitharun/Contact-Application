import os
import re
import uuid
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

# --- Suppress Flask Startup Messages ---
import sys
from io import StringIO
import logging

os.environ['FLASK_ENV'] = 'production'

app = Flask(__name__)
app.config['PROPAGATE_EXCEPTIONS'] = True

# Disable Flask/Werkzeug logging completely
log_werkzeug = logging.getLogger('werkzeug')
log_flask = logging.getLogger('flask')
log_werkzeug.setLevel(logging.CRITICAL)
log_flask.setLevel(logging.CRITICAL)
log_werkzeug.propagate = False
log_flask.propagate = False

# Disable all handlers
log_werkzeug.handlers = []
log_flask.handlers = []

# --- Supabase Setup ---
supabase = None
try:
    from supabase import create_client, Client
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    if url and key:
        supabase: Client = create_client(url, key)
        supabase.table('contacts').select('id').limit(1).execute()
        print("Supabase connected successfully")
    else:
        print("Supabase credentials missing in .env")
except Exception as e:
    print(f"Supabase unavailable: {e}")
    supabase = None

# --- Local Fallback ---
import json
LOCAL_FILE = 'contacts.json'

def local_load():
    try:
        if os.path.exists(LOCAL_FILE):
            with open(LOCAL_FILE, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return []

def local_save(contacts):
    with open(LOCAL_FILE, 'w') as f:
        json.dump(contacts, f, indent=2)

# --- Validators ---
def valid_email(email):
    if not email or not email.strip():
        return True  # optional
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

def valid_phone(phone):
    if not phone or not phone.strip():
        return False
    return len(re.sub(r'\D', '', phone)) >= 10

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ultra-pro')
def ultra_pro():
    return render_template('ultra-pro-dashboard.html')

@app.route('/ai-dashboard')
def ai_dashboard():
    return render_template('ai-dashboard.html')

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    try:
        if supabase:
            res = supabase.table('contacts').select('*').order('created_at', desc=True).execute()
            return jsonify(res.data)
        return jsonify(local_load())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    try:
        data = request.json
        if not data.get('name', '').strip():
            return jsonify({'error': 'Name is required'}), 400
        if not valid_phone(data.get('phone', '')):
            return jsonify({'error': 'Phone must have at least 10 digits'}), 400
        if not valid_email(data.get('email', '')):
            return jsonify({'error': 'Invalid email format'}), 400

        contact = {
            'id': str(uuid.uuid4()),
            'name': data['name'].strip(),
            'phone': data['phone'].strip(),
            'email': data.get('email', '').strip(),
            'category': data.get('category', 'General'),
            'favorite': data.get('favorite', False),
            'follow_up_date': data.get('follow_up_date') or None,
            'created_at': datetime.now().isoformat(),
        }

        if supabase:
            # Only insert fields that exist in Supabase table
            supabase_contact = {
                'id': contact['id'],
                'name': contact['name'],
                'phone': contact['phone'],
                'email': contact['email'],
                'category': contact['category'],
                'favorite': contact['favorite'],
                'follow_up_date': contact['follow_up_date'],
                'created_at': contact['created_at'],
            }
            res = supabase.table('contacts').insert(supabase_contact).execute()
            return jsonify(res.data[0]), 201
        else:
            # For local storage, include all fields
            full_contact = contact.copy()
            full_contact.update({
                'latitude': data.get('latitude') or None,
                'longitude': data.get('longitude') or None,
                'address': data.get('address', '').strip() or None,
                'city': data.get('city', '').strip() or None,
                'country': data.get('country', '').strip() or None,
                'website': data.get('website', '').strip() or None,
                'linkedin': data.get('linkedin', '').strip() or None,
                'twitter': data.get('twitter', '').strip() or None,
                'notes': data.get('notes', '').strip() or None,
                'private': data.get('private', False),
            })
            contacts = local_load()
            contacts.append(full_contact)
            local_save(contacts)
            return jsonify(full_contact), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/<contact_id>', methods=['PUT'])
def update_contact(contact_id):
    try:
        data = request.json
        if 'phone' in data and not valid_phone(data['phone']):
            return jsonify({'error': 'Invalid phone number'}), 400
        if 'email' in data and not valid_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400

        update_data = {k: v for k, v in data.items() if k not in ('id', 'created_at')}

        if supabase:
            # Only update fields that exist in Supabase table
            allowed_fields = {'name', 'phone', 'email', 'category', 'favorite', 'follow_up_date'}
            supabase_update = {k: v for k, v in update_data.items() if k in allowed_fields}
            res = supabase.table('contacts').update(supabase_update).eq('id', contact_id).execute()
            if not res.data:
                return jsonify({'error': 'Contact not found'}), 404
            return jsonify(res.data[0])
        else:
            contacts = local_load()
            for i, c in enumerate(contacts):
                if c['id'] == contact_id:
                    contacts[i].update(update_data)
                    local_save(contacts)
                    return jsonify(contacts[i])
            return jsonify({'error': 'Contact not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    try:
        if supabase:
            supabase.table('contacts').delete().eq('id', contact_id).execute()
            return jsonify({'message': 'Contact deleted'}), 200
        else:
            contacts = [c for c in local_load() if c['id'] != contact_id]
            local_save(contacts)
            return jsonify({'message': 'Contact deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/<contact_id>/notes', methods=['GET'])
def get_notes(contact_id):
    try:
        if supabase:
            res = supabase.table('contact_notes').select('*').eq('contact_id', contact_id).order('created_at', desc=True).execute()
            return jsonify(res.data)
        return jsonify([])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics')
def get_analytics():
    try:
        contacts = []
        if supabase:
            res = supabase.table('contacts').select('*').execute()
            contacts = res.data
        else:
            contacts = local_load()
        
        # Calculate analytics
        analytics = {
            'total_contacts': len(contacts),
            'categories': {},
            'favorites': sum(1 for c in contacts if c.get('favorite', False)),
            'recent_contacts': len([c for c in contacts if c.get('created_at') and 
                                   (datetime.now(timezone.utc) - datetime.fromisoformat(c['created_at'].replace('Z', '+00:00'))).days <= 7]),
            'top_categories': {}
        }
        
        for contact in contacts:
            cat = contact.get('category', 'General')
            analytics['categories'][cat] = analytics['categories'].get(cat, 0) + 1
        
        analytics['top_categories'] = dict(sorted(analytics['categories'].items(), key=lambda x: x[1], reverse=True)[:5])
        
        return jsonify(analytics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/search')
def search_contacts():
    try:
        query = request.args.get('q', '').lower()
        category = request.args.get('category', '')
        favorite = request.args.get('favorite', '').lower() == 'true'
        
        if supabase:
            # Build Supabase query
            query_builder = supabase.table('contacts').select('*')
            if query:
                query_builder = query_builder.or_(f"name.ilike.%{query}%,phone.ilike.%{query}%,email.ilike.%{query}%")
            if category:
                query_builder = query_builder.eq('category', category)
            if favorite:
                query_builder = query_builder.eq('favorite', True)
            
            res = query_builder.execute()
            contacts = res.data
        else:
            contacts = local_load()
            # Filter locally
            filtered = []
            for contact in contacts:
                if query and not (query in contact.get('name', '').lower() or 
                                query in contact.get('phone', '') or 
                                query in contact.get('email', '').lower()):
                    continue
                if category and contact.get('category') != category:
                    continue
                if favorite and not contact.get('favorite', False):
                    continue
                filtered.append(contact)
            contacts = filtered
        
        return jsonify(contacts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/bulk/delete', methods=['POST'])
def bulk_delete():
    try:
        data = request.json
        contact_ids = data.get('ids', [])
        
        if not contact_ids:
            return jsonify({'error': 'No contact IDs provided'}), 400
        
        deleted = 0
        if supabase:
            for contact_id in contact_ids:
                supabase.table('contacts').delete().eq('id', contact_id).execute()
                deleted += 1
        else:
            contacts = local_load()
            contacts = [c for c in contacts if c['id'] not in contact_ids]
            local_save(contacts)
            deleted = len(contact_ids)
        
        return jsonify({'deleted': deleted}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/bulk/update', methods=['POST'])
def bulk_update():
    try:
        data = request.json
        contact_ids = data.get('ids', [])
        updates = data.get('updates', {})
        
        if not contact_ids or not updates:
            return jsonify({'error': 'Contact IDs and updates required'}), 400
        
        # Filter allowed fields
        allowed_fields = {'category', 'favorite', 'follow_up_date'}
        supabase_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        updated = 0
        if supabase and supabase_updates:
            for contact_id in contact_ids:
                res = supabase.table('contacts').update(supabase_updates).eq('id', contact_id).execute()
                if res.data:
                    updated += 1
        else:
            contacts = local_load()
            for i, contact in enumerate(contacts):
                if contact['id'] in contact_ids:
                    contacts[i].update(updates)
                    updated += 1
            local_save(contacts)
        
        return jsonify({'updated': updated}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/suggestions')
def get_ai_suggestions():
    try:
        if supabase:
            res = supabase.table('contacts').select('*').execute()
            contacts = res.data
        else:
            contacts = local_load()
        
        # Simple AI suggestions (can be enhanced with real ML)
        suggestions = {
            'duplicate_check': detect_duplicates(contacts),
            'missing_info': find_missing_info(contacts),
            'communication_patterns': analyze_patterns(contacts),
            'follow_up_reminders': get_follow_up_reminders(contacts)
        }
        
        return jsonify(suggestions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export', methods=['GET'])
def export_contacts():
    try:
        format_type = request.args.get('format', 'json')
        
        if supabase:
            res = supabase.table('contacts').select('*').execute()
            contacts = res.data
        else:
            contacts = local_load()
        
        if format_type == 'csv':
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=['name', 'phone', 'email', 'category', 'favorite', 'created_at'])
            writer.writeheader()
            for contact in contacts:
                writer.writerow({
                    'name': contact.get('name', ''),
                    'phone': contact.get('phone', ''),
                    'email': contact.get('email', ''),
                    'category': contact.get('category', 'General'),
                    'favorite': contact.get('favorite', False),
                    'created_at': contact.get('created_at', '')
                })
            
            return output.getvalue(), 200, {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename=contacts.csv'
            }
        
        return jsonify(contacts), 200, {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename=contacts.json'
        }
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- AI Helper Functions ---
def detect_duplicates(contacts):
    """Simple duplicate detection based on phone/email"""
    seen_phones = {}
    seen_emails = {}
    duplicates = []
    
    for contact in contacts:
        phone = contact.get('phone', '').strip()
        email = contact.get('email', '').strip().lower()
        
        if phone and phone in seen_phones:
            duplicates.append({
                'type': 'phone',
                'value': phone,
                'contacts': [seen_phones[phone], contact['id']]
            })
        elif phone:
            seen_phones[phone] = contact['id']
            
        if email and email in seen_emails:
            duplicates.append({
                'type': 'email', 
                'value': email,
                'contacts': [seen_emails[email], contact['id']]
            })
        elif email:
            seen_emails[email] = contact['id']
    
    return duplicates

def find_missing_info(contacts):
    """Find contacts missing important information"""
    missing = {
        'no_email': [],
        'no_category': [],
        'old_contacts': []
    }
    
    for contact in contacts:
        if not contact.get('email', '').strip():
            missing['no_email'].append(contact['id'])
        if not contact.get('category') or contact.get('category') == 'General':
            missing['no_category'].append(contact['id'])
        
        # Contacts older than 6 months
        if contact.get('created_at'):
            created = datetime.fromisoformat(contact['created_at'].replace('Z', '+00:00'))
            if (datetime.now(timezone.utc) - created).days > 180:
                missing['old_contacts'].append(contact['id'])
    
    return missing

def analyze_patterns(contacts):
    """Analyze communication patterns"""
    categories = {}
    favorites_count = 0
    
    for contact in contacts:
        cat = contact.get('category', 'General')
        categories[cat] = categories.get(cat, 0) + 1
        if contact.get('favorite'):
            favorites_count += 1
    
    return {
        'category_distribution': categories,
        'favorite_percentage': (favorites_count / len(contacts)) * 100 if contacts else 0,
        'most_common_category': max(categories, key=categories.get) if categories else None
    }

def get_follow_up_reminders(contacts):
    """Get contacts needing follow-up"""
    reminders = []
    now = datetime.now(timezone.utc)
    
    for contact in contacts:
        if contact.get('follow_up_date'):
            follow_up = datetime.fromisoformat(contact['follow_up_date'])
            if follow_up <= now:
                reminders.append({
                    'id': contact['id'],
                    'name': contact['name'],
                    'days_overdue': (now - follow_up).days
                })
    
    return sorted(reminders, key=lambda x: x['days_overdue'], reverse=True)


if __name__ == '__main__':
    import sys
    import io
    import socket
    
    # Get local IP address
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print("✓ === Contact Application ===")
    print(f"✓ Storage: {'Supabase' if supabase else 'Local JSON (contacts.json)'}")
    print(f"✓ Local: http://localhost:5000")
    print(f"✓ Network: http://{local_ip}:5000")
    print("✓ Server started (Ctrl+C to stop)")
    print("-" * 50)
    print("✓ Access from other devices using: http://{local_ip}:5000")
    print("✓ (Make sure firewall allows port 5000)")
    print("-" * 50 + "\n")
    sys.stdout.flush()
    
    # Redirect stdout and stderr to suppress Flask/Werkzeug messages
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    # Create a null stream to discard messages
    devnull = io.StringIO()
    
    try:
        sys.stdout = devnull
        sys.stderr = devnull
        app.run(debug=False, port=5000, host='0.0.0.0', use_reloader=False, use_debugger=False, threaded=True)
    except KeyboardInterrupt:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        print("\n✓ Server stopped.")
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
