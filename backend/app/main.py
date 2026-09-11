from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "StoreTrack V3 API"}
