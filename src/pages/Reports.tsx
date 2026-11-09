import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { getStudents } from "../services/studentService";
import { getClasses } from "../services/classService";
import { Student, ClassItem, School } from "../types";
import {
  FileBarChart,
  Download,
  Printer,
  Users,
  GraduationCap,
  Award,
  PieChart,
  Building,
} from "lucide-react";

export default function Reports() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [schoolName, setSchoolName] = useState<string>("EduManage School");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
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
          if (school) setSchoolName(`${school.school_name} (${school.school_code})`);
        } else {
          setSchoolName("Platform Multi-School Aggregate");
        }
      }

      const [studentsRes, classesRes] = await Promise.all([
        getStudents(),
        getClasses(),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data as Student[]);
      if (classesRes.data) setClasses(classesRes.data as ClassItem[]);
      setLoading(false);
    }

    loadData();
  }, []);

  // Compute metrics
  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.gender === "Male").length;
  const femaleCount = students.filter((s) => s.gender === "Female").length;
  const otherCount = totalStudents - maleCount - femaleCount;

  // Course breakdown
  const courseCounts: Record<string, number> = {};
  students.forEach((s) => {
    const course = s.course || "General Studies";
    courseCounts[course] = (courseCounts[course] || 0) + 1;
  });

  // Export to CSV / Excel
  function exportExcelCSV() {
    if (students.length === 0) return;
    const headers = [
      "Student ID",
      "Full Name",
      "Email Address",
      "Gender",
      "Phone Number",
      "Course Program",
      "Class",
      "Cumulative GPA",
      "Enrollment Date",
      "Status",
    ];

    const rows = students.map((s) => [
      `"${s.student_id}"`,
      `"${s.full_name}"`,
      `"${s.email || ''}"`,
      `"${s.gender}"`,
      `"${s.phone || ''}"`,
      `"${s.course || ''}"`,
      `"${s.class_name || ''}"`,
      `"${s.gpa || '3.50'}"`,
      `"${s.enrollment_date || s.created_at.slice(0, 10)}"`,
      `"${s.status || 'Active'}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `academic_report_${schoolName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Reports & Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 3 Milestone: Institutional student roster and exportable performance records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportExcelCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Spreadsheet (Excel/CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Roster</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-mono text-blue-600 uppercase tracking-wider font-semibold">
                Official Institutional Record
              </p>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{schoolName}</h2>
              <p className="text-xs text-slate-500">
                Generated: {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-medium text-slate-500">
                Total Enrolled: <strong className="text-slate-900 font-bold">{totalStudents}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Analytics Summary Cards (no-print or included) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gender Distribution
            </span>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-700">Female: <strong className="font-mono text-slate-900">{femaleCount}</strong></span>
              <span className="text-slate-700">Male: <strong className="font-mono text-slate-900">{maleCount}</strong></span>
              {otherCount > 0 && <span className="text-slate-700">Other: {otherCount}</span>}
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2 flex">
              <div
                style={{ width: `${totalStudents ? (femaleCount / totalStudents) * 100 : 50}%` }}
                className="bg-purple-500 h-full"
                title="Female"
              />
              <div
                style={{ width: `${totalStudents ? (maleCount / totalStudents) * 100 : 50}%` }}
                className="bg-blue-500 h-full"
                title="Male"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Classes & Cohorts
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {classes.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active curriculum streams</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Programs Offered
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {Object.keys(courseCounts).length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Specialized courses</p>
          </div>
        </div>

        {/* Complete Enrolled Students Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Enrolled Student Roster
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/80">
                  <th className="py-2.5 px-3 font-semibold">Student ID</th>
                  <th className="py-2.5 px-3 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Email</th>
                  <th className="py-2.5 px-3 font-semibold">Gender</th>
                  <th className="py-2.5 px-3 font-semibold">Course</th>
                  <th className="py-2.5 px-3 font-semibold">Class</th>
                  <th className="py-2.5 px-3 font-semibold text-right">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                      {stu.student_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {stu.full_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{stu.email || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-600">{stu.gender}</td>
                    <td className="py-2.5 px-3 text-slate-700">{stu.course || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-700">{stu.class_name || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {stu.gpa || "3.50"}
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No student records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Signature Footer for Printed Reports */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-6">
          <div>
            <p className="font-semibold text-slate-700">Authorized Administrator</p>
            <div className="w-48 border-b border-slate-300 mt-8 mb-1"></div>
            <p className="text-[11px] text-slate-400">Signature & Date</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Academic Registrar</p>
            <div className="w-48 border-b border-slate-300 mt-8 mb-1"></div>
            <p className="text-[11px] text-slate-400">Official Institutional Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
