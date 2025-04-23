// frontend/src/App.jsx

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

// Import the protected route components
import DonorRoute from './components/Common/Auth/DonorRoute';
import SchoolRoute from './components/Common/Auth/SchoolRoute';

// --- Import New Components for Password Reset ---
// Assuming you have created these files with the code provided in the previous response
import ForgotPasswordPage from './components/Donor/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './components/Donor/ResetPasswordPage/ResetPasswordPage';
// --- End New Components ---


const DonorLayout = () => {
    // This layout wraps routes that use the donor header and footer
    return (
      <>
        <Header />
        <Outlet />
        <Footer />
      </>
    );
};


const SchoolLayout = () => {
    // This layout wraps routes specific to the school dashboard (might have different header/sidebar)
     // Keeping LanguageProvider here based on the original snippet, adjust as needed
    return (
      <LanguageProvider>
        <LanguageSelector />
        <Outlet /> {/* Outlet for nested routes (including SchoolRoute) */}
      </LanguageProvider>
    );
};

const AdminLayout = () => {
    // This layout wraps admin dashboard routes
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
        {/* Routes using the Donor Layout */}
        <Route element={<DonorLayout />}>
          {/* Public Routes */}
          <Route path="/donor-register" element={<DonorRegistration />} />
          <Route path="/donor-login" element={<DonorLogin />} />
          <Route path='/needs' element={<SchoolsInNeedPage />} />
          <Route path='/requests/:requestId' element={<NeedPage />} />
          <Route path="/school-register" element={<SchoolRegistration />} /> {/* Should this be under DonorLayout? Or its own minimal layout? Keeping as is from previous state. */}
          <Route path="/school-login" element={<SchoolLogin />} /> {/* Should this be under DonorLayout? Or its own minimal layout? Keeping as is from previous state. */}
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/" element={<Home />} />

           {/* --- New Public Password Reset Routes --- */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* Token is read from search params */}
           {/* --- End New Routes --- */}

          {/* Protected Donor Routes (require donor authentication) */}
          <Route element={<DonorRoute />}>
             <Route path='/donate/:requestId' element={<DonationPage />} />
             <Route path='/my-donations' element={<MyDonations />} />
             <Route path="/messages" element={<MessagesPage />} />
             <Route path="/profile" element={<ProfilePage />} /> {/* This route is now correctly protected */}
          </Route>
        </Route>

        {/* Routes using the School Layout */}
        <Route element={<SchoolLayout />}>
            {/* Protected School Routes (require school authentication) */}
            <Route element={<SchoolRoute />}>
                <Route path="/Dashboard" element={<SchoolDashboard />} />
                <Route path="/view-donations" element={<ViewDonations />} />
                <Route path="/request-donations" element={<RequestDonations />} />
                <Route path="/send-thanks" element={<SendThanks />} />
                <Route path="/edit-profile" element={<EditProfile />} />
            </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} /> {/* Admin Login doesn't use the AdminLayout */}
        {/* Routes using the Admin Layout (assuming they are protected elsewhere if needed) */}
        <Route element={<AdminLayout />}>
          {/* Admin Dashboard routes */}
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