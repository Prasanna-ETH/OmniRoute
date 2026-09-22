from typing import Dict, Any
from app.hardware.base import HardwareAccelerationBackend

class MockNPUBackend(HardwareAccelerationBackend):
    """
    Architecture demonstration backend representing target Qualcomm Hexagon NPU / QNN.
    Clearly designated as a design mock for hackathon presentation and architecture demonstration.
    """
    def __init__(self):
        self.target_npu = "Qualcomm® Hexagon™ NPU (Snapdragon 8 Gen 3 / Gen 4)"
        self.target_sdk = "Qualcomm AI Stack / QNN (Qualcomm Neural Network SDK)"
        self.precision = "INT8 / FP16 Mixed Precision Execution"
        self.peak_tops = 45.0  # NPU TOPS capability for target flagship

    def get_name(self) -> str:
        return "Qualcomm® Hexagon™ NPU / QNN (Architecture Mock Demonstration)"

    def get_device_info(self) -> Dict[str, Any]:
        return {
            "backend": "MockNPUBackend",
            "type": "Target Embedded NPU Architecture",
            "target_silicon": self.target_npu,
            "target_sdk": self.target_sdk,
            "precision_profile": self.precision,
            "peak_tops": f"{self.peak_tops} TOPS",
            "execution_status": "Simulated Interface (Plug-in target for Qualcomm QNN libqnn.so)",
            "power_efficiency": "~4.2x efficiency vs CPU vector baseline",
            "notes": "Demonstration mock for iQOO on-device flagship acceleration"
        }

    def is_hardware_available(self) -> bool:
        # Returns False since physical QNN hardware is not present on host development machine
        return False

    def get_status(self) -> Dict[str, Any]:
        return {
            "state": "STANDBY_READY",
            "active_tasks": 0,
            "mode": "Architecture Simulation (Non-executing)"
        }
