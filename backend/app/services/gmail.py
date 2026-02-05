from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import List, Dict, Any
import base64

def get_gmail_service(creds: Credentials):
    return build('gmail', 'v1', credentials=creds)



def list_messages(service, user_id='me', max_results=5):
    try:
        results = service.users().messages().list(userId=user_id, maxResults=max_results).execute()
        messages = results.get('messages', [])
        return messages
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return []

def get_message_detail(service, user_id='me', msg_id=None):
    try:
        message = service.users().messages().get(userId=user_id, id=msg_id, format='full').execute()
        
        payload = message.get('payload', {})
        headers = payload.get('headers', [])
        
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
        
        # Get body
        body = ""
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data')
                    if data:
                        body += base64.urlsafe_b64decode(data).decode()
        elif 'body' in payload:
            data = payload['body'].get('data')
            if data:
                body = base64.urlsafe_b64decode(data).decode()
                
        return {
            "id": message['id'],
            "threadId": message['threadId'],
            "subject": subject,
            "sender": sender,
            "date": date,
            "snippet": message.get('snippet', ''),
            "body": body
        }
    except Exception as e:
        print(f"An error occurred fetching message {msg_id}: {e}")
        return None

def create_draft(service, user_id, message_body):
    try:
        message = {'message': message_body}
        draft = service.users().drafts().create(userId=user_id, body=message).execute()
        return draft
    except Exception as e:
        print(f"An error occurred creating draft: {e}")
        return None

def send_message(service, user_id, message_body):
    try:
        message = service.users().messages().send(userId=user_id, body=message_body).execute()
        return message
    except Exception as e:
        print(f"An error occurred sending message: {e}")
        return None

def trash_message(service, user_id='me', msg_id=None):
    try:
        service.users().messages().trash(userId=user_id, id=msg_id).execute()
        return True
    except Exception as e:
        print(f"An error occurred deleting message: {e}")
        return False
