import React from 'react';
import HeroSection from '../components/Donor/HeroSection/HeroSection';
import WhyTrustUsSection from '../components/Donor/WhyTrustUs/WhyTrustUs';
import HowItWorks from '../components/Donor/HowitWorks/HowitWorks';
import SchoolRequests from '../components/Donor/SchoolRequests (Home)/SchoolRequests';

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