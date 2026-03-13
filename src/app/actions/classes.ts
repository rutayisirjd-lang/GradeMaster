'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClass(formData: {
    name: string
    level: string
    section: string
    capacity: number
    class_teacher_id?: string
}) {
    const supabase = createClient()

    // Get current academic year
    const { data: years, error: yearErr } = await (supabase.from('academic_years' as any) as any)
        .select('id')
        .eq('is_current', true)
        .limit(1)

    if (yearErr || !years || (years as any[]).length === 0) {
        console.error("❌ No current year found:", yearErr)
        return { success: false, error: 'No active academic year found. Please initialize the registry.' }
    }
    const year = (years as any[])[0]

    const { data, error } = await (supabase.from('classes' as any) as any)
        .insert([{
            ...formData,
            academic_year_id: year.id
        }])
        .select()
        .single() as { data: any, error: any }

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/classes')
    return { success: true, data }
}

export async function deleteClass(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/classes')
    return { success: true }
}

export async function assignTeacherToSubject(formData: {
    class_id: string
    subject_id: string
    teacher_id: string
}) {
    const supabase = createClient()

    // Get current year
    const { data: years, error: yearErr } = await (supabase.from('academic_years' as any) as any).select('id').eq('is_current', true).limit(1)
    if (yearErr || !years || (years as any[]).length === 0) return { success: false, error: 'No active academic year.' }
    const year = (years as any[])[0]

    const { error } = await (supabase.from('class_subjects' as any) as any).upsert({
        ...formData,
        academic_year_id: (year as any).id
    }, { onConflict: 'class_id,subject_id,academic_year_id' })

    if (error) return { success: false, error: error.message }
    revalidatePath(`/classes/${formData.class_id}`)
    return { success: true }
}
