from abc import ABC, abstractmethod
from typing import Dict, Any, List

class HardwareAccelerationBackend(ABC):
    @abstractmethod
    def get_name(self) -> str:
        """Returns the human-readable identifier of the acceleration backend."""
        pass

    @abstractmethod
    def get_device_info(self) -> Dict[str, Any]:
        """Returns hardware telemetry and device capability profile."""
        pass

    @abstractmethod
    def is_hardware_available(self) -> bool:
        """Checks if the actual physical accelerator is present and loaded."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns operational runtime status."""
        pass
