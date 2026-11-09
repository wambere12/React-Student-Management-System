import { supabase } from "./supabase";
import { ClassItem } from "../types";

export async function getClasses(filterSchoolId?: string | null) {
  let query = supabase
    .from("classes")
    .select("*")
    .order("created_at", { ascending: false });

  if (filterSchoolId) {
    query = query.eq("school_id", filterSchoolId);
  }

  return await query;
}

export async function saveClass(
  classData: Partial<ClassItem>,
  editingId?: string | null
) {
  if (editingId) {
    return await supabase
      .from("classes")
      .update(classData)
      .eq("id", editingId);
  }

  return await supabase
    .from("classes")
    .insert([classData]);
}

export async function removeClass(id: string) {
  return await supabase
    .from("classes")
    .delete()
    .eq("id", id);
}
