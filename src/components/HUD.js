import React from "react";

function fmt(n, unit, digits=2) {
  if (n === null || n === undefined) return "-";
  return `${Number(n).toFixed(digits)} ${unit}`;
}

export default function HUD({ sample, connected }) {
  const style = {
    position: "absolute",
    top: 12,
    left: 12,
    padding: "10px 12px",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    fontSize: 12,
    lineHeight: 1.4,
    borderRadius: 8,
    pointerEvents: "none",
  };
  const badge = {
    display: "inline-block",
    marginLeft: 8,
    padding: "2px 6px",
    borderRadius: 6,
    background: connected ? "rgba(0,180,0,0.4)" : "rgba(200,0,0,0.4)",
  };

  return (
    <div style={style}>
      <div>
        Flux WebSocket
        <span style={badge}>{connected ? "Connecté" : "Déconnecté"}</span>
      </div>
      {sample ? (
        <div>
          <div>t: {fmt(sample.t_s, "s")}</div>
          <div>pos: {fmt(sample.x_km, "km")} | {fmt(sample.y_km, "km")} | {fmt(sample.z_km, "km")}</div>
          <div>vit: {fmt(sample.speed_km_s, "km/s")}</div>
          <div>alt: {sample.altitude_km == null ? "-" : fmt(sample.altitude_km, "km")}</div>
          <div>repère: {sample.frame}</div>
        </div>
      ) : (
        <div>En attente de données…</div>
      )}
    </div>
  );
}