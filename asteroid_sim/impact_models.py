# impact_models.py
import math

RHO_ROCK = 2500.0  # kg/m^3
G_EARTH  = 9.81    # m/s^2

def mass_from_diameter(diameter_m: float, density_kg_m3: float) -> float:
    r = diameter_m / 2.0
    return (4.0/3.0) * math.pi * r**3 * density_kg_m3

def kinetic_energy_joules(mass_kg: float, speed_m_s: float) -> float:
    return 0.5 * mass_kg * speed_m_s**2

def energy_megatons(E_joules: float) -> float:
    return E_joules / 4.184e15

def transient_crater_diameter_m(m_kg: float, v_m_s: float, rho_t: float = RHO_ROCK, g: float = G_EARTH) -> float:
    """
    Loi d'échelle simplifiée (ordre de grandeur).
    D_tr ≈ k * ( (m/ρ_t)^(1/3) ) * v^0.44 * g^-0.22
    Ajuste k si besoin pour coller à des cas connus.
    """
    k = 1.8
    term1 = (m_kg / rho_t) ** (1.0/3.0)
    return k * term1 * (v_m_s**0.44) * (g**-0.22)
