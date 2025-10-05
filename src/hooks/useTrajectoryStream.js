import { useEffect, useRef, useState } from "react";

export default function useTrajectoryStream(url) {
  const [sample, setSample] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data);
        if (d && typeof d.x_km === "number") setSample(d);
      } catch {}
    };
    ws.onerror = () => {};
    return () => { try { ws.close(); } catch {} };
  }, [url]);

  return { sample, connected };
}