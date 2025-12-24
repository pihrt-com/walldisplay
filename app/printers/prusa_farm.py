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


def get_all(cfg):
    printers = []

    base = cfg["base_url"]

    for p in cfg["printers"]:
        try:
            r = requests.get(
                f"{base}/{p['instance']}/api/v1/status",
                headers={"X-Api-Key": p["api_key"]},
                timeout=3
            )
            r.raise_for_status()
            j = r.json()

            job = j.get("job")
            printer_data = j.get("printer", {})

            printers.append({
                "name": p["name"],
                "vendor": "Prusa",
                "model": "MK3",
                "state": normalize_state(printer_data.get("state", "offline")),
                "progress": job.get("progress") if job else 0,
                "time_left": job.get("time_remaining") if job else None
            })

        except Exception:
            printers.append({
                "name": p["name"],
                "vendor": "Prusa",
                "model": "MK3",
                "state": "offline"
            })

    return printers
