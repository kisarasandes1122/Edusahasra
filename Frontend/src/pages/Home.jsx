import React from 'react';
import HeroSection from '../components/HeroSection/HeroSection';
import WhyTrustUsSection from '../components/WhyTrustUs/WhyTrustUs';
import HowItWorks from '../components/HowitWorks/HowitWorks';
import SchoolRequests from '../components/SchoolRequests (Home)/SchoolRequests';

const Home = () => {
  const mockAuthState = {
    isAuthenticated: false,
    user: {
      name: "Kisara Sandes"
    }
  };


  return (
    <div>
      
      <HeroSection />
      <WhyTrustUsSection />
      <HowItWorks />
      <SchoolRequests />
      
    </div>
  );
};

export default Home;