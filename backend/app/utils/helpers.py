import uuid
from datetime import datetime, timezone


def generate_id(prefix: str = "") -> str:
    short = uuid.uuid4().hex[:8]
    return f"{prefix}_{short}" if prefix else short


def generate_sku(name: str) -> str:
    import random
    slug = "".join(c if c.isalnum() else "" for c in name.upper().split()[:3])
    return f"SKU-{slug[:4]}-{random.randint(1000, 9999)}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_total_qty(product: dict) -> int:
    if product.get("IsBoxed") or product.get("isBoxed"):
        return product.get("Boxes", 0) * product.get("ItemsPerBox", 0) + product.get("ExtraPieces", 0)
    return product.get("ExtraPieces", 0)


def get_stock_status(product: dict) -> str:
    total = get_total_qty(product)
    threshold = product.get("LowStockThreshold", product.get("lowStockThreshold", 10))
    if total == 0:
        return "out_of_stock"
    if total <= threshold:
        return "low_stock"
    return "in_stock"
