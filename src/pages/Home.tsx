import HomeHero from '@/features/home/Hero';
import HomeFooter from '@/features/home/HomeFooter';
import PresentationSection from '@/features/home/PresentationSection';

const Home = () => {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0042A6] to-[#07173F] text-white">
            <HomeHero />
            <PresentationSection />
            <HomeFooter />
        </main>
    )
}

export default Home