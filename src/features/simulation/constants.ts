import type { SimulationParams } from './types';

export const scenarioPresets = {
    impactor: {
        label: 'Trajectoire actuelle',
        description: "Données inspirées des estimations initiales d'Impactor-2025 lors de sa découverte en janvier 2025.",
        params: { mass: 28, radius: 0.9, velocity: 22, angle: 37, gravity: 9.81, density: 3.1 } satisfies SimulationParams,
    },
    oceanique: {
        label: 'Impact océanique',
        description: 'Scénario privilégiant une entrée oblique au-dessus du Pacifique nord avec un impact majoritairement en mer.',
        params: { mass: 18, radius: 0.7, velocity: 19, angle: 28, gravity: 9.5, density: 2.8 } satisfies SimulationParams,
    },
    continental: {
        label: 'Impact continental',
        description: "Simulation d'un impact proche des côtes avec une pénétration plus verticale et une masse légèrement supérieure.",
        params: { mass: 35, radius: 1.1, velocity: 24, angle: 49, gravity: 10.3, density: 3.5 } satisfies SimulationParams,
    },
} as const;

export type PresetKey = keyof typeof scenarioPresets;

export type ControlDefinition = {
    key: keyof SimulationParams;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    description: string;
};

export const controlDefinitions: ReadonlyArray<ControlDefinition> = [
    {
        key: "mass", label: "Masse", unit: "10¹² kg", min: 2, max: 80, step: 1,
        description: "Représente la masse totale estimée de l'objet céleste."
    },
    {
        key: "radius", label: "Rayon", unit: "km", min: 0.1, max: 2.5, step: 0.05,
        description: "Rayon moyen de l'astéroïde calculé à partir de sa forme approximative."
    },
    {
        key: "velocity", label: "Vitesse", unit: "km/s", min: 10, max: 45, step: 0.5,
        description: "Vitesse relative au moment de l'entrée atmosphérique."
    },
    {
        key: "angle", label: "Angle d'entrée", unit: "°", min: 5, max: 80, step: 1,
        description: "Angle formé entre la trajectoire de l'astéroïde et l'horizon."
    },
    {
        key: "gravity", label: "Gravité locale", unit: "m/s²", min: 7.5, max: 11.5, step: 0.1,
        description: "Gravité effective au point d'impact (altitude, latitude)."
    },
    {
        key: "density", label: "Densité", unit: "g/cm³", min: 1.5, max: 5.5, step: 0.1,
        description: "Densité moyenne de l'objet, influençant la pénétration et la dispersion."
    },
] as const;
