import { School, Profile, ClassItem, Student } from '../types';

const STORAGE_KEY = 'edumanage_database_v2';
const AUTH_KEY = 'edumanage_auth_session_v2';

export interface DatabaseState {
  schools: School[];
  profiles: Profile[];
  classes: ClassItem[];
  students: Student[];
}

// Initial seed data based on Step 1, Step 10 and realistic multi-school environment
const INITIAL_SCHOOLS: School[] = [
  {
    id: 'school-uuid-kigali-001',
    school_name: 'Kigali Digital Training Centre',
    school_code: 'KDTC001',
    email: 'info@kigali-digital.rw',
    phone: '+250 788 123 456',
    address: 'KG 543 St, Kigali, Rwanda',
    capacity: 650,
    principal_name: 'Dr. Jean-Paul Kagabo',
    created_at: new Date('2026-01-15T08:00:00Z').toISOString(),
  },
  {
    id: 'school-uuid-greenfield-002',
    school_name: 'Greenfield STEM Academy',
    school_code: 'GSA002',
    email: 'admissions@greenfield.edu',
    phone: '+254 722 987 654',
    address: '42 Acacia Avenue, Nairobi, Kenya',
    capacity: 900,
    principal_name: 'Prof. Sarah Muthoni',
    created_at: new Date('2026-02-01T09:30:00Z').toISOString(),
  },
  {
    id: 'school-uuid-horizon-003',
    school_name: 'Horizon International College',
    school_code: 'HIC003',
    email: 'info@horizon.ac.za',
    phone: '+27 21 555 7890',
    address: '15 Highbury Road, Cape Town, South Africa',
    capacity: 1200,
    principal_name: 'Markus van der Merwe',
    created_at: new Date('2026-02-20T11:00:00Z').toISOString(),
  },
];

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-uuid-super-admin',
    full_name: 'Alex Rivera (Platform Super Admin)',
    email: 'superadmin@edumanage.io',
    role: 'super_admin',
    school_id: null,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'user-uuid-admin-kigali',
    full_name: 'Claire Uwera (Kigali Admin)',
    email: 'admin.kigali@schoollabs.cc',
    role: 'school_admin',
    school_id: 'school-uuid-kigali-001',
    created_at: new Date('2026-01-16T10:00:00Z').toISOString(),
  },
  {
    id: 'user-uuid-admin-greenfield',
    full_name: 'David Ochieng (Greenfield Admin)',
    email: 'admin.greenfield@schoollabs.cc',
    role: 'school_admin',
    school_id: 'school-uuid-greenfield-002',
    created_at: new Date('2026-02-02T12:00:00Z').toISOString(),
  },
];

const INITIAL_CLASSES: ClassItem[] = [
  // Kigali Classes
  {
    id: 'class-kigali-01',
    school_id: 'school-uuid-kigali-001',
    class_name: 'CS-101 Software Foundations',
    course: 'Computer Science',
    teacher_name: 'Eng. Eric Munyaneza',
    room_number: 'Lab 3B',
    capacity: 35,
    created_at: new Date('2026-01-18T08:00:00Z').toISOString(),
  },
  {
    id: 'class-kigali-02',
    school_id: 'school-uuid-kigali-001',
    class_name: 'CYB-201 Network Defense',
    course: 'Cybersecurity',
    teacher_name: 'Marie Diane Mugeni',
    room_number: 'Hall 1',
    capacity: 30,
    created_at: new Date('2026-01-20T09:00:00Z').toISOString(),
  },
  {
    id: 'class-kigali-03',
    school_id: 'school-uuid-kigali-001',
    class_name: 'AI-301 Machine Intelligence',
    course: 'Data Science',
    teacher_name: 'Dr. Patrick Habimana',
    room_number: 'Innovation Hub',
    capacity: 25,
    created_at: new Date('2026-01-25T11:00:00Z').toISOString(),
  },
  // Greenfield Classes
  {
    id: 'class-greenfield-01',
    school_id: 'school-uuid-greenfield-002',
    class_name: 'ROB-101 Applied Robotics',
    course: 'Mechatronics',
    teacher_name: 'Dr. Grace Wanjiku',
    room_number: 'Hangar A',
    capacity: 40,
    created_at: new Date('2026-02-05T08:30:00Z').toISOString(),
  },
  {
    id: 'class-greenfield-02',
    school_id: 'school-uuid-greenfield-002',
    class_name: 'BIO-204 Genomics & Bioinformatics',
    course: 'Biotechnology',
    teacher_name: 'Prof. Joseph Otieno',
    room_number: 'BioLab 2',
    capacity: 30,
    created_at: new Date('2026-02-10T10:15:00Z').toISOString(),
  },
];

const INITIAL_STUDENTS: Student[] = [
  // Kigali Students (School A)
  {
    id: 'stu-kigali-001',
    student_id: 'KDTC-2026-014',
    full_name: 'Aline Umutoni',
    email: 'a.umutoni@student.kigali.rw',
    gender: 'Female',
    phone: '+250 788 111 222',
    course: 'Computer Science',
    class_name: 'CS-101 Software Foundations',
    class_id: 'class-kigali-01',
    school_id: 'school-uuid-kigali-001',
    status: 'Active',
    enrollment_date: '2026-01-20',
    gpa: '3.88',
    created_at: new Date('2026-01-22T08:00:00Z').toISOString(),
  },
  {
    id: 'stu-kigali-002',
    student_id: 'KDTC-2026-015',
    full_name: 'Fabrice Ndayisaba',
    email: 'f.ndayisaba@student.kigali.rw',
    gender: 'Male',
    phone: '+250 788 333 444',
    course: 'Cybersecurity',
    class_name: 'CYB-201 Network Defense',
    class_id: 'class-kigali-02',
    school_id: 'school-uuid-kigali-001',
    status: 'Active',
    enrollment_date: '2026-01-21',
    gpa: '3.65',
    created_at: new Date('2026-01-23T09:15:00Z').toISOString(),
  },
  {
    id: 'stu-kigali-003',
    student_id: 'KDTC-2026-016',
    full_name: 'Sonia Mukamwezi',
    email: 's.mukamwezi@student.kigali.rw',
    gender: 'Female',
    phone: '+250 788 555 666',
    course: 'Data Science',
    class_name: 'AI-301 Machine Intelligence',
    class_id: 'class-kigali-03',
    school_id: 'school-uuid-kigali-001',
    status: 'Active',
    enrollment_date: '2026-01-22',
    gpa: '3.92',
    created_at: new Date('2026-01-24T10:30:00Z').toISOString(),
  },
  {
    id: 'stu-kigali-004',
    student_id: 'KDTC-2026-017',
    full_name: 'Christian Niyonzima',
    email: 'c.niyonzima@student.kigali.rw',
    gender: 'Male',
    phone: '+250 788 777 888',
    course: 'Computer Science',
    class_name: 'CS-101 Software Foundations',
    class_id: 'class-kigali-01',
    school_id: 'school-uuid-kigali-001',
    status: 'Active',
    enrollment_date: '2026-01-23',
    gpa: '3.42',
    created_at: new Date('2026-01-25T14:00:00Z').toISOString(),
  },

  // Greenfield Students (School B)
  {
    id: 'stu-greenfield-001',
    student_id: 'GSA-2026-088',
    full_name: 'Brian Kipkorir',
    email: 'b.kipkorir@students.greenfield.edu',
    gender: 'Male',
    phone: '+254 711 222 333',
    course: 'Mechatronics',
    class_name: 'ROB-101 Applied Robotics',
    class_id: 'class-greenfield-01',
    school_id: 'school-uuid-greenfield-002',
    status: 'Active',
    enrollment_date: '2026-02-08',
    gpa: '3.75',
    created_at: new Date('2026-02-12T08:45:00Z').toISOString(),
  },
  {
    id: 'stu-greenfield-002',
    student_id: 'GSA-2026-089',
    full_name: 'Faith Achieng',
    email: 'f.achieng@students.greenfield.edu',
    gender: 'Female',
    phone: '+254 711 444 555',
    course: 'Biotechnology',
    class_name: 'BIO-204 Genomics & Bioinformatics',
    class_id: 'class-greenfield-02',
    school_id: 'school-uuid-greenfield-002',
    status: 'Active',
    enrollment_date: '2026-02-09',
    gpa: '3.95',
    created_at: new Date('2026-02-14T11:20:00Z').toISOString(),
  },
  {
    id: 'stu-greenfield-003',
    student_id: 'GSA-2026-090',
    full_name: 'Kevin Mwangi',
    email: 'k.mwangi@students.greenfield.edu',
    gender: 'Male',
    phone: '+254 711 666 777',
    course: 'Mechatronics',
    class_name: 'ROB-101 Applied Robotics',
    class_id: 'class-greenfield-01',
    school_id: 'school-uuid-greenfield-002',
    status: 'Active',
    enrollment_date: '2026-02-10',
    gpa: '3.60',
    created_at: new Date('2026-02-16T15:00:00Z').toISOString(),
  },
];

// Helper to load or init local storage
export function getLocalDatabase(): DatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: DatabaseState = {
        schools: INITIAL_SCHOOLS,
        profiles: INITIAL_PROFILES,
        classes: INITIAL_CLASSES,
        students: INITIAL_STUDENTS,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);

    // Ensure initial profiles always exist so login never fails
    const existingProfiles: Profile[] = Array.isArray(parsed.profiles) ? parsed.profiles : [];
    const mergedProfiles = [...existingProfiles];
    for (const initP of INITIAL_PROFILES) {
      if (!mergedProfiles.some((p) => p.email.toLowerCase() === initP.email.toLowerCase())) {
        mergedProfiles.push(initP);
      }
    }

    const existingSchools: School[] = Array.isArray(parsed.schools) ? parsed.schools : [];
    const mergedSchools = existingSchools.length > 0 ? existingSchools : INITIAL_SCHOOLS;

    const existingClasses: ClassItem[] = Array.isArray(parsed.classes) ? parsed.classes : [];
    const mergedClasses = existingClasses.length > 0 ? existingClasses : INITIAL_CLASSES;

    const existingStudents: Student[] = Array.isArray(parsed.students) ? parsed.students : [];
    const mergedStudents = existingStudents.length > 0 ? existingStudents : INITIAL_STUDENTS;

    return {
      schools: mergedSchools,
      profiles: mergedProfiles,
      classes: mergedClasses,
      students: mergedStudents,
    };
  } catch {
    return {
      schools: INITIAL_SCHOOLS,
      profiles: INITIAL_PROFILES,
      classes: INITIAL_CLASSES,
      students: INITIAL_STUDENTS,
    };
  }
}

export { INITIAL_PROFILES, INITIAL_SCHOOLS, INITIAL_CLASSES, INITIAL_STUDENTS };

export function saveLocalDatabase(db: DatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    // Trigger custom storage event for multi-tab or reactive listeners
    window.dispatchEvent(new Event('edumanage_db_updated'));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
}

export function resetDatabaseToSeed(): void {
  const initial: DatabaseState = {
    schools: INITIAL_SCHOOLS,
    profiles: INITIAL_PROFILES,
    classes: INITIAL_CLASSES,
    students: INITIAL_STUDENTS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  window.dispatchEvent(new Event('edumanage_db_updated'));
}

// Current active session tracking
export function getLocalAuthSession(): { user: { id: string; email: string }; profile: Profile } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalAuthSession(session: { user: { id: string; email: string }; profile: Profile } | null): void {
  try {
    if (session) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    window.dispatchEvent(new Event('edumanage_auth_updated'));
  } catch (e) {
    console.error('Failed to set auth session', e);
  }
}
