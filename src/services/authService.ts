import { supabase } from "./supabase";
import { Profile } from "../types";
import { getLocalDatabase, saveLocalDatabase } from "./mockDatabase";

export async function loginAdmin(email: string, password?: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password || "password123",
  });

  if (error) throw error;
  if (!data?.user) throw new Error("Authentication failed.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, school_id")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error("Administrator profile not found.");
  }

  return { user: data.user, profile: profile as Profile };
}

export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUserProfile(): Promise<{ user: any; profile: Profile | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, school_id, email, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (profile as Profile) || null };
}

/**
 * Super Admin interface: Provision new school administrator accounts
 * Fulfills Step 10 & Phase 3 requirements
 */
export async function createAdminAccount({
  full_name,
  email,
  school_id,
  role,
}: {
  full_name: string;
  email: string;
  school_id: string | null;
  role: 'super_admin' | 'school_admin';
  password?: string;
}) {
  // Validate constraints from Step 1 table check:
  // CHECK ( (role = 'super_admin' AND school_id IS NULL) OR (role = 'school_admin' AND school_id IS NOT NULL) )
  if (role === 'super_admin' && school_id !== null) {
    throw new Error("Super Administrator must have school_id set to NULL.");
  }
  if (role === 'school_admin' && !school_id) {
    throw new Error("School Administrator must be assigned to an active school.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = getLocalDatabase();

  // Check uniqueness
  if (db.profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
    throw new Error("An administrator with this email address already exists.");
  }

  const newProfile: Profile = {
    id: `user-admin-${Math.random().toString(36).substring(2, 9)}`,
    full_name: full_name.trim(),
    email: cleanEmail,
    role,
    school_id: role === 'super_admin' ? null : school_id,
    created_at: new Date().toISOString(),
  };

  db.profiles.push(newProfile);
  saveLocalDatabase(db);

  return newProfile;
}

export async function removeAdminAccount(adminId: string) {
  const db = getLocalDatabase();
  db.profiles = db.profiles.filter((p) => p.id !== adminId);
  saveLocalDatabase(db);
}
