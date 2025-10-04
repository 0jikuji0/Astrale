import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncOpen = () => setOpen(mediaQuery.matches);
        syncOpen();
        const listener = () => syncOpen();
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', listener);
        } else {
            mediaQuery.addListener(listener);
        }
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', listener);
            } else {
                mediaQuery.removeListener(listener);
            }
        };
    }, []);

    const Panel = () => (
        <aside className="flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.45em] text-blue-300">Laboratoire</p>
                    <h1 className="mt-2 text-2xl font-semibold text-blue-100">Simulation 3D d'impact</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="ghost" className="text-slate-300">
                        <Link to="/">Accueil</Link>
                    </Button>
                    <SheetClose asChild>
                        <Button size="sm" variant="ghost" className="text-slate-300">
                            Fermer
                        </Button>
                    </SheetClose>
                </div>
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

    return (
        <div className="flex w-full flex-col gap-4 lg:max-w-xl">
            <Sheet open={open} onOpenChange={setOpen} modal={false}>
                <SheetTrigger asChild>
                    <Button className="w-full justify-between gap-2" variant="outline">
                        {open ? 'Masquer les réglages' : 'Ouvrir les réglages'}
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xl border-white/10 bg-slate-900/80 p-0">
                    <div className="h-full overflow-y-auto">
                        <Panel />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default SimulationControlPanel;
