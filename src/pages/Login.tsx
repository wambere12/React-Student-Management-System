import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/authService";
import { Building2, ShieldCheck, ArrowRight, Lock, Mail, KeyRound } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e?: React.FormEvent, customEmail?: string) {
    if (e) e.preventDefault();
    const loginTargetEmail = customEmail || email;
    if (!loginTargetEmail) return;

    setLoading(true);
    setError("");

    try {
      const result = await loginAdmin(loginTargetEmail, password || "password123");

      navigate(
        result.profile.role === "super_admin"
          ? "/schools"
          : "/dashboard"
      );
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Verify administrator credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(accountEmail: string) {
    setEmail(accountEmail);
    setPassword("password123");
    handleLogin(undefined, accountEmail);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-sm">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          EduManage Multi-School System
        </h1>
        <p className="mt-1.5 text-xs text-slate-600">
          Administrator Authentication & RLS Protected Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {/* Quick Demo Login selector */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              Select Test Administrator Session:
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("superadmin@edumanage.io")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">Platform Super Administrator</p>
                  <p className="text-[11px] text-slate-500">superadmin@edumanage.io</p>
                </div>
                <span className="text-[11px] font-medium text-blue-700">All Schools &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin.kigali@schoollabs.cc")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">School A Admin (Kigali Digital)</p>
                  <p className="text-[11px] text-slate-500">admin.kigali@schoollabs.cc · KDTC001</p>
                </div>
                <span className="text-[11px] font-medium text-emerald-700">Isolated &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin.greenfield@schoollabs.cc")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">School B Admin (Greenfield STEM)</p>
                  <p className="text-[11px] text-slate-500">admin.greenfield@schoollabs.cc · GSA002</p>
                </div>
                <span className="text-[11px] font-medium text-emerald-700">Isolated &rarr;</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="admin@schoollabs.cc"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium" role="alert">
                {error}
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

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
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
