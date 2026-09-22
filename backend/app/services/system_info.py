import platform
import shutil
import subprocess
import psutil

def _nvidia():
    exe = shutil.which("nvidia-smi")
    if not exe:
        return {"available": False}
    try:
        out = subprocess.check_output(
            [exe, "--query-gpu=name,memory.total,memory.free,driver_version", "--format=csv,noheader,nounits"],
            text=True,
            timeout=3,
        ).strip()
        if not out:
            return {"available": False}
        name, total, free, driver = [x.strip() for x in out.splitlines()[0].split(",")]
        return {
            "available": True,
            "name": name,
            "memory_total_mb": int(total),
            "memory_free_mb": int(free),
            "driver": driver,
        }
    except Exception:
        return {"available": False}

def get_system_info():
    vm = psutil.virtual_memory()
    return {
        "os": platform.platform(),
        "python": platform.python_version(),
        "cpu_threads": psutil.cpu_count(logical=True),
        "ram_total_gb": round(vm.total / 1024**3, 2),
        "ram_available_gb": round(vm.available / 1024**3, 2),
        "gpu": _nvidia(),
    }
