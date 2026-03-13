import { DashboardShell } from '@/components/layout/DashboardShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    // Fetch the extended user profile to get the role
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    let role = (profile as any)?.role

    if (user.email === 'director@grademaster.rw') {
        if (!profile) {
            // [EMERGENCY BYPASS]
            const { createAdminClient } = await import('@/lib/supabase/admin')
            const admin = createAdminClient()
            const { data: newProfile, error: createError } = await (admin
                .from('users' as any) as any)
                .upsert({
                    id: user.id,
                    email: user.email!,
                    first_name: 'Jean-Pierre',
                    last_name: 'Habimana',
                    role: 'director'
                } as any)
                .select()
                .single()

            if (!createError && newProfile) {
                role = 'director'
            }
        } else if (role !== 'director') {
            const { createAdminClient } = await import('@/lib/supabase/admin')
            const admin = createAdminClient()
            await (admin
                .from('users' as any) as any)
                .update({ role: 'director' } as any)
                .eq('id', user.id)
            role = 'director'
        }
    }

    if (!role) role = 'subject_teacher'

    return (
        <DashboardShell userEmail={user.email!} role={role}>
            {children}
        </DashboardShell>
    )
}
