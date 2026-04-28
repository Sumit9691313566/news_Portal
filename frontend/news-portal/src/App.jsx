import { BrowserRouter, Routes, Route } from "react-router-dom";

import Category from "./pages/Category";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import MainAdminDashboard from "./pages/MainAdminDashboard";
import ReporterDashboard from "./pages/ReporterDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useEffect } from "react";
import { restoreExistingPushSubscription } from "./services/push";

// 👇 NEW PAGES
import Videos from "./pages/Videos";
import Search from "./pages/Search";
import VideoPlayer from "./pages/VideoPlayer";
import NotificationPanel from "./pages/NotificationPanel";
import UserNewsSubmit from "./pages/UserNewsSubmit";
import UserNewsInbox from "./pages/UserNewsInbox";
import TermsConditions from "./pages/TermsConditions";

function App() {
  useEffect(() => {
    restoreExistingPushSubscription().catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* HOME */}
        <Route path="/" element={<Category />} />

        {/* SIDEBAR ROUTES */}
        <Route path="/videos" element={<Videos />} />
        <Route path="/videos/:id" element={<VideoPlayer />} />
        <Route path="/search" element={<Search />} />
        <Route path="/send-news" element={<UserNewsSubmit />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="sub-admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/main-admin"
          element={
            <ProtectedRoute requiredRole="main-admin">
              <MainAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reporter-dashboard"
          element={
            <ProtectedRoute requiredRole="reporter">
              <ReporterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/main-admin/notifications"
          element={
            <ProtectedRoute requiredRole="main-admin">
              <NotificationPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/main-admin/users-news"
          element={
            <ProtectedRoute requiredRole="main-admin">
              <UserNewsInbox />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
