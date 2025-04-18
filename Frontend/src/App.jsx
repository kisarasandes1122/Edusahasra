import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
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
import AdminLogin from './components/Admin/AdminLogin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard/AdminDashboard';
import AdminNavigation from './components/Admin/AdminNavigation/AdminNavigation';
import SchoolVerification from './components/Admin/SchoolVerification/SchoolVerification';
import DonationManagement from './components/Admin/DonationManagement/DonationManagement';
import AnalyticsReports from './components/Admin/AnalyticsReports/AnalyticsReports';
import AdminSettings from './components/Admin/AdminSettings/AdminSettings';
import MyDonations from './components/Donor/MyDonations/MyDonations';
import MessagesPage from './components/Donor/MessagesPage/MessagesPage';
import ProfilePage from './components/Donor/ProfilePage/ProfilePage';
import AboutUs from './components/Donor/AboutUs/AboutUs';
import Home from './components/Donor/Home/Home';


const DonorLayout = () => {
  return (
    <>
      <Header /> 
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

const AdminLayout = () => {
  return (
    <div className="edusahasra-app">
      <AdminNavigation />
      <main className="edusahasra-main-content">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route element={<DonorLayout />}>
          <Route path="/donor-register" element={<DonorRegistration />} />
          <Route path="/donor-login" element={<DonorLogin />} />
          <Route path='/needs' element={<SchoolsInNeedPage />} />
          <Route path='/needs/:id' element={<NeedPage />} />
          <Route path='/donate/:id' element={<DonationPage />} />
          <Route path="/school-register" element={<SchoolRegistration />} /> {/* Consider moving school reg/login */}
          <Route path="/school-login" element={<SchoolLogin />} />         {/* Consider moving school reg/login */}
          <Route path='/my-donations' element={<MyDonations />} />          {/* Should likely be protected */}
          <Route path="/messages" element={<MessagesPage />} />            {/* Should likely be protected */}
          <Route path="/profile" element={<ProfilePage />} />              {/* Should likely be protected */}
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/" element={<Home />} />
        </Route>


        <Route element={<SchoolLayout />}>
          <Route path="/Dashboard" element={<SchoolDashboard />} /> {/* Should be protected */}
          <Route path="/view-donations" element={<ViewDonations />} /> {/* Should be protected */}
          <Route path="/request-donations" element={<RequestDonations />} /> {/* Should be protected */}
          <Route path="/send-thanks" element={<SendThanks />} /> {/* Should be protected */}
          <Route path="/edit-profile" element={<EditProfile />} /> {/* Should be protected */}
        </Route>


        <Route path="/admin-login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}> {/* This layout implies admin is logged in */}
          <Route path="/admin" element={<AdminDashboard />} />                 {/* Should be protected */}
          <Route path="/admin/school-verification" element={<SchoolVerification />} /> {/* Should be protected */}
          <Route path="/admin/donation-management" element={<DonationManagement />} /> {/* Should be protected */}
          <Route path="/admin/analytics-reports" element={<AnalyticsReports />} />   {/* Should be protected */}
          <Route path="/admin/settings" element={<AdminSettings />} />           {/* Should be protected */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;