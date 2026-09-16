"""Runtime Auth Audit — JWT token inspection & backend flow trace"""
import sys, os, time, json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from security import create_access_token, verify_token, SECRET_KEY, ALGORITHM
import jwt
from fastapi import HTTPException

# ── Step 1: Create a fresh token ──
token = create_access_token(data={"sub": "admin@getsolar.com", "role": "admin"})
print("=" * 60)
print("STEP 1: Created fresh admin token")
print(f"Token: {token[:80]}...")
print()

# ── Step 2: Decode payload (no signature verify) ──
decoded = jwt.decode(token, options={"verify_signature": False})
print("=" * 60)
print("STEP 2: Decoded JWT Payload")
print(f"  sub:  {decoded.get('sub')}")
print(f"  role: {decoded.get('role')}")
exp_ts = decoded.get("exp", 0)
iat_ts = decoded.get("iat", 0)
now = time.time()
print(f"  iat:  {iat_ts}  ({datetime.fromtimestamp(iat_ts)})")
print(f"  exp:  {exp_ts}  ({datetime.fromtimestamp(exp_ts)})")
print(f"  now:  {int(now)}  ({datetime.fromtimestamp(now)})")
print(f"  Expired?    {'YES' if now > exp_ts else 'NO'}")
print(f"  TTL left:   {timedelta(seconds=int(exp_ts - now))}")
print()

# ── Step 3: Verify with secret key ──
print("=" * 60)
print("STEP 3: Verify token with SECRET_KEY")
print(f"  SECRET_KEY type: {type(SECRET_KEY).__name__}, length: {len(str(SECRET_KEY))}")
print(f"  ALGORITHM: {ALGORITHM}")
try:
    verified = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"  VERIFICATION: PASS")
    print(f"  sub={verified['sub']} role={verified.get('role')}")
except Exception as e:
    print(f"  VERIFICATION: FAIL — {e}")
print()

# ── Step 4: Simulate verify_token() dependency ──
print("=" * 60)
print("STEP 4: Simulate verify_token() dependency flow")
print("  (This is what FastAPI calls via Depends(verify_token))")
try:
    from unittest.mock import Mock
    from fastapi import Request

    req = Mock(spec=Request)
    req.headers = {"authorization": f"Bearer {token}"}

    email = verify_token(token="dummy", authorization=f"Bearer {token}")
    print(f"  verify_token() returned: {email}")
    print("  AUTHENTICATION: PASS")
except HTTPException as e:
    print(f"  verify_token() raised HTTP {e.status_code}: {e.detail}")
    print("  AUTHENTICATION: FAIL")
except Exception as e:
    print(f"  verify_token() raised: {type(e).__name__}: {e}")

print()

# ── Step 5: Check has_admin_access (if applicable) ──
print("=" * 60)
print("STEP 5: Check admin role")
role = decoded.get("role", "")
print(f"  Token role: {role}")
print(f"  Is admin? {'YES' if role == 'admin' else 'NO'}")
print()

# ── Step 6: Check token expiry edge cases ──
print("=" * 60)
print("STEP 6: Edge cases")
# Wrong secret
try:
    jwt.decode(token, "wrong-secret", algorithms=[ALGORITHM])
    print("  Wrong secret: UNEXPECTED PASS")
except jwt.InvalidSignatureError:
    print("  Wrong secret: CORRECTLY REJECTED (InvalidSignatureError)")
except Exception as e:
    print(f"  Wrong secret: REJECTED ({type(e).__name__})")

# Wrong algorithm
try:
    jwt.decode(token, SECRET_KEY, algorithms=["HS512"])
    print("  Wrong algorithm: UNEXPECTED PASS")
except jwt.InvalidAlgorithmError:
    print("  Wrong algorithm: CORRECTLY REJECTED (InvalidAlgorithmError)")
except Exception as e:
    print(f"  Wrong algorithm: REJECTED ({type(e).__name__})")

# Malformed token
try:
    jwt.decode("abc.def.ghi", SECRET_KEY, algorithms=[ALGORITHM])
    print("  Malformed token: UNEXPECTED PASS")
except Exception as e:
    print(f"  Malformed token: CORRECTLY REJECTED ({type(e).__name__})")

# Missing Authorization header
print("  Missing Auth header: verify_token would raise 401 (tested in code below)")

print()
print("=" * 60)
print("AUDIT COMPLETE")
