from app.config import (
    PRUSA_LINK_PRINTERS,
    PRUSA_FARM,
    RAISE3D_PRINTERS,
    SHELLY_DEVICES,
    SHELLY_CLOUD,
)

from app.printers.prusa_link import get_status as prusa_link_status
from app.printers.prusa_farm import get_all as prusa_farm_status
from app.printers.raise3d import get_status as raise3d_status

from app.devices.shelly_4pm import get_power_status
from app.devices.shelly_cloud import get_sensor_statuses
from app.remote_export import send_remote_status

import time


def collect():
    printers = []

    # XL + MK4 (LAN)
    for printer in PRUSA_LINK_PRINTERS:
        try:
            printers.append(prusa_link_status(printer))
        except Exception:
            printers.append({
                "name": printer["name"],
                "vendor": "Prusa",
                "model": printer["model"],
                "state": "offline"
            })

    # MK3 farm (USB, multi-instance)
    try:
        printers.extend(prusa_farm_status(PRUSA_FARM))
    except Exception as exc:
        print(f"MK3 farm aggregation error: {exc}")
        # Keep the cards visible when the farm configuration itself is invalid
        # or the collector cannot start. Per-printer connection failures are
        # already handled by prusa_farm.get_all().
        for printer in PRUSA_FARM.get("printers", []):
            printers.append({
                "name": printer.get("name", "MK3"),
                "vendor": "Prusa",
                "model": "MK3",
                "state": "offline",
            })

    # Raise Pro2 and Pro3
    for p in RAISE3D_PRINTERS:
        try:
            printers.append(raise3d_status(p))
        except Exception:
            printers.append({
                "name": p["name"],
                "vendor": "Raise3D",
                "model": p["model"],
                "state": "offline"
            })

    # Energy (Shelly)
    power = None
    if SHELLY_DEVICES:
        try:
            power = get_power_status(SHELLY_DEVICES)
        except Exception as e:
            print(f"Shelly aggregation error: {e}")

    try:
        sensors = get_sensor_statuses(SHELLY_CLOUD)
    except Exception as exc:
        # A cloud integration failure must not block printer status delivery.
        print(f"Shelly Cloud aggregation error: {exc}")
        sensors = []

    send_remote_status(printers, power, sensors)

    return {
        "generated_at": int(time.time()),
        "printers": printers,
        "power": power,
        "sensors": sensors,
    }
