from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

def add_cors_middleware(app: FastAPI):
    # You can restrict origins for production use cases
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust this to specific domains for security in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
