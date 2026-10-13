import unittest
from pathlib import Path
from unittest.mock import patch

from app import system_info


class SystemInfoTests(unittest.TestCase):
    fixtures = Path(__file__).parent / "fixtures"

    def test_os_release_prefers_pretty_name(self):
        with patch.object(system_info, "OS_RELEASE_PATH", self.fixtures / "os-release"):
            self.assertEqual(system_info._read_os_release(), "Raspberry Pi OS (64-bit)")

    def test_cpu_temperature_converts_millidegrees(self):
        with patch.object(system_info, "THERMAL_ROOT", self.fixtures / "thermal"):
            self.assertEqual(system_info._read_cpu_temperature(), 48.2)

    def test_memory_reports_used_total_and_percent(self):
        with patch.object(system_info, "MEMINFO_PATH", self.fixtures / "meminfo"):
            self.assertEqual(
                system_info._read_memory(),
                {"total_bytes": 4_096_000, "used_bytes": 3_072_000, "percent": 75.0},
            )

    @patch("app.system_info.subprocess.run")
    def test_service_state_uses_systemctl_output(self, run):
        run.return_value.stdout = "active\n"
        self.assertEqual(system_info._service_state("walldisplay.service"), "active")
        run.assert_called_once_with(
            ["/usr/bin/systemctl", "is-active", "walldisplay.service"],
            check=False,
            capture_output=True,
            text=True,
            timeout=1,
        )


if __name__ == "__main__":
    unittest.main()
