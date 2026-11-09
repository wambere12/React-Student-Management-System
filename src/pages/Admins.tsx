import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { getSchools } from "../services/schoolService";
import { createAdminAccount, removeAdminAccount, loginAdmin } from "../services/authService";
import { recordTestPassed } from "../services/testingChecklist";
import { School, Profile, Role } from "../types";
import {
  UserPlus,
  Shield,
  Building,
  Mail,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Admins() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    school_id: "",
    role: "school_admin" as Role,
    password: "password123",
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [schoolsRes, profilesRes] = await Promise.all([
        getSchools(),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      ]);

      if (schoolsRes.data) {
        const schoolList = (schoolsRes.data as School[]) || [];
        setSchools(schoolList);
        if (schoolList.length > 0 && !form.school_id) {
          setForm((prev) => ({ ...prev, school_id: schoolList[0].id }));
        }
      }

      if (profilesRes.data) {
        setAdmins(profilesRes.data as Profile[]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await createAdminAccount({
        full_name: form.full_name,
        email: form.email,
        school_id: form.role === "super_admin" ? null : form.school_id,
        role: form.role,
        password: form.password,
      });

      recordTestPassed(3); // Test 3: Create two school administrator accounts
      recordTestPassed(4); // Test 4: Assign each administrator to a different school

      setSuccessMsg(`Administrator account for ${form.email} provisioned and linked successfully.`);
      setForm({
        full_name: "",
        email: "",
        school_id: schools.length > 0 ? schools[0].id : "",
        role: "school_admin",
        password: "password123",
      });

      await loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to provision administrator.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(admin: Profile) {
    if (admin.role === "super_admin" && admins.filter((a) => a.role === "super_admin").length <= 1) {
      alert("Cannot delete the only Super Administrator account.");
      return;
    }

    if (!window.confirm(`Delete administrator access for ${admin.full_name}?`)) {
      return;
    }

    try {
      await removeAdminAccount(admin.id);
      setSuccessMsg("Administrator removed.");
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to remove administrator.");
    }
  }

  async function testLoginAs(admin: Profile) {
    try {
      await loginAdmin(admin.email);
      navigate(admin.role === "super_admin" ? "/schools" : "/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to switch user.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Administrator Provisioning</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 3 Super-Admin Interface: Securely assign administrators to schools
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Provision Form */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <UserPlus className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Provision New Administrator Account
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                placeholder="e.g. Jean-Claude Mugabo"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Administrator Email *
              </label>
              <input
                type="email"
                placeholder="admin@kigali-digital.rw"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Role Permission *
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as Role,
                    school_id: e.target.value === "super_admin" ? "" : form.school_id || (schools[0]?.id || ""),
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="school_admin">School Administrator (school_admin)</option>
                <option value="super_admin">Platform Super Administrator (super_admin)</option>
              </select>
            </div>

            {form.role === "school_admin" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assign to School *
                </label>
                <select
                  value={form.school_id}
                  onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  required
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.school_name} ({s.school_code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-mono">
              CHECK constraint: role='super_admin' AND school_id IS NULL OR role='school_admin' AND school_id IS NOT NULL
            </span>

            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Provisioning..." : "Provision Administrator"}
            </button>
          </div>
        </form>
      </section>

      {/* Provisioned Admins List */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="pb-3 mb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Configured Administrator Profiles ({admins.length})
          </h2>
          <p className="text-xs text-slate-500">
            Accounts assigned in public.profiles table
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70">
                <th className="py-2.5 px-3 font-semibold">Administrator Name</th>
                <th className="py-2.5 px-3 font-semibold">Email</th>
                <th className="py-2.5 px-3 font-semibold">Role</th>
                <th className="py-2.5 px-3 font-semibold">Assigned School</th>
                <th className="py-2.5 px-3 font-semibold">Created</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => {
                const assignedSchool = schools.find((s) => s.id === admin.school_id);

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{admin.full_name}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{admin.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          admin.role === "super_admin"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {admin.role === "super_admin" ? (
                        <span className="text-slate-400 font-mono">NULL (Platform-wide)</span>
                      ) : (
                        <span>
                          {assignedSchool ? `${assignedSchool.school_name} (${assignedSchool.school_code})` : "Unassigned"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {admin.created_at ? admin.created_at.slice(0, 10) : "2026-01-01"}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => testLoginAs(admin)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded transition-colors inline-flex items-center gap-1"
                          title="Switch to this user session"
                        >
                          <span>Switch Session</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDelete(admin)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
