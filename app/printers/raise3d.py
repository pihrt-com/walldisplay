import requests

def get_status(printer):
    r = requests.get(f"{printer['url']}/v1/printer/status", timeout=3)
    j = r.json()

    return {
        "name": printer["name"],
        "vendor": "Raise3D",
        "model": printer["model"],
        "state": j["status"],
        "job": j.get("job_name"),
        "progress": j.get("progress", 0),
        "time_left": j.get("remaining_time")
    }