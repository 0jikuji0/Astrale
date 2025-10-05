# impact_force.py
import math

M_EARTH_KG = 5.972e24

def kinetic_energy_j(m_kg, v_ms):  # alias pratique
    return 0.5 * m_kg * v_ms**2

def energy_megatons(E_j):
    return E_j / 4.184e15

def average_force_from_energy(E_j, stop_distance_m):
    return E_j / max(stop_distance_m, 1e-6)

def contact_time_from_distance(stop_distance_m, v_ms):
    return 2.0 * stop_distance_m / max(v_ms, 1e-6)

def peak_force_from_avg(F_avg_N, k_shape=2.0):
    return k_shape * F_avg_N

def stopping_distance_from_crater(Dtr_m, beta=0.3):
    return beta * Dtr_m

def cap_peak_force_by_strength(F_peak_N, diameter_m, yield_strength_pa):
    A = math.pi * (diameter_m/2.0)**2
    F_cap = yield_strength_pa * A
    return min(F_peak_N, F_cap)

def earth_deltaV_from_impact(m_ast_kg, v_rel_ms):
    return (m_ast_kg / M_EARTH_KG) * v_rel_ms

def compute_impact_forces(
    m_ast_kg: float,
    v_rel_ms: float,
    crater_transient_m: float,
    diameter_m: float,
    yield_strength_pa: float = 5e6,
    beta_stop: float = 0.3,
    k_shape: float = 2.0
):
    E = kinetic_energy_j(m_ast_kg, v_rel_ms)
    s = stopping_distance_from_crater(crater_transient_m, beta=beta_stop)
    F_avg = average_force_from_energy(E, s)
    dt = contact_time_from_distance(s, v_rel_ms)
    F_peak = peak_force_from_avg(F_avg, k_shape=k_shape)
    F_peak_capped = cap_peak_force_by_strength(F_peak, diameter_m, yield_strength_pa)
    dV_earth = earth_deltaV_from_impact(m_ast_kg, v_rel_ms)
    return {
        "energy_j": E,
        "energy_megatons": energy_megatons(E),
        "stop_distance_m": s,
        "contact_time_s": dt,
        "force_avg_N": F_avg,
        "force_peak_N": F_peak_capped,
        "force_peak_uncapped_N": F_peak,
        "earth_deltaV_ms": dV_earth
    }
