from dataclasses import dataclass
from typing import Dict, Tuple, Literal
import numpy as np
import csv

Vec = np.ndarray

MU_SUN   = 1.32712440018e11  # km^3/s^2
MU_EARTH = 3.986004418e5
R_EARTH  = 6371.0            # km

@dataclass
class Body:
    mu: float
    r: Vec
    v: Vec

# --- fonctions de calcul ---
def rk4_step(state: Tuple[Vec, Vec], dt: float, accel_fn):
    r, v = state
    def f_r(r_, v_): return v_
    def f_v(r_, v_): return accel_fn(r_)
    k1r = f_r(r, v); k1v = f_v(r, v)
    k2r = f_r(r + 0.5*dt*k1r, v + 0.5*dt*k1v); k2v = f_v(r + 0.5*dt*k1r, v + 0.5*dt*k1v)
    k3r = f_r(r + 0.5*dt*k2r, v + 0.5*dt*k2v); k3v = f_v(r + 0.5*dt*k2r, v + 0.5*dt*k2v)
    k4r = f_r(r + dt*k3r, v + dt*k3v); k4v = f_v(r + dt*k3r, v + dt*k3v)
    r_next = r + dt*(k1r + 2*k2r + 2*k3r + k4r)/6.0
    v_next = v + dt*(k1v + 2*k2v + 2*k3v + k4v)/6.0
    return r_next, v_next

def accel_earth_only_geocentric(mu_earth: float):
    def a(r_ast: Vec) -> Vec:
        r = np.linalg.norm(r_ast)
        return -mu_earth * r_ast / (r**3 + 1e-12)
    return a

def write_csv(path: str, rows):
    fieldnames = ["t_s","x_km","y_km","z_km","vx_km_s","vy_km_s","vz_km_s","frame"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)

def propagate_and_dump_csv(
    mode: Literal["earth_only"],
    state0_r_km: Vec,
    state0_v_km_s: Vec,
    bodies: Dict[str, Body],
    dt_s: float,
    t_max_s: float,
    frame_out: Literal["geocentric"],
    output_csv: str,
    stop_on_impact: bool = True,
):
    r = state0_r_km.copy()
    v = state0_v_km_s.copy()
    t = 0.0

    accel_fn = accel_earth_only_geocentric(bodies["earth"].mu)
    frame = "geocentric"
    earth_r = np.zeros(3)
    earth_v = np.zeros(3)

    rows = []
    hit = False
    prev_r = r.copy(); prev_v = v.copy(); prev_t = t

    while t <= t_max_s:
        rows.append({
            "t_s": t,
            "x_km": r[0], "y_km": r[1], "z_km": r[2],
            "vx_km_s": v[0], "vy_km_s": v[1], "vz_km_s": v[2],
            "frame": frame
        })

        if np.linalg.norm(r) <= R_EARTH:
            hit = True
            break

        prev_r = r.copy(); prev_v = v.copy(); prev_t = t
        r, v = rk4_step((r, v), dt_s, accel_fn)
        t += dt_s

    write_csv(output_csv, rows)

    return {
        "hit": hit,
        "prev_state": (prev_t, prev_r, prev_v),
        "curr_state": (t, r, v),
        "frame": frame,
        "csv": output_csv,
    }
