import { Link } from 'react-router';

import AstraleLogo from '@/assets/logo.webp';
import Badge from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TextType from '@/components/ui/texttype';

import Logos from './Logo';
import Navbar from './Navbar';

const HomeHero = () => {
    return (
        <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-gray-800 via-purple-900/70 opacity-95 animate-aurora"
                aria-hidden
            />
            <div className="relative flex flex-col gap-16 px-6 text-center max-w-4xl w-full mt-40">
                <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row items-center justify-center ">
                        <div>
                            <Navbar />
                        </div>
                        <div className="flex flex-col items-center gap-5">
                            <Badge variant="outline" className="gap-2">
                                <img
                                    src={AstraleLogo}
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
                                    className="text-xs text-slate-200"
                                />
                            </Badge>
                            <p className="text-xl font-semibold uppercase tracking-[0.3em] text-fuchsia-500 mb-3">
                                Meteor Madness
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl text-white">
                            Modélisez{" "}
                            <span className="text-fuchsia-600 italic">l&apos;impact</span>{" "}
                            d&apos;un astéroïde et préparez des{" "}
                            <span className="text-fuchsia-600 italic">stratégies</span> de
                            défense.
                        </h1>
                        <p className="text-lg text-slate-200 md:text-xl">
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
                                className=" px-8 py-6
                bg-gradient-to-r from-fuchsia-500 to-fuchsia-700 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(240,171,252,0.3)] rounded-md"
                            >
                                <Link to="/simulation">Lancer la simulation</Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="ghost"
                                className=" px-8 py-6 text-slate-200 transition-all duration-300 hover:scale-[1.02] bg-transparent underline hover:text-white"
                            >
                                <a href="#presentation">Découvrir la plateforme</a>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-5">
                    <Logos />
                </div>
            </div>
        </header>
    );
};

export default HomeHero;