import React from 'react';
import Header from '../components/Header/Header';
import HeroSection from '../components/HeroSection/HeroSection';
import WhyTrustUsSection from '../components/WhyTrustUs/WhyTrustUs';
import HowItWorks from '../components/HowitWorks.jsx/HowitWorks';
import SchoolRequests from '../components/SchoolRequests (Home)/SchoolRequests';
import Footer from '../components/Footer/Footer';

const Home = () => {
  return (
    <div>
      <Header />
      <HeroSection />
      <WhyTrustUsSection />
      <HowItWorks />
      <SchoolRequests />
      <Footer />
    </div>
  );
};

export default Home;