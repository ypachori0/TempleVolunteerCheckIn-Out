from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import time
from datetime import datetime
from sheets_service import SheetsService

app = Flask(__name__)
# Configure CORS to allow all origins and methods
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize Google Sheets service
sheets = SheetsService()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

@app.route('/')
def home():
    try:
        # Return active volunteers from Google Sheets
        active_volunteers = sheets.get_active_volunteers()
        return jsonify({
            "volunteers": active_volunteers
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/volunteer', methods=['POST'])
def register_volunteer():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        
        if not name or not email:
            return jsonify({"error": "Name and email are required"}), 400
        
        # Check if volunteer is already registered
        registered_volunteers = sheets.get_registered_volunteers()
        if any(v['email'] == email for v in registered_volunteers):
            return jsonify({"error": "Email already registered"}), 400
        
        new_volunteer = {
            "name": name,
            "email": email,
            "registered_at": datetime.now().isoformat()
        }
        
        # Add to Google Sheets
        sheets.add_registered_volunteer(new_volunteer)
        return jsonify(new_volunteer), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/log', methods=['POST'])
def check_in():
    try:
        # Check if the form data exists
        if not request.form:
            return jsonify({"error": "No form data provided"}), 400
        
        email = request.form.get('username')
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        # Check if volunteer is registered
        registered_volunteers = sheets.get_registered_volunteers()
        volunteer = next((v for v in registered_volunteers if v['email'] == email), None)
        if not volunteer:
            return jsonify({"error": "Volunteer not found. Please register first."}), 404
        
        # Check if volunteer is already checked in
        active_volunteers = sheets.get_active_volunteers()
        is_checked_in = any(v['email'] == email for v in active_volunteers)
        
        if is_checked_in:
            # Check out
            sheets.update_active_volunteers(volunteer, is_checking_in=False)
            return jsonify({
                "message": "Checked out successfully",
                "status": "checked_out"
            }), 200
        else:
            # Check in
            check_in_volunteer = {
                "name": volunteer['name'],
                "email": volunteer['email'],
                "joined_at": datetime.now().isoformat(),
                "is_active": True
            }
            sheets.update_active_volunteers(check_in_volunteer, is_checking_in=True)
            return jsonify({
                "message": "Checked in successfully",
                "status": "checked_in",
                "volunteer": check_in_volunteer
            }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin')
def admin():
    try:
        return jsonify({
            "registered_volunteers": sheets.get_registered_volunteers(),
            "active_volunteers": sheets.get_active_volunteers(),
            "volunteer_hours": sheets.get_volunteer_hours()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/hours/<email>')
def get_volunteer_hours(email):
    try:
        hours = sheets.get_volunteer_hours(email)
        if not hours:
            return jsonify({"hours": []}), 200  # Return empty array instead of 404
        return jsonify({"hours": hours})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, ssl_context=None, port=5000)  # Disable SSL for local development 