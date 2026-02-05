import google.generativeai as genai
import os

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Select model (Gemini Pro)
model = genai.GenerativeModel('gemini-pro')

async def summarize_email(content: str) -> str:
    if not content:
        return "No content to summarize."
    
    try:
        # Gemini is synchronous in this library, but we can wrap it or run it in executor if needed.
        # For this simple implementation, direct call is fine as it's efficient.
        prompt = f"Summarize this email in 2 sentences:\n\n{content[:5000]}"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error generating summary: {str(e)}"

async def generate_reply(email_content: str, direction: str = "positive") -> str:
    try:
        prompt = f"Draft a short, professional reply to this email. Tone: {direction}.\n\nEmail:\n{email_content[:5000]}"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error generating reply: {str(e)}"
