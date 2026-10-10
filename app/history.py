"""Persist compact telemetry histories for the local API and remote mirror."""

import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any


HISTORY_DIR = Path(os.environ.get("WALLDISPLAY_HISTORY_DIR", Path(__file__).parent / "data" / "history"))
POWER_SAMPLE_INTERVAL = 60
SENSOR_SAMPLE_INTERVAL = 60
HISTORY_SECONDS = 12 * 60 * 60


def _read(name: str) -> dict[str, Any]:
    try:
        value = json.loads((HISTORY_DIR / name).read_text(encoding="utf-8"))
        if isinstance(value, dict) and isinstance(value.get("samples"), list):
            return value
    except (OSError, ValueError):
        pass
    return {"generated_at": int(time.time()), "samples": []}


def _write(name: str, history: dict[str, Any]) -> None:
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{name}.", suffix=".tmp", dir=HISTORY_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            json.dump(history, output, separators=(",", ":"))
        os.replace(temp_name, HISTORY_DIR / name)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def _record(name: str, samples: list[dict[str, Any]], now: int, interval: int) -> dict[str, Any]:
    history = _read(name)
    existing = history["samples"]
    last_ts = existing[-1].get("ts") if existing and isinstance(existing[-1], dict) else None
    if not isinstance(last_ts, (int, float)) or now - last_ts >= interval:
        existing.append({"ts": now, **samples[0]})
    min_ts = now - HISTORY_SECONDS
    history["samples"] = [sample for sample in existing if isinstance(sample, dict) and isinstance(sample.get("ts"), (int, float)) and sample["ts"] >= min_ts]
    history["generated_at"] = now
    _write(name, history)
    return history


def record_power(power: dict[str, Any] | None, now: int | None = None) -> dict[str, Any]:
    now = int(time.time()) if now is None else now
    kw = None
    if isinstance(power, dict):
        if isinstance(power.get("power_kw"), (int, float)):
            kw = float(power["power_kw"])
        elif isinstance(power.get("power_w"), (int, float)):
            kw = float(power["power_w"]) / 1000
    if kw is not None:
        return _record("power_history.json", [{"kw": round(kw, 3)}], now, POWER_SAMPLE_INTERVAL)
    return get_power_history()


def record_sensors(sensors: list[dict[str, Any]] | None, now: int | None = None) -> dict[str, Any]:
    now = int(time.time()) if now is None else now
    history = _read("sensor_history.json")
    samples = history["samples"]
    last_ts = samples[-1].get("ts") if samples and isinstance(samples[-1], dict) else None
    if not isinstance(last_ts, (int, float)) or now - last_ts >= SENSOR_SAMPLE_INTERVAL:
        for sensor in sensors or []:
            if sensor.get("state") != "online":
                continue
            temperature = sensor.get("temperature_c")
            humidity = sensor.get("humidity_percent")
            if isinstance(temperature, (int, float)) or isinstance(humidity, (int, float)):
                samples.append({"ts": now, "device_id": sensor.get("device_id"), "name": sensor.get("name"), "temperature_c": temperature, "humidity_percent": humidity})
    min_ts = now - HISTORY_SECONDS
    history["samples"] = [sample for sample in samples if isinstance(sample, dict) and isinstance(sample.get("ts"), (int, float)) and sample["ts"] >= min_ts]
    history["generated_at"] = now
    _write("sensor_history.json", history)
    return history


def get_power_history() -> dict[str, Any]:
    return _read("power_history.json")


def get_sensor_history() -> dict[str, Any]:
    return _read("sensor_history.json")
