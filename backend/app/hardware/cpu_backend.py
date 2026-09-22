import os
import platform
from typing import Dict, Any
from app.hardware.base import HardwareAccelerationBackend

class CPUBackend(HardwareAccelerationBackend):
    """
    Active execution backend for the prototype.
    Executes model inference and vector operations using local CPU threads.
    """
    def __init__(self):
        self.processor_name = platform.processor() or "x86_64 / ARM CPU"
        self.core_count = os.cpu_count() or 4

    def get_name(self) -> str:
        return "CPU / Local Host (Active Prototype Engine)"

    def get_device_info(self) -> Dict[str, Any]:
        return {
            "backend": "CPUBackend",
            "type": "Physical Host CPU",
            "processor": self.processor_name,
            "cores": self.core_count,
            "status": "Active (Executing inference)",
            "acceleration": "SIMD / AVX2 / NEON",
            "latency_factor": "1.0x (Baseline)"
        }

    def is_hardware_available(self) -> bool:
        return True

    def get_status(self) -> Dict[str, Any]:
        return {
            "state": "ONLINE",
            "active_tasks": 0,
            "mode": "Physical Execution"
        }
