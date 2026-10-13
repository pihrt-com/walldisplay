"""Collect lightweight Raspberry Pi diagnostics for the wall display."""

from __future__ import annotations

import platform
import subprocess
import sys
from pathlib import Path


OS_RELEASE_PATH = Path("/etc/os-release")
MEMINFO_PATH = Path("/proc/meminfo")
UPTIME_PATH = Path("/proc/uptime")
THERMAL_ROOT = Path("/sys/class/thermal")
WALLDISPLAY_SERVICES = ("wallboard.service", "walldisplay.service")
PI_CONNECT_SERVICE = "rpi-connect.service"
SYSTEMCTL_PATH = "/usr/bin/systemctl"
PI_CONNECT_PATH = "/usr/bin/rpi-connect"


def _read_os_release() -> str:
    """Return the human-readable Linux release, including a safe fallback."""
    try:
        values = {}
        for line in OS_RELEASE_PATH.read_text(encoding="utf-8").splitlines():
            if "=" not in line or line.startswith("#"):
                continue
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"')
        if values.get("PRETTY_NAME"):
            return values["PRETTY_NAME"]
    except OSError:
        pass
    return platform.platform() or "–"


def _read_cpu_temperature() -> float | None:
    """Read the Linux thermal-zone temperature in degrees Celsius."""
    try:
        temperature_files = sorted(THERMAL_ROOT.glob("thermal_zone*/temp"))
    except OSError:
        temperature_files = []

    for temperature_file in temperature_files:
        try:
            raw = float(temperature_file.read_text(encoding="utf-8").strip())
        except (OSError, ValueError):
            continue
        if raw > 1000:
            raw /= 1000
        if -40 <= raw <= 150:
            return round(raw, 1)
    return None


def _read_memory() -> dict | None:
    """Return actual RAM use from /proc/meminfo, without an extra dependency."""
    try:
        values = {}
        for line in MEMINFO_PATH.read_text(encoding="utf-8").splitlines():
            key, _, value = line.partition(":")
            if not value:
                continue
            values[key] = int(value.strip().split()[0]) * 1024
        total = values["MemTotal"]
        available = values["MemAvailable"]
    except (KeyError, OSError, ValueError):
        return None

    used = max(0, total - available)
    return {
        "total_bytes": total,
        "used_bytes": used,
        "percent": round((used / total) * 100, 1) if total else None,
    }


def _read_uptime_seconds() -> int | None:
    """Read Linux uptime from /proc/uptime as whole seconds."""
    try:
        return int(float(UPTIME_PATH.read_text(encoding="utf-8").split()[0]))
    except (IndexError, OSError, ValueError):
        return None


def _service_state(service_name: str) -> str:
    """Return systemd's state without allowing a missing unit to break the API."""
    try:
        result = subprocess.run(
            [SYSTEMCTL_PATH, "is-active", service_name],
            check=False,
            capture_output=True,
            text=True,
            timeout=1,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return "unavailable"

    state = result.stdout.strip().lower()
    return state or "unavailable"


def _first_active_service_state(service_names: tuple[str, ...]) -> str:
    """Return active when any compatible service unit is active."""
    states = [_service_state(service_name) for service_name in service_names]
    if "active" in states:
        return "active"
    return next((state for state in states if state != "unavailable"), "unavailable")


def _pi_connect_state() -> str:
    """Query Raspberry Pi Connect directly because its systemd unit may be user-scoped."""
    try:
        result = subprocess.run(
            [PI_CONNECT_PATH, "status"],
            check=False,
            capture_output=True,
            text=True,
            timeout=1,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return _service_state(PI_CONNECT_SERVICE)

    if result.returncode == 0 and "signed in: yes" in result.stdout.lower():
        return "active"
    return _service_state(PI_CONNECT_SERVICE)


def collect_system_status() -> dict:
    """Return optional system diagnostics for local and remote dashboard clients."""
    return {
        "linux_version": _read_os_release(),
        "python_version": platform.python_version() or sys.version.split()[0],
        "cpu_temperature_c": _read_cpu_temperature(),
        "memory": _read_memory(),
        "uptime_seconds": _read_uptime_seconds(),
        "walldisplay_service": _first_active_service_state(WALLDISPLAY_SERVICES),
        "pi_connect_service": _pi_connect_state(),
    }
