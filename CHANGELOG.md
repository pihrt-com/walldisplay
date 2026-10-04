# Changelog

## Unreleased

- Preserve MK3 multi-instance cards and log the actual error if farm collection fails before individual printers can be queried.
- Restore compatibility with legacy wallboard `PRUSA_FARM["instances"]` configuration.
- Isolate Shelly Cloud collection so an integration failure cannot prevent printer status delivery.
- Treat rejected remote status uploads as errors and bypass caches for remote static JSON and power-history requests.
- Version the JavaScript URL so clients cannot retain the pre-cache-busting script.
- Add a repository-maintained wallboard diagnostics skill with deployment and cache troubleshooting notes.
