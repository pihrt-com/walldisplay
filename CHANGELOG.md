# Changelog

## Unreleased

- Keep local status rendering responsive by refreshing Shelly telemetry and exporting remote status in background tasks; preserve the last known sensor readings during transient Cloud failures.
- Load history graphs independently from live status, guard graph rendering against missing or invalid series, and prevent overlapping status refreshes.
- Keep graph canvases unchanged when history samples have not changed and poll remote histories once per minute.
- Render graph updates into a buffer and keep the sensor graph directly below its measurement timestamp.
- Increase history graph height on narrow screens and redraw after viewport resizing or rotation.
- Preserve MK3 multi-instance cards and log the actual error if farm collection fails before individual printers can be queried.
- Restore compatibility with legacy wallboard `PRUSA_FARM["instances"]` configuration.
- Isolate Shelly Cloud collection so an integration failure cannot prevent printer status delivery.
- Treat rejected remote status uploads as errors and bypass caches for remote static JSON and power-history requests.
- Version the JavaScript URL so clients cannot retain the pre-cache-busting script.
