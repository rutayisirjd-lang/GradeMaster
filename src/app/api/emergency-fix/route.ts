import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const admin = createAdminClient()
    const email = 'director@grademaster.rw'

    try {
        // 1. Update the role to director
        const { error: updateError } = await admin
            .from('users')
            .update({ role: 'director' })
            .eq('email', email)

        if (updateError) throw updateError

        // 2. Also update metadata in Auth just in case
        const { data: users } = await admin.auth.admin.listUsers()
        const user = users.users.find(u => u.email === email)

        if (user) {
            await admin.auth.admin.updateUserById(user.id, {
                user_metadata: { ...user.user_metadata, role: 'director' }
            })
        }

        return NextResponse.json({
            success: true,
            message: `Role for ${email} has been forced to 'director'. Please LOG OUT and LOG BACK IN.`
        })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
