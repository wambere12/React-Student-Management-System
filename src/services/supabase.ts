import { createClient } from "@supabase/supabase-js";
import {
  getLocalDatabase,
  saveLocalDatabase,
  getLocalAuthSession,
  setLocalAuthSession,
  INITIAL_PROFILES,
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

export const isLiveSupabaseAvailable = hasValidSupabaseEnv;
export const liveSupabaseUrl = envUrl || "";

// Standard Supabase client if configured
export const realSupabase = hasValidSupabaseEnv
  ? createClient(envUrl, envAnonKey)
  : null;

// Database Connection Mode: 'sandbox' (instant test accounts & RLS) or 'live' (remote Supabase)
const MODE_STORAGE_KEY = 'edumanage_connection_mode_v2';

export function getDatabaseMode(): 'sandbox' | 'live' {
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === 'live' && hasValidSupabaseEnv) {
    return 'live';
  }
  // Default to 'sandbox' so the 3 demo roles work right away with zero 400 errors
  return 'sandbox';
}

export function setDatabaseMode(mode: 'sandbox' | 'live'): void {
  localStorage.setItem(MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new Event('edumanage_mode_updated'));
}

/**
 * High-fidelity QueryBuilder implementing PostgreSQL Row Level Security (RLS)
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
  private updatePatch: Record<string, any> | null = null;
  private operation: 'select' | 'update' | 'delete' | 'insert' = 'select';

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

  update(patch: Record<string, any>) {
    this.operation = 'update';
    this.updatePatch = patch;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  private applyRLS(data: any[]): any[] {
    const session = getLocalAuthSession();
    if (!session) {
      return [];
    }

    const { profile } = session;
    const isSuperAdmin = profile.role === "super_admin";
    const mySchoolId = profile.school_id;

    if (this.tableName === "schools") {
      return data.filter((school) => isSuperAdmin || school.id === mySchoolId);
    }

    if (this.tableName === "profiles") {
      return data.filter(
        (p) =>
          isSuperAdmin ||
          p.id === profile.id ||
          (mySchoolId && p.school_id === mySchoolId)
      );
    }

    if (this.tableName === "students") {
      return data.filter(
        (student) => isSuperAdmin || student.school_id === mySchoolId
      );
    }

    if (this.tableName === "classes") {
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

// In-browser Auth simulation for instant testing
const mockAuth = {
  async signInWithPassword({ email, password }: { email: string; password?: string }) {
    const db = getLocalDatabase();
    const cleanEmail = (email || "").trim().toLowerCase();

    // Look for matching profile
    let profile = db.profiles.find(
      (p) => p.email.toLowerCase() === cleanEmail || p.email.toLowerCase().startsWith(cleanEmail)
    );

    if (!profile) {
      profile = INITIAL_PROFILES.find(
        (p) => p.email.toLowerCase() === cleanEmail || p.email.toLowerCase().startsWith(cleanEmail)
      );
      if (profile) {
        db.profiles.push(profile);
        saveLocalDatabase(db);
      }
    }

    if (!profile) {
      return {
        data: { user: null, session: null },
        error: {
          message:
            "Invalid administrator login credentials. Try superadmin@edumanage.io, admin.kigali@schoollabs.cc, or admin.greenfield@schoollabs.cc with password: password123",
        },
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
 * Universal Supabase Client:
 * Handles both Sandbox Mode (instant testing with zero 400 errors) and Live Supabase Cloud.
 */
export const supabase = {
  auth: {
    async signInWithPassword(credentials: { email: string; password?: string }) {
      const mode = getDatabaseMode();
      const cleanEmail = (credentials.email || "").trim().toLowerCase();
      const isKnownDemoAccount = INITIAL_PROFILES.some(
        (p) => p.email.toLowerCase() === cleanEmail
      );

      // If user is testing with demo account in Live mode, or in Sandbox mode:
      if (mode === "sandbox" || isKnownDemoAccount) {
        return await mockAuth.signInWithPassword(credentials);
      }

      // If Live Supabase is explicitly configured and custom user is logging in:
      if (realSupabase) {
        try {
          const res = await realSupabase.auth.signInWithPassword(credentials as any);
          if (res.error) {
            // If remote doesn't have this user, fallback to mockAuth
            const localRes = await mockAuth.signInWithPassword(credentials);
            if (!localRes.error) return localRes;
            return res;
          }
          return res;
        } catch {
          return await mockAuth.signInWithPassword(credentials);
        }
      }

      return await mockAuth.signInWithPassword(credentials);
    },

    async signOut() {
      if (realSupabase) {
        try {
          await realSupabase.auth.signOut();
        } catch {}
      }
      return await mockAuth.signOut();
    },

    async getUser() {
      const session = getLocalAuthSession();
      if (session) {
        return { data: { user: session.user }, error: null };
      }
      if (realSupabase && getDatabaseMode() === "live") {
        try {
          return await realSupabase.auth.getUser();
        } catch {}
      }
      return await mockAuth.getUser();
    },
  },

  from(tableName: string) {
    const mode = getDatabaseMode();
    if (mode === "live" && realSupabase) {
      return (realSupabase as any).from(tableName);
    }
    return new QueryBuilder(tableName);
  },
};
