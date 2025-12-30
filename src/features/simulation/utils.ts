import type { DerivedIndicators, SimulationParams } from './types';

export const degToRad = (value: number): number => (value * Math.PI) / 180;

export const computeDerivedIndicators = (params: SimulationParams): DerivedIndicators => {
    const massKg = params.mass * 1e12;
    const velocityMs = params.velocity * 1000;
    const energy = 0.5 * massKg * velocityMs ** 2;
    const energyMegaton = energy / 4.184e15;

    return {
        energy,
        energyMegaton,
        richter: Math.max(0, (Math.log10(energy) - 4.8) / 1.5),
        craterDiameterKm: Math.max(0.8, energyMegaton ** 0.29 * (1.1 + params.density * 0.08)),
        tsunamiHeight: Math.min(80, energyMegaton ** 0.36 * (params.angle < 35 ? 1.5 : 1)),
        warningHours: Math.max(2, 18 - params.velocity * 0.2 + (40 - params.angle) * 0.1),
        deflectionDelta: Math.max(35, (params.mass * params.velocity) / 6),
    };
};
