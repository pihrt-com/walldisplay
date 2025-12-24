import requests


def normalize_state(state):
    mapping = {
        "PRINTING": "printing",
        "IDLE": "idle",
        "PAUSED": "paused",
        "STOPPED": "idle",
        "ERROR": "error",
        "BUSY": "printing"
    }
    return mapping.get(state, state.lower())


def get_status(printer):
    r = requests.get(
        f"{printer['url']}/api/v1/status",
        headers={"X-Api-Key": printer["api_key"]},
        timeout=3
    )
    r.raise_for_status()
    j = r.json()

    job = j.get("job")
    printer_data = j.get("printer", {})

    return {
        "name": printer["name"],
        "vendor": "Prusa",
        "model": printer["model"],
        "state": normalize_state(printer_data.get("state", "offline")),
        "progress": job.get("progress") if job else 0,
        "time_left": job.get("time_remaining") if job else None,
        "temps": {
            "nozzle": printer_data.get("temp_nozzle"),
            "bed": printer_data.get("temp_bed")
        } if "temp_nozzle" in printer_data else None
    }
