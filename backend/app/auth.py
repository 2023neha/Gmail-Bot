import os
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from typing import Optional
import os
import json
from itsdangerous import URLSafeSerializer

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/auth/callback")
SECRET_KEY = os.getenv("SECRET_KEY", "unsafe-secret-key")


# Session Serializer
serializer = URLSafeSerializer(SECRET_KEY)

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify", # includes delete (trash)
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

def get_google_flow():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google Client ID/Secret not configured.")
    
    return Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

@router.get("/login")
def login():
    flow = get_google_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    response = RedirectResponse(authorization_url)
    return response

@router.get("/callback")
def callback(code: str, state: Optional[str] = None):
    flow = get_google_flow()
    try:
        flow.fetch_token(code=code)
    except Exception as e:
        return JSONResponse({"error": f"Failed to fetch token: {str(e)}"}, status_code=400)

    credentials = flow.credentials
    
    user_info = verify_credentials(credentials)

    # Create session data
    session_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
        "user_email": user_info.get("email"),
        "user_name": user_info.get("name"),
        "picture": user_info.get("picture")
    }

    # Encrypt session
    token = serializer.dumps(session_data)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    response = RedirectResponse(f"{frontend_url}/dashboard?token={token}")
    
    return response
    
    return response

def verify_credentials(creds):
    # Use google api to get user info
    from googleapiclient.discovery import build
    service = build('oauth2', 'v2', credentials=creds)
    user_info = service.userinfo().get().execute()
    return user_info

@router.get("/me")
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split(" ")[1]
    try:
        session_data = serializer.loads(token)
        return {
            "name": session_data.get("user_name"),
            "email": session_data.get("user_email"),
            "picture": session_data.get("picture")
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")

def get_credentials_from_token(token: str):
    try:
        data = serializer.loads(token)
        return Credentials(
            token=data["token"],
            refresh_token=data.get("refresh_token"),
            token_uri=data["token_uri"],
            client_id=data["client_id"],
            client_secret=data["client_secret"],
            scopes=data["scopes"]
        )
    except Exception:
        return None
