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
        <aside className="flex max-h-full w-full max-w-xl flex-col gap-5 overflow-y-auto p-5 shadow-[0_20px_60px_rgba(7,23,63,0.6)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.45em] text-[#2E96F5]">Simulateur</p>
                    <h1 className="mt-2 text-2xl uppercase font-semibold text-white">Paramètres</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="text-[#E6ECFF] hover:text-[#eafe07] uppercase"
                    >
                        <Link className="underline decoration-inherit" to="/">
                            ACCUEIL
                        </Link>
                    </Button>
                    <SheetClose asChild>
                        <Button size="sm" variant="ghost" className="text-[#E6ECFF] hover:text-[#eafe07] uppercase">
                            FERMER
                        </Button>
                    </SheetClose>
                </div>
            </div>

            <div className="rounded-2xl border border-[#2E96F5]/30 bg-[#07173F]/70 p-4">
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
            </div>

            <section aria-label="Menu de réglages" className="flex flex-col gap-5">
                {controlDefinitions.map((control) => (
                    <div key={control.key} className="rounded-2xl border border-[#2E96F5]/30 bg-[#07173F]/70 p-4">
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

            <section className="rounded-2xl border border-[#2E96F5]/30 bg-gradient-to-br from-[#0042A6]/30 via-[#07173F]/80 to-[#2E96F5]/20 p-5">
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

            <div className="flex flex-col gap-3 rounded-2xl border border-[#2E96F5]/30 bg-[#041032]/70 p-4 text-xs text-[#A8B9FF]">
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
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
            <SheetTrigger asChild>
                <Button
                    size="sm"
                    className="fixed left-4 top-4 z-50 font-bold bg-[#eafe07] text-[#000000] shadow-[0_0_35px_rgba(234,254,7,0.45)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#f4ff4a] uppercase"
                    variant="outline"
                >
                    {open ? 'MASQUER LES RÉGLAGES' : 'OUVRIR LES RÉGLAGES'}
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="h-full max-h-screen w-full max-w-xl border-[#2E96F5]/35 bg-[#041032]/90 p-0">
                <div className="h-full overflow-y-auto">
                    <Panel />
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default SimulationControlPanel;
