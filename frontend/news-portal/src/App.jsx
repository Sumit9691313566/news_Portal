import { BrowserRouter, Routes, Route } from "react-router-dom";

import Category from "./pages/Category";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

// 👇 NEW PAGES
import Videos from "./pages/Videos";
import Search from "./pages/Search";
import EPaper from "./pages/EPaper";
import VideoPlayer from "./pages/VideoPlayer";
import EPaperViewer from "./pages/EPaperViewer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HOME */}
        <Route path="/" element={<Category />} />

        {/* SIDEBAR ROUTES */}
        <Route path="/videos" element={<Videos />} />
        <Route path="/videos/:id" element={<VideoPlayer />} />
        <Route path="/search" element={<Search />} />
        <Route path="/epaper" element={<EPaper />} />
        <Route path="/epaper/:id" element={<EPaperViewer />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
