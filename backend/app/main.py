from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Gmail AI Assistant")





origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.auth import router as auth_router
from app.api_routes import router as api_router

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(api_router, prefix="/api", tags=["emails"])

@app.get("/")
def read_root():
    return {"message": "Gmail AI Assistant Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
