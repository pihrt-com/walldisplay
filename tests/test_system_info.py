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

    def test_uptime_returns_whole_seconds(self):
        with patch.object(system_info, "UPTIME_PATH", self.fixtures / "uptime"):
            self.assertEqual(system_info._read_uptime_seconds(), 34_579_261)

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

    @patch("app.system_info._service_state", side_effect=["inactive", "active"])
    def test_wallboard_service_is_supported(self, service_state):
        self.assertEqual(
            system_info._first_active_service_state(system_info.WALLDISPLAY_SERVICES),
            "active",
        )
        self.assertEqual(
            service_state.call_args_list[0].args,
            ("wallboard.service",),
        )

    @patch("app.system_info.subprocess.run")
    def test_pi_connect_status_marks_signed_in_connection_active(self, run):
        run.return_value.returncode = 0
        run.return_value.stdout = "Signed in: yes\nScreen sharing: allowed (0 sessions active)\n"
        self.assertEqual(system_info._pi_connect_state(), "active")
        run.assert_called_once_with(
            ["/usr/bin/rpi-connect", "status"],
            check=False,
            capture_output=True,
            text=True,
            timeout=1,
        )


if __name__ == "__main__":
    unittest.main()
