export type SimulationParams = {
    mass: number;
    radius: number;
    velocity: number;
    angle: number;
    gravity: number;
    density: number;
};

export type DerivedIndicators = {
    energy: number;
    energyMegaton: number;
    richter: number;
    craterDiameterKm: number;
    tsunamiHeight: number;
    warningHours: number;
    deflectionDelta: number;
};
