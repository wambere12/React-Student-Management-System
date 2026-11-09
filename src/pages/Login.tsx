import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/authService";
import { resetDatabaseToSeed } from "../services/mockDatabase";
import {
  getDatabaseMode,
  setDatabaseMode,
  isLiveSupabaseAvailable,
  liveSupabaseUrl,
} from "../services/supabase";
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Cloud,
  HardDrive,
  ExternalLink,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("superadmin@edumanage.io");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [dbMode, setDbMode] = useState<'sandbox' | 'live'>(getDatabaseMode());

  useEffect(() => {
    const handleModeUpdate = () => setDbMode(getDatabaseMode());
    window.addEventListener("edumanage_mode_updated", handleModeUpdate);
    return () => window.removeEventListener("edumanage_mode_updated", handleModeUpdate);
  }, []);

  function handleModeChange(newMode: 'sandbox' | 'live') {
    setDatabaseMode(newMode);
    setDbMode(newMode);
    setError("");
  }

  async function handleLogin(e?: React.FormEvent, customEmail?: string) {
    if (e) e.preventDefault();
    const targetEmail = (customEmail || email).trim();
    if (!targetEmail) return;

    setLoading(true);
    setError("");

    try {
      const result = await loginAdmin(targetEmail, password || "password123");

      navigate(
        result.profile.role === "super_admin"
          ? "/schools"
          : "/dashboard"
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Authentication failed. Please verify credentials or switch to Demo Sandbox Mode."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(accountEmail: string) {
    setEmail(accountEmail);
    setPassword("password123");
    handleLogin(undefined, accountEmail);
  }

  function handleReset() {
    resetDatabaseToSeed();
    setEmail("superadmin@edumanage.io");
    setPassword("password123");
    setError("");
    setResetMsg("Restored default administrator accounts & seed database!");
    setTimeout(() => setResetMsg(""), 3500);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-3 shadow-sm">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          EduManage Multi-School System
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Administrator Authentication & RLS Protected Access
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-8">
          {/* Database Mode Switcher */}
          {isLiveSupabaseAvailable && (
            <div className="mb-5 p-1 bg-slate-100 rounded-lg flex text-xs font-medium">
              <button
                type="button"
                onClick={() => handleModeChange("sandbox")}
                className={`flex-1 py-1.5 px-2.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  dbMode === "sandbox"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>Demo Sandbox (Ready)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("live")}
                className={`flex-1 py-1.5 px-2.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  dbMode === "live"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Supabase Cloud</span>
              </button>
            </div>
          )}

          {/* Quick Demo Login selector */}
          <div className="mb-5 pb-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                1-Click Quick Login by Role:
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                title="Restore default test accounts"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Seed</span>
              </button>
            </div>

            {resetMsg && (
              <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{resetMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              {/* Role 1: Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin("superadmin@edumanage.io")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900">Platform Super Administrator</p>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">
                      super_admin
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">superadmin@edumanage.io</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  All Schools &rarr;
                </span>
              </button>

              {/* Role 2: School A Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin("admin.kigali@schoollabs.cc")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900">School A Admin (Kigali Digital)</p>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                      school_admin
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">admin.kigali@schoollabs.cc · KDTC001</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  Isolated &rarr;
                </span>
              </button>

              {/* Role 3: School B Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin("admin.greenfield@schoollabs.cc")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900">School B Admin (Greenfield STEM)</p>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                      school_admin
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">admin.greenfield@schoollabs.cc · GSA002</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  Isolated &rarr;
                </span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="superadmin@edumanage.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-blue-600 font-mono">
                  Default: <strong>password123</strong>
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  {dbMode === "live" && (
                    <button
                      type="button"
                      onClick={() => handleModeChange("sandbox")}
                      className="mt-1.5 underline font-semibold text-rose-900 block"
                    >
                      Click here to switch to Demo Sandbox Mode & Login Instantly &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Sign in to Dashboard"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Credentials quick reference table */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1.5 uppercase tracking-wider">
              Available Test Roles & Accounts:
            </span>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1.5">
              <div className="flex justify-between items-center text-slate-700">
                <span><strong>Super Admin:</strong> <span className="font-mono">superadmin@edumanage.io</span></span>
                <span className="font-mono text-slate-500">password123</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span><strong>School A:</strong> <span className="font-mono">admin.kigali@schoollabs.cc</span></span>
                <span className="font-mono text-slate-500">password123</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span><strong>School B:</strong> <span className="font-mono">admin.greenfield@schoollabs.cc</span></span>
                <span className="font-mono text-slate-500">password123</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Row Level Security Enforced
            </span>
            <span>No Public Signup</span>
          </div>
        </div>
      </div>
    </div>
  );
}
