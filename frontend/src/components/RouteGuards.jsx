import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function RequireBusiness({ children }) {
  const { businesses } = useAuth();
  if (!businesses.length) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, businesses } = useAuth();
  if (isAuthenticated && !businesses.length) {
    return <Navigate to="/onboarding" replace />;
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}
