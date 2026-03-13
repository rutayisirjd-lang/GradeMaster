'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createFacultyAccount(values: {
    first_name: string
    last_name: string
    email: string
    password: string
    role: 'director' | 'class_teacher' | 'subject_teacher'
}) {
    const admin = createAdminClient()

    // 1. Create the user in Auth
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
            first_name: values.first_name,
            last_name: values.last_name,
            role: values.role
        }
    })

    if (authError) {
        console.error('Auth Admin Error:', authError)
        // More descriptive error for key issues
        if (authError.status === 403 || authError.status === 401) {
            return { error: 'CRITICAL AUTH ERROR: Your SUPABASE_SERVICE_ROLE_KEY is invalid for this project. Please verify it in .env.local.' }
        }
        return { error: authError.message }
    }

    // Note: The public.users profile is already handled by our SQL trigger 
    // from 008_auth_trigger.sql which listens to auth.users inserts.

    revalidatePath('/teachers')
    return { success: true, user: authUser.user }
}
