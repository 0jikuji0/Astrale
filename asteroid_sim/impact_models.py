import math

RHO_ROCK = 2500.0  # kg/m^3
G_EARTH = 9.81     # m/s^2

def mass_from_diameter(diameter_m, density_kg_m3):
    r = diameter_m/2.0
    return (4.0/3.0) * math.pi * r**3 * density_kg_m3

def kinetic_energy_joules(mass_kg, speed_m_s):
    return 0.5 * mass_kg * speed_m_s**2

def energy_megatons(E_joules):
    return E_joules / 4.184e15

def transient_crater_diameter_m(m_kg, v_m_s, rho_t=RHO_ROCK, g=G_EARTH):
    # Pi-scaling simplifiée (ordre de grandeur) - à affiner selon Holsapple/Collins.
    # D_tr ~ k * ( (m/ρ_t)^(1/3) ) * ( v^0.44 ) * ( g^-0.22 )  [exposants indicatifs]

    k = 1.8  # facteur d’échelle à ajuster
    term1 = (m_kg / rho_t) ** (1.0/3.0)
    return k * term1 * (v_m_s**0.44) * (g**-0.22)