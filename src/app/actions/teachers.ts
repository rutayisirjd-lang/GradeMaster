'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createTeacher(formData: {
    email: string
    first_name: string
    last_name: string
    role: 'class_teacher' | 'subject_teacher'
    phone?: string
}) {
    const admin = createAdminClient()

    // 1. Create User in Auth
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: formData.email,
        password: 'Teacher@2025', // Default password
        email_confirm: true,
        user_metadata: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role
        }
    })

    if (authError) {
        return { success: false, error: authError.message }
    }

    // 2. Profile creation is usually handled by a trigger, but let's be safe and upsert it
    // If the trigger 008_auth_trigger exists, this might be redundant but explicit is better for now
    const { error: profileErr } = await (admin.from('users' as any) as any).upsert({
        id: authUser.user.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone: formData.phone,
        is_active: true
    })

    if (profileErr) {
        return { success: false, error: "Auth created but profile failed: " + profileErr.message }
    }

    revalidatePath('/teachers')
    return { success: true, data: authUser.user }
}

export async function deleteTeacher(id: string) {
    const admin = createAdminClient()

    // Auth deletion
    const { error: authError } = await admin.auth.admin.deleteUser(id)
    if (authError) return { success: false, error: authError.message }

    // Role removal / cleanup handled by CASCADE or trigger
    revalidatePath('/teachers')
    return { success: true }
}

export async function updateTeacher(id: string, formData: {
    first_name: string
    last_name: string
    role: 'class_teacher' | 'subject_teacher'
    phone?: string
}) {
    const admin = createAdminClient()

    // 1. Update Auth Metadata (so it stays consistent)
    const { error: authError } = await admin.auth.admin.updateUserById(id, {
        user_metadata: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role
        }
    })

    if (authError) return { success: false, error: authError.message }

    // 2. Update Profile
    const { error: profileErr } = await (admin.from('users' as any) as any).update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone: formData.phone
    }).eq('id', id)

    if (profileErr) return { success: false, error: profileErr.message }

    revalidatePath('/teachers')
    return { success: true }
}
