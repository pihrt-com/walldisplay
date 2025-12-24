from app.config import PRUSA_LINK_PRINTERS, PRUSA_FARM
from app.printers.prusa_link import get_status as prusa_link_status
from app.printers.prusa_farm import get_all as prusa_farm_status


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

    return printers
