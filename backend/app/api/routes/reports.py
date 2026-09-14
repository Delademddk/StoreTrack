from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.db.repos import product_repo, audit_repo
from app.core.dependencies import get_current_user
from app.db.database import get_raw_connection
from io import StringIO
import csv

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/metrics")
def get_metrics(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM app.vw_ReportSummary")
        cols = [d[0] for d in cursor.description]
        row = cursor.fetchone()
        if row:
            d = {cols[i]: row[i] for i in range(len(cols))}
            return {
                "dailySales": float(d.get("DailySales", 0)),
                "weeklyRevenue": float(d.get("WeeklyRevenue", 0)),
                "monthlyRevenue": float(d.get("MonthlyRevenue", 0)),
                "inventoryValue": float(d.get("InventoryValue", 0)),
            }
        return {"dailySales": 0, "weeklyRevenue": 0, "monthlyRevenue": 0, "inventoryValue": 0}
    finally:
        conn.close()


@router.get("/revenue-trend")
def get_revenue_trend(days: int = 30, user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP (?) Day, Revenue, SaleCount
            FROM app.vw_ReportRevenueTrend30Days
            ORDER BY Day DESC
        """, days)
        rows = cursor.fetchall()
        result = []
        for row in reversed(rows):
            from datetime import datetime
            day_val = row[0]
            if hasattr(day_val, 'strftime'):
                label = day_val.strftime("%b %d")
            else:
                label = str(day_val)
            result.append({
                "day": label,
                "revenue": float(row[1]) if row[1] else 0,
                "orders": int(row[2]) if row[2] else 0,
            })
        return result
    finally:
        conn.close()


@router.get("/top-products")
def get_top_products(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP 10 p.Name, SUM(si.Quantity) AS Units,
                   SUM(si.Quantity * si.UnitPrice) AS Revenue
            FROM app.SaleItems si
            INNER JOIN app.Products p ON si.ProductId = p.Id
            GROUP BY p.Name
            ORDER BY Revenue DESC
        """)
        rows = cursor.fetchall()
        return [
            {"name": r[0], "units": int(r[1]), "revenue": float(r[2])}
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/audit-log")
def get_audit_log(user: dict = Depends(get_current_user)):
    entries = audit_repo.get_all()
    return [
        {
            "id": e["Id"], "userId": e.get("UserId"),
            "user": e.get("UserName") or "",
            "action": e.get("Action") or "",
            "target": e.get("Target") or "",
            "description": e.get("Description") or "",
            "at": str(e.get("OccurredAt", "")),
        }
        for e in entries
    ]


@router.get("/sales")
def get_sales_report(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM app.vw_ReportSales ORDER BY SoldAt DESC")
        cols = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        return [
            {cols[i]: (str(row[i]) if hasattr(row[i], 'isoformat') else row[i]) for i in range(len(cols))}
            for row in rows
        ]
    finally:
        conn.close()


@router.get("/products")
def get_products_report(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM app.vw_ReportProducts ORDER BY Name")
        cols = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        return [
            {cols[i]: row[i] for i in range(len(cols))}
            for row in rows
        ]
    finally:
        conn.close()


@router.get("/creditors")
def get_creditors_report(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM app.vw_ReportCreditors ORDER BY Outstanding DESC")
        cols = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        return [
            {cols[i]: (str(row[i]) if hasattr(row[i], 'isoformat') else row[i]) for i in range(len(cols))}
            for row in rows
        ]
    finally:
        conn.close()


@router.get("/export")
def export_report(format: str = "csv", user: dict = Depends(get_current_user)):
    if format == "csv":
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "User", "Action", "Target", "Description", "Timestamp"])
        for entry in audit_repo.get_all():
            writer.writerow([
                entry["Id"], entry.get("UserName") or "", entry.get("Action") or "",
                entry.get("Target") or "", entry.get("Description") or "",
                str(entry.get("OccurredAt", "")),
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=audit_report.csv"},
        )
    return {"message": f"Export in {format} format"}


@router.get("/products/export")
def export_products(user: dict = Depends(get_current_user)):
    items = product_repo.get_all()
    return [
        {
            "SKU": p.get("Sku", ""),
            "Name": p.get("Name", ""),
            "Category": p.get("CategoryName") or "",
            "Brand": p.get("Brand") or "",
            "Supplier": p.get("Supplier") or "",
            "IsBoxed": bool(p.get("IsBoxed", False)),
            "Boxes": p.get("Boxes", 0),
            "ItemsPerBox": p.get("ItemsPerBox", 1),
            "ExtraPieces": p.get("ExtraPieces", 0),
            "PricePerBox": float(p.get("PricePerBox", 0)),
            "IndividualPrice": float(p.get("IndividualPrice", 0)),
            "LowStockThreshold": p.get("LowStockThreshold", 10),
            "Description": p.get("Description") or "",
            "Barcode": p.get("Barcode") or "",
        }
        for p in items
    ]
