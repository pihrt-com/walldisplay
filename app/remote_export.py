import time
import requests
from app.config import REMOTE_EXPORT

def send_remote_status(printers):
    if not REMOTE_EXPORT.get("enabled"):
        return

    payload = {
        "generated_at": int(time.time()),
        "printers": printers
    }

    try:
        requests.post(
            REMOTE_EXPORT["url"],
            json=payload,
            headers={
                "Authorization": f"Bearer {REMOTE_EXPORT['token']}",
                "Content-Type": "application/json"
            },
            timeout=5
        )
    except Exception as e:
        print("Remote export failed:", e)
