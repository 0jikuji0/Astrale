import json, csv, math
from pathlib import Path
import numpy as np
from .config_schema import ScenarioConfig
from .physics import propagate_until_contact
from .impact_models import mass_from_diameter, kinetic_energy_joules, energy_megatons, transient_crater_diameter_m

def run_config(json_path: str, out_csv: str):
    cfg = ScenarioConfig(**json.loads(Path(json_path).read_text()))
    rows = []
    for sc in cfg.scenarios:
        # état initial | à remplace par état d’entrée atmosphère (v, angle, etc.)
        r0 = np.array(sc.approach.initial_state.r_eci_km)
        v0 = np.array(sc.approach.initial_state.v_eci_km_s)
        hit, t, r, v = propagate_until_contact(r0, v0, sc.approach.integrator.dt_s, sc.approach.integrator.t_max_s)
        
        # énergie et cratère (si impact (ce qui n'est pas toujours le cas))
        mass = mass_from_diameter(sc.projectile.diameter_m, sc.projectile.density_kg_m3)
        speed_ms = sc.entry.speed_km_s*1000.0
        E = kinetic_energy_joules(mass, speed_ms)
        E_mt = energy_megatons(E)
        crater_m = transient_crater_diameter_m(mass, speed_ms)

        rows.append({
            "name": sc.name,
            "hit": hit,
            "tof_s": t,
            "impact_energy_mt": E_mt,
            "crater_diameter_km": crater_m/1000.0
        })

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)
