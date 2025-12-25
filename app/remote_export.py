import requests
from app.config import REMOTE_EXPORT


def send_remote_status(data):
    if not REMOTE_EXPORT.get("enabled"):
        return

    try:
        r = requests.post(
            REMOTE_EXPORT["url"],
            json=data,
            headers={
                "Authorization": f"Bearer {REMOTE_EXPORT['token']}",
                "Content-Type": "application/json"
            },
            timeout=5
        )
        r.raise_for_status()

    except Exception as e:
        print(f"[REMOTE_EXPORT] Failed: {e}")
