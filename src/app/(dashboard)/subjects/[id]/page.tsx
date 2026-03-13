'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SubjectDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const id = params.id as string

    const { data: subject, isLoading } = useQuery({
        queryKey: ['subject', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('id', id)
                .single()
            if (error) throw error
            return data
        }
    })

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    if (!subject) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-slate-400">Subject not found.</p>
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-10 w-10 border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400 hover:text-white">
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase italic">{subject.name}</h1>
                    <p className="text-slate-500 font-medium">Subject Code: {subject.code}</p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 rounded-lg">
                            <BookOpen className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Curriculum Overview</h2>
                    </div>
                    <p className="text-slate-400">
                        {subject.description || 'No detailed description available.'}
                    </p>
                    {/* Placeholder for more analytics and performance breakdowns */}
                    <div className="mt-8 p-10 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest text-center">Detailed insights and performance breakdown coming soon</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
