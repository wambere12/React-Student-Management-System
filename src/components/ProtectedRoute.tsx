import { Navigate } from "react-router-dom";
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "../services/supabase";
import { Role } from "../types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const [profile, setProfile] = useState<{ role: Role; school_id: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function verify() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (active) setChecking(false);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("role, school_id")
          .eq("id", user.id)
          .maybeSingle();

        if (active) {
          setProfile(data || null);
          setChecking(false);
        }
      } catch (err) {
        if (active) setChecking(false);
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
