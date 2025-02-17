import React from 'react';
import Header from '../components/Header/Header';
import HeroSection from '../components/HeroSection/HeroSection';
import WhyTrustUsSection from '../components/WhyTrustUs/WhyTrustUs';
import HowItWorks from '../components/HowitWorks.jsx/HowitWorks';

const Home = () => {
  return (
    <div>

      <Header />
      <HeroSection />
      <WhyTrustUsSection />
      <HowItWorks />

    </div>
  );
};

export default Home;