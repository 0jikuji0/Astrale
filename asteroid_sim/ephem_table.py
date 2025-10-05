# ephem_table.py
import csv, bisect
import numpy as np

class EphemTable:
    def __init__(self, csv_path: str):
        ts, xs, ys, zs, vxs, vys, vzs = [], [], [], [], [], [], []
        with open(csv_path, "r", encoding="utf-8") as f:
            r = csv.DictReader(f)
            for row in r:
                ts.append(float(row["t_s"]))
                xs.append(float(row["x_km"])); ys.append(float(row["y_km"])); zs.append(float(row["z_km"]))
                vxs.append(float(row["vx_km_s"])); vys.append(float(row["vy_km_s"])); vzs.append(float(row["vz_km_s"]))
        self.t = np.array(ts); self.x = np.array(xs); self.y = np.array(ys); self.z = np.array(zs)
        self.vx = np.array(vxs); self.vy = np.array(vys); self.vz = np.array(vzs)

    def sample(self, t: float):
        # interpolation linéaire
        i = max(0, min(len(self.t)-2, bisect.bisect_right(self.t, t)-1))
        t0, t1 = self.t[i], self.t[i+1]
        a = 0.0 if t1==t0 else (t - t0)/(t1 - t0)
        r = np.array([self.x[i]*(1-a)+self.x[i+1]*a,
                      self.y[i]*(1-a)+self.y[i+1]*a,
                      self.z[i]*(1-a)+self.z[i+1]*a], dtype=float)
        v = np.array([self.vx[i]*(1-a)+self.vx[i+1]*a,
                      self.vy[i]*(1-a)+self.vy[i+1]*a,
                      self.vz[i]*(1-a)+self.vz[i+1]*a], dtype=float)
        return r, v
