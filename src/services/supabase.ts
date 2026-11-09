import { createClient } from "@supabase/supabase-js";
import {
  getLocalDatabase,
  saveLocalDatabase,
  getLocalAuthSession,
  setLocalAuthSession,
} from "./mockDatabase";
import { Profile } from "../types";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if valid production Supabase credentials are provided
const hasValidSupabaseEnv =
  Boolean(envUrl) &&
  Boolean(envAnonKey) &&
  typeof envUrl === "string" &&
  !envUrl.includes("your-project") &&
  !envUrl.includes("MY_");

export const isLiveSupabaseActive = hasValidSupabaseEnv;

// Create standard Supabase client if configured
export const realSupabase = hasValidSupabaseEnv
  ? createClient(envUrl, envAnonKey)
  : null;

/**
 * High-fidelity Supabase adapter
 * Directly supports all query operations in the tutorial:
 * - auth.signInWithPassword, auth.signOut, auth.getUser
 * - from('schools').select, insert, update, delete
 * - from('profiles').select, insert, update, delete
 * - from('students').select, insert, update, delete
 * - from('classes').select, insert, update, delete
 * Enforces the exact PostgreSQL Row Level Security (RLS) rules:
 * - is_super_admin() -> can see and modify all
 * - my_school_id() -> school_admin only sees/modifies their own school's records!
 */
class QueryBuilder<T = Record<string, unknown>> {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private isHeadOnly = false;
  private isExactCount = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = "*", options?: { count?: string; head?: boolean }) {
    if (options?.head) {
      this.isHeadOnly = true;
    }
    if (options?.count === "exact") {
      this.isExactCount = true;
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((item: any) => {
      if (item[field] === undefined && value === null) return true;
      return item[field] === value;
    });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  private applyRLS(data: any[]): any[] {
    const session = getLocalAuthSession();
    if (!session) {
      // Unauthenticated
      return [];
    }

    const { profile } = session;

    // Helper functions from Step 2:
    const isSuperAdmin = profile.role === "super_admin";
    const mySchoolId = profile.school_id;

    if (this.tableName === "schools") {
      // "Admins view their schools" -> id = my_school_id() OR is_super_admin()
      return data.filter((school) => isSuperAdmin || school.id === mySchoolId);
    }

    if (this.tableName === "profiles") {
      // "View permitted profiles" -> id = auth.uid() OR school_id = my_school_id() OR is_super_admin()
      return data.filter(
        (p) =>
          isSuperAdmin ||
          p.id === profile.id ||
          (mySchoolId && p.school_id === mySchoolId)
      );
    }

    if (this.tableName === "students") {
      // "View school students" -> school_id = my_school_id() OR is_super_admin()
      return data.filter(
        (student) => isSuperAdmin || student.school_id === mySchoolId
      );
    }

    if (this.tableName === "classes") {
      // "View school classes" -> school_id = my_school_id() OR is_super_admin()
      return data.filter(
        (cls) => isSuperAdmin || cls.school_id === mySchoolId
      );
    }

    return data;
  }

  private getTableData(): any[] {
    const db = getLocalDatabase();
    switch (this.tableName) {
      case "schools":
        return [...db.schools];
      case "profiles":
        return [...db.profiles];
      case "students":
        return [...db.students];
      case "classes":
        return [...db.classes];
      default:
        return [];
    }
  }

  private setTableData(data: any[]): void {
    const db = getLocalDatabase();
    if (this.tableName === "schools") db.schools = data;
    if (this.tableName === "profiles") db.profiles = data;
    if (this.tableName === "students") db.students = data;
    if (this.tableName === "classes") db.classes = data;
    saveLocalDatabase(db);
  }

  private updatePatch: Record<string, any> | null = null;
  private operation: 'select' | 'update' | 'delete' | 'insert' = 'select';

  update(patch: Record<string, any>) {
    this.operation = 'update';
    this.updatePatch = patch;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  async then(resolve: (result: { data: any; error: any; count?: number }) => void) {
    try {
      if (this.operation === 'update') {
        const session = getLocalAuthSession();
        if (!session) {
          resolve({ data: null, error: { message: "Unauthorized." } });
          return;
        }
        const { profile } = session;
        const isSuperAdmin = profile.role === "super_admin";
        const mySchoolId = profile.school_id;

        const current = this.getTableData();
        const updatedRows: any[] = [];
        const patch = this.updatePatch || {};

        const next = current.map((item) => {
          const matches = this.filters.every((f) => f(item));
          if (!matches) return item;

          if (this.tableName === "schools" && !isSuperAdmin) {
            throw new Error("RLS: Only super admin can update schools");
          }
          if (this.tableName === "students" && !isSuperAdmin && item.school_id !== mySchoolId) {
            throw new Error("RLS: Cannot update student belonging to another school");
          }
          if (this.tableName === "classes" && !isSuperAdmin && item.school_id !== mySchoolId) {
            throw new Error("RLS: Cannot update class belonging to another school");
          }

          const updated = { ...item, ...patch, updated_at: new Date().toISOString() };
          updatedRows.push(updated);
          return updated;
        });

        this.setTableData(next);
        resolve({ data: updatedRows, error: null });
        return;
      }

      if (this.operation === 'delete') {
        const session = getLocalAuthSession();
        if (!session) {
          resolve({ data: null, error: { message: "Unauthorized." } });
          return;
        }
        const { profile } = session;
        const isSuperAdmin = profile.role === "super_admin";
        const mySchoolId = profile.school_id;

        const current = this.getTableData();
        const remaining: any[] = [];
        const deleted: any[] = [];

        for (const item of current) {
          const matches = this.filters.every((f) => f(item));
          if (matches) {
            if (this.tableName === "schools" && !isSuperAdmin) {
              resolve({ data: null, error: { message: "RLS: Only super admin can delete schools" } });
              return;
            }
            if (this.tableName === "students" && !isSuperAdmin && item.school_id !== mySchoolId) {
              resolve({ data: null, error: { message: "RLS: Cannot delete student from another school" } });
              return;
            }
            if (this.tableName === "classes" && !isSuperAdmin && item.school_id !== mySchoolId) {
              resolve({ data: null, error: { message: "RLS: Cannot delete class from another school" } });
              return;
            }
            deleted.push(item);
          } else {
            remaining.push(item);
          }
        }

        this.setTableData(remaining);
        resolve({ data: deleted, error: null });
        return;
      }

      let raw = this.getTableData();
      let filtered = this.applyRLS(raw);

      for (const filter of this.filters) {
        filtered = filtered.filter(filter);
      }

      if (this.orderField) {
        const field = this.orderField;
        const asc = this.orderAscending;
        filtered.sort((a, b) => {
          const valA = a[field] ?? "";
          const valB = b[field] ?? "";
          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });
      }

      const count = filtered.length;

      if (this.isHeadOnly) {
        resolve({ data: null, error: null, count });
        return;
      }

      resolve({ data: filtered, error: null, count: this.isExactCount ? count : undefined });
    } catch (err: any) {
      resolve({ data: null, error: { message: err?.message || "Database error" } });
    }
  }

  async single(): Promise<{ data: any; error: any }> {
    let raw = this.getTableData();
    let filtered = this.applyRLS(raw);
    for (const filter of this.filters) {
      filtered = filtered.filter(filter);
    }
    if (filtered.length === 0) {
      return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
    }
    return { data: filtered[0], error: null };
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    let raw = this.getTableData();
    let filtered = this.applyRLS(raw);
    for (const filter of this.filters) {
      filtered = filtered.filter(filter);
    }
    return { data: filtered[0] || null, error: null };
  }

  async insert(rows: any[]): Promise<{ data: any; error: any }> {
    const session = getLocalAuthSession();
    if (!session) {
      return { data: null, error: { message: "Unauthorized. Authentication required." } };
    }
    const { profile } = session;
    const isSuperAdmin = profile.role === "super_admin";
    const mySchoolId = profile.school_id;

    for (const row of rows) {
      if (this.tableName === "schools" && !isSuperAdmin) {
        return { data: null, error: { message: "RLS policy: Super admin creates schools required" } };
      }
      if (this.tableName === "students") {
        if (!isSuperAdmin && row.school_id !== mySchoolId) {
          return { data: null, error: { message: "RLS policy: Cannot insert student into foreign school" } };
        }
      }
      if (this.tableName === "classes") {
        if (!isSuperAdmin && row.school_id !== mySchoolId) {
          return { data: null, error: { message: "RLS policy: Cannot insert class into foreign school" } };
        }
      }
    }

    const current = this.getTableData();
    const newItems = rows.map((r) => ({
      ...r,
      id: r.id || `gen-${Math.random().toString(36).substring(2, 9)}`,
      created_at: r.created_at || new Date().toISOString(),
    }));

    this.setTableData([...newItems, ...current]);
    return { data: newItems, error: null };
  }
}

// Simulated Auth Client
const mockAuth = {
  async signInWithPassword({ email, password }: { email: string; password?: string }) {
    const db = getLocalDatabase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if profile exists
    const profile = db.profiles.find(
      (p) => p.email.toLowerCase() === cleanEmail
    );

    if (!profile) {
      return {
        data: { user: null, session: null },
        error: { message: "Invalid administrator login credentials." },
      };
    }

    const session = {
      user: {
        id: profile.id,
        email: profile.email,
      },
      profile,
    };

    setLocalAuthSession(session);

    return {
      data: {
        user: session.user,
        session: { access_token: "mock-token", user: session.user },
      },
      error: null,
    };
  },

  async signOut() {
    setLocalAuthSession(null);
    return { error: null };
  },

  async getUser() {
    const session = getLocalAuthSession();
    if (!session) {
      return { data: { user: null }, error: null };
    }
    return { data: { user: session.user }, error: null };
  },
};

/**
 * Universal supabase client export
 * Falls back to our complete in-browser RLS database if live keys are not configured.
 */
export const supabase = realSupabase || {
  auth: mockAuth,
  from(tableName: string) {
    return new QueryBuilder(tableName);
  },
};
