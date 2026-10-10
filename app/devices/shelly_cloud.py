"""Read temperature and humidity sensors through the Shelly Cloud API."""

import time
from typing import Any

import requests


TIMEOUT_SECONDS = 4
_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


def _cloud_status_url(server_url: str) -> str:
    server_url = server_url.strip().rstrip("/")
    if not server_url.startswith(("https://", "http://")):
        server_url = f"https://{server_url}"
    return f"{server_url}/device/status"


def _number(value: Any) -> float | None:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return None


def _find_value(status: dict[str, Any], component_prefixes: tuple[str, ...], field_names: tuple[str, ...]) -> float | None:
    for key, component in status.items():
        if not isinstance(component, dict) or not key.lower().startswith(component_prefixes):
            continue
        for field_name in field_names:
            value = _number(component.get(field_name))
            if value is not None:
                return value
    return None


def _extract_sensor_status(response: dict[str, Any], sensor: dict[str, str]) -> dict[str, Any]:
    if response.get("isok") is False:
        raise RuntimeError("Shelly Cloud rejected the status request")

    cloud_data = response.get("data")
    if not isinstance(cloud_data, dict):
        raise RuntimeError("Shelly Cloud returned no device data")

    status = cloud_data.get("device_status", cloud_data)
    if not isinstance(status, dict):
        raise RuntimeError("Shelly Cloud returned an invalid device status")

    online = cloud_data.get("online", status.get("online", True))
    if online is False:
        return {
            "name": sensor["name"], "device_id": sensor["device_id"], "state": "offline",
            "temperature_c": None, "humidity_percent": None,
            "measured_at": status.get("_updated") or cloud_data.get("_updated"),
            "fetched_at": int(time.time()),
        }

    # Shelly Plus H&T (Gen2) reports temperature:0.tC and humidity:0.rh.
    # The fallbacks keep the card compatible with older Cloud payloads too.
    temperature = _find_value(status, ("temperature:", "temp:"), ("tC", "tc", "temperature"))
    humidity = _find_value(status, ("humidity:", "hum:"), ("rh", "humidity"))
    if temperature is None:
        temperature = _number(status.get("temperature"))
    if humidity is None:
        humidity = _number(status.get("humidity"))
    if temperature is None or humidity is None:
        raise RuntimeError("Shelly Cloud response contains no temperature or humidity")

    return {
        "name": sensor["name"], "device_id": sensor["device_id"], "state": "online",
        "temperature_c": round(temperature, 1), "humidity_percent": round(humidity, 1),
        "measured_at": status.get("_updated") or cloud_data.get("_updated") or int(time.time()),
        "fetched_at": int(time.time()),
    }


def _read_sensor(cloud: dict[str, Any], sensor: dict[str, str]) -> dict[str, Any]:
    response = requests.get(
        _cloud_status_url(cloud["server_url"]),
        params={"id": sensor["device_id"], "auth_key": cloud["auth_key"]},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return _extract_sensor_status(response.json(), sensor)


def get_sensor_statuses(cloud: dict[str, Any]) -> list[dict[str, Any]]:
    """Return a card payload for every configured cloud sensor."""
    if not cloud.get("enabled"):
        return []

    refresh_seconds = max(1, int(cloud.get("refresh_seconds", 60)))
    now = time.monotonic()
    results = []
    for sensor in cloud.get("sensors", []):
        if not sensor.get("name") or not sensor.get("device_id"):
            continue

        cache_key = sensor["device_id"]
        cached = _CACHE.get(cache_key)
        if cached and now - cached[0] < refresh_seconds:
            results.append(cached[1])
            continue

        try:
            result = _read_sensor(cloud, sensor)
        except Exception as exc:
            print(f"Shelly Cloud {sensor['device_id']} error: {exc}")
            if cached:
                result = dict(cached[1])
                result["fetched_at"] = int(time.time())
                result["stale"] = True
            else:
                result = {
                    "name": sensor["name"], "device_id": sensor["device_id"], "state": "offline",
                    "temperature_c": None, "humidity_percent": None,
                    "measured_at": None, "fetched_at": int(time.time()),
                }
        _CACHE[cache_key] = (now, result)
        results.append(result)
    return results
