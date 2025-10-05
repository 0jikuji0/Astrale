import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import TextType from "@/components/ui/texttype";
import Logos from "@/components/ui/Logos/logos";
import Navbar from "@/components/ui/navbar";

const HomeHero = () => {
  return (
    <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[#07173F] blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-16 px-6 text-center max-w-4xl w-full mt-30">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="">
              <Navbar />
            </div>
            <div className="flex flex-col items-center gap-5">
              <Badge color="blue" variant="outline" className="gap-2">
                <img
                  src="/public/logo.webp"
                  alt="Logo"
                  width={25}
                  height={25}
                />
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
              <p className="text-xl font-semibold uppercase tracking-[0.3em] text-[#2E96F5] mb-3">
                Meteor Madness
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Modélisez{" "}
              <span className="text-[#EAFE07] italic">l&apos;impact</span>{" "}
              d&apos;un astéroïde et préparez des{" "}
              <span className="text-[#EAFE07] italic"> stratégies</span> de
              défense.
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
                className="bg-[#EAFE07] text-black transition-all duration-300 hover:bg-[#EAFE07] hover:scale-[1.02] hover:shadow-[0_4px_20px_white] rounded-md"
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
          </div>{" "}
        </div>{" "}
        <div className="mt-5">
          <Logos />
        </div>
      </div>
    </header>
  );
};

export default HomeHero;
