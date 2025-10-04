import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

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
};

const SimulationControlPanel = ({
    selectedPreset,
    scenarioDescription,
    params,
    derived,
    onPresetChange,
    onParamChange,
}: SimulationControlPanelProps) => {
    return (
        <aside className="flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.45em] text-blue-300">Laboratoire</p>
                    <h1 className="mt-2 text-2xl font-semibold text-blue-100">Simulation 3D d'impact</h1>
                </div>
                <Button asChild size="sm" variant="ghost" className="text-slate-300">
                    <Link to="/">Accueil</Link>
                </Button>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                <label className="flex flex-col gap-2 text-sm text-slate-300">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-200">Scénario rapide</span>
                    <select
                        value={selectedPreset}
                        onChange={(event) => onPresetChange(event.target.value as ControlPanelPresetKey)}
                        className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-slate-100 focus:border-blue-400 focus:outline-none"
                    >
                        {Object.entries(scenarioPresets).map(([key, preset]) => (
                            <option key={key} value={key}>
                                {preset.label}
                            </option>
                        ))}
                        <option value="personnalise">Personnalisé</option>
                    </select>
                </label>
                <p className="mt-3 text-xs text-slate-400">{scenarioDescription}</p>
            </div>

            <section aria-label="Menu de réglages" className="flex flex-col gap-5">
                {controlDefinitions.map((control) => (
                    <div key={control.key} className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-blue-100">{control.label}</p>
                                <p className="text-xs text-slate-400">{control.description}</p>
                            </div>
                            <span className="text-sm font-semibold text-blue-300">
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
                            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-blue-500"
                        />
                    </div>
                ))}
            </section>

            <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-blue-900/40 via-slate-900/80 to-purple-900/40 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-200">Indicateurs clés</h2>
                <dl className="mt-4 grid gap-4 text-sm text-slate-200">
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-300">Énergie cinétique</dt>
                        <dd className="text-right font-semibold text-blue-200">{scientificFormatter.format(derived.energy)} J</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-300">Équivalent TNT</dt>
                        <dd className="text-right font-semibold text-blue-200">{decimalFormatter.format(derived.energyMegaton)} Mt</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-300">Magnitude sismique estimée</dt>
                        <dd className="text-right font-semibold text-blue-200">M {decimalFormatter.format(derived.richter)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-300">Diamètre de cratère</dt>
                        <dd className="text-right font-semibold text-blue-200">{decimalFormatter.format(derived.craterDiameterKm)} km</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-300">Hauteur potentielle de tsunami</dt>
                        <dd className="text-right font-semibold text-blue-200">{decimalFormatter.format(derived.tsunamiHeight)} m</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <dt className="text-slate-300">Fenêtre d'alerte restante</dt>
                        <dd className="text-right font-semibold text-blue-200">{decimalFormatter.format(derived.warningHours)} h</dd>
                    </div>
                </dl>
            </section>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-slate-950/80 p-4 text-xs text-slate-400">
                <p>
                    <span className="font-semibold text-blue-200">Conseil stratégie&nbsp;:</span> un changement de vitesse de{' '}
                    <span className="font-semibold text-blue-100">{compactFormatter.format(derived.deflectionDelta)} m/s</span> pourrait suffire à éviter un impact direct.
                </p>
                <p>
                    Les menus ci-dessus pilotent la simulation en temps réel. Combinez-les avec des cartes USGS pour cibler les zones à évacuer.
                </p>
            </div>
        </aside>
    );
};

export default SimulationControlPanel;
