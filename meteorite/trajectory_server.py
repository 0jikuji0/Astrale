# trajectory_server_ws.py
import asyncio
import json
import websockets
from physics_lib import Body, propagate_and_dump_csv  # ton module de calcul de trajectoire

# --- Scénario par défaut (demo_geocentric) ---
default_scenario = {
    "state0_r_km": [7000.0, -2000.0, 1200.0],
    "state0_v_km_s": [-6.5, -2.0, -1.0],
    "bodies": {
        "earth": Body(
            mu=398600.4418,
            r=[0,0,0],
            v=[0,0,0]
        )
    },
    "dt_s": 2.0,
    "t_max_s": 20000.0,
    "output_csv": "Data/trajectory_default.csv"
}

# --- Fonction pour calculer trajectoire et retourner frames JSON ---
def compute_trajectory(r_km, v_km_s, diameter_m=40):
    bodies = {
        "earth": Body(mu=398600.4418, r=[0,0,0], v=[0,0,0])
    }
    output_csv = "Data/trajectory_temp.csv"
    propagate_and_dump_csv(
        mode="earth_only",
        state0_r_km=r_km,
        state0_v_km_s=v_km_s,
        bodies=bodies,
        dt_s=2.0,
        t_max_s=20000.0,
        frame_out="geocentric",
        output_csv=output_csv,
        stop_on_impact=True
    )
    # Lire CSV et retourner frames
    frames = []
    try:
        with open(output_csv, "r") as f:
            next(f)  # skip header
            for line in f:
                t_s, x, y, z, vx, vy, vz, frame = line.strip().split(",")
                frames.append({
                    "pos_km": [float(x), float(y), float(z)],
                    "vel_km_s": [float(vx), float(vy), float(vz)],
                    "time_s": float(t_s)
                })
    except FileNotFoundError:
        frames.append({
            "pos_km": r_km,
            "vel_km_s": v_km_s,
            "time_s": 0
        })
    return frames

# --- Handler WebSocket ---
async def handle_client(websocket):
    print(f"Client connected: {websocket.remote_address}")

    # Envoyer trajectoire par défaut
    default_frames = compute_trajectory(default_scenario["state0_r_km"],
                                        default_scenario["state0_v_km_s"],
                                        diameter_m=40)
    await websocket.send(json.dumps({"frames": default_frames}))

    try:
        async for message in websocket:
            data = json.loads(message)
            r_km = data.get("r_km", default_scenario["state0_r_km"])
            v_km_s = data.get("v_km_s", default_scenario["state0_v_km_s"])
            diameter_m = data.get("diameter_m", 40)
            print(f"Received new values: r={r_km}, v={v_km_s}, d={diameter_m}")

            frames = compute_trajectory(r_km, v_km_s, diameter_m)
            await websocket.send(json.dumps({"frames": frames}))

    except websockets.ConnectionClosed:
        print("Client disconnected")

# --- Lancer serveur ---
async def main():
    async with websockets.serve(handle_client, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
