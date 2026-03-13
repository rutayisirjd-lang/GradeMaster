import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    console.log("🔍 API DIAGNOSTIC START")
    const admin = createAdminClient()

    // 1. Check Academic Years
    const { data: years, error: yErr } = await admin.from('academic_years').select('*')

    // 2. Check Classes
    const { data: classes, error: cErr } = await admin.from('classes').select('*, academic_years(label)')

    // 3. Check Director
    const { data: users, error: uErr } = await admin.from('users').select('*').eq('email', 'director@grademaster.rw')

    return NextResponse.json({
        academic_years: { count: years?.length || 0, data: years, error: yErr },
        classes: { count: classes?.length || 0, data: classes, error: cErr },
        director: { data: users?.[0], error: uErr }
    })
}
