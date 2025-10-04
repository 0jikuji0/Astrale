from pydantic import BaseModel, Field, conlist
from typing import List, Literal, Optional

class InitialState(BaseModel):
    r_eci_km: List[float] = Field(..., min_items=3, max_items=3)
    v_eci_km_s: List[float] = Field(..., min_items=3, max_items=3)

class IntegratorCfg(BaseModel):
    method: Literal["rk4", "verlet"] = "rk4"
    dt_s: float = 1.0
    t_max_s: float = 3600.0

class Approach(BaseModel):
    reference: Literal["earth"] = "earth"
    initial_state: Optional[InitialState] = None   # soit état direct …
    integrator: IntegratorCfg

class Projectile(BaseModel):
    diameter_m: float
    density_kg_m3: float
    porosity: float = 0.0
    composition: Literal["stony","iron","cometary"] = "stony"

class Target(BaseModel):
    body: Literal["earth"] = "earth"
    lat_deg: float
    lon_deg: float
    atmosphere: bool = True
    sea_level: bool = True

class Entry(BaseModel):
    angle_deg: float
    speed_km_s: float

class Scenario(BaseModel):
    name: str
    epoch_utc: str
    approach: Approach
    projectile: Projectile
    target: Target
    entry: Entry
    outputs: List[str] = ["impact_energy_mt","crater_diameter_km"]

class ScenarioConfig(BaseModel):
    scenarios: List[Scenario]
