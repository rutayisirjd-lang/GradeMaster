'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import {
    User, BookOpen, GraduationCap, ArrowLeft, Loader2, Save, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getLetterGrade } from '@/lib/calculations/grades'

export default function StudentProfilePage() {
    const params = useParams()
    const studentId = params.id as string
    const supabase = createClient()
    const queryClient = useQueryClient()

    // 1. Fetch Student Details
    const { data: student, isLoading: loadingStudent } = useQuery<any>({
        queryKey: ['student', studentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    *,
                    classes (id, name, level)
                `)
                .eq('id', studentId)
                .single()
            if (error) throw error
            return data as any
        }
    })

    // 2. Fetch Active Term
    const { data: terms } = useQuery<any[]>({
        queryKey: ['active-term'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('terms')
                .select('*')
                .select('id, name, is_locked, academic_years!inner(is_current)')
                .eq('academic_years.is_current', true)
                .order('start_date', { ascending: false })

            if (error) throw error
            return data
        }
    })

    const activeTermId = terms?.[0]?.id

    // 3. Fetch Class Subjects
    const { data: classSubjects } = useQuery<any[]>({
        queryKey: ['student-subjects', student?.class_id, activeTermId],
        enabled: !!student?.class_id && !!activeTermId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_subjects')
                .select(`
                    id,
                    subjects (id, name, code)
                `)
                .eq('class_id', student!.class_id)
            if (error) throw error
            return data as any[]
        }
    })

    // 4. Fetch Assessments
    const { data: assessments } = useQuery<any[]>({
        queryKey: ['student-assessments', student?.class_id, activeTermId],
        enabled: !!classSubjects && !!activeTermId,
        queryFn: async () => {
            const subjectIds = classSubjects!.map(cs => cs.id)
            const { data, error } = await supabase
                .from('assessments')
                .select('*')
                .in('class_subject_id', subjectIds)
                .eq('term_id', activeTermId)
            if (error) throw error
            return data as any[]
        }
    })

    // 5. Fetch Marks
    const { data: marks } = useQuery<any[]>({
        queryKey: ['student-marks', studentId, activeTermId],
        enabled: !!assessments && assessments.length > 0,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marks')
                .select('*')
                .eq('student_id', studentId)
                .in('assessment_id', assessments!.map(a => a.id))
            if (error) throw error
            return data
        }
    })

    // Mutation to Upsert Mark
    const upsertMarkMutation = useMutation({
        mutationFn: async ({ assessmentId, score }: { assessmentId: string, score: number | null }) => {
            const { data: { user } } = await supabase.auth.getUser()
            const assessment = assessments?.find(a => a.id === assessmentId)
            const normalized = score !== null ? (score / (assessment?.max_score || 100)) * 100 : null

            const { error } = await (supabase.from('marks') as any)
                .upsert({
                    student_id: studentId,
                    assessment_id: assessmentId,
                    raw_score: score,
                    normalized_score: normalized,
                    entered_by: user!.id,
                    status: 'draft',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'assessment_id,student_id' })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-marks'] })
        }
    })

    const handleScoreChange = (assessmentId: string, value: string) => {
        const score = value === '' ? null : parseFloat(value)
        upsertMarkMutation.mutate({ assessmentId, score })
    }

    const getMark = (assessmentId: string) => {
        return marks?.find(m => m.assessment_id === assessmentId)
    }

    if (loadingStudent) {
        return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500 h-10 w-10" /></div>
    }

    if (!student) return null

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild className="text-slate-400 hover:text-white px-2">
                    <Link href="/students"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry</Link>
                </Button>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-xl">
                        <User size={40} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                            {student.first_name} {student.last_name}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black tracking-widest uppercase">
                                {student.student_id}
                            </Badge>
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                                {student.classes?.name || 'Unassigned'}
                            </span>
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                                Parent: Guardian Information
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-slate-800 bg-slate-900/60 shadow-2xl">
                    <CardHeader className="border-b border-slate-800/60 bg-slate-900/40">
                        <CardTitle className="flex items-center gap-2 text-emerald-400 uppercase italic tracking-tighter">
                            <Activity className="h-5 w-5" /> All Subject Marks (Term: {terms?.[0]?.name.replace('_', ' ')})
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            View and edit assessment scores across all enrolled subjects. Changes are saved automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {classSubjects?.map(cs => {
                            const subjAssessments = assessments?.filter(a => a.class_subject_id === cs.id) || []

                            // Calculate averages
                            const subjMarks = marks?.filter(m => subjAssessments.find(a => a.id === m.assessment_id && m.normalized_score !== null)) || []
                            const examScore = subjMarks.find(m => subjAssessments.find(a => a.id === m.assessment_id && a.category === 'exam'))?.normalized_score || 0
                            const caCount = subjMarks.filter(m => subjAssessments.find(a => a.id === m.assessment_id && a.category !== 'exam')).length
                            const caTotal = subjMarks.filter(m => subjAssessments.find(a => a.id === m.assessment_id && a.category !== 'exam')).reduce((sum, m) => sum + (m.normalized_score || 0), 0)
                            const caAvg = caCount > 0 ? caTotal / subjAssessments.filter(a => a.category !== 'exam').length : 0

                            const finalScore = (caAvg * 0.5) + (examScore * 0.5)
                            const grade = getLetterGrade(finalScore)

                            return (
                                <div key={cs.id} className="border-b border-slate-800/60 last:border-0 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-emerald-500" />
                                            {cs.subjects.name}
                                        </h3>
                                        <div className="flex gap-4 items-center">
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Current Standing</div>
                                                <div className="text-emerald-400 font-black italic">{finalScore.toFixed(2)}% • {grade.letter}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {subjAssessments.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic font-medium">No assessments found for this subject in the current term.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {subjAssessments.map(a => (
                                                <div key={a.id} className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate" title={a.title}>{a.title}</span>
                                                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-slate-700 text-slate-500">{a.category}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-auto">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max={a.max_score}
                                                            placeholder="-"
                                                            defaultValue={getMark(a.id)?.raw_score ?? ''}
                                                            onBlur={(e) => handleScoreChange(a.id, e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg h-8 px-2 text-sm font-black text-white text-center focus:ring-emerald-500 focus:border-emerald-500 transition-all hide-arrows"
                                                        />
                                                        <span className="text-[10px] text-slate-500 font-bold">/ {a.max_score}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {classSubjects?.length === 0 && (
                            <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                                Student is not enrolled in any subjects.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
