from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel
from app.auth import get_credentials_from_token, serializer
from app.services.gmail import (
    get_gmail_service,
    list_messages,
    get_message_detail,
    send_message,
    trash_message
)
from app.services.llm import summarize_email, generate_reply
import base64
from email.message import EmailMessage

router = APIRouter()

class EmailResponse(BaseModel):
    id: str
    subject: str
    sender: str
    snippet: str
    summary: Optional[str] = None
    date: str

class ReplyRequest(BaseModel):
    email_id: str
    original_content: str
    instructions: Optional[str] = "positive"

class SendReplyRequest(BaseModel):
    to: str
    subject: str
    body: str
    thread_id: Optional[str] = None

def get_user_creds(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth_header.split(" ")[1]
    creds = get_credentials_from_token(token)
    if not creds:
        raise HTTPException(status_code=401, detail="Invalid info")
    return creds

@router.get("/recent", response_model=List[EmailResponse])
async def get_recent_emails(creds = Depends(get_user_creds)):
    service = get_gmail_service(creds)
    messages = list_messages(service, max_results=5)
    
    email_data = []
    for msg in messages:
        details = get_message_detail(service, msg_id=msg['id'])
        if details:
            summary = await summarize_email(details.get("body", "") or details.get("snippet", ""))
            
            email_data.append(EmailResponse(
                id=details['id'],
                subject=details['subject'],
                sender=details['sender'],
                snippet=details['snippet'],
                summary=summary,
                date=details['date']
            ))
    return email_data

@router.post("/generate-reply")
async def generate_email_reply(request: ReplyRequest, creds = Depends(get_user_creds)):
    reply_text = await generate_reply(request.original_content, request.instructions)
    return {"reply": reply_text}

@router.post("/send")
async def send_email(request: SendReplyRequest, creds = Depends(get_user_creds)):
    service = get_gmail_service(creds)
    
    message = EmailMessage()
    message.set_content(request.body)
    message['To'] = request.to
    message['Subject'] = request.subject
    
    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    create_message = {
        'raw': encoded_message
    }
    
    if request.thread_id:
        create_message['threadId'] = request.thread_id

    result = send_message(service, 'me', create_message)
    if result:
        return {"status": "sent", "id": result.get("id")}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")

@router.delete("/{msg_id}")
async def delete_email(msg_id: str, creds = Depends(get_user_creds)):
    service = get_gmail_service(creds)
    success = trash_message(service, 'me', msg_id)
    if success:
        return {"status": "deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete email")
