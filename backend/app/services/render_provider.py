import os, shlex, subprocess, tempfile, time
from pathlib import Path
from typing import Optional

class RenderProviderError(RuntimeError): pass

class ExternalRenderProvider:
    """Adapter for a real local image-to-image model. No fake Canvas fallback."""
    def __init__(self, env_name:str, provider_name:str):
        self.env_name=env_name; self.provider_name=provider_name
    @property
    def command_template(self)->Optional[str]: return os.getenv(self.env_name)
    def status(self): return {"name":self.provider_name,"configured":bool(self.command_template),"mode":"real-model" if self.command_template else "unavailable"}
    def render(self,person:bytes,reference:bytes,color:str="")->tuple[bytes,float]:
        template=self.command_template
        if not template: raise RenderProviderError(f"{self.provider_name} is not configured. Set {self.env_name}.")
        started=time.perf_counter()
        with tempfile.TemporaryDirectory(prefix="fitai-render-") as td:
            root=Path(td); p=root/"person.jpg"; r=root/"reference.jpg"; out=root/"result.png"
            p.write_bytes(person); r.write_bytes(reference)
            command=template.format(person=str(p),reference=str(r),output=str(out),color=color)
            proc=subprocess.run(shlex.split(command,posix=os.name!="nt"),capture_output=True,text=True,timeout=180)
            if proc.returncode!=0: raise RenderProviderError((proc.stderr or proc.stdout)[-2000:])
            if not out.exists(): raise RenderProviderError("Provider completed without an output image.")
            return out.read_bytes(),(time.perf_counter()-started)*1000

vto_provider=ExternalRenderProvider("FITAI_VTO_COMMAND","photorealistic-vto")
hair_provider=ExternalRenderProvider("FITAI_HAIR_COMMAND","photorealistic-hair-transfer")
