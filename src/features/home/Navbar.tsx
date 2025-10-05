import { useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { GrProjects } from 'react-icons/gr';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { RiTeamFill } from 'react-icons/ri';
import { Link } from 'react-router';

import AstraleLogo from '@/assets/logo.webp';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMenuOpen(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [menuOpen]);

    const NavLinks = [
        { title: "Home", href: "/" },
        { title: "Features", href: "/features" },
        { title: "About", href: "/about" },
        { title: "Contact", href: "/contact" },
    ];
    const FastLinks = [
        {
            node: <FaGithub />,
            title: "GitHub",
            href: "https://github.com/0jikuji0/Astrale",
        },
        {
            node: <GrProjects />,
            title: "Space Apps Challenge",
            href: "https://www.spaceappschallenge.org/2025/challenges/meteor-madness/",
        },
        {
            node: <RiTeamFill />,
            title: "Our Team",
            href: "https://www.spaceappschallenge.org/2025/find-a-team/astrale/?tab=members",
        },
    ];

    return (
        <div
            className={`fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none transition-all duration-300 ${isScrolled ? "px-4 pt-6" : "px-0 pt-0"
                }`}
        >
            <div
                className={`pointer-events-auto w-full border border-white/10 px-6 transition-all duration-300 ${isScrolled
                    ? "max-w-6xl rounded-3xl bg-slate-900/30 supports-[backdrop-filter]:bg-slate-500/30 backdrop-blur-lg py-2 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.85)]"
                    : "max-w-full rounded-none bg-slate-900/70 backdrop-blur-3xl py-3 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.7)]"
                    }`}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="text-white text-lg font-semibold">
                        <Link to="/" className="text-white text-lg font-semibold">
                            <img src={AstraleLogo} alt="Logo" width={50} height={50} />
                        </Link>
                    </div>
                    <div className="hidden md:flex gap-8">
                        {NavLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-white hover:bg-white/20 px-5 py-3 rounded-xl transition-colors duration-300 text-lg"
                            >
                                {link.title}
                            </a>
                        ))}
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        {FastLinks.map(({ node, href }) => (
                            <a
                                key={href}
                                href={href}
                                className="text-white hover:text-blue-500 transition-colors duration-300 inline-flex items-center gap-2  text-xl"
                                aria-label={href}
                                target="_blank"
                                rel="noreferrer noopener"
                            >
                                {node}
                            </a>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-nav"
                        onClick={() => setMenuOpen((prev) => !prev)}
                    >
                        {menuOpen ? (
                            <HiOutlineX className="h-6 w-6" />
                        ) : (
                            <HiOutlineMenu className="h-6 w-6" />
                        )}
                    </button>
                </div>
                <div
                    id="mobile-nav"
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${menuOpen
                        ? "mt-5 max-h-[480px] opacity-100 translate-y-0 pointer-events-auto"
                        : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
                        }`}
                >
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                        {NavLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-white/90 hover:text-white hover:bg-white/15 rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200"
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.title}
                            </a>
                        ))}
                        <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
                            {FastLinks.map(({ node, href, title }) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/90 transition-colors duration-200 hover:bg-white/15 hover:text-white"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span className="text-xl">{node}</span>
                                    <span className="text-base font-medium">{title}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}