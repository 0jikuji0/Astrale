from pydantic import BaseModel, Field, conlist
from typing import List, Literal, Optional, Dict

class IntegratorCfg(BaseModel):
    method: Literal["rk4"] = "rk4"
    dt_s: float = 2.0
    t_max_s: float = 86400.0  # 1 jour par défaut


# r_eci_km: List[float] = Field(..., min_items=3, max_items=3)
# v_eci_km_s: List[float] = Field(..., min_items=3, max_items=3)
class State0(BaseModel):
    r_km: List[float] = Field(..., min_items=3, max_items=3)
    v_km_s: List[float] = Field(..., min_items=3, max_items=3)

class BodyCfg(BaseModel):
    mu_km3_s2: float
    r_km: List[float] = Field([0.0, 0.0, 0.0], min_items=3, max_items=3)
    v_km_s: List[float] = Field([0.0, 0.0, 0.0], min_items=3, max_items=3)

class Projectile(BaseModel):
    diameter_m: float
    density_kg_m3: float

class Target(BaseModel):
    body: Literal["earth"] = "earth"
    yield_strength_pa: float = 5e6   # ~roche 5 MPa
    # paramètres pour lois d'échelle (tuning rapide)
    crater_beta_stop: float = 0.3    # s ≈ beta * D_transient
    k_shape_peak: float = 2.0        # pic ~ k * moyenne

class Scenario(BaseModel):
    name: str
    gravity_model: Literal["earth_only", "sun_earth"] = "earth_only"
    epoch_utc: Optional[str] = None
    integrator: IntegratorCfg
    state0: State0
    bodies: Dict[str, BodyCfg] = Field(default_factory=dict)  # "sun","earth" attendus en sun_earth
    frame_out: Literal["geocentric", "heliocentric"] = "geocentric"
    projectile: Projectile
    target: Target
    output_csv: str
    output_json: Optional[str] = None

class ScenarioConfig(BaseModel):
    scenarios: List[Scenario]
