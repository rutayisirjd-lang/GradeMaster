'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Download, Filter, Loader2, Table as TableIcon, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getLetterGrade } from '@/lib/calculations/grades'
import Link from 'next/link'

export function DirectorBroadsheetView() {
    const supabase = createClient()
    const [selectedFilters, setSelectedFilters] = React.useState<{ classId: string, termId: string } | null>(null)

    // Filter Options
    const { data: classes } = useQuery({
        queryKey: ['classes-filter'],
        queryFn: async () => {
            const { data, error } = await supabase.from('classes').select('id, name').order('name')
            if (error) throw error; return data as any[]
        }
    })

    const { data: terms } = useQuery({
        queryKey: ['terms-filter'],
        queryFn: async () => {
            const { data, error } = await supabase.from('terms').select('id, name, academic_year_id, academic_years(label)').order('name')
            if (error) throw error; return data as any[]
        }
    })

    // Class Subjects
    const { data: classSubjects } = useQuery({
        queryKey: ['class-subjects-broadsheet', selectedFilters?.classId],
        enabled: !!selectedFilters?.classId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_subjects')
                .select('id, subjects(id, name, code)')
                .eq('class_id', selectedFilters!.classId)
            if (error) throw error; return data as any[]
        }
    })

    // Students
    const { data: students, isLoading: loadingStudents } = useQuery({
        queryKey: ['students-broadsheet', selectedFilters?.classId],
        enabled: !!selectedFilters?.classId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('class_id', selectedFilters!.classId)
                .order('last_name')
            if (error) throw error; return data as any[]
        }
    })

    // Assessments
    const { data: assessments, isLoading: loadingAssessments } = useQuery({
        queryKey: ['assessments-broadsheet', classSubjects?.map(c => c.id), selectedFilters?.termId],
        enabled: !!classSubjects && classSubjects.length > 0 && !!selectedFilters?.termId,
        queryFn: async () => {
            const subjectIds = classSubjects!.map(cs => cs.id)
            const { data, error } = await supabase
                .from('assessments')
                .select('*')
                .in('class_subject_id', subjectIds)
                .eq('term_id', selectedFilters!.termId)
            if (error) throw error; return data as any[]
        }
    })

    // Marks
    const { data: marks, isLoading: loadingMarks } = useQuery({
        queryKey: ['marks-broadsheet', assessments?.map(a => a.id)],
        enabled: !!assessments && assessments.length > 0,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marks')
                .select('*')
                .in('assessment_id', assessments!.map(a => a.id))
            if (error) throw error; return data as any[]
        }
    })

    const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setSelectedFilters({
            classId: formData.get('classId') as string,
            termId: formData.get('termId') as string,
        })
    }

    const calculateStudentFinalForSubject = (studentId: string, subjectId: string) => {
        const subjAssessments = assessments?.filter(a => a.class_subject_id === subjectId) || []
        const studentMarks = marks?.filter(m => m.student_id === studentId && subjAssessments.find(a => a.id === m.assessment_id)) || []

        if (subjAssessments.length === 0) return { score: 0, grade: getLetterGrade(0) }

        const examMark = studentMarks.find(m => assessments?.find(a => a.id === m.assessment_id)?.category === 'exam')
        const caAssessments = subjAssessments.filter(a => a.category !== 'exam')

        let totalNormalized = 0
        let count = 0
        studentMarks.forEach(m => {
            const isCA = assessments?.find(a => a.id === m.assessment_id)?.category !== 'exam'
            if (isCA && m.normalized_score !== null) {
                totalNormalized += m.normalized_score
                count++
            }
        })

        const caAvg = caAssessments.length > 0 && count > 0 ? (totalNormalized / caAssessments.length) : 0
        const examScore = examMark?.normalized_score || 0
        const finalScore = (caAvg * 0.5) + (examScore * 0.5)

        return { score: finalScore, grade: getLetterGrade(finalScore) }
    }

    const isLoading = loadingStudents || loadingAssessments || loadingMarks

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground uppercase italic">Marks Broadsheet</h1>
                    <p className="text-muted-foreground font-medium tracking-tight">View global class performance across all subjects.</p>
                </div>
                {selectedFilters && (
                    <Button variant="outline" className="border-border bg-card text-muted-foreground hover:text-foreground h-11 px-6 rounded-xl transition-all">
                        <Download className="mr-2 h-4 w-4" /> Export Master CSV
                    </Button>
                )}
            </div>

            <Card className="border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                <CardContent className="p-6">
                    <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4 lg:gap-6">
                        <div className="space-y-2 flex-1 min-w-[250px]">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Class</Label>
                            <Select name="classId" defaultValue={selectedFilters?.classId}>
                                <SelectTrigger className="bg-background border-border h-11 rounded-xl text-foreground">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex-1 min-w-[250px]">
                            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Academic Term</Label>
                            <Select name="termId" defaultValue={selectedFilters?.termId}>
                                <SelectTrigger className="bg-background border-border h-11 rounded-xl text-foreground">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    {terms?.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name.replace('_', ' ')} ({t.academic_years?.label})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-bold flex items-center gap-2 transition-all">
                            <Filter className="h-4 w-4" /> Generate Broadsheet
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {!selectedFilters ? (
                <div className="flex flex-col items-center justify-center p-20 border border-border rounded-[3rem] bg-card/20 mt-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-blue-500/50 to-transparent" />
                    <div className="h-20 w-20 rounded-2xl bg-blue-500/5 flex items-center justify-center border border-blue-500/10 mb-6 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                        <TableIcon className="h-10 w-10 text-blue-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Enter Your Selection</h3>
                    <p className="text-muted-foreground opacity-50 text-center mt-2 max-w-sm text-xs font-black uppercase tracking-widest">
                        Pick a specific class and term to view global marks performance.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 h-10 w-10" /></div>
            ) : (
                <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all">
                    <div className="overflow-x-auto">
                        <Table className="relative min-w-[800px]">
                            <TableHeader className="bg-background/80">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-[280px] text-muted-foreground font-black uppercase tracking-widest text-[9px] py-6 sticky left-0 bg-background z-20">Student Name</TableHead>
                                    {classSubjects?.map((cs) => (
                                        <TableHead key={cs.id} className="text-muted-foreground font-black uppercase tracking-widest text-[9px] text-center border-l border-border/20">
                                            {cs.subjects.name}
                                        </TableHead>
                                    ))}
                                    <TableHead className="w-[100px] text-foreground font-black uppercase tracking-tighter text-[11px] text-center border-l border-border/40 bg-blue-600/20 italic">Global Avg</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students?.map((student) => {
                                    let studentTotal = 0;
                                    let classesCount = 0;

                                    return (
                                        <TableRow key={student.id} className="border-border/40 hover:bg-blue-500/[0.03] group transition-all duration-300">
                                            <TableCell className="font-bold text-foreground sticky left-0 bg-card/80 backdrop-blur-sm z-10 py-4">
                                                <Link href={`/students/${student.id}`} className="flex flex-col group-hover:text-blue-500 transition-colors">
                                                    <span className="text-sm font-black uppercase italic">{student.first_name} {student.last_name}</span>
                                                    <span className="text-[10px] text-muted-foreground opacity-50 font-mono tracking-tighter uppercase">{student.student_id}</span>
                                                </Link>
                                            </TableCell>

                                            {classSubjects?.map((cs) => {
                                                const res = calculateStudentFinalForSubject(student.id, cs.id)
                                                studentTotal += res.score;
                                                classesCount++;
                                                return (
                                                    <TableCell key={cs.id} className="border-l border-border/20 p-4 text-center">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <span className="text-sm font-black text-foreground tabular-nums italic">{res.score.toFixed(1)}</span>
                                                            <Badge variant="outline" className={`text-[8px] h-4 py-0 ${res.score >= 50 ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500'}`}>
                                                                {res.grade.letter}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                )
                                            })}

                                            <TableCell className="border-l border-border/40 bg-blue-600/10 text-center text-md font-black py-4 text-foreground italic tabular-nums">
                                                {classesCount > 0 ? (studentTotal / classesCount).toFixed(1) : '0.0'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
