# Gmail AI Assistant

A mini-AI powered email assistant with Google login, AI chatbot dashboard, and email automation capabilities.

## Live Demo
[Insert Vercel Deployment URL Here]

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React)
- **AI**: OpenAI (GPT-4/3.5)
- **Auth**: Google OAuth2
- **Deployment**: Vercel

## Setup & Running Locally

### Prerequisites
- Node.js & npm
- Python 3.9+
- Google Cloud Project with Gmail API enabled
- OpenAI API Key

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/` (or root depending on how you run it, but `app/main.py` looks for it):
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
OPENAI_API_KEY=your_openai_key
SECRET_KEY=random_secret_string
```

Run the backend:
```bash
python -m uvicorn app.main:app --reload
```
Backend will be at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be at `http://localhost:3000`.

### 3. Vercel Deployment
This project is configured for Vercel.
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the root directory.
3. Set environment variables in Vercel project settings.

## Features
- **Google Login**: Secure authentication.
- **Chat Dashboard**: Interact with your email via AI.
- **Email Summaries**: Read last 5 emails with AI summaries.
- **AI Replies**: Generate and send replies.
- **Email Deletion**: Delete emails via command.
