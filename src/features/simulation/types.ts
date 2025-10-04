export type SimulationParams = {
    mass: number; // en 10^12 kg
    radius: number; // en km
    velocity: number; // en km/s
    angle: number; // en degrés
    gravity: number; // en m/s^2
    density: number; // en g/cm^3
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
