export default function Simulation() {
    return (
        <section
            id="presentation"
            className="relative border-t border-white/5 bg-gray-900 py-24"
        >
            <div
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/60 to-transparent"
                aria-hidden
            />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                    <div className="space-y-7 text-left">
                        <p className="inline-flex items-center rounded-full bg-fuchsia-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
                            Scénario d'impact Impactor-2025
                        </p>
                        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                            Modélisez, comprenez et anticipez les risques d'un astéroïde réel
                        </h2>
                        <p className="text-lg text-white/70">
                            Notre plateforme fusionne les données de la NASA et les
                            référentiels géologiques de l'USGS pour simuler l'arrivée
                            d'Impactor-2025, estimer l'énergie d'impact et traduire les
                            conséquences en cartes compréhensibles pour décideurs et citoyens.
                        </p>
                        <ul className="space-y-3 text-white/80">
                            <li className="flex items-start gap-3">
                                <span
                                    className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400"
                                    aria-hidden
                                />
                                Intégrez orbites, vitesses et altimétrie côtière pour modéliser
                                trajectoires, zones d'impact et risques secondaires.
                            </li>
                            <li className="flex items-start gap-3">
                                <span
                                    className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400"
                                    aria-hidden
                                />
                                Comparez les stratégies de déviation (impact cinétique, tracteur
                                gravitationnel) et mesurez leur effet sur la trajectoire.
                            </li>
                            <li className="flex items-start gap-3">
                                <span
                                    className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400"
                                    aria-hidden
                                />
                                Partagez des récits interactifs avec indicateurs pédagogiques
                                pour sensibiliser le public et guider la préparation des
                                cellules de crise.
                            </li>
                        </ul>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl shadow-[0_26px_52px_-24px_rgba(232,121,249,0.55)]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-2xl">
                                🌀
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-fuchsia-200">
                                Orbite et manœuvres en direct
                            </h3>
                            <p className="mt-2 text-sm text-white/70">
                                Visualisez la trajectoire d'Impactor-2025, ajustez les
                                paramètres orbitaux et observez l'effet de micro-variations de
                                vitesse.
                            </p>
                        </article>

                        <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl shadow-[0_26px_52px_-24px_rgba(232,121,249,0.55)]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-2xl">
                                🌐
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-fuchsia-200">
                                Carte d'impact multi-risques
                            </h3>
                            <p className="mt-2 text-sm text-white/70">
                                Superposez topographie, densité de population et zones côtières
                                pour anticiper tsunamis, séismes et effets atmosphériques.
                            </p>
                        </article>

                        <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl shadow-[0_26px_52px_-24px_rgba(232,121,249,0.55)]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-2xl">
                                🧪
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-fuchsia-200">
                                Bac à sable de mitigation
                            </h3>
                            <p className="mt-2 text-sm text-white/70">
                                Testez des scénarios de déviation, quantifiez l'énergie d'impact
                                restante et explorez les délais d'intervention optimaux.
                            </p>
                        </article>

                        <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl shadow-[0_26px_52px_-24px_rgba(232,121,249,0.55)]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-2xl">
                                🧭
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-fuchsia-200">
                                Guides et récits pédagogiques
                            </h3>
                            <p className="mt-2 text-sm text-white/70">
                                Déployez des storyboards interactifs, des infographies et des
                                briefs prêts à partager pour informer décideurs et grand public.
                            </p>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    );
}