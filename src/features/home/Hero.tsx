import { Link } from 'react-router';

import Badge from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TextType from '@/components/ui/texttype';

const HomeHero = () => {
  return (
    <header className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0042A6] to-[#07173F] text-white">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0042A6]/40 via-transparent to-[#07173F]/60 blur-3xl"
        aria-hidden
      />
      <div className="relative flex w-full max-w-4xl flex-col gap-16 px-6 text-center">
        <div className="flex flex-col ">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-5">
              <Badge color="blue" variant="outline">
                <TextType
                  text="NASA SPACE APPS - 25"
                  typingSpeed={75}
                  deletingSpeed={50}
                  pauseDuration={1500}
                  showCursor={true}
                  cursorCharacter="|"
                  loop={true}
                  className="text-xs text-[#E6ECFF]"
                />
              </Badge>
              <p className="mb-3 text-xl font-semibold uppercase tracking-[0.3em] text-[#2E96F5]">
                Meteor Madness
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Modélisez l&apos;impact d&apos;un astéroïde et préparez des
              stratégies de défense.
            </h1>
            <p className="text-lg text-[#E6ECFF] md:text-xl">
              Astrale rassemble les données de la NASA et de l&apos;USGS pour
              transformer des paramètres bruts en scénarios immersifs. Explorez
              les conséquences d&apos;une collision, testez des tactiques de
              déviation et partagez des fiches d&apos;impact prêtes pour les
              décideurs.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Button
                asChild
                size="lg"
                className="font-bold bg-[#eafe07] text-[#000000] shadow-[0_0_35px_rgba(234,254,7,0.45)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#f4ff4a] uppercase"
              >
                <Link to="/simulation">
                  LANCER LA SIMULATION
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="font-bold text-[#eafe07] hover:bg-transparent transition-all duration-300 hover:scale-[1.02] hover:text-[#8E1100] uppercase"
              >
                <a className="underline decoration-inherit" href="#presentation">
                  DÉCOUVRIR LA PLATEFORME
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeHero;
