
from fastapi import FastAPI
from sqlalchemy import text

import models

from database import engine, Base
from routes.auth_routes import router as auth_router
from routes.product_routes import router as product_router
from routes.dashboard_routes import router as dashboard_router
from fastapi.middleware.cors import CORSMiddleware
from routes.settings_routes import router as settings_router

# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="StockFlow Inventory Management",
    description="Inventory Management System API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register authentication routes
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(dashboard_router)
app.include_router(settings_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to StockFlow Inventory Management API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "Backend is running"
    }


@app.get("/db-check")
def database_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "Database connected successfully"
        }

    except Exception as error:
        return {
            "status": "Database connection failed",
            "error": str(error)
        }
