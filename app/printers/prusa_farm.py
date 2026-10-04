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

    configured_printers = cfg.get("printers")
    if configured_printers is None:
        # Earlier wallboard installations store the farm as an instance-number
        # mapping. Keep that deployed configuration working after the newer
        # list-based configuration format was introduced.
        instances = cfg.get("instances", {})
        if not isinstance(instances, dict):
            raise ValueError("PRUSA_FARM instances must be a dictionary")
        configured_printers = [
            {"instance": instance, **printer}
            for instance, printer in instances.items()
        ]

    if not isinstance(configured_printers, list):
        raise ValueError("PRUSA_FARM printers must be a list")

    for p in configured_printers:
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
