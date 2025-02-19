import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import DonorRegistration from './components/DonorRegistration/DonorRegistration';
import DonorLogin from './components/DonorLogin/DonorLogin';
import SchoolsInNeedPage from './components/SchoolInNeeds/SchoolsInNeedPage';

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
      </Routes>

      <Footer />
    </Router>
  );
};
export default App;