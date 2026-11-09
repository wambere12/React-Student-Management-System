import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileBarChart,
  Building2,
  UserPlus,
  Database,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Building,
} from "lucide-react";
import { logoutAdmin, getCurrentUserProfile } from "../services/authService";
import { getSchools } from "../services/schoolService";
import { evaluateSystemChecklist } from "../services/testingChecklist";
import { Profile, School } from "../types";
import TestingChecklistModal from "../components/TestingChecklistModal";
import { getDatabaseMode } from "../services/supabase";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistScore, setChecklistScore] = useState({ passed: 0, total: 11 });

  async function refreshSession() {
    const { profile: currentProfile } = await getCurrentUserProfile();
    if (!currentProfile) {
      navigate("/login");
      return;
    }
    setProfile(currentProfile);

    // Load schools
    const { data: schoolsData } = await getSchools();
    const schools = (schoolsData as School[]) || [];
    setAllSchools(schools);

    if (currentProfile.school_id) {
      const match = schools.find((s) => s.id === currentProfile.school_id);
      setCurrentSchool(match || null);
    } else {
      setCurrentSchool(null);
    }

    // Evaluate checklist
    const audit = await evaluateSystemChecklist();
    setChecklistScore({
      passed: audit.filter((i) => i.status === "passed").length,
      total: audit.length,
    });
  }

  useEffect(() => {
    refreshSession();

    const handleDbUpdate = () => refreshSession();
    window.addEventListener("edumanage_db_updated", handleDbUpdate);
    window.addEventListener("edumanage_checklist_updated", handleDbUpdate);

    return () => {
      window.removeEventListener("edumanage_db_updated", handleDbUpdate);
      window.removeEventListener("edumanage_checklist_updated", handleDbUpdate);
    };
  }, [location.pathname]);

  async function handleLogout() {
    await logoutAdmin();
    navigate("/login");
  }

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand Area */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">EduManage</h1>
              <p className="text-[11px] text-slate-400 font-mono tracking-wider">MULTI-SCHOOL PLATFORM</p>
            </div>
          </div>

          {/* Current School Context */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block tracking-wider uppercase mb-1">
              Active Context
            </span>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <p className="text-xs font-semibold text-white truncate">
                {isSuperAdmin
                  ? "Platform-Wide (All Schools)"
                  : currentSchool?.school_name || "School Administrator"}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                <span className="font-mono">{isSuperAdmin ? "SUPER ADMIN" : currentSchool?.school_code || "ISOLATED"}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">RLS Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 flex-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Administration
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/students"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Students</span>
            </NavLink>

            <NavLink
              to="/classes"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Classes</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <FileBarChart className="w-4 h-4 shrink-0" />
              <span>Reports & Exports</span>
            </NavLink>

            <NavLink
              to="/schools"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Schools</span>
              </div>
              {isSuperAdmin && (
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                  Super Admin
                </span>
              )}
            </NavLink>

            {isSuperAdmin && (
              <NavLink
                to="/admins"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>Admin Accounts</span>
                </div>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded">
                  Phase 3
                </span>
              </NavLink>
            )}

            <NavLink
              to="/database"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>SQL & RLS Schema</span>
            </NavLink>
          </nav>

          {/* Testing Checklist Trigger Widget */}
          <div className="mt-6 px-1">
            <button
              onClick={() => setChecklistOpen(true)}
              className="w-full text-left bg-slate-800/90 hover:bg-slate-800 p-3 rounded-lg border border-slate-700/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Testing Checklist</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  {checklistScore.passed}/{checklistScore.total}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Inspect 11-step isolation and role verification tests
              </p>
            </button>
          </div>
        </div>

        {/* Sidebar Footer with Active User & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{profile?.email}</p>
            </div>
            <span
              className={`shrink-0 text-[10px] px-2 py-0.5 rounded font-medium ${
                isSuperAdmin ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"
              }`}
            >
              {isSuperAdmin ? "Super Admin" : "School Admin"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Topbar adhering to Top Bar Contract */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0 sticky top-0 z-30">
          {/* Zone 1: Breadcrumb and Current Context */}
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {location.pathname === "/dashboard" && "Dashboard Overview"}
              {location.pathname === "/students" && "Student Management"}
              {location.pathname === "/classes" && "Class & Course Management"}
              {location.pathname === "/reports" && "Academic Reports & Export"}
              {location.pathname === "/schools" && "School Tenant Directory"}
              {location.pathname === "/admins" && "Administrator Provisioning"}
              {location.pathname === "/database" && "Database Schema & RLS Policies"}
            </h2>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-xs text-slate-500 truncate hidden sm:inline">
              {isSuperAdmin ? "Multi-School Super Admin" : currentSchool?.school_name}
            </span>
          </div>

          {/* Zone 2: Navigation status & quick actions */}
          <div className="flex items-center gap-2.5">
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded border bg-slate-50 border-slate-200 text-slate-600"
              title="Database backend"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {getDatabaseMode() === "live" ? "Supabase Cloud" : "Sandbox RLS Engine"}
            </span>

            <button
              onClick={() => setChecklistOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Checklist ({checklistScore.passed}/{checklistScore.total})</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </section>

      {/* Verification Drawer Modal */}
      <TestingChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} />
    </div>
  );
}
