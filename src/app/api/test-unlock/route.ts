import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST() {
    const admin = createAdminClient()

    // We can query the first user and log the keys
    const { data, error } = await admin.from('users').select('*').limit(1)

    return NextResponse.json({
        success: true,
        keys: data && data.length > 0 ? Object.keys(data[0]) : [],
        error
    })
}
