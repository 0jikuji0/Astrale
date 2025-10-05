from dataclasses import dataclass
from typing import Dict, Optional, Tuple
import numpy as np
import csv

Vec = np.ndarray

def rk4_step(state, dt, accel_fn):
    r, v, t = state

    # dr/dt = v ; dv/dt = a(r, t)
    def fr(r_, v_, t_):
        return v_

    def fv(r_, t_):
        return accel_fn(r_, t_)

    k1r = fr(r, v, t)
    k1v = fv(r, t)

    k2r = fr(r + 0.5*dt*k1r, v + 0.5*dt*k1v, t + 0.5*dt)
    k2v = fv(r + 0.5*dt*k1r, t + 0.5*dt)

    k3r = fr(r + 0.5*dt*k2r, v + 0.5*dt*k2v, t + 0.5*dt)
    k3v = fv(r + 0.5*dt*k2r, t + 0.5*dt)

    k4r = fr(r + dt*k3r, v + dt*k3v, t + dt)
    k4v = fv(r + dt*k3r, t + dt)

    r_next = r + (dt/6.0) * (k1r + 2*k2r + 2*k3r + k4r)
    v_next = v + (dt/6.0) * (k1v + 2*k2v + 2*k3v + k4v)
    t_next = t + dt

    return r_next, v_next, t_next

@dataclass
class MassiveBody:
    name: str
    mu: float           # km^3/s^2
    radius_km: float    # pour collision
    has_surface: bool = True
    # Source de mouvement : soit r0/v0 constants, soit une table d'éphémérides
    r0: Optional[Vec] = None
    v0: Optional[Vec] = None
    ephem: Optional[object] = None   # instance EphemTable

    def rv_at(self, t: float) -> Tuple[Vec, Vec]:
        if self.ephem is not None:
            return self.ephem.sample(t)
        else:
            return self.r0, self.v0

def make_accel_sum(bodies: Dict[str, MassiveBody]):
    def a(r_ast: Vec, t: float) -> Vec:
        acc = np.zeros(3, dtype=float)
        for b in bodies.values():
            rb, _ = b.rv_at(t)
            d = r_ast - rb
            r = np.linalg.norm(d)
            acc += - b.mu * d / (r**3 + 1e-12)
        return acc
    return a

def write_csv(path: str, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["t_s","x_km","y_km","z_km","vx_km_s","vy_km_s","vz_km_s","frame"])
        w.writeheader()
        w.writerows(rows)

def propagate_multi_and_dump(
    asteroid_r0: Vec, asteroid_v0: Vec, t0: float, dt_s: float, t_max_s: float,
    bodies: Dict[str, MassiveBody],
    frame_label: str, output_csv: str,
    stop_on_impact: bool = True
):
    accel = make_accel_sum(bodies)
    r, v, t = asteroid_r0.copy(), asteroid_v0.copy(), t0

    rows = []
    hit = False
    hit_body = None
    prev_state = (t, r.copy(), v.copy())

    while t <= t0 + t_max_s:
        rows.append({
            "t_s": t, "x_km": r[0], "y_km": r[1], "z_km": r[2],
            "vx_km_s": v[0], "vy_km_s": v[1], "vz_km_s": v[2],
            "frame": frame_label
        })

        # test collisions avec TOUS les corps qui ont une surface
        for b in bodies.values():
            if not b.has_surface:
                continue
            rb, _ = b.rv_at(t)
            if np.linalg.norm(r - rb) <= b.radius_km:
                hit = True
                hit_body = b.name
                break

        if hit and stop_on_impact:
            break

        prev_state = (t, r.copy(), v.copy())
        r, v, t = rk4_step((r, v, t), dt_s, accel)

    write_csv(output_csv, rows)
    return {
        "hit": hit,
        "hit_body": hit_body,
        "prev_state": prev_state,
        "curr_state": (t, r, v),
        "accel_fn": accel,
        "csv": output_csv
    }
