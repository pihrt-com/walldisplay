import requests
from requests.auth import HTTPBasicAuth


def _fetch_status(device):
    url = f"http://{device['ip']}/rpc/Shelly.GetStatus"

    auth = None
    if device.get("username") and device.get("password"):
        auth = HTTPBasicAuth(device["username"], device["password"])

    response = requests.get(url, timeout=5, auth=auth)
    response.raise_for_status()
    return response.json()


def get_power_status(devices):
    total_power_w = 0.0
    total_energy_wh = 0.0
    voltages = []

    for device in devices:
        try:
            data = _fetch_status(device)
        except Exception as e:
            print(f"Shelly {device.get('ip')} error: {e}")
            continue

        if "voltage" in data:
            voltages.append(data["voltage"])

        for key, value in data.items():
            if not key.startswith("switch:"):
                continue

            total_power_w += value.get("apower", 0.0)
            total_energy_wh += value.get("aenergy", {}).get("total", 0.0)

    return {
        "type": "power",
        "power_w": round(total_power_w, 1),
        "power_kw": round(total_power_w / 1000, 2),
        "voltage_v": round(sum(voltages) / len(voltages), 1) if voltages else None,
        "energy_kwh": round(total_energy_wh / 1000, 2),
    }