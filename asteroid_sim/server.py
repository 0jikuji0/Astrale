import json
import os
import asyncio
from typing import AsyncIterator, Dict, Literal

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from asteroid_sim.physics import (
    Body,
    MU_EARTH,
    R_EARTH,
    accel_earth_only_geocentric,
    accel_sun_earth_heliocentric,
    rk4_step,
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def integrate_stream(
    mode: Literal["earth_only", "sun_earth"],
    state0_r_km: np.ndarray,
    state0_v_km_s: np.ndarray,
    bodies: Dict[str, Body],
    frame_out: Literal["geocentric", "heliocentric"],
    dt_s: float,
    t_max_s: float,
) -> AsyncIterator[Dict]:
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

    while t <= t_max_s:
        out_r, out_v, out_frame = r.copy(), v.copy(), frame
        if frame_out == "geocentric" and frame == "heliocentric":
            out_r = r - earth_r
            out_v = v - earth_v
            out_frame = "geocentric"
        elif frame_out == "heliocentric" and frame == "geocentric":
            out_r = r + earth_r
            out_v = v + earth_v
            out_frame = "heliocentric"

        speed_km_s = float(np.linalg.norm(out_v))
        altitude_km = float(np.linalg.norm(out_r) - R_EARTH) if out_frame == "geocentric" else None

        yield {
            "t_s": float(t),
            "x_km": float(out_r[0]),
            "y_km": float(out_r[1]),
            "z_km": float(out_r[2]),
            "vx_km_s": float(out_v[0]),
            "vy_km_s": float(out_v[1]),
            "vz_km_s": float(out_v[2]),
            "speed_km_s": speed_km_s,
            "altitude_km": altitude_km,
            "frame": out_frame,
        }

        # impact check against Earth
        r_geo = (r - earth_r) if frame == "heliocentric" else r
        if np.linalg.norm(r_geo) <= R_EARTH:
            break

        r, v = rk4_step((r, v), dt_s, accel_fn)
        t += dt_s


def load_first_scenario(config_path: str):
    cfg = json.loads(open(config_path, "r", encoding="utf-8").read())
    sc = cfg["scenarios"][0]

    bodies: Dict[str, Body] = {}
    for name, b in sc["bodies"].items():
        bodies[name] = Body(
            mu=float(b["mu_km3_s2"]),
            r=np.array(b.get("r_km", [0, 0, 0]), dtype=float),
            v=np.array(b.get("v_km_s", [0, 0, 0]), dtype=float),
        )

    return {
        "mode": sc["gravity_model"],
        "state0_r_km": np.array(sc["state0"]["r_km"], dtype=float),
        "state0_v_km_s": np.array(sc["state0"]["v_km_s"], dtype=float),
        "bodies": bodies,
        "frame_out": sc["frame_out"],
        "dt_s": float(sc["integrator"]["dt_s"]),
        "t_max_s": float(sc["integrator"]["t_max_s"]),
    }


@app.get("/health")
async def health():
    return {"ok": True}


@app.websocket("/ws/trajectory")
async def ws_trajectory(ws: WebSocket):
    await ws.accept()
    try:
        config_path = ws.query_params.get("config", "config.json")
        if not os.path.isabs(config_path):
            config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), config_path)
        sc = load_first_scenario(config_path)

        # throttle parameters from query
        throttle_ms = float(ws.query_params.get("throttle_ms", "10"))

        async for sample in integrate_stream(**sc):
            await ws.send_text(json.dumps(sample))
            await asyncio.sleep(throttle_ms / 1000.0)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_text(json.dumps({"error": str(e)}))
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass

# Run with: uvicorn asteroid_sim.server:app --reload --port 8000


