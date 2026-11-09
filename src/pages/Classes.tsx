import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import {
  getClasses,
  saveClass,
  removeClass,
} from "../services/classService";
import { getStudents } from "../services/studentService";
import { ClassItem, Student } from "../types";
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Users,
  Search,
  Check,
  AlertCircle,
  DoorOpen,
} from "lucide-react";

const emptyClassForm = {
  class_name: "",
  course: "",
  teacher_name: "",
  room_number: "",
  capacity: 30,
};

export default function Classes() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyClassForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [classesRes, studentsRes] = await Promise.all([
        getClasses(),
        getStudents(),
      ]);

      if (classesRes.error) {
        setError(classesRes.error.message);
      } else {
        const list = (classesRes.data as ClassItem[]) || [];
        setClasses(list);
        if (list.length > 0 && !selectedClass) {
          setSelectedClass(list[0]);
        }
      }

      if (!studentsRes.error && studentsRes.data) {
        setStudents(studentsRes.data as Student[]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load classes.");
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
      [name]: name === "capacity" ? parseInt(value) || 0 : value,
    }));
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setError("Administrator profile not found.");
        setActionLoading(false);
        return;
      }

      const classData: Record<string, any> = { ...form };

      if (!editingId) {
        // Enforce school_id from authenticated profile
        classData.school_id =
          profile.role === "school_admin" ? profile.school_id : profile.school_id || "school-uuid-kigali-001";
      } else {
        delete classData.school_id;
      }

      const { error: saveError } = await saveClass(classData, editingId);

      if (saveError) {
        setError(saveError.message);
        setActionLoading(false);
        return;
      }

      setSuccessMsg(editingId ? "Class cohort updated." : "New class created successfully.");
      setForm(emptyClassForm);
      setEditingId(null);
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to save class.");
    } finally {
      setActionLoading(false);
    }
  }

  function editClass(cls: ClassItem) {
    setEditingId(cls.id);
    setForm({
      class_name: cls.class_name,
      course: cls.course || "",
      teacher_name: cls.teacher_name || "",
      room_number: cls.room_number || "",
      capacity: cls.capacity || 30,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteClass(id: string) {
    if (!window.confirm("Are you sure you want to delete this class?")) {
      return;
    }

    try {
      const { error: delError } = await removeClass(id);
      if (delError) {
        setError(delError.message);
        return;
      }

      setSuccessMsg("Class removed successfully.");
      if (selectedClass?.id === id) {
        setSelectedClass(null);
      }
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to remove class.");
    }
  }

  const filteredClasses = classes.filter((c) =>
    `${c.class_name} ${c.course} ${c.teacher_name} ${c.room_number}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Enrolled students in selected class
  const classStudents = selectedClass
    ? students.filter((s) => s.class_id === selectedClass.id || s.class_name === selectedClass.class_name)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Class & Course Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 3 Milestone: Assign curriculum cohorts, instructors, and monitor capacity
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

      {/* Class Form */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            {editingId ? "Update Class Cohort" : "Create New Class Cohort"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Class Name *
              </label>
              <input
                name="class_name"
                placeholder="e.g. CS-101 Software Foundations"
                value={form.class_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Course Program *
              </label>
              <input
                name="course"
                placeholder="e.g. Computer Science"
                value={form.course}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Teacher / Advisor
              </label>
              <input
                name="teacher_name"
                placeholder="e.g. Dr. Eric Munyaneza"
                value={form.teacher_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Room / Laboratory
              </label>
              <input
                name="room_number"
                placeholder="e.g. Lab 3B / Hall 1"
                value={form.room_number}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Student Capacity
              </label>
              <input
                name="capacity"
                type="number"
                min="5"
                max="100"
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
                  setForm(emptyClassForm);
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
                ? "Saving..."
                : editingId
                ? "Update Class Cohort"
                : "Create Class Cohort"}
            </button>
          </div>
        </form>
      </section>

      {/* Grid: Classes List and Class Details/Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                School Classes ({filteredClasses.length})
              </h2>
              <p className="text-xs text-slate-500">Active class cohorts</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                placeholder="Search classes..."
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
                  <th className="py-2.5 px-3 font-semibold">Class Name</th>
                  <th className="py-2.5 px-3 font-semibold">Course</th>
                  <th className="py-2.5 px-3 font-semibold">Teacher</th>
                  <th className="py-2.5 px-3 font-semibold">Room</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Capacity</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => {
                  const enrolledCount = students.filter(
                    (s) => s.class_id === cls.id || s.class_name === cls.class_name
                  ).length;
                  const isSelected = selectedClass?.id === cls.id;

                  return (
                    <tr
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/80 font-medium" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-900">{cls.class_name}</td>
                      <td className="py-3 px-3 text-slate-600">{cls.course}</td>
                      <td className="py-3 px-3 text-slate-600">{cls.teacher_name || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{cls.room_number || "—"}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="text-blue-700 font-semibold">{enrolledCount}</span> / {cls.capacity || 30}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => editClass(cls)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteClass(cls.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredClasses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No classes found. Register a class cohort above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Class Roster View */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="pb-3 mb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              {selectedClass ? selectedClass.class_name : "Select a Class"}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedClass ? `Instructor: ${selectedClass.teacher_name || "Unassigned"}` : "Click a class row"}
            </p>
          </div>

          {selectedClass ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Enrolled Students:</span>
                <span className="font-mono font-bold text-blue-600">
                  {classStudents.length} / {selectedClass.capacity || 30}
                </span>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                {classStudents.map((stu) => (
                  <div
                    key={stu.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{stu.full_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{stu.student_id}</p>
                    </div>
                    <span className="text-[11px] text-slate-500">{stu.gender}</span>
                  </div>
                ))}

                {classStudents.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No students currently assigned to this class cohort.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a class on the left to view enrolled student roster.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
