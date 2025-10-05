import os, json
import numpy as np
from typing import Dict
from physics_multi import MassiveBody, propagate_multi_and_dump
from ephem_table import EphemTable
from impact_utils import refine_impact_time, geocentric_lat_lon_deg, impact_angles
from impact_models import mass_from_diameter, kinetic_energy_joules, energy_megatons, transient_crater_diameter_m
from impact_force import compute_impact_forces

def run_config_multi(json_path: str):
    cfg = json.loads(open(json_path, "r", encoding="utf-8").read())
    # Schéma attendu minimal :
    # {
    #   "frame": "heliocentric",
    #   "integrator": {"dt_s": 10.0, "t_max_s": 86400.0},
    #   "asteroid": {"r_km":[...], "v_km_s":[...] , "diameter_m":..., "density_kg_m3":...},
    #   "bodies": {
    #       "sun": {"mu_km3_s2":..., "radius_km":..., "has_surface": false, "ephem_csv": "sun.csv" | null,
    #               "r_km":[0,0,0], "v_km_s":[0,0,0]},
    #       "earth": {...}, "moon": {...}, ...
    #   },
    #   "target": {"name": "earth", "yield_strength_pa": 5e6, "beta_stop":0.3, "k_shape":2.0},
    #   "output_csv": "Data/traj.csv", "output_json": "Data/impact.json"
    # }

    integ = cfg["integrator"]
    dt = float(integ["dt_s"]); tmax = float(integ["t_max_s"])
    frame = cfg.get("frame","heliocentric")

    # construire les corps
    bodies: Dict[str, MassiveBody] = {}
    for name, b in cfg["bodies"].items():
        ephem = EphemTable(b["ephem_csv"]) if b.get("ephem_csv") else None
        r0 = np.array(b.get("r_km",[0,0,0]), dtype=float)
        v0 = np.array(b.get("v_km_s",[0,0,0]), dtype=float)
        bodies[name] = MassiveBody(
            name=name, mu=float(b["mu_km3_s2"]), radius_km=float(b["radius_km"]),
            has_surface=bool(b.get("has_surface", True)),
            r0=r0, v0=v0, ephem=ephem
        )

    ast = cfg["asteroid"]
    r0 = np.array(ast["r_km"], dtype=float); v0 = np.array(ast["v_km_s"], dtype=float)
    dia = float(ast["diameter_m"]); rho = float(ast["density_kg_m3"])

    os.makedirs(os.path.dirname(cfg["output_csv"]), exist_ok=True)
    res = propagate_multi_and_dump(
        asteroid_r0=r0, asteroid_v0=v0, t0=0.0, dt_s=dt, t_max_s=tmax,
        bodies=bodies, frame_label=frame, output_csv=cfg["output_csv"],
        stop_on_impact=True
    )

    impact_obj = { "impact": None, "csv": res["csv"] }

    if res["hit"]:
        hit_name = res["hit_body"]
        target_cfg = cfg.get("target", {"name": hit_name})
        target_name = target_cfg.get("name", hit_name)
        target = bodies[target_name]

        # raffinement de l'impact vis-à-vis DU CORPS touché
        t_prev, r_prev, v_prev = res["prev_state"]
        t_curr, r_curr, v_curr = res["curr_state"]
        accel = res["accel_fn"]

        # passe tout dans le repère "géocentrique du corps impacté"
        # => soustraire r_target(t) à r_astéroïde
        def refine_to_target(t0, r0, v0, dt):
            from physics_multi import rk4_step
            # bisection sur norme(r_ast - r_target) - R_target
            a, b = 0.0, dt
            rb0, _ = target.rv_at(t0)
            fa = np.linalg.norm(r0 - rb0) - target.radius_km

            r_b, v_b, _ = rk4_step((r0, v0, t0), b, accel)
            rb1, _ = target.rv_at(t0 + b)
            fb = np.linalg.norm(r_b - rb1) - target.radius_km
            if fa*fb > 0:
                m = 0.5*(a+b)
                r_m, v_m, _ = rk4_step((r0, v0, t0), m, accel)
                return t0 + m, r_m, v_m

            for _ in range(30):
                m = 0.5*(a+b)
                r_m, v_m, _ = rk4_step((r0, v0, t0), m, accel)
                rbm, _ = target.rv_at(t0 + m)
                fm = np.linalg.norm(r_m - rbm) - target.radius_km
                if abs(fm) < 1e-6 or (b-a) < 1e-6:
                    return t0 + m, r_m, v_m
                if fa*fm > 0:
                    a, fa = m, fm
                else:
                    b, fb = m, fm
            return t0 + 0.5*(a+b), r_m, v_m

        t_imp, r_imp, v_imp = refine_to_target(t_prev, r_prev, v_prev, t_curr - t_prev)
        r_tgt, v_tgt = target.rv_at(t_imp)
        r_loc = r_imp - r_tgt      # position dans le repère centré sur le corps
        v_loc = v_imp - v_tgt
        n = r_loc / (np.linalg.norm(r_loc) + 1e-12)

        # angles / lat-lon sur le corps impacté
        lat, lon = geocentric_lat_lon_deg(r_loc)
        ang_h, ang_n = impact_angles(v_loc, n)

        # grandeurs d'impact
        m_ast = mass_from_diameter(dia, rho)
        v_rel_ms = float(np.linalg.norm(v_loc) * 1000.0)
        E_j = kinetic_energy_joules(m_ast, v_rel_ms)
        E_mt = energy_megatons(E_j)
        Dtr_m = transient_crater_diameter_m(m_ast, v_rel_ms)

        F = compute_impact_forces(
            m_ast_kg=m_ast, v_rel_ms=v_rel_ms, crater_transient_m=Dtr_m,
            diameter_m=dia,
            yield_strength_pa=float(target_cfg.get("yield_strength_pa", 5e6)),
            beta_stop=float(target_cfg.get("beta_stop", 0.3)),
            k_shape=float(target_cfg.get("k_shape", 2.0))
        )

        impact_obj = {
            "impact": {
                "body": target_name,
                "t_s": float(t_imp),
                "pos_km_body_frame": [float(r_loc[0]), float(r_loc[1]), float(r_loc[2])],
                "vel_km_s_body_frame": [float(v_loc[0]), float(v_loc[1]), float(v_loc[2])],
                "speed_km_s": float(np.linalg.norm(v_loc)),
                "lat_deg": float(lat), "lon_deg": float(lon),
                "surface_normal": [float(n[0]), float(n[1]), float(n[2])],
                "angle_from_horizontal_deg": float(ang_h),
                "angle_from_surface_normal_deg": float(ang_n),
                "energy_megatons": float(E_mt),
                "crater_diameter_km": float(Dtr_m/1000.0),
                "forces": F,
                "frame": f"{frame} (CSV); local={target_name}-centric"
            },
            "csv": res["csv"]
        }

    out_json = cfg["output_json"]
    os.makedirs(os.path.dirname(out_json), exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(impact_obj, f, indent=2)
    return impact_obj

if __name__ == "__main__":
    import sys, pprint
    j = sys.argv[1] if len(sys.argv)>1 else "config_multi.json"
    pprint.pprint(run_config_multi(j))
