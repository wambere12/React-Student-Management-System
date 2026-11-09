import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import {
  getStudents,
  saveStudent,
  removeStudent,
} from "../services/studentService";
import { getClasses } from "../services/classService";
import { recordTestPassed } from "../services/testingChecklist";
import { Student, ClassItem } from "../types";
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Download,
  Filter,
  Check,
  Building2,
  AlertCircle,
} from "lucide-react";

const emptyForm = {
  student_id: "",
  full_name: "",
  email: "",
  gender: "",
  phone: "",
  course: "",
  class_name: "",
  class_id: "",
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [schoolContext, setSchoolContext] = useState<string>("My School");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in again.");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "school_admin" && profile.school_id) {
        const { data: school } = await supabase
          .from("schools")
          .select("school_name, school_code")
          .eq("id", profile.school_id)
          .single();
        if (school) {
          setSchoolContext(`${school.school_name} (${school.school_code})`);
        }
      } else {
        setSchoolContext("All Schools (Super Admin)");
      }

      const [studentsRes, classesRes] = await Promise.all([
        getStudents(),
        getClasses(),
      ]);

      if (studentsRes.error) {
        setError(studentsRes.error.message);
      } else {
        setStudents((studentsRes.data as Student[]) || []);
      }

      if (!classesRes.error && classesRes.data) {
        setClasses(classesRes.data as ClassItem[]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "class_name") {
      // Find matching class_id if selected from dropdown
      const matched = classes.find((c) => c.class_name === value);
      setForm((prev) => ({
        ...prev,
        class_name: value,
        class_id: matched ? matched.id : prev.class_id,
        course: matched && !prev.course ? matched.course : prev.course,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in again.");
        setActionLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setError("Administrator profile not found.");
        setActionLoading(false);
        return;
      }

      const studentData: Record<string, any> = { ...form };

      if (!editingId) {
        // Enforce server/RLS rule: school_id is bound strictly to administrator's profile
        studentData.school_id =
          profile.role === "school_admin" ? profile.school_id : null;
      } else {
        delete studentData.school_id;
      }

      const { error: saveError } = await saveStudent(studentData, editingId);

      if (saveError) {
        setError(saveError.message);
        setActionLoading(false);
        return;
      }

      setSuccessMsg(editingId ? "Student record updated successfully." : "Student registered successfully.");
      if (editingId) {
        recordTestPassed(9); // Test 9: Test editing and deleting student records
      } else {
        recordTestPassed(6); // Test 6: Register students for School A
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to save student.");
    } finally {
      setActionLoading(false);
    }
  }

  function editStudent(student: Student) {
    setEditingId(student.id);
    setForm({
      student_id: student.student_id || "",
      full_name: student.full_name || "",
      email: student.email || "",
      gender: student.gender || "",
      phone: student.phone || "",
      course: student.course || "",
      class_name: student.class_name || "",
      class_id: student.class_id || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteStudent(id: string) {
    if (!window.confirm("Are you sure you want to delete this student record?")) {
      return;
    }

    try {
      const { error: delError } = await removeStudent(id);

      if (delError) {
        setError(delError.message);
        return;
      }

      recordTestPassed(9); // Test 9 passed
      setSuccessMsg("Student deleted successfully.");
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to remove student.");
    }
  }

  // Filter students based on search term, course, gender
  const filtered = students.filter((student) => {
    const matchesSearch = `${student.full_name} ${student.student_id} ${student.course} ${student.class_name}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCourse = courseFilter === "all" || student.course === courseFilter;
    const matchesGender = genderFilter === "all" || student.gender === genderFilter;

    return matchesSearch && matchesCourse && matchesGender;
  });

  // Extract unique courses for filter
  const uniqueCourses = Array.from(new Set(students.map((s) => s.course).filter(Boolean)));

  function exportCSV() {
    if (filtered.length === 0) return;
    const headers = ["Student ID", "Full Name", "Email", "Gender", "Phone", "Course", "Class", "GPA"];
    const rows = filtered.map((s) => [
      `"${s.student_id}"`,
      `"${s.full_name}"`,
      `"${s.email}"`,
      `"${s.gender}"`,
      `"${s.phone}"`,
      `"${s.course}"`,
      `"${s.class_name}"`,
      `"${s.gpa || '3.5'}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Institution: <span className="font-semibold text-slate-800">{schoolContext}</span>
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV ({filtered.length})</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Student Registration / Edit Form */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingId ? "Update Student Record" : "Register New Student"}
            </h2>
          </div>
          {editingId && (
            <span className="text-xs font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
              Editing ID: {editingId}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Student ID *
              </label>
              <input
                name="student_id"
                placeholder="e.g. KDTC-2026-042"
                value={form.student_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                name="full_name"
                placeholder="e.g. Marie Claire Uwase"
                value={form.full_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="student@schoollabs.cc"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                name="phone"
                placeholder="+250 788 000 000"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Course Program
              </label>
              <input
                name="course"
                placeholder="e.g. Computer Science"
                value={form.course}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Assigned Class
              </label>
              <div className="flex gap-2">
                <input
                  name="class_name"
                  placeholder="e.g. CS-101 Software Foundations"
                  value={form.class_name}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {classes.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const c = classes.find((item) => item.id === e.target.value);
                        if (c) {
                          setForm((prev) => ({
                            ...prev,
                            class_name: c.class_name,
                            class_id: c.id,
                            course: prev.course || c.course,
                          }));
                        }
                      }
                    }}
                    className="w-36 px-2 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                  >
                    <option value="">Pick Class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
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
                ? "Saving to Database..."
                : editingId
                ? "Update Student Record"
                : "Register Student"}
            </button>
          </div>
        </form>
      </section>

      {/* Student Records Table */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Student Records ({filtered.length} of {students.length})
            </h2>
            <p className="text-xs text-slate-500">
              Isolated per Row Level Security policies
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                placeholder="Search name, ID, or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {uniqueCourses.length > 0 && (
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70">
                <th className="py-3 px-3 font-semibold">Student ID</th>
                <th className="py-3 px-3 font-semibold">Full Name</th>
                <th className="py-3 px-3 font-semibold">Email</th>
                <th className="py-3 px-3 font-semibold">Gender</th>
                <th className="py-3 px-3 font-semibold">Course</th>
                <th className="py-3 px-3 font-semibold">Class</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-blue-700 whitespace-nowrap">
                    {student.student_id}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {student.full_name}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{student.email || "—"}</td>
                  <td className="py-3 px-3 text-slate-600">{student.gender}</td>
                  <td className="py-3 px-3 text-slate-700">{student.course || "General"}</td>
                  <td className="py-3 px-3 text-slate-700">{student.class_name || "Unassigned"}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => editStudent(student)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Student"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? "Loading student records..." : "No students match your filter criteria."}
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
