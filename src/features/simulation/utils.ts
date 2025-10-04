import type { DerivedIndicators, SimulationParams } from './types';

export const degToRad = (value: number) => (value * Math.PI) / 180;

export const computeDerivedIndicators = (params: SimulationParams): DerivedIndicators => {
    const massKg = params.mass * 1e12;
    const velocityMs = params.velocity * 1_000;
    const energy = 0.5 * massKg * velocityMs * velocityMs;
    const energyMegaton = energy / 4.184e15;
    const richter = Math.max(0, (Math.log10(energy) - 4.8) / 1.5);
    const craterDiameterKm = Math.max(0.8, Math.pow(energyMegaton, 0.29) * (1.1 + params.density * 0.08));
    const tsunamiHeight = Math.min(80, Math.pow(energyMegaton, 0.36) * (params.angle < 35 ? 1.5 : 1));
    const warningHours = Math.max(2, 18 - params.velocity * 0.2 + (40 - params.angle) * 0.1);
    const deflectionDelta = Math.max(35, (params.mass * params.velocity) / 6);

    return {
        energy,
        energyMegaton,
        richter,
        craterDiameterKm,
        tsunamiHeight,
        warningHours,
        deflectionDelta,
    };
};
