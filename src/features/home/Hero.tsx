import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import TextType from "@/components/ui/texttype";

const HomeHero = () => {
  return (
    <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-purple-500/30 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-16 px-6 text-center max-w-4xl w-full">
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
                  className="text-xs text-gray-300"
                />
              </Badge>
              <p className="text-xl font-semibold uppercase tracking-[0.3em] text-blue-300 mb-3">
                Meteor Madness
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Modélisez l&apos;impact d&apos;un astéroïde et préparez des
              stratégies de défense.
            </h1>
            <p className="text-lg text-slate-300 md:text-xl">
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
                className="bg-blue-500 text-slate-50 shadow-blue-600/30 transition-all duration-300 hover:shadow-blue-300 hover:scale-[1.02] hover:bg-linear-65 hover:from-purple-600 hover:to-blue-500"
              >
                <Link to="/simulation">Lancer la simulation</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-slate-300 transition-all duration-300 hover:scale-[1.02]"
              >
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
