import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import Header from './components/Donor/Header/Header';
import Footer from './components/Donor/Footer/Footer';
import DonorRegistration from './components/Donor/DonorRegistration/DonorRegistration';
import DonorLogin from './components/Donor/DonorLogin/DonorLogin';
import SchoolsInNeedPage from './components/Donor/SchoolInNeeds/SchoolsInNeedPage';
import NeedPage from './components/Donor/NeedPage/NeedPage';
import DonationPage from './components/Donor/DonationPage/DonationPage'; // The page to protect
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
import MyDonations from './components/Donor/MyDonations/MyDonations';       // Protect this too
import MessagesPage from './components/Donor/MessagesPage/MessagesPage';   // Protect this too
import ProfilePage from './components/Donor/ProfilePage/ProfilePage';      // Protect this too
import AboutUs from './components/Donor/AboutUs/AboutUs';
import Home from './components/Donor/Home/Home';

// Import the protected route component
import DonorRoute from './components/Common/Auth/DonorRoute'; // Adjust path if needed

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
  // ... (same as before)
    return (
      <LanguageProvider>
        <LanguageSelector />
        <Outlet />
      </LanguageProvider>
    );
};

const AdminLayout = () => {
  // ... (same as before)
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
        {/* Routes within DonorLayout */}
        <Route element={<DonorLayout />}>
          {/* Public Donor Routes */}
          <Route path="/donor-register" element={<DonorRegistration />} />
          <Route path="/donor-login" element={<DonorLogin />} />
          <Route path='/needs' element={<SchoolsInNeedPage />} />
          <Route path='/requests/:requestId' element={<NeedPage />} /> {/* NeedPage itself is public */}
          <Route path="/school-register" element={<SchoolRegistration />} />
          <Route path="/school-login" element={<SchoolLogin />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/" element={<Home />} />

          {/* Protected Donor Routes - Wrap these with DonorRoute */}
          <Route element={<DonorRoute />}>
             <Route path='/donate/:requestId' element={<DonationPage />} /> {/* Now protected */}
             <Route path='/my-donations' element={<MyDonations />} />       {/* Now protected */}
             <Route path="/messages" element={<MessagesPage />} />         {/* Now protected */}
             <Route path="/profile" element={<ProfilePage />} />           {/* Now protected */}
             {/* Add any other donor-only routes here */}
          </Route>
        </Route>

        {/* Routes within SchoolLayout (Should also be protected, similar pattern) */}
        <Route element={<SchoolLayout />}>
          {/* TODO: Add a SchoolRoute protector here */}
          <Route path="/Dashboard" element={<SchoolDashboard />} />
          <Route path="/view-donations" element={<ViewDonations />} />
          <Route path="/request-donations" element={<RequestDonations />} />
          <Route path="/send-thanks" element={<SendThanks />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          {/* TODO: Add an AdminRoute protector here */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/school-verification" element={<SchoolVerification />} />
          <Route path="/admin/donation-management" element={<DonationManagement />} />
          <Route path="/admin/analytics-reports" element={<AnalyticsReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;