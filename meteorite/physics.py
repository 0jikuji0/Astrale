# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
#from physics import Body, propagate_and_dump_csv, R_EARTH

app = Flask(__name__)
CORS(app)  # Permet à ton front de faire des requêtes depuis localhost

# --- Route pour calculer la trajectoire ---
@app.route("/compute_trajectory", methods=["POST"])
def compute_trajectory():
    data = request.json

    # --- Récupération des valeurs envoyées par le front ---
    r_km = data.get("r_km")          # position initiale [x, y, z] km
    v_km_s = data.get("v_km_s")      # vitesse initiale [vx, vy, vz] km/s
    diameter_m = data.get("diameter_m", 40)  # diamètre en m, valeur par défaut

    # --- Création des corps (ici juste la Terre) ---
    earth = Body(
        mu=398600.4418,           # km^3/s^2
        r=np.array([0,0,0], dtype=float),
        v=np.array([0,0,0], dtype=float)
    )
    bodies = {"earth": earth}

    # --- Paramètres de simulation ---
    dt_s = 2.0         # pas de temps (s)
    t_max_s = 20000.0  # durée max (s)
    output_csv = "Data/trajectory_temp.csv"  # <-- Assure-toi que le dossier Data/ existe

    # --- Calcul de la trajectoire ---
    res = propagate_and_dump_csv(
        mode="earth_only",           # simulation géocentrique
        state0_r_km=np.array(r_km, dtype=float),
        state0_v_km_s=np.array(v_km_s, dtype=float),
        bodies=bodies,
        dt_s=dt_s,
        t_max_s=t_max_s,
        frame_out="geocentric",
        output_csv=output_csv,
        stop_on_impact=True
    )

    # --- Conversion du CSV en JSON pour le front ---
    frames = []
    if os.path.exists(output_csv):
        with open(output_csv, "r") as f:
            next(f)  # skip header
            for line in f:
                t_s, x, y, z, vx, vy, vz, frame = line.strip().split(",")
                frames.append({
                    "pos_km": [float(x), float(y), float(z)],
                    "vel_km_s": [float(vx), float(vy), float(vz)],
                    "time_s": float(t_s)
                })
    else:
        # Si CSV manquant, renvoie la position initiale
        frames.append({
            "pos_km": r_km,
            "vel_km_s": v_km_s,
            "time_s": 0
        })

    return jsonify({"frames": frames})

# --- Lancement du serveur ---
if __name__ == "__main__":
    # Port 5000 = fetch() dans ton front
    app.run(host="0.0.0.0", port=5000, debug=True)
