export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    first_name: string
                    last_name: string
                    role: 'director' | 'class_teacher' | 'subject_teacher'
                    phone: string | null
                    avatar_url: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    first_name: string
                    last_name: string
                    role: 'director' | 'class_teacher' | 'subject_teacher'
                    phone?: string | null
                    avatar_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    first_name?: string
                    last_name?: string
                    role?: 'director' | 'class_teacher' | 'subject_teacher'
                    phone?: string | null
                    avatar_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            academic_years: {
                Row: {
                    id: string
                    label: string
                    start_date: string
                    end_date: string
                    is_current: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    label: string
                    start_date: string
                    end_date: string
                    is_current?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    label?: string
                    start_date?: string
                    end_date?: string
                    is_current?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            classes: {
                Row: {
                    id: string
                    academic_year_id: string
                    name: string
                    level: string
                    section: string
                    class_teacher_id: string | null
                    room: string | null
                    capacity: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    academic_year_id: string
                    name: string
                    level: string
                    section: string
                    class_teacher_id?: string | null
                    room?: string | null
                    capacity?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    academic_year_id?: string
                    name?: string
                    level?: string
                    section?: string
                    class_teacher_id?: string | null
                    room?: string | null
                    capacity?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            subjects: {
                Row: {
                    id: string
                    name: string
                    code: string
                    description: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    description?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    description?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            class_subjects: {
                Row: {
                    id: string
                    class_id: string
                    subject_id: string
                    teacher_id: string
                    academic_year_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    subject_id: string
                    teacher_id: string
                    academic_year_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    class_id?: string
                    subject_id?: string
                    teacher_id?: string
                    academic_year_id?: string
                    created_at?: string
                }
            }
            students: {
                Row: {
                    id: string
                    student_id: string
                    first_name: string
                    last_name: string
                    gender: 'male' | 'female' | 'other'
                    date_of_birth: string
                    enrollment_date: string
                    academic_year_id: string
                    class_id: string
                    guardian_name: string | null
                    guardian_phone: string | null
                    guardian_email: string | null
                    guardian_relation: string | null
                    photo_url: string | null
                    notes: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id?: string
                    first_name: string
                    last_name: string
                    gender: 'male' | 'female' | 'other'
                    date_of_birth: string
                    enrollment_date: string
                    academic_year_id: string
                    class_id: string
                    guardian_name?: string | null
                    guardian_phone?: string | null
                    guardian_email?: string | null
                    guardian_relation?: string | null
                    photo_url?: string | null
                    notes?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    first_name?: string
                    last_name?: string
                    gender?: 'male' | 'female' | 'other'
                    date_of_birth?: string
                    enrollment_date?: string
                    academic_year_id?: string
                    class_id?: string
                    guardian_name?: string | null
                    guardian_phone?: string | null
                    guardian_email?: string | null
                    guardian_relation?: string | null
                    photo_url?: string | null
                    notes?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            terms: {
                Row: {
                    id: string
                    academic_year_id: string
                    name: 'TERM_1' | 'TERM_2' | 'TERM_3'
                    start_date: string
                    end_date: string
                    is_locked: boolean
                    locked_at: string | null
                    locked_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    academic_year_id: string
                    name: 'TERM_1' | 'TERM_2' | 'TERM_3'
                    start_date: string
                    end_date: string
                    is_locked?: boolean
                    locked_at?: string | null
                    locked_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    academic_year_id?: string
                    name?: 'TERM_1' | 'TERM_2' | 'TERM_3'
                    start_date?: string
                    end_date?: string
                    is_locked?: boolean
                    locked_at?: string | null
                    locked_by?: string | null
                    created_at?: string
                }
            }
            assessments: {
                Row: {
                    id: string
                    class_subject_id: string
                    term_id: string
                    title: string
                    category: 'quiz' | 'homework' | 'exercise' | 'exam'
                    max_score: number
                    date: string | null
                    description: string | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    class_subject_id: string
                    term_id: string
                    title: string
                    category: 'quiz' | 'homework' | 'exercise' | 'exam'
                    max_score?: number
                    date?: string | null
                    description?: string | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    class_subject_id?: string
                    term_id?: string
                    title?: string
                    category?: 'quiz' | 'homework' | 'exercise' | 'exam'
                    max_score?: number
                    date?: string | null
                    description?: string | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            marks: {
                Row: {
                    id: string
                    assessment_id: string
                    student_id: string
                    raw_score: number | null
                    normalized_score: number | null
                    absence_type: 'present' | 'excused' | 'unexcused' | 'not_applicable'
                    status: 'draft' | 'submitted' | 'reviewed' | 'locked'
                    entered_by: string
                    reviewed_by: string | null
                    override_by: string | null
                    override_reason: string | null
                    submitted_at: string | null
                    reviewed_at: string | null
                    locked_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    assessment_id: string
                    student_id: string
                    raw_score?: number | null
                    normalized_score?: number | null
                    absence_type?: 'present' | 'excused' | 'unexcused' | 'not_applicable'
                    status?: 'draft' | 'submitted' | 'reviewed' | 'locked'
                    entered_by: string
                    reviewed_by?: string | null
                    override_by?: string | null
                    override_reason?: string | null
                    submitted_at?: string | null
                    reviewed_at?: string | null
                    locked_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    assessment_id?: string
                    student_id?: string
                    raw_score?: number | null
                    normalized_score?: number | null
                    absence_type?: 'present' | 'excused' | 'unexcused' | 'not_applicable'
                    status?: 'draft' | 'submitted' | 'reviewed' | 'locked'
                    entered_by?: string
                    reviewed_by?: string | null
                    override_by?: string | null
                    override_reason?: string | null
                    submitted_at?: string | null
                    reviewed_at?: string | null
                    locked_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            term_subject_results: {
                Row: {
                    id: string
                    student_id: string
                    class_subject_id: string
                    term_id: string
                    ca_average: number | null
                    exam_score: number | null
                    final_score: number | null
                    letter_grade: string | null
                    is_incomplete: boolean
                    incomplete_reason: string | null
                    computed_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    class_subject_id: string
                    term_id: string
                    ca_average?: number | null
                    exam_score?: number | null
                    final_score?: number | null
                    letter_grade?: string | null
                    is_incomplete?: boolean
                    incomplete_reason?: string | null
                    computed_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    class_subject_id?: string
                    term_id?: string
                    ca_average?: number | null
                    exam_score?: number | null
                    final_score?: number | null
                    letter_grade?: string | null
                    is_incomplete?: boolean
                    incomplete_reason?: string | null
                    computed_at?: string
                }
            }
            term_results: {
                Row: {
                    id: string
                    student_id: string
                    term_id: string
                    class_id: string
                    term_average: number | null
                    rank_in_class: number | null
                    teacher_remark: string | null
                    is_published: boolean
                    published_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    term_id: string
                    class_id: string
                    term_average?: number | null
                    rank_in_class?: number | null
                    teacher_remark?: string | null
                    is_published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    term_id?: string
                    class_id?: string
                    term_average?: number | null
                    rank_in_class?: number | null
                    teacher_remark?: string | null
                    is_published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            annual_results: {
                Row: {
                    id: string
                    student_id: string
                    academic_year_id: string
                    class_id: string
                    term1_average: number | null
                    term2_average: number | null
                    term3_average: number | null
                    annual_average: number | null
                    rank_in_class: number | null
                    promotion_status: 'pending' | 'promoted' | 'repeated' | 'withdrawn'
                    promotion_override: boolean
                    promotion_override_by: string | null
                    promotion_override_reason: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    academic_year_id: string
                    class_id: string
                    term1_average?: number | null
                    term2_average?: number | null
                    term3_average?: number | null
                    annual_average?: number | null
                    rank_in_class?: number | null
                    promotion_status?: 'pending' | 'promoted' | 'repeated' | 'withdrawn'
                    promotion_override?: boolean
                    promotion_override_by?: string | null
                    promotion_override_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    academic_year_id?: string
                    class_id?: string
                    term1_average?: number | null
                    term2_average?: number | null
                    term3_average?: number | null
                    annual_average?: number | null
                    rank_in_class?: number | null
                    promotion_status?: 'pending' | 'promoted' | 'repeated' | 'withdrawn'
                    promotion_override?: boolean
                    promotion_override_by?: string | null
                    promotion_override_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            reports: {
                Row: {
                    id: string
                    student_id: string | null
                    class_id: string | null
                    term_id: string | null
                    academic_year_id: string | null
                    report_type: 'term_transcript' | 'annual_report' | 'class_summary'
                    file_url: string | null
                    generated_by: string | null
                    generated_at: string
                }
                Insert: {
                    id?: string
                    student_id?: string | null
                    class_id?: string | null
                    term_id?: string | null
                    academic_year_id?: string | null
                    report_type: 'term_transcript' | 'annual_report' | 'class_summary'
                    file_url?: string | null
                    generated_by?: string | null
                    generated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string | null
                    class_id?: string | null
                    term_id?: string | null
                    academic_year_id?: string | null
                    report_type?: 'term_transcript' | 'annual_report' | 'class_summary'
                    file_url?: string | null
                    generated_by?: string | null
                    generated_at?: string
                }
            }
            audit_log: {
                Row: {
                    id: string
                    user_id: string
                    action: string
                    table_name: string | null
                    record_id: string | null
                    old_value: Json | null
                    new_value: Json | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    action: string
                    table_name?: string | null
                    record_id?: string | null
                    old_value?: Json | null
                    new_value?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    action?: string
                    table_name?: string | null
                    record_id?: string | null
                    old_value?: Json | null
                    new_value?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    body: string
                    type: string
                    is_read: boolean
                    link: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    body: string
                    type: string
                    is_read?: boolean
                    link?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    body?: string
                    type?: string
                    is_read?: boolean
                    link?: string | null
                    created_at?: string
                }
            }
            student_year_history: {
                Row: {
                    id: string
                    student_id: string
                    academic_year_id: string
                    class_id: string
                    promotion_status: 'pending' | 'promoted' | 'repeated' | 'withdrawn' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    academic_year_id: string
                    class_id: string
                    promotion_status?: 'pending' | 'promoted' | 'repeated' | 'withdrawn' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    academic_year_id?: string
                    class_id?: string
                    promotion_status?: 'pending' | 'promoted' | 'repeated' | 'withdrawn' | null
                    created_at?: string
                }
            }
            invitations: {
                Row: {
                    id: string
                    email: string
                    role: 'director' | 'class_teacher' | 'subject_teacher'
                    token: string
                    invited_by: string
                    expires_at: string
                    accepted_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    role: 'director' | 'class_teacher' | 'subject_teacher'
                    token: string
                    invited_by: string
                    expires_at?: string
                    accepted_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'director' | 'class_teacher' | 'subject_teacher'
                    token?: string
                    invited_by?: string
                    expires_at?: string
                    accepted_at?: string | null
                    created_at?: string
                }
            }


        }
    }
}
