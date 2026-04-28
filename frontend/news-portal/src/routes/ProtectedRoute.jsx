import { Navigate } from "react-router-dom";

const parseJwtPayload = (token = "") => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized));
  } catch {
    return null;
  }
};

const clearAdminSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminRole");
  localStorage.removeItem("adminName");
  localStorage.removeItem("adminEmail");
};

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");
  const claims = parseJwtPayload(token || "");
  const tokenRole = claims?.role;
  const isExpired = claims?.exp ? claims.exp * 1000 <= Date.now() : false;
  const hasRequiredRole =
    !requiredRole ||
    tokenRole === requiredRole ||
    (tokenRole === "main-admin" && requiredRole === "sub-admin");

  if (!token || !claims || isExpired || (role && tokenRole && role !== tokenRole)) {
    clearAdminSession();
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
