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
        <Route path="/DonorRegistration" element={<DonorRegistration />} />
        <Route path="/DonorLogin" element={<DonorLogin />} />
        <Route path='/Needs' element={<SchoolsInNeedPage />} />
      </Routes>

      <Footer />
    </Router>
  );
};
export default App;