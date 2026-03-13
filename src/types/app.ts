export type UserRole = 'director' | 'class_teacher' | 'subject_teacher';

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
    avatar_url?: string;
    is_active: boolean;
}

export interface AcademicYear {
    id: string;
    label: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface Term {
    id: string;
    academic_year_id: string;
    name: 'TERM_1' | 'TERM_2' | 'TERM_3';
    start_date: string;
    end_date: string;
    is_locked: boolean;
}

export interface Class {
    id: string;
    academic_year_id: string;
    name: string;
    level: string;
    section: string;
    class_teacher_id?: string;
    room?: string;
    capacity: number;
}
