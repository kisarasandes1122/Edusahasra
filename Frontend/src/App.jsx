import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/Donor/Header/Header';
import Footer from './components/Donor/Footer/Footer';
import DonorRegistration from './components/Donor/DonorRegistration/DonorRegistration';
import DonorLogin from './components/Donor/DonorLogin/DonorLogin';
import SchoolsInNeedPage from './components/Donor/SchoolInNeeds/SchoolsInNeedPage';
import NeedPage from './components/Donor/NeedPage/NeedPage';
import DonationPage from './components/Donor/DonationPage/DonationPage';

const App = () => {

  const mockAuthState = {
    isAuthenticated: false,
    user: {
      name: "Kisara Sandes"
    }
  };

  return (
  
    <Router>

      <Header 
        isAuthenticated={mockAuthState.isAuthenticated}
        user={mockAuthState.user}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/donor-register" element={<DonorRegistration />} />
        <Route path="/donor-login" element={<DonorLogin />} />
        <Route path='/needs' element={<SchoolsInNeedPage />} />
        <Route path='/needs/1' element={<NeedPage />} />
        <Route path='/donate/1' element={<DonationPage />} />
      </Routes>

      <Footer />
    </Router>
  );
};
export default App;