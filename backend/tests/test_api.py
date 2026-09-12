import requests
import sys

BASE = "http://localhost:8000"

def test():
    r = requests.get(f"{BASE}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print("[OK] Health check")

    r = requests.post(f"{BASE}/api/auth/login", json={"username": "alex", "password": "demo1234"})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    token = r.json()["token"]
    print(f"[OK] Login - got token")
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(f"{BASE}/api/auth/me", headers=headers)
    assert r.status_code == 200 and r.json()["role"] == "Admin"
    print(f"[OK] Get me - {r.json()['name']} ({r.json()['role']})")

    r = requests.get(f"{BASE}/api/products", headers=headers)
    assert r.status_code == 200 and r.json()["total"] == 8
    print(f"[OK] Products - {r.json()['total']} products")

    r = requests.get(f"{BASE}/api/categories", headers=headers)
    assert r.status_code == 200 and len(r.json()) == 5
    print(f"[OK] Categories - {len(r.json())} categories")

    r = requests.get(f"{BASE}/api/sales", headers=headers)
    assert r.status_code == 200 and r.json()["total"] == 4
    print(f"[OK] Sales - {r.json()['total']} sales")

    r = requests.get(f"{BASE}/api/customers", headers=headers)
    assert r.status_code == 200 and r.json()["total"] == 3
    print(f"[OK] Customers - {r.json()['total']} customers")

    r = requests.get(f"{BASE}/api/dashboard/kpis", headers=headers)
    assert r.status_code == 200
    kpis = r.json()
    print(f"[OK] Dashboard KPIs - Products: {kpis['totalProducts']}, Stock: {kpis['itemsInStock']}, Today: ${kpis['todaySales']}")

    r = requests.get(f"{BASE}/api/users", headers=headers)
    assert r.status_code == 200 and r.json()["total"] == 5
    print(f"[OK] Users - {r.json()['total']} users")

    r = requests.get(f"{BASE}/api/reports/metrics", headers=headers)
    assert r.status_code == 200
    print(f"[OK] Reports metrics")

    r = requests.get(f"{BASE}/api/settings", headers=headers)
    assert r.status_code == 200
    print(f"[OK] Settings")

    # Test product creation
    r = requests.post(f"{BASE}/api/products", headers=headers, json={
        "name": "Test Widget", "category": "Electronics", "brand": "TestCo",
        "supplier": "Test Supplier", "isBoxed": False, "extraPieces": 50,
        "individualPrice": 9.99, "lowStockThreshold": 5,
    })
    assert r.status_code == 201
    new_id = r.json()["id"]
    print(f"[OK] Create product - {r.json()['name']} ({r.json()['sku']})")

    # Test product update
    r = requests.put(f"{BASE}/api/products/{new_id}", headers=headers, json={"individualPrice": 12.99})
    assert r.status_code == 200 and r.json()["individualPrice"] == 12.99
    print(f"[OK] Update product - price changed to ${r.json()['individualPrice']}")

    # Test sale creation
    r = requests.post(f"{BASE}/api/sales", headers=headers, json={
        "items": [{"productId": "p_03", "name": "MX-Wireless Mouse G2", "qty": 2, "unitPrice": 64.50}],
        "subtotal": 129.00, "discount": 0, "tax": 0, "total": 129.00,
        "method": "Cash",
    })
    assert r.status_code == 201
    print(f"[OK] Create sale - {r.json()['invoice']} for ${r.json()['total']}")

    # Test customer creation
    r = requests.post(f"{BASE}/api/customers", headers=headers, json={
        "name": "Test Customer", "phone": "+1 555 9999",
    })
    assert r.status_code == 201
    cust_id = r.json()["id"]
    print(f"[OK] Create customer - {r.json()['name']}")

    # Test category creation
    r = requests.post(f"{BASE}/api/categories", headers=headers, json={"name": "Test Category"})
    assert r.status_code == 201
    print(f"[OK] Create category - {r.json()['name']}")

    # Test unauthorized access
    r = requests.get(f"{BASE}/api/products")
    assert r.status_code == 401
    print(f"[OK] Unauthorized access blocked")

    # Test unauthorized user management (Cashier role)
    r2 = requests.post(f"{BASE}/api/auth/login", json={"username": "priya", "password": "demo1234"})
    token2 = r2.json()["token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    r = requests.get(f"{BASE}/api/users", headers=headers2)
    assert r.status_code == 403
    print(f"[OK] Role-based access control works")

    print("\n=== ALL TESTS PASSED ===")

if __name__ == "__main__":
    try:
        test()
    except Exception as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
