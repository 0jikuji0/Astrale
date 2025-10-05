export const SIMULATION_EVENTS = {
    SELECTED_PLANET_CHANGE: 'simulation:selected-planet-change',
    UPDATE_PLANET_PARAMS: 'simulation:update-planet-params',
} as const;

export type SimulationEventType = typeof SIMULATION_EVENTS[keyof typeof SIMULATION_EVENTS];
