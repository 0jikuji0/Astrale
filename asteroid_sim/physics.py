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

def rk4_step(state: Tuple[Vec, Vec], dt: float, accel_fn):
    r, v = state
    def f_r(r_, v_): return v_
    def f_v(r_, v_): return accel_fn(r_)
    k1r = f_r(r, v);               k1v = f_v(r, v)
    k2r = f_r(r + 0.5*dt*k1r, v + 0.5*dt*k1v); k2v = f_v(r + 0.5*dt*k1r, v + 0.5*dt*k1v)
    k3r = f_r(r + 0.5*dt*k2r, v + 0.5*dt*k2v); k3v = f_v(r + 0.5*dt*k2r, v + 0.5*dt*k2v)
    k4r = f_r(r + dt*k3r, v + dt*k3v);         k4v = f_v(r + dt*k3r, v + dt*k3v)
    r_next = r + dt*(k1r + 2*k2r + 2*k3r + k4r)/6.0
    v_next = v + dt*(k1v + 2*k2v + 2*k3v + k4v)/6.0
    return r_next, v_next

def accel_earth_only_geocentric(mu_earth: float):
    def a(r_ast: Vec) -> Vec:
        r = np.linalg.norm(r_ast)
        return -mu_earth * r_ast / (r**3 + 1e-12)
    return a

def accel_sun_earth_heliocentric(mu_sun: float, mu_earth: float, r_earth: Vec):
    def a(r_ast: Vec) -> Vec:
        # Soleil à l'origine
        r = np.linalg.norm(r_ast)
        a_sun = -mu_sun * r_ast / (r**3 + 1e-12)
        # Terre à r_earth
        d = r_ast - r_earth
        rd = np.linalg.norm(d)
        a_earth = -mu_earth * d / (rd**3 + 1e-12)
        return a_sun + a_earth
    return a

def write_csv(path: str, rows):
    fieldnames = ["t_s","x_km","y_km","z_km","vx_km_s","vy_km_s","vz_km_s","frame"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)

def propagate_and_dump_csv(
    mode: Literal["earth_only","sun_earth"],
    state0_r_km: Vec,
    state0_v_km_s: Vec,
    bodies: Dict[str, Body],
    dt_s: float,
    t_max_s: float,
    frame_out: Literal["geocentric","heliocentric"],
    output_csv: str,
    stop_on_impact: bool = True,
):
    r = state0_r_km.copy()
    v = state0_v_km_s.copy()
    t = 0.0

    if mode == "earth_only":
        accel_fn = accel_earth_only_geocentric(bodies["earth"].mu)
        frame = "geocentric"
        earth_r = np.zeros(3)
        earth_v = np.zeros(3)
    elif mode == "sun_earth":
        accel_fn = accel_sun_earth_heliocentric(bodies["sun"].mu, bodies["earth"].mu, bodies["earth"].r)
        frame = "heliocentric"
        earth_r = bodies["earth"].r
        earth_v = bodies["earth"].v
    else:
        raise ValueError("Unknown gravity model")

    rows = []
    hit = False
    prev_r = r.copy(); prev_v = v.copy(); prev_t = t

    while t <= t_max_s:
        # sortie dans le frame demandé
        out_r, out_v, out_frame = r.copy(), v.copy(), frame
        if frame_out == "geocentric" and frame == "heliocentric":
            out_r = r - earth_r
            out_v = v - earth_v
            out_frame = "geocentric"
        elif frame_out == "heliocentric" and frame == "geocentric":
            out_r = r + earth_r
            out_v = v + earth_v
            out_frame = "heliocentric"

        rows.append({
            "t_s": t,
            "x_km": out_r[0], "y_km": out_r[1], "z_km": out_r[2],
            "vx_km_s": out_v[0], "vy_km_s": out_v[1], "vz_km_s": out_v[2],
            "frame": out_frame
        })

        # test impact (géocentrique)
        r_geo = (r - earth_r) if frame=="heliocentric" else r
        if np.linalg.norm(r_geo) <= R_EARTH:
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
        "accel_fn": accel_fn,
        "frame": frame,
        "earth_r": earth_r,
        "earth_v": earth_v,
        "csv": output_csv,
    }
