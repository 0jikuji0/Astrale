// src/AsteroidScene.js
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

function AsteroidModel() {
  // Charger le modèle glb (mets ton fichier asteroid.glb dans /public)
  const { scene } = useGLTF("/asteroid.glb");
  return <primitive object={scene} scale={1.5} />;
}

export default function AsteroidScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Lumières */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {/* Suspense = loader pendant chargement du modèle */}
      <Suspense fallback={null}>
        <AsteroidModel />
      </Suspense>

      {/* Contrôles caméra + rotation automatique */}
      <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} />
    </Canvas>
  );
}
