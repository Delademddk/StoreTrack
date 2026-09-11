from datetime import datetime, timedelta, timezone
import uuid
import random
from app.core.security import hash_password


def generate_id(prefix: str = "") -> str:
    short = uuid.uuid4().hex[:8]
    return f"{prefix}_{short}" if prefix else short


def generate_sku(name: str) -> str:
    slug = "".join(c if c.isalnum() else "" for c in name.upper().split()[:3])
    return f"SKU-{slug[:4]}-{random.randint(1000, 9999)}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def days_ago_iso(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def seed_products() -> list[dict]:
    return [
        {
            "id": "p_01", "sku": "SKU-SPH-2024-BK",
            "name": "Studio Pro Headphones", "category": "Electronics",
            "brand": "AudioTech", "supplier": "Northwind Traders",
            "isBoxed": True, "boxes": 42, "itemsPerBox": 12, "extraPieces": 3,
            "pricePerBox": 1200.00, "individualPrice": 129.99,
            "lowStockThreshold": 10, "description": "Premium noise-cancelling headphones with deep bass.",
            "barcode": "5901234123457", "image": "https://placehold.co/200x200?text=Headphones",
            "createdAt": days_ago_iso(90), "updatedAt": days_ago_iso(2),
        },
        {
            "id": "p_02", "sku": "SKU-NAR-7520-V2",
            "name": "NuPhy Air75 V2 Mechanical", "category": "Peripherals",
            "brand": "NuPhy", "supplier": "Keyboardery",
            "isBoxed": True, "boxes": 2, "itemsPerBox": 5, "extraPieces": 0,
            "pricePerBox": 800.00, "individualPrice": 175.00,
            "lowStockThreshold": 8, "description": "Ultra-slim mechanical keyboard with hot-swappable switches.",
            "barcode": "6512345678901", "image": "https://placehold.co/200x200?text=Keyboard",
            "createdAt": days_ago_iso(60), "updatedAt": days_ago_iso(5),
        },
        {
            "id": "p_03", "sku": "SKU-MXW-2024-G2",
            "name": "MX-Wireless Mouse G2", "category": "Peripherals",
            "brand": "LogiMax", "supplier": "Halcyon Direct",
            "isBoxed": False, "boxes": 0, "itemsPerBox": 1, "extraPieces": 24,
            "pricePerBox": 0, "individualPrice": 64.50,
            "lowStockThreshold": 15, "description": "Ergonomic wireless mouse with adjustable DPI.",
            "barcode": "4901234567890", "image": "https://placehold.co/200x200?text=Mouse",
            "createdAt": days_ago_iso(45), "updatedAt": days_ago_iso(1),
        },
        {
            "id": "p_04", "sku": "SKU-UBP-14M3-PRO",
            "name": "UltraBook Pro 14\" M3", "category": "Computers",
            "brand": "Apple", "supplier": "Halcyon Direct",
            "isBoxed": False, "boxes": 0, "itemsPerBox": 1, "extraPieces": 8,
            "pricePerBox": 0, "individualPrice": 2149.00,
            "lowStockThreshold": 5, "description": "14-inch laptop with M3 chip, 16GB RAM, 512GB SSD.",
            "barcode": "1234567890123", "image": "https://placehold.co/200x200?text=Laptop",
            "createdAt": days_ago_iso(30), "updatedAt": days_ago_iso(3),
        },
        {
            "id": "p_05", "sku": "SKU-SWE-ANC-EL",
            "name": "SonicWave Elite ANC", "category": "Audio",
            "brand": "SonicWave", "supplier": "Northwind Traders",
            "isBoxed": True, "boxes": 1, "itemsPerBox": 10, "extraPieces": 2,
            "pricePerBox": 450.00, "individualPrice": 99.00,
            "lowStockThreshold": 12, "description": "True wireless earbuds with active noise cancellation.",
            "barcode": "7891234560123", "image": "https://placehold.co/200x200?text=Earbuds",
            "createdAt": days_ago_iso(75), "updatedAt": days_ago_iso(7),
        },
        {
            "id": "p_06", "sku": "SKU-ACM-2024-CS",
            "name": "Artisan Ceramic Mug Set", "category": "Home & Living",
            "brand": "KilnCraft", "supplier": "Kiln & Co",
            "isBoxed": True, "boxes": 18, "itemsPerBox": 6, "extraPieces": 2,
            "pricePerBox": 90.00, "individualPrice": 18.00,
            "lowStockThreshold": 20, "description": "Handcrafted 4-piece ceramic mug set in matte finish.",
            "barcode": "3456789012345", "image": "https://placehold.co/200x200?text=Mug+Set",
            "createdAt": days_ago_iso(120), "updatedAt": days_ago_iso(10),
        },
        {
            "id": "p_07", "sku": "SKU-MBEK-2024-MB",
            "name": "Matte Black Electric Kettle", "category": "Home & Living",
            "brand": "KilnCraft", "supplier": "Muji Wholesale",
            "isBoxed": False, "boxes": 0, "itemsPerBox": 1, "extraPieces": 8,
            "pricePerBox": 0, "individualPrice": 58.00,
            "lowStockThreshold": 10, "description": "1.7L fast-boil kettle with matte black stainless steel finish.",
            "barcode": "2345678901234", "image": "https://placehold.co/200x200?text=Kettle",
            "createdAt": days_ago_iso(50), "updatedAt": days_ago_iso(4),
        },
        {
            "id": "p_08", "sku": "SKU-MDL-2024-SL",
            "name": "Minimalist Desk Lamp", "category": "Home & Living",
            "brand": "LumaHome", "supplier": "Nord Distributors",
            "isBoxed": True, "boxes": 6, "itemsPerBox": 8, "extraPieces": 3,
            "pricePerBox": 480.00, "individualPrice": 72.00,
            "lowStockThreshold": 8, "description": "Adjustable LED desk lamp with touch dimmer and USB port.",
            "barcode": "8901234567890", "image": "https://placehold.co/200x200?text=Desk+Lamp",
            "createdAt": days_ago_iso(40), "updatedAt": days_ago_iso(6),
        },
    ]


def seed_categories() -> list[dict]:
    return [
        {"id": "cat_1", "name": "Electronics", "color": "#3b82f6", "icon": "Cpu", "description": "Electronic devices and gadgets", "createdAt": days_ago_iso(120)},
        {"id": "cat_2", "name": "Peripherals", "color": "#8b5cf6", "icon": "Keyboard", "description": "Input devices and accessories", "createdAt": days_ago_iso(120)},
        {"id": "cat_3", "name": "Computers", "color": "#06b6d4", "icon": "Monitor", "description": "Desktops, laptops, and components", "createdAt": days_ago_iso(120)},
        {"id": "cat_4", "name": "Audio", "color": "#f59e0b", "icon": "Headphones", "description": "Speakers, earbuds, and audio gear", "createdAt": days_ago_iso(120)},
        {"id": "cat_5", "name": "Home & Living", "color": "#10b981", "icon": "Home", "description": "Household and lifestyle products", "createdAt": days_ago_iso(120)},
    ]


def seed_users() -> list[dict]:
    return [
        {
            "id": "u_01", "name": "Admin User", "username": "admin",
            "email": "admin@storetrack.com", "phone": "+1 555 0101",
            "role": "Admin", "status": "Active",
            "password": hash_password("Admin123"),
            "lastActive": "2 hours ago", "permissions": [],
            "createdAt": days_ago_iso(180),
        },
        {
            "id": "u_02", "name": "Cashier User", "username": "cashier",
            "email": "cashier@storetrack.com", "phone": "+1 555 0102",
            "role": "Cashier", "status": "Active",
            "password": hash_password("Cashier123"),
            "lastActive": "3 hours ago", "permissions": [],
            "createdAt": days_ago_iso(90),
        },
    ]


def seed_customers() -> list[dict]:
    return [
        {
            "id": "c_01", "name": "Bloom Interiors Ltd", "phone": "+254 712 345 678",
            "address": "Kenyatta Avenue, Nairobi", "notes": "Interior design firm, bulk buyer",
            "createdAt": days_ago_iso(90), "updatedAt": days_ago_iso(2),
        },
        {
            "id": "c_02", "name": "Priya Menon", "phone": "+254 723 456 789",
            "address": "Westlands, Nairobi", "notes": "",
            "createdAt": days_ago_iso(60), "updatedAt": days_ago_iso(5),
        },
        {
            "id": "c_03", "name": "Ken Miles", "phone": "+254 734 567 890",
            "address": "Kasarani, Nairobi", "notes": "Regular customer",
            "createdAt": days_ago_iso(30), "updatedAt": days_ago_iso(1),
        },
    ]


def seed_sales() -> list[dict]:
    return [
        {
            "id": "s_01", "invoice": "INV-9204",
            "customer": "Bloom Interiors Ltd",
            "items": [
                {"productId": "p_08", "name": "Minimalist Desk Lamp", "qty": 2, "unitPrice": 72.00},
                {"productId": "p_06", "name": "Artisan Ceramic Mug Set", "qty": 4, "unitPrice": 18.00},
            ],
            "subtotal": 216.00, "discount": 0, "tax": 0, "total": 216.00,
            "method": "Cash", "cashier": "Alex Rivera",
            "at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
        },
        {
            "id": "s_02", "invoice": "INV-9203",
            "customer": "Priya Menon",
            "items": [
                {"productId": "p_05", "name": "SonicWave Elite ANC", "qty": 1, "unitPrice": 99.00},
                {"productId": "p_03", "name": "MX-Wireless Mouse G2", "qty": 1, "unitPrice": 64.50},
            ],
            "subtotal": 163.50, "discount": 10.00, "tax": 0, "total": 153.50,
            "method": "Card", "cashier": "Priya Menon",
            "at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
        },
        {
            "id": "s_03", "invoice": "INV-9202",
            "customer": "Ken Miles",
            "items": [
                {"productId": "p_04", "name": "UltraBook Pro 14\" M3", "qty": 1, "unitPrice": 2149.00},
            ],
            "subtotal": 2149.00, "discount": 0, "tax": 0, "total": 2149.00,
            "method": "Mobile Money", "cashier": "Alex Rivera",
            "at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
        },
        {
            "id": "s_04", "invoice": "INV-9198",
            "customer": "Bloom Interiors Ltd",
            "items": [
                {"productId": "p_01", "name": "Studio Pro Headphones", "qty": 3, "unitPrice": 129.99},
                {"productId": "p_02", "name": "NuPhy Air75 V2 Mechanical", "qty": 1, "unitPrice": 175.00},
            ],
            "subtotal": 564.97, "discount": 50.00, "tax": 0, "total": 514.97,
            "method": "Cash", "cashier": "Sam Kariuki",
            "at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        },
    ]


def seed_ledger_entries() -> list[dict]:
    return [
        {"id": "le_01", "customerId": "c_01", "kind": "purchase", "at": days_ago_iso(60), "amount": 514.97, "balanceAfter": 514.97, "method": None, "reference": None, "notes": None, "saleId": "s_04", "expectedPaymentDate": None, "lineSummary": "3x Studio Pro Headphones, 1x NuPhy Air75 V2 Mechanical"},
        {"id": "le_02", "customerId": "c_01", "kind": "payment", "at": days_ago_iso(45), "amount": 200.00, "balanceAfter": 314.97, "method": "Cash", "reference": "Partial payment", "notes": None, "saleId": None, "expectedPaymentDate": None, "lineSummary": None},
        {"id": "le_03", "customerId": "c_01", "kind": "purchase", "at": days_ago_iso(10), "amount": 216.00, "balanceAfter": 530.97, "method": None, "reference": None, "notes": None, "saleId": "s_01", "expectedPaymentDate": days_ago_iso(-5), "lineSummary": "2x Minimalist Desk Lamp, 4x Artisan Ceramic Mug Set"},
        {"id": "le_04", "customerId": "c_02", "kind": "purchase", "at": days_ago_iso(20), "amount": 350.00, "balanceAfter": 350.00, "method": None, "reference": None, "notes": None, "saleId": None, "expectedPaymentDate": days_ago_iso(-2), "lineSummary": "2x MX-Wireless Mouse G2"},
        {"id": "le_05", "customerId": "c_02", "kind": "payment", "at": days_ago_iso(15), "amount": 100.00, "balanceAfter": 250.00, "method": "Mobile Money", "reference": "M-Pesa", "notes": None, "saleId": None, "expectedPaymentDate": None, "lineSummary": None},
        {"id": "le_06", "customerId": "c_03", "kind": "purchase", "at": days_ago_iso(5), "amount": 149.00, "balanceAfter": 149.00, "method": None, "reference": None, "notes": None, "saleId": None, "expectedPaymentDate": days_ago_iso(-10), "lineSummary": "2x Matte Black Electric Kettle"},
    ]


def seed_activity() -> list[dict]:
    return [
        {"id": "a_01", "kind": "sale", "title": "Sale recorded", "description": "INV-9204 — Bloom Interiors Ltd, $216.00", "actor": "Alex Rivera", "at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()},
        {"id": "a_02", "kind": "restock", "title": "Inventory restocked", "description": "Studio Pro Headphones: +20 units", "actor": "Sam Kariuki", "at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()},
        {"id": "a_03", "kind": "low_stock", "title": "Low stock alert", "description": "NuPhy Air75 V2 Mechanical below threshold (10 units left)", "actor": "System", "at": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat()},
        {"id": "a_04", "kind": "edit", "title": "Product updated", "description": "Studio Pro Headphones — price adjusted to $129.99", "actor": "Alex Rivera", "at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()},
        {"id": "a_05", "kind": "user", "title": "New user added", "description": "Amara Okafor joined as Manager", "actor": "Alex Rivera", "at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()},
        {"id": "a_06", "kind": "settings", "title": "Backup completed", "description": "Full database backup exported successfully", "actor": "System", "at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()},
    ]


def seed_audit_log() -> list[dict]:
    return [
        {"id": "al_01", "at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(), "user": "Alex Rivera", "action": "Product Updated", "target": "SKU-SPH-2024-BK", "description": "Studio Pro Headphones — price adjusted to $129.99"},
        {"id": "al_02", "at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(), "user": "Alex Rivera", "action": "Sale Recorded", "target": "INV-9204", "description": "Cash sale of $216.00 to Bloom Interiors Ltd"},
        {"id": "al_03", "at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(), "user": "Priya Menon", "action": "Sale Recorded", "target": "INV-9203", "description": "Card sale of $153.50 to Priya Menon"},
        {"id": "al_04", "at": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(), "user": "Sam Kariuki", "action": "Inventory Restock", "target": "SKU-SPH-2024-BK", "description": "Added 20 units to Studio Pro Headphones"},
        {"id": "al_05", "at": (datetime.now(timezone.utc) - timedelta(hours=10)).isoformat(), "user": "System", "action": "Low Stock Alert", "target": "SKU-NAR-7520-V2", "description": "NuPhy Air75 V2 Mechanical below threshold"},
        {"id": "al_06", "at": (datetime.now(timezone.utc) - timedelta(hours=14)).isoformat(), "user": "Alex Rivera", "action": "User Created", "target": "amara", "description": "New user Amara Okafor created with role Manager"},
        {"id": "al_07", "at": (datetime.now(timezone.utc) - timedelta(hours=20)).isoformat(), "user": "System", "action": "Backup Completed", "target": "backup_2024_07_22.zip", "description": "Full database backup exported"},
    ]


def seed_revenue_series() -> list[dict]:
    series = []
    now = datetime.now(timezone.utc)
    for i in range(30):
        d = now - timedelta(days=29 - i)
        revenue = round(random.uniform(800, 6000), 2)
        orders = random.randint(2, 15)
        series.append({"day": d.strftime("%b %d"), "revenue": revenue, "orders": orders})
    return series


def seed_best_sellers() -> list[dict]:
    return [
        {"name": "Studio Pro Headphones", "units": 342, "revenue": 44455.58},
        {"name": "UltraBook Pro 14\" M3", "units": 67, "revenue": 143983.00},
        {"name": "Minimalist Desk Lamp", "units": 148, "revenue": 10656.00},
        {"name": "Artisan Ceramic Mug Set", "units": 192, "revenue": 3456.00},
        {"name": "MX-Wireless Mouse G2", "units": 95, "revenue": 6127.50},
    ]


def seed_category_breakdown() -> list[dict]:
    return [
        {"name": "Electronics", "value": 35},
        {"name": "Peripherals", "value": 20},
        {"name": "Computers", "value": 25},
        {"name": "Audio", "value": 8},
        {"name": "Home & Living", "value": 12},
    ]


def get_total_qty(product: dict) -> int:
    if product.get("isBoxed"):
        return product.get("boxes", 0) * product.get("itemsPerBox", 0) + product.get("extraPieces", 0)
    return product.get("extraPieces", 0)


def get_stock_status(product: dict) -> str:
    total = get_total_qty(product)
    threshold = product.get("lowStockThreshold", 10)
    if total == 0:
        return "out_of_stock"
    if total <= threshold:
        return "low_stock"
    return "in_stock"


PERMISSIONS = [
    "View Dashboard", "View Products", "Add Products", "Edit Products", "Delete Products",
    "Manage Categories", "View Sales", "Create Sales", "View Reports", "Export Reports",
    "Manage Users", "Manage Settings", "Backup/Restore Database",
]
