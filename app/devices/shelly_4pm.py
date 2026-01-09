import requests
from requests.auth import HTTPBasicAuth


def _get_status(device):
    url = f"http://{device['ip']}/rpc/Shelly.GetStatus"

    auth = None
    if device.get("username") and device.get("password"):
        auth = HTTPBasicAuth(device["username"], device["password"])

    response = requests.get(url, timeout=5, auth=auth)
    response.raise_for_status()
    return response.json()


def _extract_voltages(data):
    """
    Shelly FW differs by model/firmware.
    Voltage can be in:
      - switch:0.voltage
      - em:0.voltage
      - sometimes on root (rare)
    """
    voltages = []

    # rare case
    if isinstance(data.get("voltage"), (int, float)):
        voltages.append(float(data["voltage"]))

    # switch channels
    for key, value in data.items():
        if key.startswith("switch:") and isinstance(value, dict):
            v = value.get("voltage")
            if isinstance(v, (int, float)):
                voltages.append(float(v))

    # EM measurement block
    for key, value in data.items():
        if key.startswith("em:") and isinstance(value, dict):
            v = value.get("voltage")
            if isinstance(v, (int, float)):
                voltages.append(float(v))

    return voltages


def get_power_status(devices):
    total_power_w = 0.0
    total_energy_wh = 0.0
    all_voltages = []

    for device in devices:
        try:
            data = _get_status(device)
        except Exception as e:
            print(f"Shelly {device.get('ip')} unreachable: {e}")
            continue

        # collect voltages from this device
        all_voltages.extend(_extract_voltages(data))

        # sum channels
        for key, value in data.items():
            if key.startswith("switch:") and isinstance(value, dict):
                total_power_w += value.get("apower", 0.0)
                total_energy_wh += value.get("aenergy", {}).get("total", 0.0)

    voltage_v = None
    if all_voltages:
        voltage_v = round(sum(all_voltages) / len(all_voltages), 1)

    return {
        "power_w": round(total_power_w, 1),
        "power_kw": round(total_power_w / 1000, 2),
        "voltage_v": voltage_v,
        "energy_kwh": round(total_energy_wh / 1000, 2),
    }