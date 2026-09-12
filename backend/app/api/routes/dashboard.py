from fastapi import APIRouter, Depends
from app.db.repos import product_repo, sale_repo, activity_repo, audit_repo
from app.core.dependencies import get_current_user
from app.db.database import get_raw_connection

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(user: dict = Depends(get_current_user)):
    today_sales, today_orders = sale_repo.today_sales()
    return {
        "totalProducts": product_repo.count(),
        "itemsInStock": product_repo.total_stock(),
        "todaySales": round(today_sales, 2),
        "todayOrders": today_orders,
        "weeklyRevenue": round(sale_repo.weekly_revenue(), 2),
        "inventoryValue": round(product_repo.inventory_value(), 2),
        "lowStock": product_repo.low_stock_count(),
        "outOfStock": product_repo.out_of_stock_count(),
    }


@router.get("/revenue")
def get_revenue(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP 30
                CONVERT(VARCHAR(10), s.SoldAt, 120) AS day,
                ISNULL(sub.Revenue, 0) AS revenue,
                ISNULL(sub.Orders, 0) AS orders
            FROM (
                SELECT DISTINCT CAST(SoldAt AS DATE) AS d
                FROM app.Sales
                WHERE SoldAt >= DATEADD(DAY, -30, SYSUTCDATETIME())
            ) dates
            LEFT JOIN (
                SELECT CAST(SoldAt AS DATE) AS d,
                       SUM(Total) AS Revenue,
                       COUNT(*) AS Orders
                FROM app.Sales
                WHERE SoldAt >= DATEADD(DAY, -30, SYSUTCDATETIME())
                GROUP BY CAST(SoldAt AS DATE)
            ) sub ON dates.d = sub.d
            LEFT JOIN app.Sales s ON CAST(s.SoldAt AS DATE) = dates.d
            ORDER BY dates.d
        """)
        rows = cursor.fetchall()
        result = []
        seen_dates = set()
        for row in rows:
            day_str = str(row[0])
            if day_str not in seen_dates:
                seen_dates.add(day_str)
                from datetime import datetime
                try:
                    dt = datetime.strptime(day_str, "%Y-%m-%d")
                    label = dt.strftime("%b %d")
                except (ValueError, TypeError):
                    label = day_str
                result.append({
                    "day": label,
                    "revenue": float(row[1]) if row[1] else 0,
                    "orders": int(row[2]) if row[2] else 0,
                })
        return result
    finally:
        conn.close()


@router.get("/activity")
def get_activity(user: dict = Depends(get_current_user)):
    entries = activity_repo.get_all()
    return [
        {
            "id": e["Id"], "kind": e["Kind"], "title": e["Title"],
            "description": e.get("Description") or "", "actor": e["Actor"],
            "at": str(e.get("OccurredAt", "")),
        }
        for e in entries
    ]


@router.get("/best-sellers")
def get_best_sellers(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP 5
                p.Name,
                SUM(si.Quantity) AS Units,
                SUM(si.Quantity * si.UnitPrice) AS Revenue
            FROM app.SaleItems si
            INNER JOIN app.Products p ON si.ProductId = p.Id
            GROUP BY p.Name
            ORDER BY Revenue DESC
        """)
        cols = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        return [
            {"name": r[0], "units": int(r[1]), "revenue": float(r[2])}
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/categories")
def get_category_breakdown(user: dict = Depends(get_current_user)):
    conn = get_raw_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.Name,
                   COUNT(p.Id) AS ProductCount
            FROM app.Categories c
            LEFT JOIN app.Products p ON c.Id = p.CategoryId
            GROUP BY c.Name
            ORDER BY ProductCount DESC
        """)
        rows = cursor.fetchall()
        total = sum(r[1] for r in rows) or 1
        return [
            {"name": r[0], "value": round(r[1] / total * 100)}
            for r in rows
        ]
    finally:
        conn.close()
