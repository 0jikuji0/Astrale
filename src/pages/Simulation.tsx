import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    computeDerivedIndicators, scenarioPresets, SimulationControlPanel, SimulationViewport
} from '@/features/simulation';

import type { ControlPanelPresetKey } from '@/features/simulation/SimulationControlPanel';
import type { PresetKey, SimulationParams } from '@/features/simulation';

const Simulation = () => {
    const [selectedPreset, setSelectedPreset] = useState<ControlPanelPresetKey>('impactor');
    const [params, setParams] = useState<SimulationParams>({ ...scenarioPresets.impactor.params });

    useEffect(() => {
        if (selectedPreset === 'personnalise') return;
        const presetParams = scenarioPresets[selectedPreset as PresetKey].params;
        setParams({ ...presetParams });
    }, [selectedPreset]);

    const derived = useMemo(() => computeDerivedIndicators(params), [params]);

    const scenarioDescription = useMemo(() => {
        if (selectedPreset === 'personnalise') {
            return "Paramètres ajustés manuellement pour explorer des situations extrêmes ou spécifiques.";
        }
        return scenarioPresets[selectedPreset as PresetKey].description;
    }, [selectedPreset]);

    const handleParamChange = useCallback((key: keyof SimulationParams, value: number) => {
        setParams((previous) => ({ ...previous, [key]: Number.isNaN(value) ? previous[key] : value }));
        setSelectedPreset('personnalise');
    }, []);

    const handlePresetChange = useCallback((preset: ControlPanelPresetKey) => {
        setSelectedPreset(preset);
    }, []);

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0042A6] to-[#07173F] text-white">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10 lg:flex-row">
                <SimulationControlPanel
                    selectedPreset={selectedPreset}
                    scenarioDescription={scenarioDescription}
                    params={params}
                    derived={derived}
                    onPresetChange={handlePresetChange}
                    onParamChange={handleParamChange}
                />
                <SimulationViewport params={params} />
            </div>
        </main>
    );
};

export default Simulation;
