import { HomeFooter, HomeHero, HomePresentationSection } from '@/features/home';

const Home = () => {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0042A6] to-[#07173F] text-white">
            <HomeHero />
            <HomePresentationSection />
            <HomeFooter />
        </main>
    )
}

export default Home