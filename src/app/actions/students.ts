'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStudent(formData: {
    first_name: string
    last_name: string
    gender: 'male' | 'female'
    date_of_birth: string
    class_id: string
    student_id?: string // Optional, can be auto-generated
}) {
    const supabase = createClient()

    // Get current year
    const { data: year } = await supabase.from('academic_years').select('id').eq('is_current', true).single()
    if (!year) return { success: false, error: 'No active academic year.' }

    const { data, error } = await supabase
        .from('students')
        .insert([{
            ...formData,
            academic_year_id: year.id,
            enrollment_date: new Date().toISOString().split('T')[0],
            is_active: true
        }])
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    revalidatePath(`/classes/${formData.class_id}`)
    revalidatePath('/students')
    return { success: true, data }
}

export async function updateStudentClass(studentId: string, newClassId: string | null) {
    const supabase = createClient()
    const { error } = await supabase
        .from('students')
        .update({ class_id: newClassId })
        .eq('id', studentId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/classes')
    revalidatePath('/students')
    return { success: true }
}

export async function deleteStudent(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/students')
    return { success: true }
}
