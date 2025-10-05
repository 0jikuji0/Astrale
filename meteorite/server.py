from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np

app = FastAPI()

# Classe pour recevoir les paramètres initiaux de l'astéroïde
class TrajInput(BaseModel):
    r0: list[float]  # position initiale [x, y, z] en km
    v0: list[float]  # vitesse initiale [vx, vy, vz] en km/s
    steps: int = 100  # nombre de points dans la trajectoire

@app.get("/trajectory")
def default_trajectory():
    """Renvoie une trajectoire par défaut"""
    points = [{"x": x, "y": np.sin(x/10)*10, "z": 0} for x in range(0, 100)]
    return {"frames": points}

@app.post("/compute_trajectory")
def compute_trajectory(inp: TrajInput):
    """Calcule une trajectoire simple linéaire (remplace par ton RK4 si besoin)"""
    r0 = np.array(inp.r0)
    v0 = np.array(inp.v0)
    frames = []
    dt = 1.0  # pas de temps arbitraire en s
    for i in range(inp.steps):
        r = r0 + v0 * dt * i
        frames.append({"x": r[0], "y": r[1], "z": r[2]})
    return {"frames": frames}
