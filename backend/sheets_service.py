from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime
import os

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SERVICE_ACCOUNT_FILE = 'credentials.json'  # Update this if you saved the file somewhere else
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID')

# Sheet names
REGISTERED_VOLUNTEERS_SHEET = 'Registered Volunteers'
ACTIVE_VOLUNTEERS_SHEET = 'Active Volunteers'
VOLUNTEER_HOURS_SHEET = 'Volunteer Hours'

class SheetsService:
    def __init__(self):
        try:
            credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            service = build('sheets', 'v4', credentials=credentials)
            self.sheet = service.spreadsheets()
        except Exception as e:
            print(f"Failed to initialize Google Sheets service: {str(e)}")
            raise

    def get_registered_volunteers(self):
        result = self.sheet.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f'{REGISTERED_VOLUNTEERS_SHEET}!A2:D'
        ).execute()
        values = result.get('values', [])
        volunteers = []
        for row in values:
            if len(row) >= 3:
                volunteers.append({
                    'name': row[0],
                    'email': row[1],
                    'registered_at': row[2]
                })
        return volunteers

    def get_active_volunteers(self):
        result = self.sheet.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f'{ACTIVE_VOLUNTEERS_SHEET}!A2:E'
        ).execute()
        values = result.get('values', [])
        volunteers = []
        for row in values:
            if len(row) >= 4:
                volunteers.append({
                    'name': row[0],
                    'email': row[1],
                    'joined_at': row[2],
                    'is_active': row[3] == 'True'
                })
        return volunteers

    def add_registered_volunteer(self, volunteer):
        values = [
            [
                volunteer['name'],
                volunteer['email'],
                volunteer['registered_at'],
                datetime.now().isoformat()
            ]
        ]
        body = {'values': values}
        self.sheet.values().append(
            spreadsheetId=SPREADSHEET_ID,
            range=f'{REGISTERED_VOLUNTEERS_SHEET}!A2:D2',
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()

    def update_active_volunteers(self, volunteer, is_checking_in):
        if is_checking_in:
            # Add to active volunteers
            values = [
                [
                    volunteer['name'],
                    volunteer['email'],
                    volunteer['joined_at'],
                    'True',
                    datetime.now().isoformat()
                ]
            ]
            body = {'values': values}
            self.sheet.values().append(
                spreadsheetId=SPREADSHEET_ID,
                range=f'{ACTIVE_VOLUNTEERS_SHEET}!A2:E2',
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
        else:
            # Remove from active volunteers and log hours
            active_volunteers = self.get_active_volunteers()
            for i, v in enumerate(active_volunteers):
                if v['email'] == volunteer['email']:
                    # Clear the row in active volunteers
                    range_name = f'{ACTIVE_VOLUNTEERS_SHEET}!A{i+2}:E{i+2}'
                    self.sheet.values().clear(
                        spreadsheetId=SPREADSHEET_ID,
                        range=range_name
                    ).execute()
                    
                    # Log the hours
                    check_out_time = datetime.now()
                    check_in_time = datetime.fromisoformat(v['joined_at'])
                    duration = (check_out_time - check_in_time).total_seconds() / 3600  # hours
                    
                    values = [
                        [
                            v['name'],
                            v['email'],
                            v['joined_at'],
                            check_out_time.isoformat(),
                            f"{duration:.2f}"
                        ]
                    ]
                    body = {'values': values}
                    self.sheet.values().append(
                        spreadsheetId=SPREADSHEET_ID,
                        range=f'{VOLUNTEER_HOURS_SHEET}!A2:E2',
                        valueInputOption='RAW',
                        insertDataOption='INSERT_ROWS',
                        body=body
                    ).execute()
                    break

    def get_volunteer_hours(self, email=None):
        result = self.sheet.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f'{VOLUNTEER_HOURS_SHEET}!A2:E'
        ).execute()
        values = result.get('values', [])
        hours = []
        for row in values:
            if len(row) >= 5:
                if email is None or row[1] == email:
                    hours.append({
                        'name': row[0],
                        'email': row[1],
                        'check_in': row[2],
                        'check_out': row[3],
                        'hours': float(row[4])
                    })
        return hours 