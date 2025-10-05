import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';

import { controlDefinitions, scenarioPresets } from './constants';
import { compactFormatter, decimalFormatter, scientificFormatter } from './formatters';

import type { PresetKey } from './constants';
import type { DerivedIndicators, SimulationParams } from './types';

export type ControlPanelPresetKey = PresetKey | 'personnalise';

type SimulationControlPanelProps = {
    selectedPreset: ControlPanelPresetKey;
    scenarioDescription: string;
    params: SimulationParams;
    derived: DerivedIndicators;
    onPresetChange: (preset: ControlPanelPresetKey) => void;
    onParamChange: (key: keyof SimulationParams, value: number) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const SELECTED_PLANET_EVENT = 'simulation:selected-planet-change';

type SelectedPlanetEventDetail = {
    planetName: string | null;
    params: SimulationParams;
};

const SimulationControlPanel = ({
    selectedPreset,
    scenarioDescription,
    params,
    derived,
    onPresetChange,
    onParamChange,
    open,
    onOpenChange,
}: SimulationControlPanelProps) => {
    const [activePlanet, setActivePlanet] = useState<string | null>(null);
    const [planetParams, setPlanetParams] = useState<SimulationParams>(params);
    const paramsRef = useRef(params);

    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<SelectedPlanetEventDetail>).detail;
            setActivePlanet(detail.planetName);
            setPlanetParams(detail.params);
        };
        window.addEventListener(SELECTED_PLANET_EVENT, handler as EventListener);
        return () => window.removeEventListener(SELECTED_PLANET_EVENT, handler as EventListener);
    }, []);

    const handlePlanetParamChange = (key: keyof SimulationParams, value: number) => {
        if (!activePlanet) return;

        const updated = { ...planetParams, [key]: value };
        setPlanetParams(updated);

        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('simulation:update-planet-params', {
                    detail: { planetName: activePlanet, params: updated },
                })
            );
        }
    };

    const Panel = () => (
        <aside className="flex h-full w-full max-w-xl flex-col gap-5 overflow-y-auto border border-white/15 bg-white/10 p-5 shadow-[0_20px_60px_rgba(7,23,63,0.6)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.45em] text-[#2E96F5]">Simulateur</p>
                    <h1 className="mt-2 text-2xl uppercase font-semibold text-white">Paramètres</h1>
                </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                <label className="flex flex-col gap-2 text-sm text-[#E6ECFF]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#2E96F5]">Scénario rapide</span>
                    <select
                        value={selectedPreset}
                        onChange={(event) => onPresetChange(event.target.value as ControlPanelPresetKey)}
                        className="rounded-lg border border-[#2E96F5]/40 bg-[#041032]/80 px-3 py-2 text-white focus:border-[#eafe07] focus:outline-none"
                    >
                        {Object.entries(scenarioPresets).map(([key, preset]) => (
                            <option key={key} value={key}>
                                {preset.label}
                            </option>
                        ))}
                        <option value="personnalise">Personnalisé</option>
                    </select>
                </label>
                <p className="mt-3 text-xs text-[#A8B9FF]">{scenarioDescription}</p>
                <div className="mt-3 rounded-xl border border-[#2E96F5]/35 bg-[#041032]/70 p-3 text-xs text-[#A8B9FF]">
                    <p>
                        Les réglages s'appliquent à la planète actuellement sélectionnée dans la scène 3D. Sans sélection,
                        ils contrôlent l'objet de simulation par défaut.
                    </p>
                    <p className="mt-2 text-[#eafe07]">
                        Contrôle actif&nbsp;: {activePlanet ?? 'Objet de mission'}
                    </p>
                </div>
            </div>

            {activePlanet && (
                <section className="rounded-2xl border border-[#eafe07]/35 bg-[#eafe07]/5 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#eafe07]">
                            Édition: {activePlanet}
                        </h2>
                        <span className="text-xs text-[#A8B9FF]">Planète sélectionnée</span>
                    </div>
                    <p className="mt-2 text-xs text-[#A8B9FF]">
                        Les curseurs ci-dessous modifient uniquement la planète sélectionnée. Ces changements sont indépendants de l'objet de mission par défaut.
                    </p>
                    <div className="mt-4 flex flex-col gap-4">
                        {controlDefinitions.map((control) => (
                            <div key={control.key} className="rounded-xl border border-[#eafe07]/25 bg-[#041032]/50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">{control.label}</p>
                                        <p className="text-xs text-[#A8B9FF]">{control.description}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-[#eafe07]">
                                        {decimalFormatter.format(planetParams[control.key])} {control.unit}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={control.min}
                                    max={control.max}
                                    step={control.step}
                                    value={planetParams[control.key]}
                                    onChange={(event) => handlePlanetParamChange(control.key, parseFloat(event.target.value))}
                                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#0B1F4F] accent-[#eafe07]"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section aria-label="Menu de réglages" className="flex flex-col gap-5">
                <div className="rounded-xl border border-[#2E96F5]/35 bg-[#041032]/50 p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#2E96F5]">
                        {activePlanet ? 'Objet de mission (par défaut)' : 'Paramètres de simulation'}
                    </h3>
                    {activePlanet && (
                        <p className="mt-1 text-xs text-[#A8B9FF]">
                            Ces réglages s'appliquent à l'objet de mission lorsqu'aucune planète n'est sélectionnée.
                        </p>
                    )}
                </div>
                {controlDefinitions.map((control) => (
                    <div key={control.key} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-white">{control.label}</p>
                                <p className="text-xs text-[#A8B9FF]">{control.description}</p>
                            </div>
                            <span className="text-sm font-semibold text-[#eafe07]">
                                {decimalFormatter.format(params[control.key])} {control.unit}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={params[control.key]}
                            onChange={(event) => onParamChange(control.key, parseFloat(event.target.value))}
                            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#0B1F4F] accent-[#2E96F5]"
                        />
                    </div>
                ))}
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-[0_12px_45px_rgba(7,23,63,0.35)]">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2E96F5]">Indicateurs clés</h2>
                <dl className="mt-4 grid gap-4 text-sm text-[#E6ECFF]">
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-[#A8B9FF]">Énergie cinétique</dt>
                        <dd className="text-right font-semibold text-[#eafe07]">{scientificFormatter.format(derived.energy)} J</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-[#A8B9FF]">Équivalent TNT</dt>
                        <dd className="text-right font-semibold text-[#eafe07]">{decimalFormatter.format(derived.energyMegaton)} Mt</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-[#A8B9FF]">Magnitude sismique estimée</dt>
                        <dd className="text-right font-semibold text-[#eafe07]">M {decimalFormatter.format(derived.richter)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-[#A8B9FF]">Diamètre de cratère</dt>
                        <dd className="text-right font-semibold text-[#eafe07]">{decimalFormatter.format(derived.craterDiameterKm)} km</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-[#A8B9FF]">Hauteur potentielle de tsunami</dt>
                        <dd className="text-right font-semibold text-[#eafe07]">{decimalFormatter.format(derived.tsunamiHeight)} m</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-[#A8B9FF]">Fenêtre d'alerte restante</dt>
                        <dd className="text-right font-semibold text-[#eafe07]">{decimalFormatter.format(derived.warningHours)} h</dd>
                    </div>
                </dl>
            </section>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-xs text-[#A8B9FF] backdrop-blur-xl">
                <p>
                    <span className="font-semibold text-[#eafe07]">Conseil stratégie&nbsp;:</span> un changement de vitesse de{' '}
                    <span className="font-semibold text-white">{compactFormatter.format(derived.deflectionDelta)} m/s</span> pourrait suffire à éviter un impact direct.
                </p>
                <p>
                    Les menus ci-dessus pilotent la simulation en temps réel. Combinez-les avec des cartes USGS pour cibler les zones à évacuer.
                </p>
            </div>
        </aside>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
            <SheetContent side="left" className="h-screen w-full max-w-xl border-white/10 bg-white/5 p-0 backdrop-blur-2xl sm:max-w-xl">
                <Panel />
            </SheetContent>
        </Sheet>
    );
};

export default SimulationControlPanel;
