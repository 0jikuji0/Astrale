import gsap from 'gsap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, Quaternion, SRGBColorSpace, Vector3 } from 'three';

import { Edges, Line, OrbitControls, Stars, useCursor, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

import { astronomicalToCartesian, fetchCelestialPositions, mapPlanetName } from './astronomyApi';
import { SIMULATION_EVENTS } from './events';
import { decimalFormatter } from './formatters';
import { degToRad } from './utils';

import type { ChangeEvent } from 'react';
import type { MutableRefObject } from 'react';
import type { RootState, ThreeEvent } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { SimulationParams } from './types';
import type { PositionsResponse, AstronomicalPosition } from './astronomyApi';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const AU_TO_SCENE_UNITS = 32;
const DEFAULT_CAMERA_POSITION = new Vector3(7, AU_TO_SCENE_UNITS * 1, AU_TO_SCENE_UNITS * 5);
const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0);
const ORBIT_SEGMENTS = 240;

const SPEED_SCALE = 0.12;
const INCLINATION_MULTIPLIER = 3;
const getSemiMajorAxis = (distanceAu: number) => distanceAu * AU_TO_SCENE_UNITS;

const EARTH_SEMI_MAJOR_AXIS = getSemiMajorAxis(1);
const EARTH_ORBIT_ECCENTRICITY = 0.0167;
const EARTH_SEMI_MINOR_AXIS = EARTH_SEMI_MAJOR_AXIS * Math.sqrt(1 - EARTH_ORBIT_ECCENTRICITY * EARTH_ORBIT_ECCENTRICITY);
const EARTH_ORBIT_TILT = degToRad(0 * INCLINATION_MULTIPLIER);
const EARTH_ORBIT_SPEED = 1 * SPEED_SCALE;
const EARTH_ROTATION_SPEED = 0.25;
const EARTH_RADIUS = 1.6;
const EARTH_VERTICAL_OFFSET = 0;

const STARS_CONFIG = {
    radius: 100,
    depth: 50,
    count: 5000,
    factor: 4,
    saturation: 0,
    fade: true,
    speed: 1,
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const orbitalDetailFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
});

const distanceFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
});

const DEFAULT_TARGET_KEY = '__default__';

type SelectedPlanetEventDetail = {
    planetName: string | null;
    params: SimulationParams;
};

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

type AsteroidComposition = {
    roche: number;
    glace: number;
    fer: number;
    nickel?: number;
    silicate?: number;
};

type AsteroidDefinition = {
    name: string;
    scale: number;
    color: string;
    composition: AsteroidComposition;
    orbit: OrbitParameters;
};

type VectorTuple = [number, number, number];

type FocusState = {
    definition: PlanetDefinition | AsteroidDefinition;
    type: 'planet' | 'asteroid';
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
            semiMajorAxis: getSemiMajorAxis(0.387),
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
            semiMajorAxis: getSemiMajorAxis(0.723),
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
            semiMajorAxis: getSemiMajorAxis(1.524),
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
            semiMajorAxis: getSemiMajorAxis(5.203),
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
            semiMajorAxis: getSemiMajorAxis(9.537),
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
            semiMajorAxis: getSemiMajorAxis(19.191),
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
        scale: 9.4,
        rotationSpeed: 0.022,
        color: '#4f79ff',
        summary: 'Dernière géante de glace, balayée par des vents supersoniques.',
        distanceAu: 30.069,
        inclinationDegrees: 1.77,
        orbit: {
            semiMajorAxis: getSemiMajorAxis(30.069),
            eccentricity: 0.0086,
            inclination: degToRad(1.77 * INCLINATION_MULTIPLIER),
            speed: 0.006 * SPEED_SCALE,
            phase: Math.PI * 3.2,
        },
    },
];

const generateRandomAsteroids = (): AsteroidDefinition[] => {
    const asteroidNames = [
        'Cérès', 'Vesta', 'Pallas', 'Hygeia', 'Interamnia',
        'Europa (ast)', 'Davida', 'Sylvia', 'Cybele', 'Eunomia',
        'Juno', 'Euphrosyne', 'Hektor', 'Thisbe', 'Bamberga'
    ];

    return asteroidNames.map((name, index) => {
        const distanceAu = 2.2 + Math.random() * 1.3; // Asteroid belt: 2.2-3.5 AU
        const eccentricity = 0.05 + Math.random() * 0.15;
        const inclinationDegrees = Math.random() * 15;

        // Generate random composition totaling 100%
        const roche = 30 + Math.random() * 40;
        const glace = Math.random() * 30;
        const fer = Math.random() * 25;
        const remaining = 100 - roche - glace - fer;
        const nickel = remaining * Math.random();
        const silicate = remaining - nickel;

        return {
            name,
            scale: 0.15 + Math.random() * 0.35,
            color: '#8B4513',
            composition: {
                roche: Math.round(roche),
                glace: Math.round(glace),
                fer: Math.round(fer),
                nickel: Math.round(nickel),
                silicate: Math.round(silicate),
            },
            orbit: {
                semiMajorAxis: getSemiMajorAxis(distanceAu),
                eccentricity,
                inclination: degToRad(inclinationDegrees * INCLINATION_MULTIPLIER),
                speed: (0.3 + Math.random() * 0.4) * SPEED_SCALE,
                phase: (Math.PI * 2 * index) / asteroidNames.length,
            },
        };
    });
};

const asteroidDefinitions = generateRandomAsteroids();

type AsteroidProps = {
    definition: AsteroidDefinition;
    isSelected: boolean;
    onSelect: (definition: AsteroidDefinition, position: VectorTuple) => void;
    onPositionChange?: (definition: AsteroidDefinition, position: Vector3) => void;
};

const Asteroid = ({ definition, isSelected, onSelect, onPositionChange }: AsteroidProps) => {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const worldPositionRef = useRef(new Vector3());

    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    const asteroidTextures = useTexture({
        map: '/images/Rock030_1K-JPG_Color.jpg',
        roughnessMap: '/images/Rock030_1K-JPG_Roughness.jpg',
        normalMap: '/images/Rock030_1K-JPG_NormalGL.jpg',
        displacementMap: '/images/Rock030_1K-JPG_Displacement.jpg',
        aoMap: '/images/Rock030_1K-JPG_AmbientOcclusion.jpg',
    });

    // Set color space for the base texture
    asteroidTextures.map.colorSpace = SRGBColorSpace;

    const orbitQuaternion = useMemo(
        () => new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), definition.orbit.inclination),
        [definition.orbit.inclination],
    );

    const orbitSemiMinor = useMemo(
        () => definition.orbit.semiMajorAxis * Math.sqrt(1 - definition.orbit.eccentricity * definition.orbit.eccentricity),
        [definition.orbit.eccentricity, definition.orbit.semiMajorAxis],
    );

    const orbitPosition = useRef(new Vector3());

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const { semiMajorAxis: a, eccentricity: e, phase } = definition.orbit;
        const time = state.clock.getElapsedTime();
        const angle = time * definition.orbit.speed + phase;
        const x = Math.cos(angle) * a - a * e;
        const z = Math.sin(angle) * orbitSemiMinor;
        const position = orbitPosition.current;
        position.set(x, 0, z).applyQuaternion(orbitQuaternion);
        groupRef.current.position.copy(position);
        groupRef.current.getWorldPosition(worldPositionRef.current);
        if (onPositionChange) {
            onPositionChange(definition, worldPositionRef.current);
        }

        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.3;
            meshRef.current.rotation.y += delta * 0.5;
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
            <OrbitPath orbit={definition.orbit} color="#ff0000" />
            <group ref={groupRef} scale={definition.scale}>
                <mesh
                    ref={meshRef}
                    castShadow
                    receiveShadow
                    onClick={handleClick}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                >
                    <sphereGeometry args={[1, 64, 64]} />
                    <meshStandardMaterial
                        map={asteroidTextures.map}
                        roughnessMap={asteroidTextures.roughnessMap}
                        roughness={0.8}
                        metalness={0.1}
                        normalMap={asteroidTextures.normalMap}
                        displacementMap={asteroidTextures.displacementMap}
                        displacementScale={0.3}
                        aoMap={asteroidTextures.aoMap}
                        emissive={definition.color}
                        emissiveIntensity={isSelected ? 0.3 : 0}
                    />
                    {isSelected ? <Edges scale={1.1} color="#ff0000" /> : null}
                </mesh>
            </group>
        </group>
    );
};

const SunGlow = () => {
    const sunTexture = useTexture('/images/sun_hd.jpg');
    sunTexture.colorSpace = SRGBColorSpace;

    return (
        <mesh scale={2.4} position={[0, 0, 0]}>
            <sphereGeometry args={[1, 48, 48]} />
            <meshStandardMaterial
                map={sunTexture}
                emissive="#f7b955"
                emissiveIntensity={0.35}
                metalness={0}
                roughness={1}
                toneMapped={false}
            />
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
    }, [orbit]);

    return <Line points={points} color={color} transparent opacity={0.18} raycast={() => null} />;
};

type PlanetProps = {
    definition: PlanetDefinition;
    isSelected: boolean;
    onSelect: (definition: PlanetDefinition, position: VectorTuple) => void;
    onPositionChange?: (definition: PlanetDefinition, position: Vector3) => void;
    activeParams: SimulationParams | null;
};

const Planet = ({ definition, isSelected, onSelect, onPositionChange, activeParams }: PlanetProps) => {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const planetTexture = useTexture(definition.texture);
    planetTexture.colorSpace = SRGBColorSpace;
    const radiusMultiplier = isSelected && activeParams ? clamp(1 + activeParams.radius * 0.08, 0.4, 4.2) : 1;
    const speedMultiplier = isSelected && activeParams ? clamp(1 + activeParams.velocity * 0.03, 0.25, 4.5) : 1;
    const rotationMultiplier = isSelected && activeParams ? clamp(1 + activeParams.mass * 0.005, 0.5, 4.2) : 1;
    const tiltOffset = isSelected && activeParams ? degToRad(activeParams.angle) * 0.02 : 0;
    const emissiveIntensity = isSelected && activeParams ? clamp(0.2 + activeParams.mass * 0.01, 0.05, 0.9) : 0;
    const orbitSpeed = definition.orbit.speed * speedMultiplier;
    const orbitInclination = definition.orbit.inclination + tiltOffset;
    const appliedScale = definition.scale * radiusMultiplier;
    const orbitQuaternion = useMemo(
        () => new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), orbitInclination),
        [orbitInclination],
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
        const { semiMajorAxis: a, eccentricity: e, phase } = definition.orbit;
        const time = state.clock.getElapsedTime();
        const angle = time * orbitSpeed + phase;
        const x = Math.cos(angle) * a - a * e;
        const z = Math.sin(angle) * orbitSemiMinor;
        const position = orbitPosition.current;
        position.set(x, 0, z).applyQuaternion(orbitQuaternion);
        groupRef.current.position.copy(position);
        groupRef.current.getWorldPosition(worldPositionRef.current);
        if (onPositionChange) {
            onPositionChange(definition, worldPositionRef.current);
        }

        if (meshRef.current) {
            meshRef.current.rotation.y += delta * definition.rotationSpeed * rotationMultiplier;
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
            <OrbitPath
                orbit={{
                    ...definition.orbit,
                    inclination: orbitInclination,
                }}
                color={definition.color}
            />
            <group ref={groupRef} scale={appliedScale}>
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
                        emissive={definition.color}
                        emissiveIntensity={isSelected ? emissiveIntensity : 0}
                    />
                    {isSelected ? <Edges scale={1.08} color="#c026d3" /> : null}
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
    controlsRef: React.RefObject<OrbitControlsImpl | null>;
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

        const update = () => {
            controls.update();
        };

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
        const scale = focusState.type === 'planet' ? (focusState.definition as PlanetDefinition).scale : (focusState.definition as AsteroidDefinition).scale;
        offsetRef.current.distance = Math.max(focusState.type === 'asteroid' ? 4 : 16, scale * 6.5);
        offsetRef.current.height = scale * 2;
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
    activeParams: SimulationParams | null;
    onSelect: (definition: PlanetDefinition, position: VectorTuple) => void;
    onPositionChange: (definition: PlanetDefinition, position: Vector3) => void;
};

const Earth = ({ definition, isSelected, activeParams, onSelect, onPositionChange }: EarthProps) => {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const worldPositionRef = useRef(new Vector3());
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);
    const earthMap = useTexture('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    earthMap.colorSpace = SRGBColorSpace;
    const earthNormalMap = useTexture('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
    const radiusMultiplier = isSelected && activeParams ? clamp(1 + activeParams.radius * 0.08, 0.5, 4) : 1;
    const speedMultiplier = isSelected && activeParams ? clamp(1 + activeParams.velocity * 0.03, 0.25, 4.5) : 1;
    const rotationMultiplier = isSelected && activeParams ? clamp(1 + activeParams.mass * 0.005, 0.5, 4) : 1;
    const tiltOffset = isSelected && activeParams ? degToRad(activeParams.angle) * 0.02 : 0;
    const emissiveIntensity = isSelected && activeParams ? clamp(0.2 + activeParams.mass * 0.01, 0.05, 0.9) : 0;
    const orbitSpeed = EARTH_ORBIT_SPEED * speedMultiplier;
    const dynamicTilt = EARTH_ORBIT_TILT + tiltOffset;
    const orbitQuaternion = useMemo(
        () => new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dynamicTilt),
        [dynamicTilt],
    );
    const orbitPosition = useRef(new Vector3());

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.getElapsedTime();
        const angle = time * orbitSpeed;
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
        onPositionChange(definition, worldPositionRef.current);

        if (meshRef.current) {
            meshRef.current.rotation.y += delta * EARTH_ROTATION_SPEED * rotationMultiplier;
            meshRef.current.scale.set(radiusMultiplier, radiusMultiplier, radiusMultiplier);
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
            <OrbitPath
                orbit={{
                    ...definition.orbit,
                    inclination: dynamicTilt,
                }}
                color={definition.color}
            />
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
                        emissive="#1d4ed8"
                        emissiveIntensity={emissiveIntensity}
                    />
                    {isSelected ? <Edges scale={1.04} color="#c026d3" /> : null}
                </mesh>
                <Atmosphere radius={EARTH_RADIUS * 1.08 * radiusMultiplier} />
            </group>
        </group>
    );
};

type MoonProps = Pick<SimulationParams, 'radius' | 'velocity' | 'angle'> & {
    centerRef: MutableRefObject<Vector3>;
};

const Moon = ({ radius, velocity, angle, centerRef }: MoonProps) => {
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
            <sphereGeometry args={[Math.max(0.2, radius * 1.4), 32, 32]} />
            <meshStandardMaterial map={moonTexture} roughness={1} metalness={0.05} />
        </mesh>
    );
};

type SimulationViewportProps = {
    params: SimulationParams;
    controlPanelOpen?: boolean;
    onControlPanelOpenChange?: (open: boolean) => void;
};

const SimulationViewport = ({ params, controlPanelOpen: externalControlPanelOpen, onControlPanelOpenChange }: SimulationViewportProps) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const earthPositionRef = useRef(new Vector3());
    const focusPositionRef = useRef(new Vector3());
    const planetPositionsRef = useRef<Record<string, Vector3>>({});
    const asteroidPositionsRef = useRef<Record<string, Vector3>>({});
    const registeredPlanetsRef = useRef(new Set<string>());
    const totalPlanets = planetDefinitions.length + 1;
    const [focusState, setFocusState] = useState<FocusState | null>(null);
    const [selectedAsteroid, setSelectedAsteroid] = useState<AsteroidDefinition | null>(null);
    const [positionsReady, setPositionsReady] = useState(false);
    const [synthesisOpen, setSynthesisOpen] = useState(true);
    const [internalControlPanelOpen, setInternalControlPanelOpen] = useState(false);
    const planetParamsRef = useRef<Record<string, SimulationParams>>({});
    const latestParamsRef = useRef(params);
    const activeTargetRef = useRef<string | null>(null);

    // Add API state management
    const [astronomyData, setAstronomyData] = useState<PositionsResponse | null>(null);
    const [apiLoading, setApiLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // Fetch real astronomical data
    useEffect(() => {
        const fetchAstronomyData = async () => {
            try {
                setApiLoading(true);
                setApiError(null);
                // Fetch positions for current date/time
                const data = await fetchCelestialPositions(
                    48.8566, // Paris latitude (default)
                    2.3522,  // Paris longitude (default)
                    100,     // elevation in meters
                    1        // UTC+1 timezone
                );
                setAstronomyData(data);
            } catch (error) {
                console.error('Failed to fetch astronomy data:', error);
                setApiError(error instanceof Error ? error.message : 'Failed to fetch astronomical data');
            } finally {
                setApiLoading(false);
            }
        };

        fetchAstronomyData();

        // Refresh data every 5 minutes
        const interval = setInterval(fetchAstronomyData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Map API positions to planet real-time coordinates
    const astronomicalPositions = useMemo(() => {
        if (!astronomyData) return new Map<string, Vector3>();

        const positions = new Map<string, Vector3>();

        astronomyData.positions.forEach((astroPos: AstronomicalPosition) => {
            const planetName = mapPlanetName(astroPos.name);
            if (planetName) {
                const [x, y, z] = astronomicalToCartesian(
                    astroPos.ra,
                    astroPos.dec,
                    AU_TO_SCENE_UNITS * 10 // Scale factor for visibility
                );
                positions.set(planetName, new Vector3(x, y, z));
            }
        });

        return positions;
    }, [astronomyData]);

    const controlPanelOpen = externalControlPanelOpen ?? internalControlPanelOpen;
    const setControlPanelOpen = onControlPanelOpenChange ?? setInternalControlPanelOpen;

    useEffect(() => {
        latestParamsRef.current = params;
        const activeKey = activeTargetRef.current ?? DEFAULT_TARGET_KEY;
        if (!activeTargetRef.current) {
            planetParamsRef.current[activeKey] = { ...params };
        }
    }, [params]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ planetName: string; params: SimulationParams }>).detail;
            planetParamsRef.current[detail.planetName] = { ...detail.params };
        };

        window.addEventListener(SIMULATION_EVENTS.UPDATE_PLANET_PARAMS, handler as EventListener);
        return () => window.removeEventListener(SIMULATION_EVENTS.UPDATE_PLANET_PARAMS, handler as EventListener);
    }, []);

    const emitFocusChange = useCallback(
        (definition: PlanetDefinition | AsteroidDefinition | null) => {
            if (typeof window === 'undefined') return;
            const key = definition?.name ?? DEFAULT_TARGET_KEY;
            const fallback =
                planetParamsRef.current[key] ??
                planetParamsRef.current[DEFAULT_TARGET_KEY] ??
                latestParamsRef.current;
            const snapshot = { ...fallback };
            planetParamsRef.current[key] = snapshot;
            window.dispatchEvent(
                new CustomEvent<SelectedPlanetEventDetail>(
                    SIMULATION_EVENTS.SELECTED_PLANET_CHANGE,
                    { detail: { planetName: definition?.name ?? null, params: snapshot } } as CustomEventInit<SelectedPlanetEventDetail>,
                ),
            );
        },
        [],
    );

    useEffect(() => {
        emitFocusChange(null);
    }, [emitFocusChange]);

    useEffect(() => {
        const nextName = focusState?.definition.name ?? null;
        const prevName = activeTargetRef.current;
        activeTargetRef.current = nextName;
        if (prevName === nextName) {
            return;
        }
        emitFocusChange(focusState?.definition ?? null);
    }, [emitFocusChange, focusState]);

    const handlePlanetSelect = useCallback((definition: PlanetDefinition, position: VectorTuple) => {
        focusPositionRef.current.set(position[0], position[1], position[2]);
        setFocusState({ definition, type: 'planet' });
        setSelectedAsteroid(null);
    }, []);

    const handlePlanetPositionUpdate = useCallback(
        (definition: PlanetDefinition, position: Vector3) => {
            const store = planetPositionsRef.current;

            // Override with real astronomical position if available
            const realPosition = astronomicalPositions.get(definition.name);
            const finalPosition = realPosition || position;

            const existing = store[definition.name];
            if (existing) {
                existing.copy(finalPosition);
            } else {
                store[definition.name] = finalPosition.clone();
            }
            if (!registeredPlanetsRef.current.has(definition.name)) {
                registeredPlanetsRef.current.add(definition.name);
                if (registeredPlanetsRef.current.size >= totalPlanets) {
                    setPositionsReady(true);
                }
            }
            if (definition.name === earthDefinition.name) {
                earthPositionRef.current.copy(finalPosition);
            }
            if (focusState?.definition.name === definition.name) {
                focusPositionRef.current.copy(finalPosition);
            }
        },
        [focusState, totalPlanets, astronomicalPositions],
    );

    const handleAsteroidSelect = useCallback((definition: AsteroidDefinition, position: VectorTuple) => {
        focusPositionRef.current.set(position[0], position[1], position[2]);
        setSelectedAsteroid(definition);
        setFocusState({ definition, type: 'asteroid' });
    }, []);

    const handleAsteroidPositionUpdate = useCallback(
        (definition: AsteroidDefinition, position: Vector3) => {
            const store = asteroidPositionsRef.current;
            const existing = store[definition.name];
            if (existing) {
                existing.copy(position);
            } else {
                store[definition.name] = position.clone();
            }
            if (selectedAsteroid?.name === definition.name && focusState?.type === 'asteroid') {
                focusPositionRef.current.copy(position);
            }
        },
        [focusState, selectedAsteroid],
    );

    const planetOptions = [earthDefinition, ...planetDefinitions];
    const handleMenuPlanetSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        const planetName = event.target.value;
        if (!planetName) {
            handleResetFocus();
            return;
        }
        const definition = planetOptions.find((planet) => planet.name === planetName);
        if (!definition) return;
        const storedPosition = planetPositionsRef.current[planetName];
        if (!storedPosition) return;
        handlePlanetSelect(definition, [storedPosition.x, storedPosition.y, storedPosition.z]);
    };

    const handleResetFocus = useCallback(() => {
        setFocusState(null);
        focusPositionRef.current.set(0, 0, 0);
    }, []);

    useEffect(() => {
        if (!controlsRef.current) return;
        controlsRef.current.enablePan = !focusState;
    }, [focusState]);

    const selectedBody = focusState?.type === 'planet' ? (focusState.definition as PlanetDefinition) : null;
    const defaultParamsSnapshot = planetParamsRef.current[DEFAULT_TARGET_KEY] ?? latestParamsRef.current;
    const moonControlParams = focusState ? defaultParamsSnapshot : params;
    const selectedPlanetParams = selectedBody ? (planetParamsRef.current[selectedBody.name] ?? params) : null;

    return (
        <section className="relative h-screen w-full overflow-hidden bg-black">
            {/* API Loading/Error Indicators */}
            {apiLoading && (
                <div className="absolute top-6 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-[#2E96F5]/40 bg-[#041032]/90 px-4 py-2 text-sm text-white backdrop-blur-xl">
                    Chargement des positions astronomiques...
                </div>
            )}
            {apiError && (
                <div className="absolute top-6 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/90 px-4 py-2 text-sm text-red-200 backdrop-blur-xl">
                    Erreur API: {apiError} - Utilisation des positions simulées
                </div>
            )}

            <div className="relative z-10 h-full">
                <Canvas
                    className="bg-black"
                    shadows
                    camera={{
                        position: [DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.y, DEFAULT_CAMERA_POSITION.z],
                        fov: 45,
                        near: 0.1,
                        far: 5000,
                    }}
                    onPointerMissed={(event) => {
                        if (event.button === 0) {
                            handleResetFocus();
                            setSelectedAsteroid(null);
                        }
                    }}
                >
                    <color attach="background" args={['#000000']} />
                    <ambientLight intensity={0.55} />
                    <pointLight position={[0, 0, 0]} intensity={1.25} color="#f8d27a" distance={1500} />
                    <directionalLight
                        position={[60, 40, 20]}
                        intensity={0.6}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                    <Stars {...STARS_CONFIG} />
                    <Stars radius={200} depth={100} count={3000} factor={5} saturation={0} fade={true} speed={0.8} />
                    <Stars radius={300} depth={150} count={2000} factor={6} saturation={0.2} fade={true} speed={0.5} />
                    <SunGlow />
                    <group>
                        {asteroidDefinitions.map((asteroid) => (
                            <Asteroid
                                key={asteroid.name}
                                definition={asteroid}
                                isSelected={selectedAsteroid?.name === asteroid.name}
                                onSelect={handleAsteroidSelect}
                                onPositionChange={handleAsteroidPositionUpdate}
                            />
                        ))}
                    </group>
                    <group>
                        {planetDefinitions.map((planet) => (
                            <Planet
                                key={planet.name}
                                definition={planet}
                                isSelected={focusState?.type === 'planet' && focusState.definition.name === planet.name}
                                onSelect={handlePlanetSelect}
                                onPositionChange={handlePlanetPositionUpdate}
                                activeParams={focusState?.type === 'planet' && focusState.definition.name === planet.name ? selectedPlanetParams : null}
                            />
                        ))}
                    </group>
                    <Earth
                        definition={earthDefinition}
                        isSelected={focusState?.type === 'planet' && focusState.definition.name === earthDefinition.name}
                        activeParams={focusState?.type === 'planet' && focusState.definition.name === earthDefinition.name ? selectedPlanetParams : null}
                        onSelect={handlePlanetSelect}
                        onPositionChange={handlePlanetPositionUpdate}
                    />
                    <Moon
                        radius={moonControlParams.radius}
                        velocity={moonControlParams.velocity}
                        angle={moonControlParams.angle}
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
                        maxDistance={focusState ? 1400 : 2200}
                    />
                </Canvas>
            </div>

            <div className="absolute bottom-4 left-6 z-30 flex gap-3">
                <button
                    onClick={() => setControlPanelOpen(!controlPanelOpen)}
                    className="rounded-xl border border-white/15 bg-[#c026d3]/90 px-4 py-2 text-sm font-semibold uppercase text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-[#c026d3] hover:scale-105"
                >
                    {controlPanelOpen ? 'Masquer Réglages' : 'Ouvrir Réglages'}
                </button>
                <button
                    onClick={() => setSynthesisOpen(!synthesisOpen)}
                    className="rounded-xl border border-white/15 bg-[#2E96F5]/90 px-4 py-2 text-sm font-semibold uppercase text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-[#c026d3] hover:text-white"
                >
                    {synthesisOpen ? 'Masquer Synthèse' : 'Afficher Synthèse'}
                </button>
            </div>

            <div
                className={`absolute bottom-20 left-6 z-20 w-[min(360px,85%)] overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-[1px] shadow-[0_30px_60px_rgba(4,16,50,0.45)] backdrop-blur-xl transition-all duration-300 ${synthesisOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2E96F5]/35 via-transparent to-[#0C1C4D]/70 opacity-90" />
                <div className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-[#2E96F5]/35 blur-3xl" />
                <div className="relative z-10 w-full rounded-[1.8rem] p-4 text-sm text-[#E6ECFF]">
                    <h2 className="text-base font-semibold text-[#2E96F5]">Synthèse rapide</h2>
                    {astronomyData && (
                        <div className="mt-2 text-xs text-[#A8B9FF]">
                            <p>Données astronomiques en temps réel</p>
                            <p className="text-[0.65rem]">Calculé pour: {astronomyData.time_info.local_time_display}</p>
                        </div>
                    )}
                    <div className="mt-3 flex flex-col gap-1 text-xs text-[#A8B9FF]">
                        <label className="font-semibold uppercase tracking-wide text-[#2E96F5]">
                            Cibler une planète
                        </label>
                        <select
                            value={selectedBody?.name ?? ''}
                            onChange={handleMenuPlanetSelect}
                            disabled={!positionsReady}
                            className="rounded-lg border border-[#2E96F5]/40 bg-[#041032]/80 px-3 py-2 text-white focus:border-[#c026d3] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">Aucune sélection</option>
                            {planetOptions.map((planet) => (
                                <option key={planet.name} value={planet.name}>
                                    {planet.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="mt-2 text-xs text-[#A8B9FF]">
                        Projection du système et suivi temps réel des paramètres. Cliquez sur une planète {focusState?.type === 'asteroid' ? 'ou astéroïde' : ''} pour centrer la vue, appliquer les réglages et obtenir ses indicateurs orbitaux.
                    </p>
                    <p className="mt-3 text-[0.7rem] leading-relaxed text-[#A8B9FF]">
                        Les curseurs du panneau contrôlent la planète suivie ; sans sélection, ils pilotent l'objet de mission par défaut.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                        <div className="col-span-2 rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                            <p className="text-[#A8B9FF]">Planète suivie</p>
                            <p className="text-lg font-semibold text-[#c026d3]">{selectedBody ? selectedBody.name : (selectedAsteroid ? selectedAsteroid.name : 'Aucune')}</p>
                            <p className="mt-2 text-[0.7rem] leading-relaxed text-[#A8B9FF]">
                                {selectedBody
                                    ? selectedBody.summary
                                    : (selectedAsteroid ? `Astéroïde ${selectedAsteroid.name} de la ceinture principale` : 'Cliquez sur une planète pour zoomer, ajuster la caméra et analyser sa trajectoire par rapport à votre scénario.')}
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                            <p className="text-[#A8B9FF]">Vitesse actuelle</p>
                            <p className="text-lg font-semibold text-[#c026d3]">{decimalFormatter.format(params.velocity)} km/s</p>
                        </div>
                        <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                            <p className="text-[#A8B9FF]">Inclinaison</p>
                            <p className="text-lg font-semibold text-[#c026d3]">{decimalFormatter.format(params.angle)}°</p>
                        </div>
                        <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                            <p className="text-[#A8B9FF]">Masse</p>
                            <p className="text-lg font-semibold text-[#c026d3]">{decimalFormatter.format(params.mass)} ×10¹² kg</p>
                        </div>
                        <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                            <p className="text-[#A8B9FF]">Rayon</p>
                            <p className="text-lg font-semibold text-[#c026d3]">{decimalFormatter.format(params.radius)} km</p>
                        </div>
                        {selectedBody ? (
                            <>
                                <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                                    <p className="text-[#A8B9FF]">Distance orbitale moyenne</p>
                                    <p className="text-lg font-semibold text-[#c026d3]">
                                        {distanceFormatter.format(selectedBody.distanceAu)} AU
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                                    <p className="text-[#A8B9FF]">Excentricité</p>
                                    <p className="text-lg font-semibold text-[#c026d3]">
                                        {orbitalDetailFormatter.format(selectedBody.orbit.eccentricity)}
                                    </p>
                                </div>
                                <div className="col-span-2 rounded-xl border border-[#2E96F5]/25 bg-[#07173F]/70 p-2.5">
                                    <p className="text-[#A8B9FF]">Inclinaison orbitale</p>
                                    <p className="text-lg font-semibold text-[#c026d3]">
                                        {orbitalDetailFormatter.format(selectedBody.inclinationDegrees)}°
                                    </p>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {selectedAsteroid && (
                <div className="absolute top-6 right-6 z-30 w-[min(340px,85%)] overflow-hidden rounded-2xl border border-red-500/30 bg-black/80 p-[1px] shadow-[0_30px_60px_rgba(139,0,0,0.45)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/25 via-transparent to-red-900/50 opacity-90" />
                    <div className="relative z-10 w-full rounded-[1.8rem] p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-red-400">Astéroïde</h3>
                                <p className="mt-1 text-xl font-bold text-white">{selectedAsteroid.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAsteroid(null)}
                                className="rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase text-red-400 transition-all hover:bg-red-500/30"
                            >
                                Fermer
                            </button>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Composition</p>
                            <div className="mt-2 space-y-2">
                                {Object.entries(selectedAsteroid.composition).map(([key, value]) => (
                                    value > 0 && (
                                        <div key={key} className="flex items-center justify-between text-sm">
                                            <span className="capitalize text-gray-300">{key}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-700">
                                                    <div
                                                        className="h-full bg-red-500"
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                                <span className="w-12 text-right font-semibold text-red-400">{value}%</span>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-950/30 p-3">
                            <p className="text-xs text-gray-400">
                                Cet astéroïde fait partie de la ceinture principale située entre Mars et Jupiter. Sa composition peut fournir des indices sur la formation du système solaire.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SimulationViewport;
