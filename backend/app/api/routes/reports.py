from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.repositories.data_repos import product_repo, sale_repo, audit_repo, activity_repo
from app.core.dependencies import get_current_user
from io import StringIO
import csv

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/metrics")
def get_metrics(user: dict = Depends(get_current_user)):
    today_sales, _ = sale_repo.today_sales()
    weekly = sale_repo.weekly_revenue()
    return {
        "dailySales": round(today_sales, 2),
        "weeklyRevenue": round(weekly, 2),
        "monthlyRevenue": round(weekly * 4.1, 2),
        "inventoryValue": round(product_repo.inventory_value(), 2),
    }


@router.get("/revenue-trend")
def get_revenue_trend(days: int = 30, user: dict = Depends(get_current_user)):
    from app.mock_data.store import store
    return store.revenue_series[:days]


@router.get("/top-products")
def get_top_products(user: dict = Depends(get_current_user)):
    from app.mock_data.store import store
    return store.best_sellers


@router.get("/audit-log")
def get_audit_log(user: dict = Depends(get_current_user)):
    return audit_repo.get_all()


@router.get("/export")
def export_report(format: str = "csv", user: dict = Depends(get_current_user)):
    if format == "csv":
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "User", "Action", "Target", "Description", "Timestamp"])
        for entry in audit_repo.get_all():
            writer.writerow([entry["id"], entry["user"], entry["action"], entry["target"], entry["description"], entry["at"]])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=audit_report.csv"},
        )
    return {"message": f"Export in {format} format"}


@router.get("/products/export")
def export_products(user: dict = Depends(get_current_user)):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["SKU", "Name", "Category", "Brand", "Boxes", "Items Per Box", "Extra Pieces", "Price Per Box", "Individual Price", "Low Stock Threshold", "Description", "Barcode"])
    for p in product_repo.get_all():
        writer.writerow([
            p["sku"], p["name"], p["category"], p["brand"],
            p.get("boxes", 0), p.get("itemsPerBox", 1), p.get("extraPieces", 0),
            p.get("pricePerBox", 0), p.get("individualPrice", 0),
            p.get("lowStockThreshold", 10), p.get("description", ""), p.get("barcode", ""),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_export.csv"},
    )
