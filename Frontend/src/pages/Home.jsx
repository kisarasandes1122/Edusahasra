import React from 'react';
import Header from '../components/Header/Header';
import HeroSection from '../components/HeroSection/HeroSection';
import WhyTrustUsSection from '../components/WhyTrustUs/WhyTrustUs';
import HowItWorks from '../components/HowitWorks/HowitWorks';
import SchoolRequests from '../components/SchoolRequests (Home)/SchoolRequests';
import Footer from '../components/Footer/Footer';

const Home = () => {
  const mockAuthState = {
    isAuthenticated: false,
    user: {
      name: "Kisara Sandes"
    }
  };


  return (
    <div>
      <Header 
        isAuthenticated={mockAuthState.isAuthenticated}
        user={mockAuthState.user}
      />
      <HeroSection />
      <WhyTrustUsSection />
      <HowItWorks />
      <SchoolRequests />
      <Footer />
    </div>
  );
};

export default Home;