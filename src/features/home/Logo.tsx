import { FaPython } from 'react-icons/fa';
import { IoLogoJavascript } from 'react-icons/io';
import { SiReact, SiTailwindcss, SiTypescript, SiVite } from 'react-icons/si';
import { TbBrandThreejs } from 'react-icons/tb';

import LogoLoop from './Loop';

const techLogos = [
    { node: <SiReact />, title: "React", href: "https://react.dev" },
    { node: <SiVite />, title: "Vite", href: "https://vitejs.dev" },
    {
        node: <SiTypescript />,
        title: "TypeScript",
        href: "https://www.typescriptlang.org",
    },
    {
        node: <SiTailwindcss />,
        title: "Tailwind CSS",
        href: "https://tailwindcss.com",
    },
    { node: <FaPython />, title: "Python", href: "https://www.python.org" },
    {
        node: <IoLogoJavascript />,
        title: "JavaScript",
        href: "https://www.javascript.com",
    },
    { node: <TbBrandThreejs />, title: "Three.js", href: "https://threejs.org" },
];

export default function Logos() {
    return (
        <div style={{ height: "200px", position: "relative", overflow: "hidden" }}>
            <LogoLoop
                logos={techLogos}
                speed={50}
                direction="left"
                logoHeight={48}
                gap={40}
                pauseOnHover
                scaleOnHover
                fadeOut
                fadeOutColor="transparent"
                ariaLabel="Technology partners"
            />
        </div>
    );
}