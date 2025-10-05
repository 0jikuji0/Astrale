import { Link } from 'react-router';

const HomeFooter = () => {
    return (
        <footer className="border-t border-white/10 bg-slate-950/80 py-12">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 text-center text-sm text-slate-400">
                <p>Astrale — Prototype d'analyse des risques d'impact pour Meteor Madness.</p>
                <p className="text-slate-500">Créé pour mettre en lumière les données ouvertes de la NASA et de l'USGS.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link className="text-blue-300 transition hover:text-blue-100" to="/simulation">Essayer la simulation 3D</Link>
                    <a className="text-blue-300 transition hover:text-blue-100" href="#presentation">Fonctionnalités</a>
                    <a className="text-blue-300 transition hover:text-blue-100" href="mailto:contact@astrale.app">Contact</a>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;