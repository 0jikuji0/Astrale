import React from "react";
import AsteroidScene from "./AsteroidScene";
import useTrajectoryStream from "./hooks/useTrajectoryStream";
import HUD from "./components/HUD";

function App() {
  const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000/ws/trajectory?config=config.json&throttle_ms=10`;
  const { sample, connected } = useTrajectoryStream(wsUrl);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <AsteroidScene />
      <HUD sample={sample} connected={connected} />
    </div>
  );
}

export default App;