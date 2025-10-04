import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

const HomeHero = () => {
    return (
        <header className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-purple-500/30 blur-3xl" aria-hidden />
            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-24">
                <div className="flex flex-col gap-10">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Meteor Madness</p>
                        <Button asChild variant="outline" className="border-blue-400/60 bg-slate-900/60 text-blue-100 backdrop-blur">
                            <Link to="/simulation">Accéder à la simulation</Link>
                        </Button>
                    </div>
                    <div className="flex flex-col gap-6 md:max-w-3xl">
                        <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                            Modélisez l&apos;impact d&apos;un astéroïde et préparez des stratégies de défense.
                        </h1>
                        <p className="text-lg text-slate-300 md:text-xl">
                            Astrale rassemble les données de la NASA et de l&apos;USGS pour transformer des paramètres bruts en scénarios immersifs. Explorez les conséquences d&apos;une collision, testez des tactiques de déviation et partagez des fiches d&apos;impact prêtes pour les décideurs.
                        </p>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Button asChild size="lg" className="bg-blue-500 text-slate-50 shadow-lg shadow-blue-600/30">
                                <Link to="/simulation">Lancer la simulation</Link>
                            </Button>
                            <Button asChild size="lg" variant="ghost" className="text-slate-300">
                                <a href="#presentation">Découvrir la plateforme</a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HomeHero;
