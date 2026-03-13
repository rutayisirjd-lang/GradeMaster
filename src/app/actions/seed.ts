'use server'

import { createAdminClient } from '@/lib/supabase/admin'

interface SeedResult {
    success: boolean
    log: string[]
    error?: string
}

async function createUserIfNotExists(
    admin: ReturnType<typeof createAdminClient>,
    allUsers: any[],
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    role: string,
    log: string[]
) {
    const existingUser = allUsers.find(u => u.email === email)

    if (existingUser) {
        log.push(`🔄 User ${email} already exists. Forcing role to: ${role}`)

        // 1. Force update the Auth metadata
        await admin.auth.admin.updateUserById(existingUser.id, {
            user_metadata: { ...existingUser.user_metadata, role, first_name, last_name }
        })

        // 2. Force update the public.users table (UPSERT to ensure it exists)
        const { error: upErr } = await (admin
            .from('users' as any) as any)
            .upsert({
                id: existingUser.id,
                email: email,
                role: role,
                first_name,
                last_name
            } as any)

        if (upErr) log.push(`⚠️ Table sync error for ${email}: ${upErr.message}`)

        return existingUser.id
    }

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name, role }
    })

    if (authError) {
        if (authError.message.includes('already exists')) {
            // If they exist in Auth but weren't in our initial listUsers call, 
            // it means we just missed them. Try to find the user to get their ID.
            const { data: found } = await admin.auth.admin.listUsers()
            const u = found?.users.find(u => u.email === email)
            if (u) {
                log.push(`🔄 User ${email} recovered from Auth after conflict.`)
                // Sync to table
                await (admin.from('users' as any) as any).upsert({
                    id: u.id,
                    email,
                    role,
                    first_name,
                    last_name
                })
                return u.id
            }
        }
        log.push(`❌ Failed to create ${email}: ${authError.message}`)
        return null
    }

    // Sync to table
    await (admin.from('users' as any) as any).upsert({
        id: authUser.user.id,
        email,
        role,
        first_name,
        last_name
    })

    log.push(`✅ Created ${role}: ${first_name} ${last_name} (${email})`)
    return authUser.user.id
}

export async function seedEntireSystem(): Promise<SeedResult> {
    const admin = createAdminClient()
    const log: string[] = []

    try {
        log.push('🚀 Starting GradeMaster Complete System Seed...')
        log.push('─'.repeat(50))

        // ═══════════════════════════════════════════
        // PRE-FLIGHT: Fetch all users once
        // ═══════════════════════════════════════════
        const { data: userData } = await admin.auth.admin.listUsers()
        const allUsers = userData?.users || []

        // ═══════════════════════════════════════════
        // PHASE 1: Create User Accounts
        // ═══════════════════════════════════════════
        log.push('')
        log.push('👤 PHASE 1: Creating User Accounts...')

        const directorId = await createUserIfNotExists(
            admin, allUsers, 'director@grademaster.rw', 'Director@2025',
            'Jean-Pierre', 'Habimana', 'director', log
        )

        const classTeacher1Id = await createUserIfNotExists(
            admin, allUsers, 'ct.uwase@grademaster.rw', 'Teacher@2025',
            'Marie-Claire', 'Uwase', 'class_teacher', log
        )

        const classTeacher2Id = await createUserIfNotExists(
            admin, allUsers, 'ct.nkurunziza@grademaster.rw', 'Teacher@2025',
            'Emmanuel', 'Nkurunziza', 'class_teacher', log
        )

        const subjectTeacher1Id = await createUserIfNotExists(
            admin, allUsers, 'st.mugabo@grademaster.rw', 'Teacher@2025',
            'Patrick', 'Mugabo', 'subject_teacher', log
        )

        const subjectTeacher2Id = await createUserIfNotExists(
            admin, allUsers, 'st.uwimana@grademaster.rw', 'Teacher@2025',
            'Diane', 'Uwimana', 'subject_teacher', log
        )

        const subjectTeacher3Id = await createUserIfNotExists(
            admin, allUsers, 'st.ndayisaba@grademaster.rw', 'Teacher@2025',
            'Olivier', 'Ndayisaba', 'subject_teacher', log
        )

        if (!directorId) {
            return { success: false, log, error: 'Failed to create director account. Check SUPABASE_SERVICE_ROLE_KEY.' }
        }

        // ═══════════════════════════════════════════
        // PHASE 2: School Settings
        // ═══════════════════════════════════════════
        log.push('')
        log.push('🏫 PHASE 2: School Settings...')

        const { error: schoolErr } = await (admin.from('school_settings' as any) as any).upsert({
            school_name: 'GradeMaster International Academy',
            school_motto: 'Academic Excellence, Precisely Tracked',
            country: 'Rwanda',
            school_address: 'KG 567 St, Kacyiru, Kigali',
            principal_name: 'Jean-Pierre Habimana',
            report_footer_text: 'This is an official GradeMaster Academy report card.'
        }, { onConflict: 'id' })
        if (schoolErr) log.push(`⚠️ School settings: ${schoolErr.message}`)
        else log.push('✅ School profile configured.')

        // ═══════════════════════════════════════════
        // PHASE 3: Academic Year
        // ═══════════════════════════════════════════
        log.push('')
        log.push('📅 PHASE 3: Academic Year...')

        // Ensure all other years are NOT current
        await (admin.from('academic_years' as any) as any).update({ is_current: false }).neq('label', '2025-2026')

        const { data: yearData, error: yearErr } = await (admin.from('academic_years' as any) as any).upsert({
            label: '2025-2026',
            start_date: '2025-01-05',
            end_date: '2025-11-20',
            is_current: true
        }, { onConflict: 'label' }).select()

        if (yearErr || !yearData || yearData.length === 0) {
            log.push(`❌ Academic year: ${yearErr?.message || 'Update failed'}`)
            return { success: false, log, error: yearErr?.message }
        }
        const yearId = yearData[0].id
        log.push(`✅ Academic Year 2025-2026 (ID: ${yearId.slice(0, 8)}...)`)

        // ═══════════════════════════════════════════
        // PHASE 4: Terms
        // ═══════════════════════════════════════════
        log.push('')
        log.push('📆 PHASE 4: Terms...')

        const termsToInsert = [
            { academic_year_id: yearId, name: 'TERM_1', start_date: '2025-01-05', end_date: '2025-04-15', is_locked: false },
            { academic_year_id: yearId, name: 'TERM_2', start_date: '2025-05-01', end_date: '2025-08-15', is_locked: false },
            { academic_year_id: yearId, name: 'TERM_3', start_date: '2025-09-01', end_date: '2025-11-20', is_locked: false },
        ]
        for (const term of termsToInsert) {
            const { error: tErr } = await (admin.from('terms' as any) as any).upsert(term, { onConflict: 'academic_year_id,name' })
            if (tErr) log.push(`⚠️ Term ${term.name}: ${tErr.message}`)
            else log.push(`✅ ${term.name}: ${term.start_date} → ${term.end_date}`)
        }

        // Fetch term IDs
        const { data: terms } = await (admin.from('terms' as any) as any).select('id, name').eq('academic_year_id', yearId)
        const termMap: Record<string, string> = {}
        terms?.forEach((t: any) => { termMap[t.name] = t.id })

        // ═══════════════════════════════════════════
        // PHASE 5: Subjects
        // ═══════════════════════════════════════════
        log.push('')
        log.push('📚 PHASE 5: Subjects...')

        const subjectsToInsert = [
            { name: 'Mathematics', code: 'MATH-GEN', description: 'Core mathematics, algebra, and geometry.' },
            { name: 'Physics', code: 'PHY-GEN', description: 'Mechanics, thermodynamics, and optics.' },
            { name: 'English', code: 'ENG-LIT', description: 'Language arts, literature, and composition.' },
            { name: 'History', code: 'HIST-GEN', description: 'African and world history.' },
            { name: 'Biology', code: 'BIO-LAB', description: 'Life sciences and laboratory biology.' },
            { name: 'Chemistry', code: 'CHEM-LAB', description: 'Chemical compounds and lab experiments.' },
            { name: 'Kinyarwanda', code: 'KINY-01', description: 'National language and cultural studies.' },
            { name: 'Economics', code: 'ECON-01', description: 'Micro and macroeconomics principles.' },
            { name: 'French', code: 'FRN-01', description: 'French language and conversation.' },
            { name: 'Geography', code: 'GEO-01', description: 'Physical and human geography.' },
        ]
        for (const subj of subjectsToInsert) {
            const { error: sErr } = await (admin.from('subjects' as any) as any).upsert(subj, { onConflict: 'name' })
            if (sErr) log.push(`⚠️ Subject ${subj.name}: ${sErr.message}`)
            else log.push(`✅ ${subj.name} (${subj.code})`)
        }

        // Fetch subject IDs
        const { data: subjects } = await (admin.from('subjects' as any) as any).select('id, name')
        const subjMap: Record<string, string> = {}
        subjects?.forEach((s: any) => { subjMap[s.name] = s.id })

        // ═══════════════════════════════════════════
        // PHASE 6: Classes
        // ═══════════════════════════════════════════
        log.push('')
        log.push('🏛️ PHASE 6: Classes...')

        const classesToInsert = [
            { academic_year_id: yearId, name: 'Senior 1A', level: 'S1', section: 'A', capacity: 45, class_teacher_id: classTeacher1Id },
            { academic_year_id: yearId, name: 'Senior 1B', level: 'S1', section: 'B', capacity: 42, class_teacher_id: classTeacher2Id },
            { academic_year_id: yearId, name: 'Senior 2A', level: 'S2', section: 'A', capacity: 40, class_teacher_id: classTeacher1Id },
            { academic_year_id: yearId, name: 'Senior 3 Alpha', level: 'S3', section: 'Alpha', capacity: 35, class_teacher_id: classTeacher2Id },
        ]
        for (const cls of classesToInsert) {
            const { error: cErr } = await (admin.from('classes' as any) as any).upsert(cls, { onConflict: 'academic_year_id,name' })
            if (cErr) log.push(`⚠️ Class ${cls.name}: ${cErr.message}`)
            else log.push(`✅ ${cls.name} (${cls.level}${cls.section}) – capacity ${cls.capacity}`)
        }

        // Fetch class IDs
        const { data: classes } = await (admin.from('classes' as any) as any).select('id, name').eq('academic_year_id', yearId)
        const classMap: Record<string, string> = {}
        classes?.forEach((c: any) => { classMap[c.name] = c.id })

        // ═══════════════════════════════════════════
        // PHASE 7: Class-Subject Assignments
        // ═══════════════════════════════════════════
        log.push('')
        log.push('🔗 PHASE 7: Class-Subject Assignments...')

        const assignments = [
            // Senior 1A
            { class_id: classMap['Senior 1A'], subject_id: subjMap['Mathematics'], teacher_id: subjectTeacher1Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 1A'], subject_id: subjMap['Physics'], teacher_id: subjectTeacher2Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 1A'], subject_id: subjMap['English'], teacher_id: subjectTeacher3Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 1A'], subject_id: subjMap['History'], teacher_id: subjectTeacher2Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 1A'], subject_id: subjMap['Biology'], teacher_id: subjectTeacher1Id!, academic_year_id: yearId },
            // Senior 1B
            { class_id: classMap['Senior 1B'], subject_id: subjMap['Mathematics'], teacher_id: subjectTeacher1Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 1B'], subject_id: subjMap['English'], teacher_id: subjectTeacher3Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 1B'], subject_id: subjMap['Chemistry'], teacher_id: subjectTeacher2Id!, academic_year_id: yearId },
            // Senior 2A
            { class_id: classMap['Senior 2A'], subject_id: subjMap['Mathematics'], teacher_id: subjectTeacher1Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 2A'], subject_id: subjMap['Physics'], teacher_id: subjectTeacher2Id!, academic_year_id: yearId },
            { class_id: classMap['Senior 2A'], subject_id: subjMap['Economics'], teacher_id: subjectTeacher3Id!, academic_year_id: yearId },
        ]
        for (const a of assignments) {
            if (!a.class_id || !a.subject_id || !a.teacher_id) continue
            const { error: aErr } = await (admin.from('class_subjects' as any) as any).upsert(a, { onConflict: 'class_id,subject_id,academic_year_id' })
            if (aErr) log.push(`⚠️ Assignment: ${aErr.message}`)
        }
        log.push(`✅ Assigned ${assignments.filter(a => a.class_id && a.subject_id).length} subject-teacher pairs.`)

        // ═══════════════════════════════════════════
        // PHASE 8: Students
        // ═══════════════════════════════════════════
        log.push('')
        log.push('🎒 PHASE 8: Students...')

        const studentsData = [
            // Senior 1A (8 students)
            { student_id: 'STU-2025-001', first_name: 'David', last_name: 'Kagame', gender: 'male', date_of_birth: '2012-05-14', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            { student_id: 'STU-2025-002', first_name: 'Grace', last_name: 'Mutoni', gender: 'female', date_of_birth: '2012-08-22', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            { student_id: 'STU-2025-003', first_name: 'John', last_name: 'Niyonzima', gender: 'male', date_of_birth: '2012-03-10', enrollment_date: '2025-01-08', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            { student_id: 'STU-2025-004', first_name: 'Sarah', last_name: 'Uwineza', gender: 'female', date_of_birth: '2013-01-15', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            { student_id: 'STU-2025-005', first_name: 'Alain', last_name: 'Mugisha', gender: 'male', date_of_birth: '2012-11-30', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            { student_id: 'STU-2025-006', first_name: 'Sonia', last_name: 'Izere', gender: 'female', date_of_birth: '2012-04-12', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            { student_id: 'STU-2025-007', first_name: 'Eric', last_name: 'Byiringiro', gender: 'male', date_of_birth: '2012-07-05', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            { student_id: 'STU-2025-008', first_name: 'Betty', last_name: 'Umutoni', gender: 'female', date_of_birth: '2012-12-01', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1A'] },
            // Senior 1B (6 students)
            { student_id: 'STU-2025-009', first_name: 'Claude', last_name: 'Habimana', gender: 'male', date_of_birth: '2012-09-18', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1B'] },
            { student_id: 'STU-2025-010', first_name: 'Yvette', last_name: 'Mukamana', gender: 'female', date_of_birth: '2012-06-23', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1B'] },
            { student_id: 'STU-2025-011', first_name: 'Pascal', last_name: 'Twagiramungu', gender: 'male', date_of_birth: '2012-01-30', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1B'] },
            { student_id: 'STU-2025-012', first_name: 'Chantal', last_name: 'Ingabire', gender: 'female', date_of_birth: '2012-10-11', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1B'] },
            { student_id: 'STU-2025-013', first_name: 'Kevin', last_name: 'Rugamba', gender: 'male', date_of_birth: '2012-02-25', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1B'] },
            { student_id: 'STU-2025-014', first_name: 'Aline', last_name: 'Mukundwa', gender: 'female', date_of_birth: '2012-11-07', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 1B'] },
            // Senior 2A (5 students)
            { student_id: 'STU-2025-020', first_name: 'Moses', last_name: 'Ndayisaba', gender: 'male', date_of_birth: '2011-02-14', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 2A'] },
            { student_id: 'STU-2025-021', first_name: 'Lydia', last_name: 'Umubyeyi', gender: 'female', date_of_birth: '2011-10-22', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 2A'] },
            { student_id: 'STU-2025-022', first_name: 'Frank', last_name: 'Hakizimana', gender: 'male', date_of_birth: '2011-06-10', enrollment_date: '2025-01-10', academic_year_id: yearId, class_id: classMap['Senior 2A'] },
            { student_id: 'STU-2025-023', first_name: 'Valentine', last_name: 'Nyirahabimana', gender: 'female', date_of_birth: '2011-04-03', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 2A'] },
            { student_id: 'STU-2025-024', first_name: 'Thierry', last_name: 'Murenzi', gender: 'male', date_of_birth: '2011-08-17', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 2A'] },
            // Senior 3 Alpha (4 students)
            { student_id: 'STU-2025-030', first_name: 'Sandra', last_name: 'Ishimwe', gender: 'female', date_of_birth: '2010-11-22', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 3 Alpha'] },
            { student_id: 'STU-2025-031', first_name: 'Yves', last_name: 'Nshimiyimana', gender: 'male', date_of_birth: '2010-09-14', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 3 Alpha'] },
            { student_id: 'STU-2025-032', first_name: 'Claudine', last_name: 'Mukeshimana', gender: 'female', date_of_birth: '2010-03-08', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 3 Alpha'] },
            { student_id: 'STU-2025-033', first_name: 'Jean-Paul', last_name: 'Bizimungu', gender: 'male', date_of_birth: '2010-07-19', enrollment_date: '2025-01-05', academic_year_id: yearId, class_id: classMap['Senior 3 Alpha'] },
        ]
        let studentCount = 0
        for (const student of studentsData) {
            if (!student.class_id) { log.push(`⚠️ Skipped ${student.first_name} (class not found)`); continue }
            const { error: stErr } = await (admin.from('students' as any) as any).upsert(student, { onConflict: 'student_id' })
            if (stErr) log.push(`⚠️ Student ${student.student_id}: ${stErr.message}`)
            else studentCount++
        }
        log.push(`✅ Inserted ${studentCount} students across 4 classes.`)

        // ═══════════════════════════════════════════
        // PHASE 9: Sample Assessments & Marks (Term 1 only)
        // ═══════════════════════════════════════════
        log.push('')
        log.push('📝 PHASE 9: Sample Assessments & Marks...')

        // Fetch class_subjects for Senior 1A Math
        const { data: csData } = await (admin.from('class_subjects' as any) as any).select('id').eq('class_id', classMap['Senior 1A']).eq('subject_id', subjMap['Mathematics']).single()

        if (csData && termMap['TERM_1'] && directorId) {
            // Create a sample assessment
            const { data: assessmentData, error: assErr } = await (admin.from('assessments' as any) as any).upsert({
                class_subject_id: csData.id,
                term_id: termMap['TERM_1'],
                title: 'Math Quiz 1 – Algebra Basics',
                category: 'quiz',
                max_score: 20,
                created_by: directorId
            }, { onConflict: 'id' }).select()

            if (assErr) {
                log.push(`⚠️ Assessment: ${assErr.message}`)
            } else if (assessmentData && assessmentData.length > 0) {
                const assessmentId = assessmentData[0].id
                // Insert marks for Senior 1A students
                const s1aStudents = studentsData.filter(s => s.class_id === classMap['Senior 1A'])
                const { data: dbStudents } = await (admin.from('students' as any) as any).select('id, student_id').in('student_id', s1aStudents.map(s => s.student_id))

                if (dbStudents) {
                    const sampleScores = [18, 15, 12, 17, 14, 19, 11, 16]
                    const marksToInsert = dbStudents.map((s: any, i: number) => ({
                        assessment_id: assessmentId,
                        student_id: s.id,
                        raw_score: sampleScores[i % sampleScores.length],
                        normalized_score: (sampleScores[i % sampleScores.length] / 20) * 100,
                        entered_by: subjectTeacher1Id || directorId,
                        status: 'submitted' as const
                    }))

                    for (const mark of marksToInsert) {
                        const { error: mErr } = await (admin.from('marks' as any) as any).upsert(mark, { onConflict: 'assessment_id,student_id' })
                        if (mErr) log.push(`⚠️ Mark: ${mErr.message}`)
                    }
                    log.push(`✅ Added ${marksToInsert.length} marks for "Math Quiz 1 – Algebra Basics".`)
                }
            }
        } else {
            log.push('⚠️ Skipped assessments (missing class-subject or term data).')
        }

        // ═══════════════════════════════════════════
        // COMPLETE
        // ═══════════════════════════════════════════
        log.push('')
        log.push('─'.repeat(50))
        log.push('🎉 SYSTEM SEED COMPLETE!')
        log.push('')
        log.push('📋 Login Credentials:')
        log.push('  Director:        director@grademaster.rw / Director@2025')
        log.push('  Class Teacher 1: ct.uwase@grademaster.rw / Teacher@2025')
        log.push('  Class Teacher 2: ct.nkurunziza@grademaster.rw / Teacher@2025')
        log.push('  Subject Teacher: st.mugabo@grademaster.rw / Teacher@2025')
        log.push('  Subject Teacher: st.uwimana@grademaster.rw / Teacher@2025')
        log.push('  Subject Teacher: st.ndayisaba@grademaster.rw / Teacher@2025')

        return { success: true, log }
    } catch (err: any) {
        log.push(`💥 CRITICAL ERROR: ${err.message}`)
        return { success: false, log, error: err.message }
    }
}
