import gsap from 'gsap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, Quaternion, SRGBColorSpace, Vector3 } from 'three';

import { Edges, Line, OrbitControls, Stars, useCursor, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

import { decimalFormatter } from './formatters';
import { degToRad } from './utils';

import type { MutableRefObject } from 'react';

import type { RootState, ThreeEvent } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { SimulationParams } from './types';
import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js';

const DEFAULT_CAMERA_POSITION = new Vector3(0, 28, 120);
const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0);
const ORBIT_SEGMENTS = 240;

const SOLAR_SCALE = 650 / 30.069;
const ORBIT_SCALE = 1;
const SPEED_SCALE = 0.12;
const INCLINATION_MULTIPLIER = 3;
const EARTH_SEMI_MAJOR_AXIS = SOLAR_SCALE * ORBIT_SCALE;
const EARTH_ORBIT_ECCENTRICITY = 0.0167;
const EARTH_SEMI_MINOR_AXIS = EARTH_SEMI_MAJOR_AXIS * Math.sqrt(1 - EARTH_ORBIT_ECCENTRICITY * EARTH_ORBIT_ECCENTRICITY);
const EARTH_ORBIT_TILT = degToRad(0 * INCLINATION_MULTIPLIER);
const EARTH_ORBIT_SPEED = 1 * SPEED_SCALE;
const EARTH_ROTATION_SPEED = 0.25;
const EARTH_RADIUS = 1.6;
const EARTH_VERTICAL_OFFSET = 0;

const orbitalDetailFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
});

const distanceFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
});

type OrbitParameters = {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    speed: number;
    phase: number;
};

type PlanetRingDefinition = {
    innerRadius: number;
    outerRadius: number;
    texture?: string;
    color?: string;
    opacity?: number;
    tilt?: [number, number, number];
};

type PlanetDefinition = {
    name: string;
    texture: string;
    scale: number;
    rotationSpeed: number;
    color: string;
    summary: string;
    distanceAu: number;
    inclinationDegrees: number;
    orbit: OrbitParameters;
    rings?: PlanetRingDefinition;
};

type VectorTuple = [number, number, number];

type FocusState = {
    definition: PlanetDefinition;
};

const planetDefinitions: ReadonlyArray<PlanetDefinition> = [
    {
        name: 'Mercure',
        texture: '/images/mercury_hd.jpg',
        scale: 0.7,
        rotationSpeed: 0.18,
        color: '#888888',
        summary: "Plus petite planète, proche du Soleil avec une orbite très rapide.",
        distanceAu: 0.387,
        inclinationDegrees: 7,
        orbit: {
            semiMajorAxis: 0.387 * SOLAR_SCALE * ORBIT_SCALE,
            eccentricity: 0.2056,
            inclination: degToRad(7 * INCLINATION_MULTIPLIER),
            speed: 4.15 * SPEED_SCALE,
            phase: 0,
        },
    },
    {
        name: 'Vénus',
        texture: '/images/venus_hd.jpg',
        scale: 1.5,
        rotationSpeed: 0.06,
        color: '#f5d66d',
        summary: "Jumelle de la Terre par la taille mais enveloppée d'une atmosphère brûlante.",
        distanceAu: 0.723,
        inclinationDegrees: 3.4,
        orbit: {
            semiMajorAxis: 0.723 * SOLAR_SCALE * ORBIT_SCALE,
            eccentricity: 0.0068,
            inclination: degToRad(3.4 * INCLINATION_MULTIPLIER),
            speed: 1.62 * SPEED_SCALE,
            phase: Math.PI * 0.35,
        },
    },
    {
        name: 'Mars',
        texture: '/images/mars_hd.jpg',
        scale: 1.9,
        rotationSpeed: 0.08,
        color: '#ff5c45',
        summary: 'Planète rouge désertique riche en reliefs volcaniques et canyons.',
        distanceAu: 1.524,
        inclinationDegrees: 1.85,
        orbit: {
            semiMajorAxis: 1.524 * SOLAR_SCALE * ORBIT_SCALE,
            eccentricity: 0.0934,
            inclination: degToRad(1.85 * INCLINATION_MULTIPLIER),
            speed: 0.53 * SPEED_SCALE,
            phase: Math.PI * 0.8,
        },
    },
    {
        name: 'Jupiter',
        texture: '/images/jupiter_hd.jpg',
        scale: 6.4,
        rotationSpeed: 0.03,
        color: '#e3a667',
        summary: 'Géante gazeuse striée, protectrice du système solaire par sa gravité.',
        distanceAu: 5.203,
        inclinationDegrees: 1.3,
        orbit: {
            semiMajorAxis: 5.203 * SOLAR_SCALE * ORBIT_SCALE,
            eccentricity: 0.0484,
            inclination: degToRad(1.3 * INCLINATION_MULTIPLIER),
            speed: 0.08 * SPEED_SCALE,
            phase: Math.PI * 1.6,
        },
    },
    {
        name: 'Saturne',
        texture: '/images/saturn_hd.jpg',
        scale: 5.2,
        rotationSpeed: 0.024,
        color: '#f0e2bb',
        summary: 'Emblématique par ses anneaux majestueux composés de glace et de roche.',
        distanceAu: 9.537,
        inclinationDegrees: 2.49,
        orbit: {
            semiMajorAxis: 9.537 * SOLAR_SCALE * ORBIT_SCALE,
            eccentricity: 0.0541,
            inclination: degToRad(2.49 * INCLINATION_MULTIPLIER),
            speed: 0.03 * SPEED_SCALE,
            phase: Math.PI * 2.1,
        },
        rings: {
            innerRadius: 1.3,
            outerRadius: 1.9,
            texture: '/images/saturn_ring.jpg',
            opacity: 0.65,
        },
    },
    {
        name: 'Uranus',
        texture: '/images/uranus_hd.jpg',
        scale: 3.6,
        rotationSpeed: 0.026,
        color: '#a9d7f5',
        summary: 'Géante glacée inclinée sur le côté, tournant presque couchée.',
        distanceAu: 19.191,
        inclinationDegrees: 0.77,
        orbit: {
            semiMajorAxis: 19.191 * SOLAR_SCALE * ORBIT_SCALE,
            eccentricity: 0.0472,
            inclination: degToRad(0.77 * INCLINATION_MULTIPLIER),
            speed: 0.011 * SPEED_SCALE,
            phase: Math.PI * 2.6,
        },
        rings: {
            innerRadius: 1,
            outerRadius: 1.6,
            color: '#cde5ff',
            opacity: 0.35,
            tilt: [-Math.PI / 2.4, 0, Math.PI / 9],
        },
    },
    {
        name: 'Neptune',
        texture: '/images/neptune_hd.jpg',
        scale: 3.4,
        rotationSpeed: 0.022,
        color: '#4f79ff',
        summary: 'Dernière géante de glace, balayée par des vents supersoniques.',
        distanceAu: 30.069,
        inclinationDegrees: 1.77,
        orbit: {
            semiMajorAxis: 30.069 * SOLAR_SCALE * ORBIT_SCALE,
            eccentricity: 0.0086,
            inclination: degToRad(1.77 * INCLINATION_MULTIPLIER),
            speed: 0.006 * SPEED_SCALE,
            phase: Math.PI * 3.2,
        },
    },
];

const SunGlow = () => {
    const sunTexture = useTexture('/images/sun_hd.jpg');
    sunTexture.colorSpace = SRGBColorSpace;

    return (
        <mesh scale={2.4} position={[0, 0, 0]}>
            <sphereGeometry args={[1, 48, 48]} />
            <meshStandardMaterial map={sunTexture} emissive="#fbe7a7" emissiveIntensity={0.9} />
        </mesh>
    );
};

const TexturedPlanetRings = ({
    innerRadius,
    outerRadius,
    texture,
    opacity = 0.6,
    tilt = [-Math.PI / 2, 0, 0],
}: PlanetRingDefinition & { texture: string }) => {
    const ringTexture = useTexture(texture);
    ringTexture.colorSpace = SRGBColorSpace;

    return (
        <mesh rotation={tilt}>
            <ringGeometry args={[innerRadius, outerRadius, 128]} />
            <meshBasicMaterial map={ringTexture} transparent opacity={opacity} side={DoubleSide} />
        </mesh>
    );
};

const PlanetRings = (props: PlanetRingDefinition) => {
    const { innerRadius, outerRadius, texture, color = '#f5e2b5', opacity = 0.6, tilt = [-Math.PI / 2, 0, 0] } = props;

    if (!texture) {
        return (
            <mesh rotation={tilt}>
                <ringGeometry args={[innerRadius, outerRadius, 128]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} side={DoubleSide} />
            </mesh>
        );
    }

    return (
        <TexturedPlanetRings
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            texture={texture}
            opacity={opacity}
            tilt={tilt}
        />
    );
};

type OrbitPathProps = {
    orbit: OrbitParameters;
    color: string;
};

const OrbitPath = ({ orbit, color }: OrbitPathProps) => {
    const points = useMemo(() => {
        const { semiMajorAxis: a, eccentricity: e, inclination } = orbit;
        const b = a * Math.sqrt(1 - e * e);
        const tiltQuaternion = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), inclination);
        const computed: Array<[number, number, number]> = [];
        for (let i = 0; i <= ORBIT_SEGMENTS; i += 1) {
            const theta = (i / ORBIT_SEGMENTS) * Math.PI * 2;
            const x = Math.cos(theta) * a - a * e;
            const z = Math.sin(theta) * b;
            const point = new Vector3(x, 0, z).applyQuaternion(tiltQuaternion);
            computed.push([point.x, point.y, point.z]);
        }
        return computed;
    }, [orbit.eccentricity, orbit.inclination, orbit.semiMajorAxis]);

    return <Line points={points} color={color} transparent opacity={0.18} raycast={() => null} />;
};

type PlanetProps = {
    definition: PlanetDefinition;
    isSelected: boolean;
    onSelect: (definition: PlanetDefinition, position: VectorTuple) => void;
    onPositionChange?: (definition: PlanetDefinition, position: Vector3) => void;
};

const Planet = ({ definition, isSelected, onSelect, onPositionChange }: PlanetProps) => {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const planetTexture = useTexture(definition.texture);
    planetTexture.colorSpace = SRGBColorSpace;
    const orbitQuaternion = useMemo(
        () => new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), definition.orbit.inclination),
        [definition.orbit.inclination],
    );
    const orbitSemiMinor = useMemo(
        () => definition.orbit.semiMajorAxis * Math.sqrt(1 - definition.orbit.eccentricity * definition.orbit.eccentricity),
        [definition.orbit.eccentricity, definition.orbit.semiMajorAxis],
    );
    const orbitPosition = useRef(new Vector3());
    const worldPositionRef = useRef(new Vector3());

    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const { semiMajorAxis: a, eccentricity: e, speed, phase } = definition.orbit;
        const time = state.clock.getElapsedTime();
        const angle = time * speed + phase;
        const x = Math.cos(angle) * a - a * e;
        const z = Math.sin(angle) * orbitSemiMinor;
        const position = orbitPosition.current;
        position.set(x, 0, z).applyQuaternion(orbitQuaternion);
        groupRef.current.position.copy(position);
        groupRef.current.getWorldPosition(worldPositionRef.current);
        if (isSelected && onPositionChange) {
            onPositionChange(definition, worldPositionRef.current);
        }

        if (meshRef.current) {
            meshRef.current.rotation.y += delta * definition.rotationSpeed;
        }
    });

    const handleClick = useCallback(
        (event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            if (!groupRef.current) return;
            const worldPosition = new Vector3();
            groupRef.current.getWorldPosition(worldPosition);
            onSelect(definition, [worldPosition.x, worldPosition.y, worldPosition.z]);
        },
        [definition, onSelect],
    );

    const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
    }, []);

    const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(false);
    }, []);

    return (
        <group>
            <OrbitPath orbit={definition.orbit} color={definition.color} />
            <group ref={groupRef} scale={definition.scale}>
                <mesh
                    ref={meshRef}
                    castShadow
                    receiveShadow
                    onClick={handleClick}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                >
                    <sphereGeometry args={[1, 48, 48]} />
                    <meshStandardMaterial
                        map={planetTexture}
                        roughness={0.6}
                        metalness={0.1}
                        emissive="#000000"
                        emissiveIntensity={0}
                    />
                    {isSelected ? <Edges scale={1.08} color="#eafe07" /> : null}
                </mesh>
                {definition.rings ? <PlanetRings {...definition.rings} /> : null}
            </group>
        </group>
    );
};

const CameraFocusManager = ({
    focusState,
    controlsRef,
    focusPositionRef,
}: {
    focusState: FocusState | null;
    controlsRef: React.RefObject<OrbitControlsImpl>;
    focusPositionRef: MutableRefObject<Vector3>;
}) => {
    const { camera } = useThree();
    const followActiveRef = useRef(false);
    const offsetRef = useRef({
        distance: Math.max(16, EARTH_RADIUS * 6.5),
        height: EARTH_RADIUS * 2,
        direction: new Vector3(0, 0, 1),
    });

    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;

        followActiveRef.current = false;
        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(controls.target);

        const update = () => controls.update();

        if (!focusState) {
            offsetRef.current.direction.set(0, 0, 1);
            const positionTween = gsap.to(camera.position, {
                duration: 1.2,
                x: DEFAULT_CAMERA_POSITION.x,
                y: DEFAULT_CAMERA_POSITION.y,
                z: DEFAULT_CAMERA_POSITION.z,
                ease: 'power2.out',
                overwrite: 'auto',
                onUpdate: update,
            });
            const targetTween = gsap.to(controls.target, {
                duration: 1.2,
                x: DEFAULT_CAMERA_TARGET.x,
                y: DEFAULT_CAMERA_TARGET.y,
                z: DEFAULT_CAMERA_TARGET.z,
                ease: 'power2.out',
                overwrite: 'auto',
                onUpdate: update,
            });
            return () => {
                positionTween.kill();
                targetTween.kill();
            };
        }

        const targetVector = focusPositionRef.current.clone();
        const direction = targetVector.clone().normalize();
        if (direction.lengthSq() < 1e-3) {
            direction.set(0, 0, 1);
        }
        offsetRef.current.distance = Math.max(16, focusState.definition.scale * 6.5);
        offsetRef.current.height = focusState.definition.scale * 2;
        offsetRef.current.direction.copy(direction);

        const cameraDestination = targetVector.clone().add(direction.multiplyScalar(offsetRef.current.distance));
        cameraDestination.y += offsetRef.current.height;

        let completedTweens = 0;
        const markComplete = () => {
            completedTweens += 1;
            if (completedTweens >= 2) {
                followActiveRef.current = true;
            }
        };

        const positionTween = gsap.to(camera.position, {
            duration: 1,
            x: cameraDestination.x,
            y: cameraDestination.y,
            z: cameraDestination.z,
            ease: 'power3.out',
            overwrite: 'auto',
            onUpdate: update,
            onComplete: markComplete,
        });

        const targetTween = gsap.to(controls.target, {
            duration: 1,
            x: targetVector.x,
            y: targetVector.y,
            z: targetVector.z,
            ease: 'power3.out',
            overwrite: 'auto',
            onUpdate: update,
            onComplete: markComplete,
        });

        return () => {
            positionTween.kill();
            targetTween.kill();
        };
    }, [camera, controlsRef, focusState, focusPositionRef]);

    useFrame(() => {
        const controls = controlsRef.current;
        if (!controls || !focusState || !followActiveRef.current) return;

        const targetVector = focusPositionRef.current.clone();
        const hasMagnitude = targetVector.lengthSq() > 1e-6;
        const direction = hasMagnitude ? targetVector.clone().normalize() : offsetRef.current.direction.clone();

        const desiredPosition = targetVector.clone().add(direction.multiplyScalar(offsetRef.current.distance));
        desiredPosition.y += offsetRef.current.height;

        camera.position.lerp(desiredPosition, 0.08);
        controls.target.lerp(targetVector, 0.12);
        controls.update();
    });

    return null;
};

const Atmosphere = ({ radius }: { radius: number }) => (
    <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15} />
    </mesh>
);

const earthDefinition: PlanetDefinition = {
    name: 'Terre',
    texture: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    scale: EARTH_RADIUS,
    rotationSpeed: EARTH_ROTATION_SPEED,
    color: '#2E96F5',
    summary: 'Planète océanique abritant une atmosphère tempérée.',
    distanceAu: 1,
    inclinationDegrees: 0,
    orbit: {
        semiMajorAxis: EARTH_SEMI_MAJOR_AXIS,
        eccentricity: EARTH_ORBIT_ECCENTRICITY,
        inclination: EARTH_ORBIT_TILT,
        speed: EARTH_ORBIT_SPEED,
        phase: 0,
    },
};

type EarthProps = {
    definition: PlanetDefinition;
    isSelected: boolean;
    onSelect: (definition: PlanetDefinition, position: VectorTuple) => void;
    onPositionChange: (position: Vector3) => void;
};

const Earth = ({ definition, isSelected, onSelect, onPositionChange }: EarthProps) => {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const worldPositionRef = useRef(new Vector3());
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);
    const earthMap = useTexture('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    earthMap.colorSpace = SRGBColorSpace;
    const earthNormalMap = useTexture('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
    const orbitQuaternion = useMemo(
        () => new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), EARTH_ORBIT_TILT),
        [],
    );
    const orbitPosition = useRef(new Vector3());

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.getElapsedTime();
        const angle = time * EARTH_ORBIT_SPEED;
        const x = Math.cos(angle) * EARTH_SEMI_MAJOR_AXIS - EARTH_SEMI_MAJOR_AXIS * EARTH_ORBIT_ECCENTRICITY;
        const z = Math.sin(angle) * EARTH_SEMI_MINOR_AXIS;
        const position = orbitPosition.current;
        position.set(x, 0, z);
        if (EARTH_ORBIT_TILT !== 0) {
            position.applyQuaternion(orbitQuaternion);
        }
        position.y += EARTH_VERTICAL_OFFSET;
        groupRef.current.position.copy(position);
        groupRef.current.getWorldPosition(worldPositionRef.current);
        onPositionChange(worldPositionRef.current);

        if (meshRef.current) {
            meshRef.current.rotation.y += delta * EARTH_ROTATION_SPEED;
        }
    });

    const handleClick = useCallback(
        (event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            const pos = worldPositionRef.current;
            onSelect(definition, [pos.x, pos.y, pos.z]);
        },
        [definition, onSelect],
    );

    const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
    }, []);

    const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(false);
    }, []);

    return (
        <group>
            <OrbitPath orbit={definition.orbit} color={definition.color} />
            <group ref={groupRef}>
                <mesh
                    ref={meshRef}
                    castShadow
                    receiveShadow
                    onClick={handleClick}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                >
                    <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
                    <meshStandardMaterial
                        map={earthMap}
                        normalMap={earthNormalMap}
                        metalness={0.05}
                        roughness={0.85}
                        emissive="#000000"
                        emissiveIntensity={0}
                    />
                    {isSelected ? <Edges scale={1.04} color="#eafe07" /> : null}
                </mesh>
                <Atmosphere radius={EARTH_RADIUS * 1.08} />
            </group>
        </group>
    );
};

type AsteroidProps = Pick<SimulationParams, 'radius' | 'velocity' | 'angle'> & {
    centerRef: MutableRefObject<Vector3>;
};

const Asteroid = ({ radius, velocity, angle, centerRef }: AsteroidProps) => {
    const meshRef = useRef<Mesh>(null!);
    const orbitRadius = EARTH_RADIUS * 6;
    const moonTexture = useTexture('https://threejs.org/examples/textures/planets/moon_1024.jpg');
    moonTexture.colorSpace = SRGBColorSpace;

    useFrame((state: RootState, delta: number) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const speedFactor = velocity / 18;
        const angleRad = degToRad(angle);
        const x = Math.cos(time * speedFactor) * orbitRadius;
        const z = Math.sin(time * speedFactor) * orbitRadius * Math.cos(angleRad);
        const y = Math.sin(time * speedFactor) * EARTH_RADIUS * 1.2 + Math.sin(angleRad) * EARTH_RADIUS * 0.9;
        const center = centerRef.current;
        meshRef.current.position.set(center.x + x, center.y + y, center.z + z);
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

type SimulationViewportProps = {
    params: SimulationParams;
};

const SimulationViewport = ({ params }: SimulationViewportProps) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const earthPositionRef = useRef(new Vector3());
    const focusPositionRef = useRef(new Vector3());
    const [focusState, setFocusState] = useState<FocusState | null>(null);

    const handlePlanetSelect = useCallback((definition: PlanetDefinition, position: VectorTuple) => {
        focusPositionRef.current.set(position[0], position[1], position[2]);
        setFocusState({ definition });
    }, []);

    const handleFocusPositionChange = useCallback(
        (definition: PlanetDefinition, position: Vector3) => {
            if (focusState?.definition.name === definition.name) {
                focusPositionRef.current.copy(position);
            }
        },
        [focusState],
    );

    const handleEarthPositionUpdate = useCallback(
        (position: Vector3) => {
            earthPositionRef.current.copy(position);
            handleFocusPositionChange(earthDefinition, position);
        },
        [handleFocusPositionChange],
    );

    const handleResetFocus = useCallback(() => {
        setFocusState(null);
        focusPositionRef.current.set(0, 0, 0);
    }, []);

    useEffect(() => {
        if (!controlsRef.current) return;
        controlsRef.current.enablePan = !focusState;
    }, [focusState]);

    const selectedBody = focusState?.definition ?? null;

    return (
        <section className="relative h-screen w-full overflow-hidden rounded-3xl border border-[#2E96F5]/35 bg-black">
            <div className="relative z-10 h-full">
                <Canvas
                    className="bg-black"
                    shadows
                    camera={{
                        position: [DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.y, DEFAULT_CAMERA_POSITION.z],
                        fov: 45,
                        far: 3000,
                    }}
                    onPointerMissed={(event) => {
                        if (event.button === 0) {
                            handleResetFocus();
                        }
                    }}
                >
                    <ambientLight intensity={0.55} />
                    <pointLight position={[0, 0, 0]} intensity={1.6} color="#f8d27a" distance={600} />
                    <directionalLight
                        position={[60, 40, 20]}
                        intensity={0.6}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                    <Stars radius={2600} depth={180} count={12000} factor={5} fade />
                    <SunGlow />
                    <group>
                        {planetDefinitions.map((planet) => (
                            <Planet
                                key={planet.name}
                                definition={planet}
                                isSelected={focusState?.definition.name === planet.name}
                                onSelect={handlePlanetSelect}
                                onPositionChange={handleFocusPositionChange}
                            />
                        ))}
                    </group>
                    <Earth
                        definition={earthDefinition}
                        isSelected={focusState?.definition.name === earthDefinition.name}
                        onSelect={handlePlanetSelect}
                        onPositionChange={handleEarthPositionUpdate}
                    />
                    <Asteroid
                        radius={params.radius}
                        velocity={params.velocity}
                        angle={params.angle}
                        centerRef={earthPositionRef}
                    />
                    <CameraFocusManager
                        focusState={focusState}
                        controlsRef={controlsRef}
                        focusPositionRef={focusPositionRef}
                    />
                    <OrbitControls
                        ref={controlsRef}
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.08}
                        minDistance={10}
                        maxDistance={focusState ? 900 : 1500}
                    />
                </Canvas>
            </div>

            <div className="absolute bottom-4 left-6 z-20 w-[min(440px,90%)] overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-[1px] shadow-[0_30px_60px_rgba(4,16,50,0.45)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2E96F5]/35 via-transparent to-[#0C1C4D]/70 opacity-90" />
                <div className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-[#2E96F5]/35 blur-3xl" />
                <div className="relative z-10 w-full rounded-[1.8rem] p-5 text-sm text-[#E6ECFF]">
                    <h2 className="text-base font-semibold text-[#2E96F5]">Synthèse rapide</h2>
                    <p className="mt-2 text-xs text-[#A8B9FF]">
                        Projection du système et suivi temps réel des paramètres. Cliquez sur une planète pour centrer la vue et obtenir ses indicateurs
                        orbitaux.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                        <div className="col-span-2 rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                            <p className="text-[#A8B9FF]">Planète suivie</p>
                            <p className="text-lg font-semibold text-[#eafe07]">{selectedBody ? selectedBody.name : 'Aucune'}</p>
                            <p className="mt-2 text-[0.7rem] leading-relaxed text-[#A8B9FF]">
                                {selectedBody
                                    ? selectedBody.summary
                                    : 'Cliquez sur une planète pour zoomer, ajuster la caméra et analyser sa trajectoire par rapport à votre scénario.'}
                            </p>
                        </div>
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
                        {selectedBody ? (
                            <>
                                <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                                    <p className="text-[#A8B9FF]">Distance orbitale moyenne</p>
                                    <p className="text-lg font-semibold text-[#eafe07]">
                                        {distanceFormatter.format(selectedBody.distanceAu)} AU
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                                    <p className="text-[#A8B9FF]">Excentricité</p>
                                    <p className="text-lg font-semibold text-[#eafe07]">
                                        {orbitalDetailFormatter.format(selectedBody.orbit.eccentricity)}
                                    </p>
                                </div>
                                <div className="col-span-2 rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-3">
                                    <p className="text-[#A8B9FF]">Inclinaison orbitale</p>
                                    <p className="text-lg font-semibold text-[#eafe07]">
                                        {orbitalDetailFormatter.format(selectedBody.inclinationDegrees)}°
                                    </p>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SimulationViewport;
