import { useState } from "react";
import { Copy, Check, Database, Shield, FileCode2, Terminal, RefreshCw } from "lucide-react";
import { resetDatabaseToSeed } from "../services/mockDatabase";

const STEP1_SQL = `-- Step 1: Multi-School Database Structure
-- 1. Schools
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(200) NOT NULL,
    school_code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Administrator profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    school_id UUID REFERENCES public.schools(id),
    role VARCHAR(30) NOT NULL
        CHECK (role IN ('super_admin', 'school_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (role = 'super_admin' AND school_id IS NULL)
        OR
        (role = 'school_admin' AND school_id IS NOT NULL)
    )
);

-- 3. School classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id)
        ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL,
    course VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, class_name)
);

-- 4. Update the existing students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS school_id UUID
REFERENCES public.schools(id) ON DELETE CASCADE;

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS class_id UUID
REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_students_school
ON public.students(school_id);

CREATE INDEX IF NOT EXISTS idx_students_class
ON public.students(class_id);

CREATE INDEX IF NOT EXISTS idx_profiles_school
ON public.profiles(school_id);`;

const STEP2_SQL = `-- Step 2: PostgreSQL Row Level Security (RLS) Configuration
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'super_admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.my_school_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT school_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'school_admin';
$$;

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Schools Policies
CREATE POLICY "Admins view their schools"
ON public.schools FOR SELECT
TO authenticated
USING (
    id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

CREATE POLICY "Super admin creates schools"
ON public.schools FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT public.is_super_admin())
);

CREATE POLICY "Super admin updates schools"
ON public.schools FOR UPDATE
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Super admin deletes schools"
ON public.schools FOR DELETE
TO authenticated
USING ((SELECT public.is_super_admin()));

-- Profiles Policies
CREATE POLICY "View permitted profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())
    OR school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

-- Students Policies
CREATE POLICY "View school students"
ON public.students FOR SELECT
TO authenticated
USING (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

CREATE POLICY "Register school students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

CREATE POLICY "Update school students"
ON public.students FOR UPDATE
TO authenticated
USING (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
)
WITH CHECK (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

CREATE POLICY "Delete school students"
ON public.students FOR DELETE
TO authenticated
USING (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

-- Classes Policies
CREATE POLICY "View school classes"
ON public.classes FOR SELECT
TO authenticated
USING (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

CREATE POLICY "Create school classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

CREATE POLICY "Update school classes"
ON public.classes FOR UPDATE
TO authenticated
USING (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
)
WITH CHECK (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);

CREATE POLICY "Delete school classes"
ON public.classes FOR DELETE
TO authenticated
USING (
    school_id = (SELECT public.my_school_id())
    OR (SELECT public.is_super_admin())
);`;

export default function DatabaseSQL() {
  const [copiedStep1, setCopiedStep1] = useState(false);
  const [copiedStep2, setCopiedStep2] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  function copyCode(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleResetSeed() {
    if (window.confirm("Reset all test data back to default Kigali Digital and Greenfield STEM seed?")) {
      resetDatabaseToSeed();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">PostgreSQL & RLS SQL Architecture</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 1 and Step 2 database upgrade scripts, security definitions, and policy blueprints
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo Seed Data</span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800">
          Demo database state reset to initial seed data.
        </div>
      )}

      {/* RLS Overview Banner */}
      <div className="p-5 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Multi-Tenant Isolation Guaranteed by Database Kernel</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            School administrators are restricted at the database row level. Even if an attacker tampers
            with browser API requests, the query <code className="text-emerald-400 font-mono">school_id = my_school_id()</code> is
            enforced by PostgreSQL itself via Row Level Security.
          </p>
        </div>
      </div>

      {/* Step 1 Code Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Step 1: Multi-School Database Tables & Constraints</h2>
              <p className="text-xs text-slate-500">Run in Supabase SQL Editor &rarr; New Query</p>
            </div>
          </div>

          <button
            onClick={() => copyCode(STEP1_SQL, setCopiedStep1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            {copiedStep1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedStep1 ? "Copied SQL!" : "Copy Step 1 SQL"}</span>
          </button>
        </div>

        <pre className="bg-slate-950 text-slate-200 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
          {STEP1_SQL}
        </pre>
      </section>

      {/* Step 2 Code Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Step 2: Row Level Security (RLS) Policies & Functions</h2>
              <p className="text-xs text-slate-500">Enforces school isolation across schools, profiles, classes, and students</p>
            </div>
          </div>

          <button
            onClick={() => copyCode(STEP2_SQL, setCopiedStep2)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            {copiedStep2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedStep2 ? "Copied SQL!" : "Copy Step 2 SQL"}</span>
          </button>
        </div>

        <pre className="bg-slate-950 text-slate-200 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-[440px] leading-relaxed border border-slate-800">
          {STEP2_SQL}
        </pre>
      </section>
    </div>
  );
}
