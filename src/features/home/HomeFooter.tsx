import { Link } from "react-router";

const HomeFooter = () => {
  return (
    <footer className="relative overflow-hidden rounded-[1rem] bg-gradient-to-br from-slate-900/60 via-purple-900/30 to-gray-900 py-14">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent"
        aria-hidden
      />

      <nav aria-label="Pied de page" className="mx-auto w-full max-w-7xl px-6">
        <div className="mb-12 flex items-center gap-4">
          <img
            src="/public/logo.webp"
            alt="Astrale Logo"
            width={56}
            height={56}
            className="h-14 w-14 rounded-md"
          />
          <div className="flex flex-col">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[0.08em] text-fuchsia-100">
              METEOR MADNESS
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-300">
              Visualisation et simulation d'impacts, NASA / USGS
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-100 mb-4">
              Produit
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link className="transition hover:text-white" to="/simulation">
                  Simulation 3D
                </Link>
              </li>
              <li>
                <a className="transition hover:text-white" href="#presentation">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a className="transition hover:text-white" href="#roadmap">
                  Feuille de route
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-100 mb-4">
              Données
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a
                  className="transition hover:text-white"
                  href="https://api.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                >
                  NASA NEO API
                </a>
              </li>
              <li>
                <a
                  className="transition hover:text-white"
                  href="https://www.usgs.gov/"
                  target="_blank"
                  rel="noreferrer"
                >
                  USGS Datasets
                </a>
              </li>
              <li>
                <a className="transition hover:text-white" href="#sources">
                  Sources & unités
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-100 mb-4">
              Ressources
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a className="transition hover:text-white" href="#guide">
                  Guide d'utilisation
                </a>
              </li>
              <li>
                <a className="transition hover:text-white" href="#faq">
                  FAQ
                </a>
              </li>
              <li>
                <a
                  className="transition hover:text-white"
                  href="#accessibilite"
                >
                  Accessibilité
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-100 mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a
                  className="transition hover:text-white"
                  href="mailto:contact@astrale.app"
                >
                  contact@astrale.app
                </a>
              </li>
              <li>
                <a className="transition hover:text-white" href="#mentions">
                  Mentions légales
                </a>
              </li>
              <li>
                <a
                  className="transition hover:text-white"
                  href="#confidentialite"
                >
                  Confidentialité
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <div className="h-px w-full bg-white/5" aria-hidden />
          <p className="text-xs text-fuchsia-100/70 pt-3 mt-15">
            © 2025 Astrale, NASA Space Apps Challenge
          </p>
        </div>
      </nav>
    </footer>
  );
};

export default HomeFooter;
