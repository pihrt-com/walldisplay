from app.config import PRUSA_LINK_PRINTERS, PRUSA_FARM, RAISE3D_PRINTERS
from app.printers.prusa_link import get_status as prusa_link_status
from app.printers.prusa_farm import get_all as prusa_farm_status
from app.printers.raise3d import get_status as raise3d_status
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
    except Exception:
        pass

    # Raise Pro2 and Pro3
    for p in RAISE3D_PRINTERS:
        printers.append(raise3d_status(p))    

    send_remote_status(printers)
    
    return {
        "generated_at": int(time.time()),  # UNIX timestamp
        "printers": printers
    }