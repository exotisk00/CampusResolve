import Navbar from '../components/Navbar.jsx';
import HeroSection from '../components/HeroSection.jsx';
import FeaturesSection from '../components/FeaturesSection.jsx';
import HowItWorksSection from '../components/HowItWorksSection.jsx';
import Footer from '../components/Footer.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-content-primary">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
