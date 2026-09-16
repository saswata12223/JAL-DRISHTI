import React from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import HeroSection from '../components/landing/HeroSection';
import LiveSituationStrip from '../components/landing/LiveSituationStrip';
import PlatformPreviewSection from '../components/landing/PlatformPreviewSection';
import TerrainSection from '../components/landing/TerrainSection';
import SimulationSection from '../components/landing/SimulationSection';
import ImpactSection from '../components/landing/ImpactSection';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col font-sans selection:bg-[#8FD3E8] selection:text-[#0F4C81] scroll-smooth relative">
      <LandingHeader />
      
      <main className="flex-1 flex flex-col w-full">
        <HeroSection />
        <TerrainSection />
        <SimulationSection />
        <LiveSituationStrip />
        <ImpactSection />
        <PlatformPreviewSection />
      </main>

      <LandingFooter />
    </div>
  );
}
