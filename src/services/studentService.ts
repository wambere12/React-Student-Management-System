import { supabase } from "./supabase";
import { Student } from "../types";

export async function getStudents(filterSchoolId?: string | null) {
  let query = supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (filterSchoolId) {
    query = query.eq("school_id", filterSchoolId);
  }

  return await query;
}

export async function saveStudent(
  student: Partial<Student>,
  editingId?: string | null
) {
  if (editingId) {
    return await supabase
      .from("students")
      .update(student)
      .eq("id", editingId);
  }

  return await supabase
    .from("students")
    .insert([student]);
}

export async function removeStudent(id: string) {
  return await supabase
    .from("students")
    .delete()
    .eq("id", id);
}
