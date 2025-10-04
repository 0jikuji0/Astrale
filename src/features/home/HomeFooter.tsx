import { Link } from 'react-router';

const HomeFooter = () => {
    return (
        <footer className="border-t border-[#2E96F5]/20 bg-[#041032]/90 py-12">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 text-center text-sm text-[#A8B9FF]">
                <p>Astrale — Prototype d'analyse des risques d'impact pour Meteor Madness.</p>
                <p className="text-[#8FA6E0]">Créé pour mettre en lumière les données ouvertes de la NASA et de l'USGS.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link className="text-[#2E96F5] underline decoration-inherit uppercase transition hover:text-[#eafe07]" to="/simulation">
                        ESSAYER LA SIMULATION 3D
                    </Link>
                    <a className="text-[#2E96F5] underline decoration-inherit uppercase transition hover:text-[#eafe07]" href="#presentation">
                        FONCTIONNALITÉS
                    </a>
                    <a className="text-[#2E96F5] underline decoration-inherit uppercase transition hover:text-[#eafe07]" href="mailto:contact@astrale.app">
                        CONTACT
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;
