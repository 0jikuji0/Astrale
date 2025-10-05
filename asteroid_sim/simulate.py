# simulate.py
import json
import os
import numpy as np
from typing import Dict
from physics import Body, propagate_and_dump_csv, R_EARTH
from config_schema import ScenarioConfig
from impact_utils import refine_impact_time, geocentric_lat_lon_deg, impact_angles
from impact_models import mass_from_diameter, kinetic_energy_joules, energy_megatons, transient_crater_diameter_m
from impact_force import compute_impact_forces

def run_config(json_path: str):
    cfg = ScenarioConfig(**json.loads(open(json_path, "r", encoding="utf-8").read()))
    summaries = []

    for sc in cfg.scenarios:
        # bodies
        bodies: Dict[str, Body] = {}
        for name, b in sc.bodies.items():
            bodies[name] = Body(
                mu=b.mu_km3_s2,
                r=np.array(b.r_km, dtype=float),
                v=np.array(b.v_km_s, dtype=float)
            )
        # si earth_only, assurer la présence d'earth
        if sc.gravity_model == "earth_only" and "earth" not in bodies:
            from physics import MU_EARTH
            bodies["earth"] = Body(MU_EARTH, np.zeros(3), np.zeros(3))

        # propagation + CSV
        res = propagate_and_dump_csv(
            mode=sc.gravity_model,
            state0_r_km=np.array(sc.state0.r_km, dtype=float),
            state0_v_km_s=np.array(sc.state0.v_km_s, dtype=float),
            bodies=bodies,
            dt_s=sc.integrator.dt_s,
            t_max_s=sc.integrator.t_max_s,
            frame_out=sc.frame_out,
            output_csv=sc.output_csv,
            stop_on_impact=True
        )

        impact_json_path = sc.output_json or os.path.splitext(sc.output_csv)[0] + "_impact.json"
        impact_obj = None

        if res["hit"]:
            # On travaille en géocentrique pour raffinement
            earth_r = res["earth_r"]
            frame = res["frame"]

            t_prev, r_prev, v_prev = res["prev_state"]
            t_curr, r_curr, v_curr = res["curr_state"]

            r_prev_geo = (r_prev - earth_r) if frame=="heliocentric" else r_prev
            r_curr_geo = (r_curr - earth_r) if frame=="heliocentric" else r_curr

            t_imp, r_imp_geo, v_imp_geo = refine_impact_time(
                r_prev_geo, v_prev, t_prev, t_curr - t_prev, res["accel_fn"]
            )

            # Caractéristiques géométriques
            lat, lon = geocentric_lat_lon_deg(r_imp_geo)
            n = r_imp_geo / np.linalg.norm(r_imp_geo)
            ang_h, ang_n = impact_angles(v_imp_geo, n)

            # Grandeurs cinétiques / cratère / forces
            m_ast = mass_from_diameter(sc.projectile.diameter_m, sc.projectile.density_kg_m3)
            v_rel_ms = float(np.linalg.norm(v_imp_geo) * 1000.0)  # km/s -> m/s
            E_j = kinetic_energy_joules(m_ast, v_rel_ms)
            E_mt = energy_megatons(E_j)
            Dtr_m = transient_crater_diameter_m(m_ast, v_rel_ms)

            forces = compute_impact_forces(
                m_ast_kg=m_ast,
                v_rel_ms=v_rel_ms,
                crater_transient_m=Dtr_m,
                diameter_m=sc.projectile.diameter_m,
                yield_strength_pa=sc.target.yield_strength_pa,
                beta_stop=sc.target.crater_beta_stop,
                k_shape=sc.target.k_shape_peak
            )

            impact_obj = {
                "impact": {
                    "t_s": float(t_imp),
                    "pos_km": [float(r_imp_geo[0]), float(r_imp_geo[1]), float(r_imp_geo[2])],
                    "vel_km_s": [float(v_imp_geo[0]), float(v_imp_geo[1]), float(v_imp_geo[2])],
                    "speed_km_s": float(np.linalg.norm(v_imp_geo)),
                    "lat_deg": float(lat),
                    "lon_deg": float(lon),
                    "surface_normal": [float(n[0]), float(n[1]), float(n[2])],
                    "angle_from_horizontal_deg": float(ang_h),
                    "angle_from_surface_normal_deg": float(ang_n),
                    "energy_megatons": float(E_mt),
                    "crater_diameter_km": float(Dtr_m/1000.0),
                    "forces": forces,
                    "frame": "geocentric"
                },
                "csv": res["csv"]
            }
        else:
            impact_obj = { "impact": None, "csv": res["csv"] }

        with open(impact_json_path, "w", encoding="utf-8") as f:
            json.dump(impact_obj, f, indent=2)

        summaries.append({
            "name": sc.name,
            "hit": res["hit"],
            "csv": res["csv"],
            "impact_json": impact_json_path
        })

    return summaries

if __name__ == "__main__":
    import sys, pprint
    path = sys.argv[1] if len(sys.argv)>1 else "config.json"
    pprint.pprint(run_config(path))
