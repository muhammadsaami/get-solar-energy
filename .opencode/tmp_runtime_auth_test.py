"""
Runtime Auth Audit

Traces the full auth flow:
  Login → get token → call protected endpoints → trace failures
"""
import sys, os, json, time, requests as req

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

BACKEND_URL = "http://localhost:8000"

# ────────────────────────────────────────────────────────
# 1. Test 1: Login — get a real token
# ────────────────────────────────────────────────────────
print("=" * 70)
print("TEST 1: Login & get JWT token")
print("=" * 70)

try:
    r = req.post(f"{BACKEND_URL}/api/login", json={
        "email": "admin@getsolar.com",
        "password": "Admin@123",
    }, timeout=10)
    print(f"  POST /api/login → {r.status_code}")
    if r.status_code == 200:
        body = r.json()
        token = body.get("access_token") or body.get("token") or ""
        print(f"  Token received: {'YES' if token else 'NO'}")
        print(f"  Token preview: {token[:60]}...")
    else:
        print(f"  Body: {r.text[:300]}")
        token = ""
except Exception as e:
    print(f"  Connection failed: {e}")
    print("  (Server may not be running)")
    sys.exit(1)

print()

# ────────────────────────────────────────────────────────
# 2. Test without token (anonymous)
# ────────────────────────────────────────────────────────
print("=" * 70)
print("TEST 2: Anonymous request (no Authorization header)")
print("=" * 70)

endpoints_noauth = [
    ("GET", "/api/admin/dashboard"),
    ("GET", "/api/admin/activity"),
    ("GET", "/api/admin/health"),
]

for method, path in endpoints_noauth:
    try:
        if method == "GET":
            r = req.get(f"{BACKEND_URL}{path}", timeout=10)
        print(f"  {method} {path:45s} → {r.status_code}")
        if r.status_code == 401:
            print(f"    Expected 401 (no auth): PASS")
        else:
            print(f"    Unexpected status: {r.status_code}")
    except Exception as e:
        print(f"  {method} {path:45s} → ERROR: {e}")

print()

# ────────────────────────────────────────────────────────
# 3. Test with token — Admin Dashboard
# ────────────────────────────────────────────────────────
print("=" * 70)
print("TEST 3: Authenticated requests with token")
print("=" * 70)

if not token:
    print("  SKIPPED — no token available")
else:
    headers = {"Authorization": f"Bearer {token}"}

    protected_endpoints = [
        ("GET", "/api/admin/dashboard"),
        ("GET", "/api/admin/activity"),
        ("GET", "/api/admin/health"),
        ("GET", "/api/crm/pipeline-metrics"),
        ("GET", "/api/crm/tasks"),
        ("GET", "/api/crm/meetings"),
        ("GET", "/api/crm/followups"),
        ("GET", "/api/crm/alerts"),
        ("GET", "/api/crm/reports/activity"),
        ("GET", "/api/dashboard/stats"),
        ("GET", "/api/dashboard/recent-bills"),
        ("GET", "/api/projects/metrics"),
    ]

    for method, path in protected_endpoints:
        try:
            if method == "GET":
                r = req.get(f"{BACKEND_URL}{path}", headers=headers, timeout=10)
            status = r.status_code
            ok = "OK" if status == 200 else "FAIL"
            print(f"  {method} {path:45s} → {status} {ok}")
        except Exception as e:
            print(f"  {method} {path:45s} → ERROR: {e}")

print()

# ────────────────────────────────────────────────────────
# 4. Token decode & validation
# ────────────────────────────────────────────────────────
print("=" * 70)
print("TEST 4: JWT token analysis")
print("=" * 70)

if token:
    # Decode with python-jose (the lib used by backend)
    try:
        from jose import jwt as jose_jwt
        from dotenv import load_dotenv
        load_dotenv()
        secret = os.getenv("JWT_SECRET_KEY", "")
        algorithm = os.getenv("JWT_ALGORITHM", "HS256")

        print(f"  SECRET_KEY set: {'YES' if secret else 'NO'}")
        print(f"  SECRET_KEY length: {len(secret)}")
        print(f"  ALGORITHM: {algorithm}")

        # Decode without verification
        raw = jose_jwt.get_unverified_claims(token)
        print(f"  Payload: {json.dumps(raw, indent=2)}")

        # Check expiry
        exp = raw.get("exp", 0)
        now = time.time()
        from datetime import datetime
        print(f"  exp: {datetime.fromtimestamp(exp)}")
        print(f"  now: {datetime.fromtimestamp(now)}")
        print(f"  expired: {'YES' if now > exp else 'NO'}")

        # Verify properly
        try:
            verified = jose_jwt.decode(token, secret, algorithms=[algorithm])
            print(f"  Verification: PASS (sub={verified.get('sub')})")
        except Exception as e:
            print(f"  Verification: FAIL — {e}")

    except ImportError:
        print("  (python-jose not installed — install with: pip install python-jose)")
        print(f"  Token preview: {token[:60]}...")
else:
    print("  SKIPPED — no token available")

print()

# ────────────────────────────────────────────────────────
# 5. Edge cases
# ────────────────────────────────────────────────────────
print("=" * 70)
print("TEST 5: Edge cases")
print("=" * 70)

# Expired token simulation
import base64
if token:
    parts = token.split(".")
    if len(parts) == 3:
        # Decode payload, change exp to past, re-encode
        try:
            import json
            padding = 4 - len(parts[1]) % 4
            if padding != 4:
                parts[1] += "=" * padding
            payload_bytes = base64.urlsafe_b64decode(parts[1])
            payload = json.loads(payload_bytes)
            payload["exp"] = int(time.time()) - 3600  # 1 hour ago
            new_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
            expired_token = f"{parts[0]}.{new_payload}.{parts[2]}"

            r = req.get(f"{BACKEND_URL}/api/admin/dashboard",
                       headers={"Authorization": f"Bearer {expired_token}"}, timeout=10)
            print(f"  Expired token → {r.status_code} (expected 401)")
        except Exception as e:
            print(f"  Expired token test error: {e}")

# Missing header
r = req.get(f"{BACKEND_URL}/api/admin/dashboard", timeout=10)
print(f"  No auth header → {r.status_code} (expected 401)")

# Malformed token
r = req.get(f"{BACKEND_URL}/api/admin/dashboard",
           headers={"Authorization": "Bearer abc.def.ghi"}, timeout=10)
print(f"  Malformed token → {r.status_code} (expected 401)")

# Wrong secret token
try:
    from jose import jwt as jose_jwt
    from dotenv import load_dotenv
    load_dotenv()
    fake_token = jose_jwt.encode({"sub": "hacker", "exp": int(time.time()) + 3600}, "wrong-secret", algorithm="HS256")
    r = req.get(f"{BACKEND_URL}/api/admin/dashboard",
               headers={"Authorization": f"Bearer {fake_token}"}, timeout=10)
    print(f"  Wrong-secret token → {r.status_code} (expected 401)")
except:
    print("  Wrong-secret test skipped (jose not available)")

print()
print("=" * 70)
print("RUNTIME AUTH AUDIT COMPLETE")
print("=" * 70)
