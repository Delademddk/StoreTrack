import requests
import sys

BASE = "http://localhost:8000"

def test_comprehensive():
    # Login as admin
    r = requests.post(f"{BASE}/api/auth/login", json={"username": "alex", "password": "demo1234"})
    assert r.status_code == 200
    token = r.json()["token"]
    h = {"Authorization": f"Bearer {token}"}

    # Test inventory calculation
    r = requests.get(f"{BASE}/api/products/p_01", headers=h)
    p = r.json()
    assert p["isBoxed"] is True
    total = p["boxes"] * p["itemsPerBox"] + p["extraPieces"]
    print(f"[OK] Product p_01 stock: {p['boxes']} boxes x {p['itemsPerBox']} + {p['extraPieces']} = {total}")

    # Test stock deduction on sale
    old_extra = p["extraPieces"]
    r = requests.post(f"{BASE}/api/sales", headers=h, json={
        "items": [{"productId": "p_03", "name": "MX-Wireless Mouse G2", "qty": 5, "unitPrice": 64.50}],
        "subtotal": 322.50, "discount": 0, "tax": 0, "total": 322.50, "method": "Cash",
    })
    assert r.status_code == 201
    print(f"[OK] Sale deducted stock - {r.json()['invoice']}")

    r = requests.get(f"{BASE}/api/products/p_03", headers=h)
    assert r.json()["extraPieces"] == 19  # Was 24, sold 5
    print(f"[OK] Stock correctly deducted: {r.json()['extraPieces']} remaining")

    # Test restock
    r = requests.post(f"{BASE}/api/products/p_03/restock", headers=h, json={
        "addBoxes": 0, "addPieces": 10, "reason": "Supplier Delivery", "notes": "Restock"
    })
    assert r.status_code == 200
    assert r.json()["extraPieces"] == 29  # 19 + 10
    print(f"[OK] Restock works: {r.json()['extraPieces']} after restock")

    # Test credit sale with customer
    r = requests.post(f"{BASE}/api/sales", headers=h, json={
        "items": [{"productId": "p_07", "name": "Matte Black Electric Kettle", "qty": 2, "unitPrice": 58.00}],
        "subtotal": 116.00, "discount": 0, "tax": 0, "total": 116.00, "method": "Cash",
        "onCredit": True, "customerId": "c_01", "amountPaid": 50.00,
        "expectedPaymentDate": "2026-10-01T00:00:00Z",
    })
    assert r.status_code == 201
    print(f"[OK] Credit sale created: {r.json()['invoice']}")

    # Check customer ledger
    r = requests.get(f"{BASE}/api/customers/c_01/summary", headers=h)
    assert r.status_code == 200
    s = r.json()
    assert s["outstanding"] > 0
    print(f"[OK] Customer outstanding: ${s['outstanding']:.2f}")

    # Test payment
    r = requests.post(f"{BASE}/api/customers/c_01/payments", headers=h, json={
        "amount": 100.00, "method": "Mobile Money", "reference": "MPESA-TEST"
    })
    assert r.status_code == 200
    print(f"[OK] Payment recorded: ${r.json()['amount']}")

    # Test dashboard
    r = requests.get(f"{BASE}/api/dashboard/kpis", headers=h)
    assert r.status_code == 200
    k = r.json()
    print(f"[OK] Dashboard: {k['totalProducts']} products, {k['itemsInStock']} stock, {k['lowStock']} low stock")

    # Test reports
    r = requests.get(f"{BASE}/api/reports/audit-log", headers=h)
    assert r.status_code == 200
    print(f"[OK] Audit log: {len(r.json())} entries")

    # Test export
    r = requests.get(f"{BASE}/api/reports/export?format=csv", headers=h)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    print(f"[OK] CSV export works")

    # Test product CSV export
    r = requests.get(f"{BASE}/api/reports/products/export", headers=h)
    assert r.status_code == 200
    print(f"[OK] Product CSV export works")

    # Test user role restrictions
    r2 = requests.post(f"{BASE}/api/auth/login", json={"username": "priya", "password": "demo1234"})
    h2 = {"Authorization": f"Bearer {r2.json()['token']}"}

    r = requests.get(f"{BASE}/api/users", headers=h2)
    assert r.status_code == 403  # Cashier can't list users
    print(f"[OK] Cashier blocked from user management")

    r = requests.post(f"{BASE}/api/products", headers=h2, json={
        "name": "Test", "category": "Electronics", "brand": "X", "supplier": "Y",
    })
    assert r.status_code == 403  # Cashier can't create products
    print(f"[OK] Cashier blocked from product creation")

    # Test settings
    r = requests.get(f"{BASE}/api/settings", headers=h)
    assert r.status_code == 200
    assert r.json()["store"]["storeName"] == "StoreTrack Demo Store"
    print(f"[OK] Settings loaded correctly")

    # Test category management
    r = requests.post(f"{BASE}/api/categories", headers=h, json={"name": "TestCat"})
    assert r.status_code == 201
    cat_id = r.json()["id"]
    r = requests.put(f"{BASE}/api/categories/{cat_id}", headers=h, json={"name": "TestCat Updated"})
    assert r.status_code == 200
    r = requests.delete(f"{BASE}/api/categories/{cat_id}", headers=h)
    assert r.status_code == 200
    print(f"[OK] Category CRUD works")

    # Test product duplicate
    r = requests.post(f"{BASE}/api/products/p_01/duplicate", headers=h)
    assert r.status_code == 201
    assert "(Copy)" in r.json()["name"]
    print(f"[OK] Product duplicate works")

    print("\n=== ALL COMPREHENSIVE TESTS PASSED ===")

if __name__ == "__main__":
    try:
        test_comprehensive()
    except Exception as e:
        print(f"\n[FAIL] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
