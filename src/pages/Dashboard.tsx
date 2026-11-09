import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  Users,
  GraduationCap,
  Building2,
  TrendingUp,
  ArrowRight,
  Shield,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Student, ClassItem } from "../types";

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    schools: 0,
    school: "Loading...",
    role: "school_admin",
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      let studentQuery = supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      let classQuery = supabase
        .from("classes")
        .select("*", { count: "exact", head: true });

      let schoolName = "All Schools";

      if (profile.role === "school_admin") {
        studentQuery = studentQuery.eq("school_id", profile.school_id);
        classQuery = classQuery.eq("school_id", profile.school_id);

        const { data: school } = await supabase
          .from("schools")
          .select("school_name")
          .eq("id", profile.school_id)
          .single();

        schoolName = school?.school_name || "My School";
      }

      const [studentsCountRes, classesCountRes, schoolsCountRes, studentsData, classesData] =
        await Promise.all([
          studentQuery,
          classQuery,
          supabase.from("schools").select("*", { count: "exact", head: true }),
          supabase.from("students").select("*").order("created_at", { ascending: false }),
          supabase.from("classes").select("*").order("created_at", { ascending: false }),
        ]);

      setStats({
        students: studentsCountRes.count || 0,
        classes: classesCountRes.count || 0,
        schools: schoolsCountRes.count || 0,
        school: schoolName,
        role: profile.role,
      });

      setRecentStudents(((studentsData.data as Student[]) || []).slice(0, 5));
      setClassList(((classesData.data as ClassItem[]) || []).slice(0, 5));
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const isSuperAdmin = stats.role === "super_admin";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome to <span className="font-semibold text-slate-700">{stats.school}</span> · Row Level Security Isolated
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/students"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <span>Manage Students</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Students</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {loading ? "..." : stats.students}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isSuperAdmin ? "Enrolled across all registered schools" : "Active student records in this school"}
          </p>
        </div>

        {/* Total Classes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Classes</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {loading ? "..." : stats.classes}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isSuperAdmin ? "Active academic cohorts platform-wide" : "Assigned cohorts & laboratories"}
          </p>
        </div>

        {/* School Context */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {isSuperAdmin ? "Registered Schools" : "Assigned School"}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 truncate">
            {loading ? "..." : isSuperAdmin ? `${stats.schools} Schools Active` : stats.school}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isSuperAdmin ? "Manage participating tenant institutions" : "Strict database boundary enforced"}
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Students & Class Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Students Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Student Enrolments</h2>
              <p className="text-xs text-slate-500">Most recent verified students in this context</p>
            </div>
            <Link to="/students" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all ({stats.students}) &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">Student ID</th>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Course</th>
                  <th className="py-2.5 px-3 font-semibold">Class</th>
                  <th className="py-2.5 px-3 font-semibold text-right">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600">{s.student_id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{s.full_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.course}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.class_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-900 text-right tabular-nums">
                      {s.gpa || "3.50"}
                    </td>
                  </tr>
                ))}
                {recentStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No student records found in this school context.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classes & Architecture Overview (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Active Classes</h2>
                <p className="text-xs text-slate-500">Classrooms and courses</p>
              </div>
              <Link to="/classes" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                View &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {classList.map((c) => (
                <div key={c.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70">
                  <p className="text-xs font-semibold text-slate-900 truncate">{c.class_name}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{c.course}</span>
                    <span className="font-mono">{c.room_number || "Room A"}</span>
                  </div>
                </div>
              ))}
              {classList.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No classes configured.</p>
              )}
            </div>
          </div>

          {/* System Security Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Tenant Architecture
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostgreSQL Row Level Security (RLS) policies prevent unauthorized cross-school data leakage.
              Each school administrator operates inside their school's isolated partition.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>SECURITY DEFINER</span>
              <span className="text-emerald-600 font-semibold">RLS ENFORCED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
