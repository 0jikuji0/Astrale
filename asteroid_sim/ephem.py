import requests
from pathlib import Path
import json

HORIZONS_VEC_URL = "https://ssd-api.jpl.nasa.gov/horizons.api"
SBDB_LOOKUP_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"
CACHE_DIR = Path(__file__).resolve().parent / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

def _cache_get(key: str):
    p = CACHE_DIR / f"{key}.json"
    return json.loads(p.read_text()) if p.exists() else None

def _cache_set(key: str, data: dict):
    p = CACHE_DIR / f"{key}.json"
    p.write_text(json.dumps(data))

def sbdb_lookup(designation: str) -> dict:
    key = f"sbdb_{designation}"
    if (cached := _cache_get(key)): return cached
    resp = requests.get(SBDB_LOOKUP_URL, params={"sstr": designation, "full-prec": "true"})
    resp.raise_for_status()
    data = resp.json()
    _cache_set(key, data)
    return data

def horizons_state(body: str, epoch_tdb_jd: float) -> dict:
    # Récupérer état barycentrique (ex: Terre, astéroïde) à un epoch JD(TDB).
    # Voir doc API Horizons pour paramètres (COMMAND, MAKE_EPHEM, EPHEM_TYPE=VECTORS, etc.)

    key = f"hor_vec_{body}_{epoch_tdb_jd:.6f}"
    if (cached := _cache_get(key)): return cached

    params = {
        "format": "json",
        "COMMAND": '399',           # '399' pour la Terre, ou '433' Eros, etc. par déf on prendra la terre
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "CENTER": "500@0",         # barycentre solaire ; adapter si besoin
        "REF_PLANE": "ECLIPTIC",
        "REF_SYSTEM": "J2000",
        "VEC_TABLE": "3",          # state vector
        "OUT_UNITS": "KM-S",
        "TLIST": f"{epoch_tdb_jd:.9f}"
    }
    r = requests.get(HORIZONS_VEC_URL, params=params)
    r.raise_for_status()
    data = r.json()
    _cache_set(key, data)
    return data
