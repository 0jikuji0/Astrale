import math
import numpy as np
from typing import Tuple
from physics import rk4_step, R_EARTH

def refine_impact_time(r_prev, v_prev, t_prev, dt, accel_fn, max_iter=30):
    # Cherche t* dans [t_prev, t_prev+dt] tel que |r(t*)| = R_EARTH par bissection.
    # r,v sont géocentriques (ou r_earth soustrait si frame héliocentrique).
    def step(r, v, h):
        return rk4_step((r, v), h, accel_fn)

    a, b = 0.0, dt
    r_a, v_a = r_prev.copy(), v_prev.copy()
    r_b, v_b = step(r_prev.copy(), v_prev.copy(), b)

    fa = np.linalg.norm(r_a) - R_EARTH
    fb = np.linalg.norm(r_b) - R_EARTH
    if fa*fb > 0:
        # pas de changement de signe -> fallback milieu
        m = 0.5*(a+b)
        r_m, v_m = step(r_prev.copy(), v_prev.copy(), m)
        return t_prev + m, r_m, v_m

    for _ in range(max_iter):
        m = 0.5*(a+b)
        r_m, v_m = step(r_prev.copy(), v_prev.copy(), m)
        fm = np.linalg.norm(r_m) - R_EARTH
        if abs(fm) < 1e-6 or (b-a) < 1e-6:
            return t_prev + m, r_m, v_m
        if fa*fm > 0:
            a, r_a, v_a, fa = m, r_m, v_m, fm
        else:
            b, r_b, v_b, fb = m, r_m, v_m, fm
    return t_prev + 0.5*(a+b), r_m, v_m

def geocentric_lat_lon_deg(r):
    x,y,z = r
    lat = math.degrees(math.asin(z / (np.linalg.norm(r) + 1e-12)))
    lon = math.degrees(math.atan2(y, x))
    return lat, lon

def impact_angles(v_vec, normal_vec):
    n = normal_vec / (np.linalg.norm(normal_vec) + 1e-12)
    v = v_vec / (np.linalg.norm(v_vec) + 1e-12)
    # angle par rapport à la normale (0° = vertical)
    ang_norm = math.degrees(math.acos(-np.clip(np.dot(v, n), -1.0, 1.0)))
    ang_horiz = 90.0 - ang_norm
    return ang_horiz, ang_norm
