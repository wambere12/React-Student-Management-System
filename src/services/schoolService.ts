import { supabase } from "./supabase";
import { School } from "../types";

export async function getSchools() {
  return await supabase
    .from("schools")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function getSchoolById(schoolId: string) {
  return await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .single();
}

export async function saveSchool(
  schoolData: Partial<School>,
  editingId?: string | null
) {
  if (editingId) {
    return await supabase
      .from("schools")
      .update(schoolData)
      .eq("id", editingId);
  }

  return await supabase
    .from("schools")
    .insert([schoolData]);
}

export async function removeSchool(id: string) {
  return await supabase
    .from("schools")
    .delete()
    .eq("id", id);
}
