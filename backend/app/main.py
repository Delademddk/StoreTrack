from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.routes import auth, products, categories, sales, customers, users, dashboard, reports, settings as settings_route, import_export

app = FastAPI(
    title="StoreTrack V3 API",
    description="Backend API for StoreTrack V3 inventory management system",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(sales.router)
app.include_router(customers.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(settings_route.router)
app.include_router(import_export.router)

upload_dir = Path(settings.PRODUCT_IMAGE_UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
def health_check():
    from app.db.database import test_connection
    db_ok = test_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "service": "StoreTrack V3 API",
        "database": "connected" if db_ok else "disconnected",
    }
