import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/mock-data";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow direct access without authentication
  // If user is logged in, enforce role-based access
  if (user && allowedRoles && role && !allowedRoles.includes(role)) {
    const dashboardPath = role === "student" ? "/student" : role === "faculty" ? "/faculty" : "/admin";
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
