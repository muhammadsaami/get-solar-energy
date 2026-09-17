from fastapi import FastAPI, Depends, Request
from fastapi.security import OAuth2PasswordBearer
import uvicorn
import threading
import time
import requests

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.get("/test")
def test(token: str = Depends(oauth2_scheme)):
    return {"token": token}

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="error")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(1)

token_value = "eyJhbG.fake.token"
res1 = requests.get("http://127.0.0.1:8001/test", headers={"Authorization": f"Bearer {token_value}"})
print("Manual fetch token:", res1.json())

res2 = requests.get("http://127.0.0.1:8001/test", headers={"Authorization": f"Bearer {token_value}", "Content-Type": "application/json"})
print("UI fetch token:", res2.json())
