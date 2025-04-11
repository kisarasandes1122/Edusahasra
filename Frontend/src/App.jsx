import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/Donor/Header/Header';
import Footer from './components/Donor/Footer/Footer';
import DonorRegistration from './components/Donor/DonorRegistration/DonorRegistration';
import DonorLogin from './components/Donor/DonorLogin/DonorLogin';
import SchoolsInNeedPage from './components/Donor/SchoolInNeeds/SchoolsInNeedPage';
import NeedPage from './components/Donor/NeedPage/NeedPage';
import DonationPage from './components/Donor/DonationPage/DonationPage';
import SchoolRegistration from './components/School/SchoolRegistration/SchoolRegistration';
import SchoolLogin from './components/School/SchoolLogin/SchoolLogin';
import SchoolDashboard from './components/School/SchoolDashboard/SchoolDashboard';
import ViewDonations from './components/School/ViewDonations/ViewDonations';
import RequestDonations from './components/School/RequestDonations/RequestDonations';
import SendThanks from './components/School/SendThanks/SendThanks';
import EditProfile from './components/School/EditProfile/EditProfile';
import { LanguageProvider } from './components/LanguageSelector/LanguageContext';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';


const DonorLayout = () => {
  const mockAuthState = {
    isAuthenticated: false,
    user: {
      name: "Kisara Sandes"
    }
  };

  return (
    <>
      <Header 
        isAuthenticated={mockAuthState.isAuthenticated}
        user={mockAuthState.user}
      />
      <Outlet /> 
      <Footer />
    </>
  );
};


const SchoolLayout = () => {
  return (
    <LanguageProvider>
      <LanguageSelector />
      <Outlet />
    </LanguageProvider>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route element={<DonorLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/donor-register" element={<DonorRegistration />} />
          <Route path="/donor-login" element={<DonorLogin />} />
          <Route path='/needs' element={<SchoolsInNeedPage />} />
          <Route path='/needs/:id' element={<NeedPage />} />
          <Route path='/donate/:id' element={<DonationPage />} />
          <Route path="/school-register" element={<SchoolRegistration />} />
          <Route path="/school-login" element={<SchoolLogin />} />
        </Route>

        <Route element={<SchoolLayout />}>
          <Route path="/Dashboard" element={<SchoolDashboard />} />
          <Route path="/view-donations" element={<ViewDonations />} />
          <Route path="/request-donations" element={<RequestDonations />} />
          <Route path="/send-thanks" element={<SendThanks />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;