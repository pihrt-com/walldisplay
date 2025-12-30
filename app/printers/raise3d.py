import time
import hashlib
import requests

TIMEOUT = 3

_TOKEN_CACHE = {}  # base_url -> (token, timestamp)


# ---------- LOW LEVEL ----------

def _normalize_base_url(url: str) -> str:
    return url.rstrip("/").replace(":10800", "")


def _login(base_url: str, password: str) -> str:
    ts = int(time.time() * 1000)
    raw = f"password={password}&timestamp={ts}"

    sha1_hex = hashlib.sha1(raw.encode("utf-8")).hexdigest()
    sign = hashlib.md5(sha1_hex.encode("utf-8")).hexdigest()

    url = f"{base_url}:10800/v1/login"

    r = requests.get(
        url,
        params={
            "timestamp": ts,
            "sign": sign
        },
        timeout=TIMEOUT
    )

    r.raise_for_status()
    j = r.json()

    if j.get("status") != 1:
        raise RuntimeError(j)

    token = j["data"]["token"]
    _TOKEN_CACHE[base_url] = (token, time.time())
    return token


def _get_token(base_url: str, password: str) -> str:
    cached = _TOKEN_CACHE.get(base_url)
    if cached:
        token, ts = cached
        if time.time() - ts < 23 * 3600:
            return token

    return _login(base_url, password)


def _api_get(base_url: str, path: str, token: str) -> dict | None:
    url = f"{base_url}:10800/v1{path}"
    r = requests.get(url, params={"token": token}, timeout=TIMEOUT)

    if r.status_code != 200:
        return None

    j = r.json()
    if j.get("status") != 1:
        return None

    return j.get("data")


# ---------- HIGH LEVEL ----------

def get_status(cfg: dict) -> dict:
    base_url = _normalize_base_url(cfg["url"])
    password = cfg["api_key"]

    try:
        token = _get_token(base_url, password)

        run = _api_get(base_url, "/printer/runningstatus", token)
        job = _api_get(base_url, "/job/currentjob", token)
        nozzle = _api_get(base_url, "/printer/nozzle1", token)
        bed = _api_get(base_url, "/printer/basic", token)

        nozzle_temp = nozzle.get("nozzle_cur_temp", 0) if nozzle else 0
        bed_temp = bed.get("heatbed_cur_temp", 0) if bed else 0

        job_name = None
        progress = 0
        time_left = None
        state = "idle"

        if job:
            file_name = (job.get("file_name") or "").strip()
            job_status = job.get("job_status")
            printed = job.get("printed_time", 0)
            total = job.get("total_time", 0)

            is_real_job = (
                job_status == "running"
                and file_name != ""
                and printed > 0
                and total > printed
            )

            if is_real_job:
                job_name = file_name

                raw_progress = job.get("print_progress", 0)
                progress = int(raw_progress * 100) if raw_progress <= 1 else int(raw_progress)

                time_left = total - printed
                state = "printing"

            elif job_status == "paused" and file_name:
                state = "paused"

        temps = {
            "nozzle": round(nozzle_temp),
            "bed": round(bed_temp)
        }

        print(f"[Raise3D] querying {cfg['name']} {cfg['url']}")


        return {
            "name": cfg["name"],
            "vendor": "Raise3D",
            "model": cfg.get("model"),
            "state": state,
            "job": job_name,
            "progress": progress,
            "time_left": time_left,
            "temps": temps
        }

    except Exception as e:
        print("[Raise3D ERROR]", repr(e))
        return {
            "name": cfg["name"],
            "vendor": "Raise3D",
            "model": cfg.get("model"),
            "state": "offline"
        }
