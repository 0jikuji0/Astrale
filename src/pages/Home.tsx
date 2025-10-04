import { HomeFooter, HomeHero, HomePresentationSection } from '@/features/home';

const Home = () => {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            <HomeHero />
            <HomePresentationSection />
            <HomeFooter />
        </main>
    )
}

export default Home