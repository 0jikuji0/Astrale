# asteroid_sim/physics.py
import numpy as np

MU_EARTH = 3.986004418e5  # km^3/s^2
R_EARTH_KM = 6371.0

def accel_2body(r_vec_km):
    r = np.linalg.norm(r_vec_km)
    return -MU_EARTH * r_vec_km / r**3

def rk4_step(r, v, dt, acc_func):
    k1v = acc_func(r)
    k1r = v
    k2v = acc_func(r + 0.5*dt*k1r)
    k2r = v + 0.5*dt*k1v
    k3v = acc_func(r + 0.5*dt*k2r)
    k3r = v + 0.5*dt*k2v
    k4v = acc_func(r + dt*k3r)
    k4r = v + dt*k3v
    r_next = r + dt*(k1r + 2*k2r + 2*k3r + k4r)/6.0
    v_next = v + dt*(k1v + 2*k2v + 2*k3v + k4v)/6.0
    return r_next, v_next

def propagate_until_contact(r0, v0, dt_s, t_max_s):
    r = np.array(r0, dtype=float)
    v = np.array(v0, dtype=float)
    t = 0.0
    while t < t_max_s:
        if np.linalg.norm(r) <= R_EARTH_KM:  # simplifié: surface sphérique
            return True, t, r, v
        r, v = rk4_step(r, v, dt_s, accel_2body)
        t += dt_s
    return False, t, r, v
