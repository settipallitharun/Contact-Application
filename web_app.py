from flask import Flask, render_template, request, jsonify
import json
import os
import re
import uuid
from datetime import datetime

app = Flask(__name__)

class ContactManager:
    FILE_NAME = "contacts.json"

    @staticmethod
    def load_contacts():
        if not os.path.exists(ContactManager.FILE_NAME):
            return []
        try:
            with open(ContactManager.FILE_NAME, "r") as file:
                return json.load(file)
        except json.JSONDecodeError:
            return []

    @staticmethod
    def save_contacts(contacts):
        with open(ContactManager.FILE_NAME, "w") as file:
            json.dump(contacts, file, indent=4)

    @staticmethod
    def validate_email(email):
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        return re.match(pattern, email) is not None

    @staticmethod
    def validate_phone(phone):
        return phone.isdigit() and len(phone) >= 10

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    contacts = ContactManager.load_contacts()
    return jsonify(contacts)

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    data = request.json
    
    if not ContactManager.validate_phone(data.get('phone', '')):
        return jsonify({'error': 'Invalid phone number'}), 400
    
    if not ContactManager.validate_email(data.get('email', '')):
        return jsonify({'error': 'Invalid email format'}), 400
    
    contact = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'phone': data['phone'],
        'email': data['email'],
        'category': data.get('category', 'General'),
        'favorite': data.get('favorite', False),
        'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    contacts = ContactManager.load_contacts()
    contacts.append(contact)
    ContactManager.save_contacts(contacts)
    
    return jsonify(contact), 201

@app.route('/api/contacts/<contact_id>', methods=['PUT'])
def update_contact(contact_id):
    data = request.json
    contacts = ContactManager.load_contacts()
    
    for contact in contacts:
        if contact['id'] == contact_id:
            if 'phone' in data and not ContactManager.validate_phone(data['phone']):
                return jsonify({'error': 'Invalid phone number'}), 400
            if 'email' in data and not ContactManager.validate_email(data['email']):
                return jsonify({'error': 'Invalid email format'}), 400
            
            contact.update({k: v for k, v in data.items() if k != 'id'})
            ContactManager.save_contacts(contacts)
            return jsonify(contact)
    
    return jsonify({'error': 'Contact not found'}), 404

@app.route('/api/contacts/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    contacts = ContactManager.load_contacts()
    updated = [c for c in contacts if c['id'] != contact_id]
    
    if len(updated) == len(contacts):
        return jsonify({'error': 'Contact not found'}), 404
    
    ContactManager.save_contacts(updated)
    return jsonify({'message': 'Contact deleted'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
