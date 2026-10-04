---
name: wallboard-diagnostics
description: Diagnose and deploy walldisplay or wallboard Raspberry Pi fixes, including Prusa MK3 farms, Shelly Cloud, and the remote status mirror.
---

# Wallboard Diagnostics

Use this skill for maintenance of this repository's Raspberry Pi deployment and its remote mirror.

- The production directory is `/opt/wallboard`, not a Git checkout. Clone the repository to a temporary directory under `/home/pi`, back up affected files, and copy only the changed runtime files. Never overwrite `app/config.py`, which contains device credentials.
- The MK3 farm supports both `PRUSA_FARM["printers"]` (current list form) and the legacy `PRUSA_FARM["instances"]` mapping used by early `wallboard` deployments. An empty MK3 payload usually means a configuration-schema mismatch, not unavailable printers; unreachable configured printers must remain visible as `offline` cards.
- The local FastAPI endpoint is `http://127.0.0.1:8000/api/status`. The local Nginx frontend is `/var/www/wallboard`, separate from `/opt/wallboard`.
- Compare `generated_at` from the local endpoint and `https://farma.pihrt.com/status.json` with a unique query parameter before diagnosing stale remote data. The remote CDN caches static assets for a long time: keep query cache-busting in `app.js` and version the script URL in `index.html` when JavaScript behavior changes.
- `measured_at` on a Shelly card is the Shelly Cloud source measurement time, not the backend fetch time. A stale sensor timestamp indicates the cloud has not received a newer device reading; it does not prove that the wallboard JSON is stale.
- Do not print, commit, or request secrets. In particular, Cloud API failures can include query parameters in exception text, so redact them before sharing logs.
- Validate Python syntax, JavaScript syntax, the MK3 count in `/api/status`, and the remote mirror's `generated_at` after a deployment.
