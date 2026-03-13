import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    console.log("🔍 USER PERMISSION DIAGNOSTIC START")
    const supabase = createClient()

    // Check session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    // Check User Table
    const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single()

    // 1. Check Academic Years
    const { data: years, error: yErr } = await supabase.from('academic_years').select('*')

    // 2. Check Classes
    const { data: classes, error: cErr } = await supabase.from('classes').select('*')

    return NextResponse.json({
        session: { email: session.user.email, id: session.user.id },
        profile: profile,
        academic_years: { count: years?.length || 0, error: yErr },
        classes: { count: classes?.length || 0, error: cErr }
    })
}
