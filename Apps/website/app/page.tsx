import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Hassle from './components/Hassle';
import Features from './components/Features';
import Steps from './components/Steps';
import UserFlows from './components/UserFlows';
import GlobalReach from './components/GlobalReach';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function LandingPage() {
  return (
    <main className="antialiased overflow-x-hidden bg-background">
      {/* TopNavBar */}
      <Navbar />
      
      <div className="pt-20 pb-0">
        {/* Hero Section */}
        <Hero />

        {/* Hassle / Pain Points Section */}
        <Hassle />

        {/* Features Bento Grid */}
        <Features />


        {/* 3 Steps Setup Section */}
        <Steps />

        {/* Interactive User Flows / Tabs Section */}
        <UserFlows />

        {/* Global Connectivity Map Section */}
        <GlobalReach />

        {/* Testimonials Marquee Grid */}
        <Testimonials />

        {/* Pricing Toggles Section */}
        <Pricing />

        {/* Accordion FAQ Section */}
        <FAQ />

        {/* CTA Bottom Banner */}
        <CTA />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
