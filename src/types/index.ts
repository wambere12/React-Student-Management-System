export type Role = 'super_admin' | 'school_admin';

export interface School {
  id: string;
  school_name: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  capacity?: number;
  principal_name?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  school_id: string | null;
  created_at: string;
}

export interface ClassItem {
  id: string;
  school_id: string;
  class_name: string;
  course: string;
  teacher_name?: string;
  room_number?: string;
  capacity?: number;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other' | string;
  phone: string;
  course: string;
  class_name: string;
  class_id?: string | null;
  school_id: string | null;
  status?: 'Active' | 'Graduated' | 'Suspended';
  enrollment_date?: string;
  gpa?: string;
  created_at: string;
  updated_at?: string;
}

export interface SystemStats {
  studentsCount: number;
  classesCount: number;
  schoolsCount: number;
  adminsCount: number;
  activeSchoolName: string;
}

export interface VerificationTestItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  actionRequired?: string;
}
