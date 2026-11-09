import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { getSchools, saveSchool, removeSchool } from "../services/schoolService";
import { recordTestPassed } from "../services/testingChecklist";
import { School, Profile, Student } from "../types";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  Check,
  AlertCircle,
  Search,
} from "lucide-react";

const emptySchoolForm = {
  school_name: "",
  school_code: "",
  email: "",
  phone: "",
  address: "",
  capacity: 500,
  principal_name: "",
};

export default function Schools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptySchoolForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsSuperAdmin(profile?.role === "super_admin");
      }

      const [schoolsRes, profilesRes, studentsRes] = await Promise.all([
        getSchools(),
        supabase.from("profiles").select("*"),
        supabase.from("students").select("*"),
      ]);

      if (schoolsRes.error) {
        setError(schoolsRes.error.message);
      } else {
        setSchools((schoolsRes.data as School[]) || []);
      }

      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (studentsRes.data) setStudents(studentsRes.data as Student[]);
    } catch (err: any) {
      setError(err?.message || "Failed to load schools.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "school_code"
          ? value.toUpperCase()
          : name === "capacity"
          ? parseInt(value) || 0
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const { error: saveError } = await saveSchool(form, editingId);

      if (saveError) {
        setError(saveError.message);
        setActionLoading(false);
        return;
      }

      recordTestPassed(1); // Test 1: Create the first school
      setSuccessMsg(editingId ? "School updated successfully." : "New school registered successfully.");
      setForm(emptySchoolForm);
      setEditingId(null);
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to save school.");
    } finally {
      setActionLoading(false);
    }
  }

  function editSchool(school: School) {
    setEditingId(school.id);
    setForm({
      school_name: school.school_name,
      school_code: school.school_code,
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      capacity: school.capacity || 500,
      principal_name: school.principal_name || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteSchool(id: string) {
    if (!window.confirm("Are you sure you want to delete this school? This will remove associated classes and students.")) {
      return;
    }

    try {
      const { error: delError } = await removeSchool(id);
      if (delError) {
        setError(delError.message);
        return;
      }

      setSuccessMsg("School removed.");
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to remove school.");
    }
  }

  const filteredSchools = schools.filter((s) =>
    `${s.school_name} ${s.school_code} ${s.email} ${s.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">School Tenant Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 7 & Phase 3: Register and govern participating school organizations
          </p>
        </div>

        {isSuperAdmin && (
          <Link
            to="/admins"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Provision School Admins</span>
          </Link>
        )}
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

      {/* Register School Form (Super Admin only or authorized) */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingId ? "Update School Registration" : "Register New School"}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            RLS: super_admin only
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                School Name *
              </label>
              <input
                name="school_name"
                placeholder="e.g. Kigali Digital Training Centre"
                value={form.school_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Unique School Code *
              </label>
              <input
                name="school_code"
                placeholder="e.g. KDTC001"
                value={form.school_code}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="info@kigali-digital.rw"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                name="phone"
                placeholder="+250 788 123 456"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Campus Address
              </label>
              <input
                name="address"
                placeholder="Kigali, Rwanda"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Max Student Capacity
              </label>
              <input
                name="capacity"
                type="number"
                min="50"
                max="5000"
                value={form.capacity}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptySchoolForm);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading
                ? "Registering..."
                : editingId
                ? "Update School"
                : "Register School"}
            </button>
          </div>
        </form>
      </section>

      {/* Registered Schools Table */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Registered Schools ({filteredSchools.length})
            </h2>
            <p className="text-xs text-slate-500">
              Active institutions on this multi-tenant platform
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70">
                <th className="py-2.5 px-3 font-semibold">School Name</th>
                <th className="py-2.5 px-3 font-semibold">Code</th>
                <th className="py-2.5 px-3 font-semibold">Email</th>
                <th className="py-2.5 px-3 font-semibold">Phone</th>
                <th className="py-2.5 px-3 font-semibold">Address</th>
                <th className="py-2.5 px-3 font-semibold text-center">Students</th>
                <th className="py-2.5 px-3 font-semibold text-center">Admins</th>
                {isSuperAdmin && (
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.map((s) => {
                const schoolStudentsCount = students.filter((stu) => stu.school_id === s.id).length;
                const schoolAdminsCount = profiles.filter((p) => p.school_id === s.id).length;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{s.school_name}</td>
                    <td className="py-3 px-3 font-mono font-medium text-blue-700">{s.school_code}</td>
                    <td className="py-3 px-3 text-slate-600">{s.email || "—"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.phone || "—"}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[180px]">{s.address || "—"}</td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-800">
                      {schoolStudentsCount}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-800">
                      {schoolAdminsCount}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => editSchool(s)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit School"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSchool(s.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete School"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredSchools.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="py-8 text-center text-slate-400">
                    No schools registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
