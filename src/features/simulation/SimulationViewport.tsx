import { useRef } from 'react';
import { SRGBColorSpace } from 'three';

import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';

import { decimalFormatter } from './formatters';
import { degToRad } from './utils';

import type { RootState } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { SimulationParams } from './types';

const Earth = () => {
    const earthMap = useTexture('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    earthMap.colorSpace = SRGBColorSpace;
    const earthNormalMap = useTexture('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');

    return (
        <mesh>
            <sphereGeometry args={[5, 64, 64]} />
            <meshStandardMaterial map={earthMap} normalMap={earthNormalMap} metalness={0.05} roughness={0.85} />
        </mesh>
    );
};

type AsteroidProps = Pick<SimulationParams, 'radius' | 'velocity' | 'angle'>;

const Asteroid = ({ radius, velocity, angle }: AsteroidProps) => {
    const meshRef = useRef<Mesh>(null!);
    const orbitRadius = 12;
    const moonTexture = useTexture('https://threejs.org/examples/textures/planets/moon_1024.jpg');
    moonTexture.colorSpace = SRGBColorSpace;

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
            <meshStandardMaterial map={moonTexture} roughness={1} metalness={0.05} />
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
    type PlanetDefinition = {
        name: string;
        texture: string;
        position: [number, number, number];
        scale: number;
        rotationSpeed?: number;
    };

    const planets: ReadonlyArray<PlanetDefinition> = [
        {
            name: 'Mars',
            texture: 'https://threejs.org/examples/textures/planets/mars_1024.jpg',
            position: [-22, 4, -46],
            scale: 1.8,
            rotationSpeed: 0.03,
        },
        {
            name: 'Jupiter',
            texture: 'https://threejs.org/examples/textures/planets/jupiter_1024.jpg',
            position: [48, 16, -120],
            scale: 6.5,
            rotationSpeed: 0.01,
        },
        {
            name: 'Neptune',
            texture: 'https://threejs.org/examples/textures/planets/neptune_1024.jpg',
            position: [-60, -2, -160],
            scale: 3.4,
            rotationSpeed: 0.02,
        },
    ];

    const Planet = ({ texture, position, scale, rotationSpeed = 0.02 }: PlanetDefinition) => {
        const planetRef = useRef<Mesh>(null!);
        const planetTexture = useTexture(texture);
        planetTexture.colorSpace = SRGBColorSpace;

        useFrame((_, delta) => {
            if (!planetRef.current) return;
            planetRef.current.rotation.y += delta * rotationSpeed;
        });

        return (
            <mesh ref={planetRef} position={position} scale={scale} castShadow receiveShadow>
                <sphereGeometry args={[1, 48, 48]} />
                <meshStandardMaterial map={planetTexture} roughness={0.6} metalness={0.1} />
            </mesh>
        );
    };

    const PlanetField = () => (
        <group>
            {planets.map((planet) => (
                <Planet key={planet.name} {...planet} />
            ))}
        </group>
    );

    return (
        <section className="relative flex-1 overflow-hidden rounded-3xl border border-[#2E96F5]/35 bg-black">
            <div className="relative z-10 h-[60vh] lg:h-[70vh]">
                <Canvas className="bg-black" shadows camera={{ position: [10, 8, 14], fov: 45 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[15, 10, 5]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                    <pointLight position={[-12, -10, -10]} intensity={0.4} color="#eafe07" />
                    <Stars radius={80} depth={60} count={8000} factor={4} fade />
                    <PlanetField />
                    <group position={[0, -2.6, 0]}>
                        <Earth />
                        <Atmosphere />
                    </group>
                    <Asteroid radius={params.radius} velocity={params.velocity} angle={params.angle} />
                    <OrbitControls enablePan={false} maxDistance={45} minDistance={8} />
                </Canvas>
            </div>

            <div className="absolute bottom-4 left-6 z-20 w-[min(420px,90%)] rounded-2xl border border-[#2E96F5]/30 bg-[#041032]/85 p-5 text-sm text-[#E6ECFF] backdrop-blur">
                <h2 className="text-base font-semibold text-[#2E96F5]">Synthèse rapide</h2>
                <p className="mt-2 text-xs text-[#A8B9FF]">
                    Projection de l'orbite actuelle avec visualisation temps réel de la vitesse et de l'inclinaison. Ajustez les menus pour tester
                    vos stratégies de déviation.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                        <p className="text-[#A8B9FF]">Vitesse actuelle</p>
                        <p className="text-lg font-semibold text-[#eafe07]">{decimalFormatter.format(params.velocity)} km/s</p>
                    </div>
                    <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                        <p className="text-[#A8B9FF]">Inclinaison</p>
                        <p className="text-lg font-semibold text-[#eafe07]">{decimalFormatter.format(params.angle)}°</p>
                    </div>
                    <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                        <p className="text-[#A8B9FF]">Masse</p>
                        <p className="text-lg font-semibold text-[#eafe07]">{decimalFormatter.format(params.mass)} ×10¹² kg</p>
                    </div>
                    <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                        <p className="text-[#A8B9FF]">Rayon</p>
                        <p className="text-lg font-semibold text-[#eafe07]">{decimalFormatter.format(params.radius)} km</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SimulationViewport;
