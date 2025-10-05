const presentationHighlights = [
    {
        title: "Visualisations dynamiques",
        description: "Orbites animées, zones d'impact et cartes de vulnérabilité haute résolution.",
    },
    {
        title: "Scénarios guidés",
        description: "Comparez des options de déviation : impact cinétique, remorqueur gravitationnel ou explosions nucléaires.",
    },
    {
        title: "Rapports instantanés",
        description: "Générez des fiches PDF prêtes pour la presse ou les cellules de crise.",
    },
    {
        title: "Mode pédagogique",
        description: "Guides interactifs et infographies pour vulgariser la physique des impacts.",
    },
] as const;

const strengths = [
    "⚙️ Paramétrage complet des caractéristiques de l'astéroïde",
    "🛰️ Synchronisation prête avec les flux NeoWs de la NASA",
    "🌊 Cartographie des risques USGS pour les côtes et reliefs",
    "📝 Export de scénarios pour les cellules gouvernementales",
] as const;

const PresentationSection = () => {
    return (
        <section id="presentation" className="relative border-t border-white/5 bg-slate-900/60 py-24">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" aria-hidden />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6">
                <div className="grid gap-10 md:grid-cols-2">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-semibold text-blue-100">Un cockpit scientifique pour tous</h2>
                        <p className="text-slate-300">
                            Ajustez l'orbite d'Meteor Madness, combinez des données de terrain et visualisez instantanément les effets sur les zones côtières, les populations et les infrastructures essentielles.
                        </p>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li className="flex items-start gap-3">
                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" aria-hidden />
                                Interfaces accessibles pour scientifiques, responsables publics et citoyens.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" aria-hidden />
                                Calculs énergétiques simplifiés et fiches de synthèse partageables.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" aria-hidden />
                                Connexion prête pour les API NASA NeoWs et jeux de données USGS.
                            </li>
                        </ul>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {presentationHighlights.map((highlight) => (
                            <article key={highlight.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-blue-900/20">
                                <h3 className="text-lg font-semibold text-blue-200">{highlight.title}</h3>
                                <p className="mt-2 text-sm text-slate-300">{highlight.description}</p>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8">
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-blue-100">Pourquoi maintenant&nbsp;?</h2>
                            <p className="text-slate-300">
                                L'objet Meteor Madness a une probabilité d'impact faible mais non nulle. Astrale accompagne les décideurs pour anticiper les effets les plus critiques : tsunamis, ondes de choc atmosphériques et séismes induits.
                            </p>
                            <p className="text-slate-300">
                                En quelques clics, identifiez quand et comment intervenir, documentez les zones à évacuer et comparez les résultats de différentes stratégies de déviation grâce à une interface unique.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-lg shadow-blue-900/30">
                            <h3 className="text-lg font-semibold text-blue-200">Points forts</h3>
                            <ul className="mt-4 space-y-3 text-sm text-slate-300">
                                {strengths.map((strength) => (
                                    <li key={strength}>{strength}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PresentationSection;