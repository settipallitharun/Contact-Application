import json
import os
import re
import uuid
from datetime import datetime


class Contact:
    def __init__(self, name, phone, email):
        self.id = str(uuid.uuid4())
        self.name = name
        self.phone = phone
        self.email = email
        self.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return self.__dict__


class ContactManager:
    FILE_NAME = "contacts.json"

    def __init__(self):
        self.contacts = self.load_contacts()

    def load_contacts(self):
        if not os.path.exists(self.FILE_NAME):
            return []
        try:
            with open(self.FILE_NAME, "r") as file:
                return json.load(file)
        except json.JSONDecodeError:
            return []

    def save_contacts(self):
        with open(self.FILE_NAME, "w") as file:
            json.dump(self.contacts, file, indent=4)

    def validate_email(self, email):
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        return re.match(pattern, email)

    def validate_phone(self, phone):
        return phone.isdigit() and len(phone) >= 10

    def add_contact(self):
        name = input("Enter Name: ").strip()
        phone = input("Enter Phone Number: ").strip()
        email = input("Enter Email: ").strip()

        if not self.validate_phone(phone):
            print("❌ Invalid phone number.\n")
            return

        if not self.validate_email(email):
            print("❌ Invalid email format.\n")
            return

        contact = Contact(name, phone, email)
        self.contacts.append(contact.to_dict())
        self.save_contacts()
        print("✅ Contact added successfully!\n")

    def view_contacts(self):
        if not self.contacts:
            print("📂 No contacts found.\n")
            return

        print("\n📒 Contact List")
        print("=" * 60)

        for contact in self.contacts:
            print(f"ID      : {contact['id']}")
            print(f"Name    : {contact['name']}")
            print(f"Phone   : {contact['phone']}")
            print(f"Email   : {contact['email']}")
            print(f"Created : {contact['created_at']}")
            print("-" * 60)
        print()

    def search_contact(self):
        keyword = input("Enter name to search: ").lower()
        results = [c for c in self.contacts if keyword in c['name'].lower()]

        if not results:
            print("❌ No matching contacts found.\n")
            return

        print("\n🔍 Search Results")
        print("=" * 60)
        for contact in results:
            print(f"ID    : {contact['id']}")
            print(f"Name  : {contact['name']}")
            print(f"Phone : {contact['phone']}")
            print(f"Email : {contact['email']}")
            print("-" * 60)
        print()

    def delete_contact(self):
        contact_id = input("Enter Contact ID to delete: ").strip()
        updated_list = [c for c in self.contacts if c['id'] != contact_id]

        if len(updated_list) == len(self.contacts):
            print("❌ Contact not found.\n")
            return

        self.contacts = updated_list
        self.save_contacts()
        print("🗑 Contact deleted successfully!\n")

    def update_contact(self):
        contact_id = input("Enter Contact ID to update: ").strip()

        for contact in self.contacts:
            if contact['id'] == contact_id:
                contact['name'] = input("New Name: ") or contact['name']
                contact['phone'] = input("New Phone: ") or contact['phone']
                contact['email'] = input("New Email: ") or contact['email']
                self.save_contacts()
                print("✏ Contact updated successfully!\n")
                return

        print("❌ Contact not found.\n")

    def menu(self):
        while True:
            print("\n📞 Advanced Contact Manager")
            print("1. Add Contact")
            print("2. View Contacts")
            print("3. Search Contact")
            print("4. Update Contact")
            print("5. Delete Contact")
            print("6. Exit")

            choice = input("Enter choice (1-6): ")

            actions = {
                "1": self.add_contact,
                "2": self.view_contacts,
                "3": self.search_contact,
                "4": self.update_contact,
                "5": self.delete_contact
            }

            if choice in actions:
                actions[choice]()
            elif choice == "6":
                print("👋 Exiting... Goodbye!")
                break
            else:
                print("❌ Invalid choice.\n")


if __name__ == "__main__":
    manager = ContactManager()
    manager.menu()