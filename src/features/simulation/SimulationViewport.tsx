import { useRef } from 'react';

import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';

import { decimalFormatter } from './formatters';
import { degToRad } from './utils';

import type { RootState } from '@react-three/fiber';
import type { Mesh } from 'three';

import type { SimulationParams } from './types';

const Earth = () => {
    return (
        <mesh>
            <sphereGeometry args={[5, 64, 64]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#0f172a" emissiveIntensity={0.2} />
        </mesh>
    );
};

type AsteroidProps = Pick<SimulationParams, 'radius' | 'velocity' | 'angle'>;

const Asteroid = ({ radius, velocity, angle }: AsteroidProps) => {
    const meshRef = useRef<Mesh>(null!);
    const orbitRadius = 12;

    useFrame((state: RootState, delta: number) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const speedFactor = velocity / 18;
        const angleRad = degToRad(angle);
        const x = Math.cos(time * speedFactor) * orbitRadius;
        const z = Math.sin(time * speedFactor) * orbitRadius * Math.cos(angleRad);
        const y = Math.sin(time * speedFactor) * 2.2 + Math.sin(angleRad) * 1.5;
        meshRef.current.position.set(x, y, z);
        meshRef.current.rotation.x += delta * 0.7;
        meshRef.current.rotation.y += delta * (0.5 + speedFactor * 0.05);
    });

    return (
        <mesh ref={meshRef} castShadow>
            <sphereGeometry args={[Math.max(0.3, radius * 2), 32, 32]} />
            <meshStandardMaterial color="#f97316" roughness={0.85} metalness={0.1} />
        </mesh>
    );
};

const Atmosphere = () => (
    <mesh>
        <sphereGeometry args={[5.2, 64, 64]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15} />
    </mesh>
);

type SimulationViewportProps = {
    params: SimulationParams;
};

const SimulationViewport = ({ params }: SimulationViewportProps) => {
    return (
        <section className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/30" aria-hidden />
            <div className="relative z-10 h-[520px] lg:h-full">
                <Canvas shadows camera={{ position: [10, 8, 14], fov: 45 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[15, 10, 5]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                    <pointLight position={[-12, -10, -10]} intensity={0.4} color="#60a5fa" />
                    <Stars radius={80} depth={60} count={8000} factor={4} fade />
                    <group position={[0, -2.6, 0]}>
                        <Earth />
                        <Atmosphere />
                    </group>
                    <Asteroid radius={params.radius} velocity={params.velocity} angle={params.angle} />
                    <OrbitControls enablePan={false} maxDistance={45} minDistance={8} />
                </Canvas>
            </div>

            <div className="absolute bottom-6 left-6 z-20 w-[min(420px,90%)] rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-sm text-slate-200 backdrop-blur">
                <h2 className="text-base font-semibold text-blue-100">Synthèse rapide</h2>
                <p className="mt-2 text-xs text-slate-400">
                    Projection de l'orbite actuelle avec visualisation temps réel de la vitesse et de l'inclinaison. Ajustez les menus pour tester
                    vos stratégies de déviation.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                        <p className="text-slate-400">Vitesse actuelle</p>
                        <p className="text-lg font-semibold text-blue-200">{decimalFormatter.format(params.velocity)} km/s</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                        <p className="text-slate-400">Inclinaison</p>
                        <p className="text-lg font-semibold text-blue-200">{decimalFormatter.format(params.angle)}°</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                        <p className="text-slate-400">Masse</p>
                        <p className="text-lg font-semibold text-blue-200">{decimalFormatter.format(params.mass)} ×10¹² kg</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                        <p className="text-slate-400">Rayon</p>
                        <p className="text-lg font-semibold text-blue-200">{decimalFormatter.format(params.radius)} km</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SimulationViewport;
