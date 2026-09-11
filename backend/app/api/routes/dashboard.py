from fastapi import APIRouter, Depends
from app.repositories.data_repos import product_repo, sale_repo, activity_repo
from app.core.dependencies import get_current_user

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
    from app.mock_data.store import store
    return store.revenue_series


@router.get("/activity")
def get_activity(user: dict = Depends(get_current_user)):
    return activity_repo.get_all()


@router.get("/best-sellers")
def get_best_sellers(user: dict = Depends(get_current_user)):
    from app.mock_data.store import store
    return store.best_sellers


@router.get("/categories")
def get_category_breakdown(user: dict = Depends(get_current_user)):
    from app.mock_data.store import store
    return store.category_breakdown
