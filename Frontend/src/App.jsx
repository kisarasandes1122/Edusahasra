// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';

// --- Component Imports ---
// Donor/Public Facing Components
import Header from './components/Donor/Header/Header';
import Footer from './components/Donor/Footer/Footer';
import DonorRegistration from './components/Donor/DonorRegistration/DonorRegistration';
import DonorLogin from './components/Donor/DonorLogin/DonorLogin';
import SchoolsInNeedPage from './components/Donor/SchoolInNeeds/SchoolsInNeedPage';
import NeedPage from './components/Donor/NeedPage/NeedPage';
import DonationPage from './components/Donor/DonationPage/DonationPage';
import MyDonations from './components/Donor/MyDonations/MyDonations';
import MessagesPage from './components/Donor/MessagesPage/MessagesPage';
import ProfilePage from './components/Donor/ProfilePage/ProfilePage';
import AboutUs from './components/Donor/AboutUs/AboutUs';
import Home from './components/Donor/Home/Home';
import HowItWorksPage from './components/Donor/HowItWorksPage/HowItWorksPage';
import ImpactStoriesPage from './components/Donor/ImpactStoriesPage/ImpactStoriesPage'; // Public list
// import ImpactStoryDetail from './components/Donor/ImpactStoriesPage/ImpactStoryDetail'; // Optional public detail view

// School Components
import SchoolRegistration from './components/School/SchoolRegistration/SchoolRegistration';
import SchoolLogin from './components/School/SchoolLogin/SchoolLogin';
import SchoolDashboard from './components/School/SchoolDashboard/SchoolDashboard';
import ViewDonations from './components/School/ViewDonations/ViewDonations';
import RequestDonations from './components/School/RequestDonations/RequestDonations';
import SendThanks from './components/School/SendThanks/SendThanks';
import EditProfile from './components/School/EditProfile/EditProfile';
import WriteImpactStoriesPage from './components/School/WriteImpactStoriesPage/WriteImpactStoriesPage'; // School write story

// Admin Components
import AdminLogin from './components/Admin/AdminLogin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard/AdminDashboard';
import AdminNavigation from './components/Admin/AdminNavigation/AdminNavigation';
import SchoolVerification from './components/Admin/SchoolVerification/SchoolVerification'; // Correct path if needed
import DonationManagement from './components/Admin/DonationManagement/DonationManagement';
import AnalyticsReports from './components/Admin/AnalyticsReports/AnalyticsReports';
import AdminSettings from './components/Admin/AdminSettings/AdminSettings';
import AdminImpactStoriesPage from './components/Admin/AdminImpactStories/AdminImpactStoriesPage'; // Admin list
import AdminImpactStoryDetail from './components/Admin/AdminImpactStories/AdminImpactStoryDetail'; // Admin detail

// Language Selector Component & Context (Used in School Layout in this structure)
import { LanguageProvider } from './components/LanguageSelector/LanguageContext';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';

// Authentication Route Components
import DonorRoute from './components/Common/Auth/DonorRoute';
import SchoolRoute from './components/Common/Auth/SchoolRoute';
import AdminRoute from './components/Common/Auth/AdminRoute'; // Import AdminRoute

// Password Reset Components
import ForgotPasswordPage from './components/Donor/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './components/Donor/ResetPasswordPage/ResetPasswordPage';


// --- Layout Components ---
// These components define the common structure (headers, footers, sidebars)
// They do *not* perform authentication checks themselves; that's the job of the *Route components*
const DonorLayout = () => {
    return (
      <>
        <Header />
        <Outlet /> {/* Renders the nested route component */}
        <Footer />
      </>
    );
};

const SchoolLayout = () => {
    // This layout wraps routes specific to the school dashboard (might have different header/sidebar)
    // LanguageProvider is wrapped here based on the original structure
    return (
      <LanguageProvider>
        <LanguageSelector />
        {/* Assuming SchoolHeader/Sidebar would go here if implemented */}
        <Outlet /> {/* Renders the nested route component */}
        {/* Assuming SchoolFooter would go here if implemented */}
      </LanguageProvider>
    );
};

const AdminLayout = () => {
    // This layout wraps admin dashboard routes - provides the navigation and main content area
    return (
      <div className="edusahasra-app">
        <AdminNavigation />
        <main className="edusahasra-main-content">
          <Outlet /> {/* Renders the nested route component */}
        </main>
      </div>
    );
};


// --- Main App Component with Routes ---
const App = () => {
  return (
    <Router>
      <Routes>

        {/* ======================================= */}
        {/* --- Public Routes (No Authentication) --- */}
        {/* ======================================= */}
        {/* These routes are accessible to anyone. Some might use a shared layout. */}

        {/* Public Routes using the Donor Layout */}
        <Route element={<DonorLayout />}>
           <Route path="/" element={<Home />} />
           <Route path="/about-us" element={<AboutUs />} />
           <Route path="/how-it-works" element={<HowItWorksPage />} />
           {/* Registration & Login pages are typically public */}
           <Route path="/donor-register" element={<DonorRegistration />} />
           <Route path="/donor-login" element={<DonorLogin />} />
           <Route path="/school-register" element={<SchoolRegistration />} />
           <Route path="/school-login" element={<SchoolLogin />} />
           {/* Public facing pages for needs, requests, and impact stories list */}
           <Route path='/needs' element={<SchoolsInNeedPage />} />
           {/* Note: Access to a specific NeedPage (/requests/:requestId) is public as per routes */}
           <Route path='/requests/:requestId' element={<NeedPage />} />
           <Route path="/impact-stories" element={<ImpactStoriesPage />} /> {/* Public Impact Stories List */}
           {/* Optional: Public route to view a specific impact story detail (if linking from public list) */}
           {/* <Route path="/impact-stories/:impactStoryId" element={<ImpactStoryDetail />} /> */}

           {/* Public Password Reset Routes */}
           <Route path="/forgot-password" element={<ForgotPasswordPage />} />
           <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* Token is read from search params */}
        </Route>

        {/* Admin Login is a standalone public route (doesn't use AdminLayout) */}
        <Route path="/admin-login" element={<AdminLogin />} />


        {/* =================================== */}
        {/* --- Protected Donor Routes --- */}
        {/* =================================== */}
        {/* Use DonorRoute to check authentication. Nested routes render if authenticated. */}
        <Route element={<DonorRoute />}> {/* Authentication Check */}
             {/* These routes use the DonorLayout *if* authenticated */}
             <Route element={<DonorLayout />}> {/* Layout */}
                 {/* Specific Protected Donor Pages (Original Paths) */}
                 <Route path='/donate/:requestId' element={<DonationPage />} />
                 <Route path='/my-donations' element={<MyDonations />} />
                 <Route path="/messages" element={<MessagesPage />} />
                 <Route path="/profile" element={<ProfilePage />} />
             </Route>
        </Route>


        {/* ==================================== */}
        {/* --- Protected School Routes --- */}
        {/* ==================================== */}
        {/* Use SchoolRoute to check authentication. Nested routes render if authenticated. */}
        <Route element={<SchoolRoute />}> {/* Authentication Check */}
             {/* These routes use the SchoolLayout *if* authenticated */}
             {/* Keep LanguageProvider/Selector within SchoolLayout if it's part of that layout */}
             <Route element={<SchoolLayout />}> {/* Layout */}
                 {/* Specific Protected School Pages (Original Paths) */}
                 <Route path="/Dashboard" element={<SchoolDashboard />} />
                 <Route path="/view-donations" element={<ViewDonations />} />
                 <Route path="/request-donations" element={<RequestDonations />} />
                 <Route path="/send-thanks" element={<SendThanks />} />
                 <Route path="/edit-profile" element={<EditProfile />} />
                 <Route path="/write-impact-story" element={<WriteImpactStoriesPage />} />
                 {/* Optional: Route for school to view their own submitted story details */}
                 {/* <Route path="/my-impact-stories/:impactStoryId" element={<SchoolImpactStoryDetail />} /> */}
             </Route>
        </Route>


        {/* ================================= */}
        {/* --- Protected Admin Routes --- */}
        {/* ================================= */}
        {/* Use AdminRoute to check authentication. Nested routes render if authenticated. */}
        <Route element={<AdminRoute />}> {/* <<< THIS PERFORMS THE ADMIN AUTH CHECK */}
             {/* These routes use the AdminLayout *if* authenticated */}
            <Route element={<AdminLayout />}> {/* <<< THIS PROVIDES THE ADMIN LAYOUT */}
                 {/* Specific Protected Admin Pages (Original Paths) */}
                 <Route path="/admin" element={<AdminDashboard />} />
                 <Route path="/admin/school-verification" element={<SchoolVerification />} />
                 <Route path="/admin/donation-management" element={<DonationManagement />} />
                 <Route path="/admin/analytics-reports" element={<AnalyticsReports />} />
                 <Route path="/admin/settings" element={<AdminSettings />} />
                 {/* Admin Impact Stories Routes - List and Detail (Original Paths) */}
                 <Route path="/admin/impact-stories" element={<AdminImpactStoriesPage />} />
                 <Route path="/admin/impact-stories/:storyId" element={<AdminImpactStoryDetail />} />

                 {/* Add other specific protected admin pages here using their original paths */}
            </Route>
        </Route>


        {/* ============================== */}
        {/* --- Catch-all / 404 Route --- */}
        {/* ============================== */}
        {/* Add a route here to handle paths that don't match any above */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}

      </Routes>
    </Router>
  );
};

export default App;