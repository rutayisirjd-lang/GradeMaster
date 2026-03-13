'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Save,
    Send,
    CheckCircle2,
    AlertCircle,
    Info,
    Download,
    Upload,
    Search,
    ChevronDown,
    Filter,
    Loader2,
    Table as TableIcon,
    Plus,
    Trash2,
    MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { getLetterGrade } from '@/lib/calculations/grades'
import { DirectorBroadsheetView } from '@/components/DirectorBroadsheetView'

interface MarkUpdate {
    studentId: string
    assessmentId: string
    score: number | null
}

interface ClassItem {
    id: string
    name: string
}

interface SubjectItem {
    id: string
    name: string
}

interface TermItem {
    id: string
    name: string
    academic_year_id: string
    academic_years: { label: string } | null
}

interface AssessmentItem {
    id: string
    title: string
    category: string
    max_score: number
    class_subject_id: string
    term_id: string
    created_at: string
}

interface StudentItem {
    id: string
    student_id: string
    first_name: string
    last_name: string
    class_id: string
}

interface MarkItem {
    id: string
    student_id: string
    assessment_id: string
    raw_score: number | null
    normalized_score: number | null
}

export default function MarksPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [selectedFilters, setSelectedFilters] = React.useState<{
        classId: string,
        subjectId: string,
        termId: string
    } | null>(null)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [isAddAssessmentOpen, setIsAddAssessmentOpen] = React.useState(false)

    // Check user role
    const { data: userRole, isLoading: loadingRole } = useQuery({
        queryKey: ['user-role-marks'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            const { data } = await (supabase.from('users' as any) as any).select('role').eq('id', user.id).single()
            return data?.role
        }
    })

    // 1. Fetch Filter Options
    const { data: classes } = useQuery<ClassItem[]>({
        queryKey: ['classes-filter'],
        queryFn: async () => {
            const { data, error } = await supabase.from('classes').select('id, name').order('name')
            if (error) throw error
            return data as ClassItem[]
        }
    })

    const { data: subjects } = useQuery<SubjectItem[]>({
        queryKey: ['subjects-filter'],
        queryFn: async () => {
            const { data, error } = await supabase.from('subjects').select('id, name').order('name')
            if (error) throw error
            return data as SubjectItem[]
        }
    })

    const { data: terms } = useQuery<TermItem[]>({
        queryKey: ['terms-filter'],
        queryFn: async () => {
            const { data, error } = await supabase.from('terms').select('id, name, academic_year_id, academic_years(label)').order('name')
            if (error) throw error
            return data as any as TermItem[]
        }
    })

    // 2. Fetch ClassSubject link
    const { data: classSubject } = useQuery<{ id: string }>({
        queryKey: ['class-subject', selectedFilters?.classId, selectedFilters?.subjectId],
        enabled: !!selectedFilters?.classId && !!selectedFilters?.subjectId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_subjects')
                .select('id')
                .eq('class_id', selectedFilters!.classId)
                .eq('subject_id', selectedFilters!.subjectId)
                .single()
            if (error) throw error
            return data as { id: string }
        }
    })

    // 3. Fetch Assessments
    const { data: assessments, isLoading: loadingAssessments } = useQuery<AssessmentItem[]>({
        queryKey: ['assessments', classSubject?.id, selectedFilters?.termId],
        enabled: !!classSubject?.id && !!selectedFilters?.termId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('assessments')
                .select('*')
                .eq('class_subject_id', classSubject!.id)
                .eq('term_id', selectedFilters!.termId)
                .order('created_at')
            if (error) throw error
            return data as AssessmentItem[]
        }
    })

    // 4. Fetch Students
    const { data: students, isLoading: loadingStudents } = useQuery<StudentItem[]>({
        queryKey: ['students-marks', selectedFilters?.classId],
        enabled: !!selectedFilters?.classId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('class_id', selectedFilters!.classId)
                .order('last_name')
            if (error) throw error
            return data as StudentItem[]
        }
    })

    // 5. Fetch Marks
    const { data: marks, isLoading: loadingMarks } = useQuery<MarkItem[]>({
        queryKey: ['marks', assessments?.map(a => a.id)],
        enabled: !!assessments && assessments.length > 0,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marks')
                .select('*')
                .in('assessment_id', assessments!.map(a => a.id))
            if (error) throw error
            return data as MarkItem[]
        }
    })

    // Mutations
    const createAssessmentMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await (supabase.from('assessments' as any) as any).insert([{
                ...values,
                class_subject_id: classSubject!.id,
                term_id: selectedFilters!.termId,
                created_by: user!.id
            }])
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] })
            setIsAddAssessmentOpen(false)
            toast.success('Assessment created')
        }
    })

    const upsertMarkMutation = useMutation({
        mutationFn: async ({ studentId, assessmentId, score }: MarkUpdate) => {
            const { data: { user } } = await supabase.auth.getUser()
            // Normalized score calculation (simple version for now: raw / max * 100)
            const assessment = assessments?.find(a => a.id === assessmentId)
            const normalized = score !== null ? (score / (assessment?.max_score || 100)) * 100 : null

            const { error } = await (supabase
                .from('marks' as any) as any)
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
            queryClient.invalidateQueries({ queryKey: ['marks'] })
        }
    })

    const finalizeMarksMutation = useMutation({
        mutationFn: async () => {
            if (!students || !assessments || !classSubject || !selectedFilters) return

            const updates = students.map(student => {
                const caAvg = parseFloat(calculateStudentCA(student.id))
                const examMark = marks?.find(m => {
                    const assessment = assessments.find(a => a.id === m.assessment_id)
                    return m.student_id === student.id && assessment?.category === 'exam'
                })
                const examScore = examMark?.normalized_score || 0
                const finalScore = parseFloat(calculateStudentFinal(student.id))
                const gradeInfo = getLetterGrade(finalScore)

                return {
                    student_id: student.id,
                    class_subject_id: classSubject.id,
                    term_id: selectedFilters.termId,
                    ca_average: caAvg,
                    exam_score: examScore,
                    final_score: finalScore,
                    letter_grade: gradeInfo.letter,
                    is_incomplete: false,
                    computed_at: new Date().toISOString()
                }
            })

            const { error } = await (supabase
                .from('term_subject_results' as any) as any)
                .upsert(updates, { onConflict: 'student_id,term_id,class_subject_id' })

            if (error) throw error

            // Log action
            const { data: { user } } = await supabase.auth.getUser()
            await (supabase.from('audit_log' as any) as any).insert([{
                user_id: user!.id,
                action: 'UPDATE',
                table_name: 'term_subject_results',
                new_value: { class_id: selectedFilters.classId, subject_id: selectedFilters.subjectId, count: updates.length }
            }])
        },
        onSuccess: () => {
            toast.success('Marks finalized and pushed to transcripts!')
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to finalize marks')
        }
    })

    const handleScoreChange = (studentId: string, assessmentId: string, value: string) => {
        const score = value === '' ? null : parseFloat(value)
        upsertMarkMutation.mutate({ studentId, assessmentId, score })
    }

    const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setSelectedFilters({
            classId: formData.get('classId') as string,
            subjectId: formData.get('subjectId') as string,
            termId: formData.get('termId') as string,
        })
    }

    const getMark = (studentId: string, assessmentId: string) => {
        return marks?.find(m => m.student_id === studentId && m.assessment_id === assessmentId)
    }

    // Derived Calculations
    const calculateStudentCA = (studentId: string) => {
        const studentMarks = marks?.filter(m => m.student_id === studentId) || []
        const caAssessments = assessments?.filter(a => a.category !== 'exam') || []
        if (caAssessments.length === 0) return "0.00"

        let totalNormalized = 0
        let count = 0
        studentMarks.forEach(m => {
            const isCA = assessments?.find(a => a.id === m.assessment_id)?.category !== 'exam'
            if (isCA && m.normalized_score !== null) {
                totalNormalized += m.normalized_score
                count++
            }
        })
        return count > 0 ? (totalNormalized / caAssessments.length).toFixed(2) : "0.00"
    }

    const calculateStudentFinal = (studentId: string) => {
        const studentMarks = marks?.filter(m => m.student_id === studentId) || []
        const examMark = studentMarks.find(m => assessments?.find(a => a.id === m.assessment_id)?.category === 'exam')
        const caAvg = parseFloat(calculateStudentCA(studentId))

        // Default: 50% CA, 50% Exam
        const examScore = examMark?.normalized_score || 0
        return ((caAvg * 0.5) + (examScore * 0.5)).toFixed(2)
    }

    if (loadingRole) {
        return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500 h-10 w-10" /></div>
    }

    if (userRole === 'director') {
        return <DirectorBroadsheetView />
    }

    return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/50 pb-8 md:pb-10 px-2">
                <div className="space-y-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black tracking-[0.3em] text-[8px] px-4 h-7 mb-2 rounded-full italic">Operational Module</Badge>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic selection:bg-emerald-500/40">Performance Engine</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[8px] md:text-[10px] flex items-center gap-3 opacity-70">Record and compute academic performance in real-time</p>
                </div>
                {selectedFilters && (
                    <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        <Button variant="outline" className="border-border bg-card/40 backdrop-blur-xl text-muted-foreground hover:text-foreground h-12 md:h-14 px-6 md:px-8 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all shadow-xl shadow-black/5 flex-shrink-0">
                            <Download className="mr-3 h-4 w-4 text-emerald-500" /> <span className="hidden sm:inline">Data Export</span><span className="sm:hidden">Export</span>
                        </Button>
                        <Button
                            onClick={() => finalizeMarksMutation.mutate()}
                            disabled={finalizeMarksMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black h-12 md:h-14 px-8 md:px-10 rounded-[1.2rem] md:rounded-[1.5rem] transition-all active:scale-95 uppercase tracking-widest text-[9px] md:text-[10px] flex gap-3 shadow-xl shadow-emerald-500/20 flex-shrink-0"
                        >
                            {finalizeMarksMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Committing...</>
                            ) : (
                                <><Send className="mr-1 h-4 w-4" /> Finalize</>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            <Card className="border-border bg-card/30 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl relative group mx-2">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-20" />
                <CardContent className="p-6 md:p-12">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-end gap-6 md:gap-8">
                        <div className="space-y-3 flex-1 min-w-[200px]">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-2 opacity-60">Academic Section</Label>
                            <Select name="classId" defaultValue={selectedFilters?.classId}>
                                <SelectTrigger className="bg-card/40 border-border h-12 md:h-14 rounded-[1.2rem] md:rounded-[1.5rem] text-foreground focus:ring-emerald-500/40 shadow-xl shadow-black/5">
                                    <SelectValue placeholder="Select Target Class" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground rounded-2xl">
                                    {classes?.map(c => <SelectItem key={c.id} value={c.id} className="rounded-xl">{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 flex-1 min-w-[200px]">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-1">Subject Stream</Label>
                            <Select name="subjectId" defaultValue={selectedFilters?.subjectId}>
                                <SelectTrigger className="bg-card/40 border-border h-12 md:h-14 rounded-[1.2rem] md:rounded-[1.5rem] text-foreground focus:ring-emerald-500/40 shadow-xl shadow-black/5">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground rounded-xl">
                                    {subjects?.map(s => <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 flex-1 min-w-[200px]">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-1">Academic Term</Label>
                            <Select name="termId" defaultValue={selectedFilters?.termId}>
                                <SelectTrigger className="bg-card/40 border-border h-12 md:h-14 rounded-[1.2rem] md:rounded-[1.5rem] text-foreground focus:ring-emerald-500/40 shadow-xl shadow-black/5">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground rounded-xl">
                                    {terms?.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="rounded-lg">
                                            {t.name.replace('_', ' ')} ({t.academic_years?.label})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-12 md:h-14 px-10 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-tighter flex items-center gap-2 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 sm:col-span-2 lg:col-span-1">
                            <Filter className="h-4 w-4" /> Initialize Engine
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {
                !selectedFilters ? (
                    <div className="flex flex-col items-center justify-center p-32 border-2 border-dashed border-border/50 rounded-[4rem] bg-card/10 mt-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-500 to-transparent opacity-20" />
                        <div className="h-28 w-28 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-10 shadow-[0_0_80px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform duration-500">
                            <TableIcon className="h-12 w-12 text-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground italic uppercase tracking-tighter opacity-40">System Idle</h3>
                        <p className="text-muted-foreground opacity-30 text-center mt-3 max-w-sm text-[10px] font-black uppercase tracking-[0.3em]">
                            Configure academic vectors to initialize performance processing.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-200">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                                    <Input
                                        placeholder="Find student..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-[200px] h-10 bg-background border-border text-sm pl-10 rounded-xl focus-visible:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Dialog open={isAddAssessmentOpen} onOpenChange={setIsAddAssessmentOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 px-4 h-10 rounded-xl">
                                            <Plus className="h-4 w-4 mr-2" /> New Assessment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-background border-border text-foreground">
                                        <form onSubmit={(e) => {
                                            e.preventDefault()
                                            const formData = new FormData(e.currentTarget)
                                            createAssessmentMutation.mutate({
                                                title: formData.get('title'),
                                                category: formData.get('category'),
                                                max_score: parseFloat(formData.get('max_score') as string),
                                                date: new Date().toISOString().split('T')[0]
                                            })
                                        }}>
                                            <DialogHeader>
                                                <DialogTitle>Create Assessment</DialogTitle>
                                                <DialogDescription className="text-muted-foreground">Define a new quiz, test or exam for this subject.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="title">Assessment Title</Label>
                                                    <Input id="title" name="title" placeholder="Quiz 1: Algebra Fundamentals" className="bg-muted border-border" required />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="category">Category</Label>
                                                        <Select name="category" defaultValue="quiz">
                                                            <SelectTrigger className="bg-muted border-border">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-background border-border text-foreground">
                                                                <SelectItem value="quiz">Quiz</SelectItem>
                                                                <SelectItem value="homework">Homework</SelectItem>
                                                                <SelectItem value="exercise">Exercise</SelectItem>
                                                                <SelectItem value="exam">Final Exam</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="max_score">Max Mark</Label>
                                                        <Input id="max_score" name="max_score" type="number" defaultValue={20} className="bg-muted border-border" required />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createAssessmentMutation.isPending}>
                                                    {createAssessmentMutation.isPending ? 'Creating...' : 'Create Assessment'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all">
                            <div className="overflow-x-auto">
                                <Table className="relative min-w-[1000px]">
                                    <TableHeader className="bg-background/80">
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="w-[280px] text-muted-foreground font-black uppercase tracking-widest text-[9px] py-6 sticky left-0 bg-background z-20">Student Name</TableHead>
                                            {assessments?.map((a) => (
                                                <TableHead key={a.id} className="text-muted-foreground font-black uppercase tracking-widest text-[9px] text-center border-l border-border/20">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="truncate max-w-[100px] mx-auto">{a.title}</span>
                                                        <Badge variant="outline" className="text-[8px] opacity-60 p-1 font-black leading-none">MAX: {a.max_score}</Badge>
                                                    </div>
                                                </TableHead>
                                            ))}
                                            <TableHead className="w-[100px] text-emerald-500 font-black uppercase tracking-widest text-[10px] text-center border-l border-border/40 bg-emerald-500/5">CA Avg</TableHead>
                                            <TableHead className="w-[100px] text-foreground font-black uppercase tracking-tighter text-[11px] text-center border-l border-border/40 bg-emerald-600/10 italic">Final Score</TableHead>
                                            <TableHead className="w-[60px] text-muted-foreground font-black uppercase text-center border-l border-border/40">Grd</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingStudents || loadingAssessments ? (
                                            [1, 2, 3].map(i => (
                                                <TableRow key={i} className="animate-pulse bg-muted/30 border-none">
                                                    <TableCell colSpan={assessments?.length ? assessments.length + 4 : 5} className="h-16" />
                                                </TableRow>
                                            ))
                                        ) : students?.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map((student) => {
                                            const final = calculateStudentFinal(student.id)
                                            const gradeInfo = getLetterGrade(parseFloat(final))

                                            return (
                                                <TableRow key={student.id} className="border-border/40 hover:bg-emerald-500/[0.03] group transition-all duration-300">
                                                    <TableCell className="font-bold text-foreground sticky left-0 bg-card/80 backdrop-blur-sm z-10 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black group-hover:text-emerald-500 transition-colors uppercase italic">{student.first_name} {student.last_name}</span>
                                                            <span className="text-[10px] text-muted-foreground opacity-50 font-mono tracking-tighter uppercase">{student.student_id}</span>
                                                        </div>
                                                    </TableCell>

                                                    {assessments?.map((a) => (
                                                        <TableCell key={a.id} className="border-l border-border/20 p-0 text-center">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                max={a.max_score}
                                                                className="w-full h-full bg-transparent border-none text-center text-sm font-black text-foreground placeholder:text-muted-foreground/20 focus:ring-inset focus:ring-1 focus:ring-emerald-500 py-4 outline-none transition-all hide-arrows"
                                                                placeholder="-"
                                                                defaultValue={getMark(student.id, a.id)?.raw_score ?? ''}
                                                                onBlur={(e) => handleScoreChange(student.id, a.id, e.target.value)}
                                                            />
                                                        </TableCell>
                                                    ))}

                                                    <TableCell className="border-l border-border/40 bg-emerald-500/5 text-center text-sm font-black text-emerald-500/80 py-4 italic tabular-nums">
                                                        {calculateStudentCA(student.id)}
                                                    </TableCell>
                                                    <TableCell className="border-l border-border/40 bg-emerald-600/10 text-center text-md font-black py-4 text-foreground italic tabular-nums">
                                                        {final}
                                                    </TableCell>
                                                    <TableCell className={`border-l border-border/40 text-center text-sm font-black py-4 ${parseFloat(final) >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {gradeInfo.letter}
                                                    </TableCell>
                                                </TableRow>

                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-card border border-border shadow-2xl shadow-black/20 group hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-background border border-border group-hover:scale-110 transition-transform">
                                        <Info className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-foreground uppercase tracking-tighter">Instant Persistence</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Changes are saved on field exit.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 rounded-2xl bg-card border border-border shadow-2xl shadow-black/20 group hover:border-blue-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-background border border-border group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-foreground uppercase tracking-tighter">Mark Status</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Currently editing as DRAFT.</span>
                                    </div>
                                </div>
                                <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black tracking-widest px-3 uppercase">Draft Mode</Badge>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

function ShieldCheck({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
