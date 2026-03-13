'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    BarChart3,
    FileText,
    Download,
    FileSearch,
    Search,
    User,
    ArrowRight,
    ClipboardCheck,
    Calendar,
    Layers,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Filter,
    Eye,
    Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import React from 'react'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { TranscriptDocument } from '@/lib/pdf/TranscriptDocument'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export default function ReportsPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedClass, setSelectedClass] = React.useState<string>('all')
    const [selectedTerm, setSelectedTerm] = React.useState<string>('')

    // 1. Fetch Classes for filter
    const { data: classes } = useQuery({
        queryKey: ['classes-reports'],
        queryFn: async () => {
            const { data, error } = await supabase.from('classes').select('id, name').order('name')
            if (error) throw error
            return data as any[]
        }
    })

    // 2. Fetch Terms for filter
    const { data: terms } = useQuery({
        queryKey: ['terms-reports'],
        queryFn: async () => {
            const { data, error } = await supabase.from('terms').select('id, name, academic_years(label)').order('name')
            if (error) throw error
            return data as any[]
        }
    })

    // 3. Fetch Students for report generation
    const { data: students, isLoading } = useQuery({
        queryKey: ['students-reports-list', selectedClass],
        queryFn: async () => {
            console.log("🛠️ FETCHING STUDENTS FOR REPORTS (MANUAL JOIN)...")
            // 1. Fetch students
            let query = supabase.from('students' as any).select('*').order('last_name')
            if (selectedClass !== 'all') {
                query = query.eq('class_id', selectedClass)
            }
            const { data: stData, error: stError } = await query
            if (stError) throw stError
            if (!stData) return []

            // 2. Fetch unique class IDs
            const classIds = Array.from(new Set((stData as any[]).map(s => s.class_id).filter(Boolean)))
            let classMap: Record<string, any> = {}
            if (classIds.length > 0) {
                const { data: classesData } = await (supabase.from('classes' as any) as any).select('id, name').in('id', classIds)
                classesData?.forEach((c: any) => { classMap[c.id] = c })
            }

            // 3. Merging
            const joined = (stData as any[]).map(s => ({
                ...s,
                classes: s.class_id ? classMap[s.class_id] : null
            }))

            return joined
        }
    })

    // 4. Mutation to "record" report generation
    const recordReportMutation = useMutation({
        mutationFn: async (reportData: any) => {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await (supabase.from('reports' as any) as any).insert([{
                student_id: reportData.studentId,
                class_id: reportData.classId,
                term_id: selectedTerm,
                report_type: 'term_transcript',
                generated_by: user!.id
            }])
            if (error) throw error
        }
    })

    const filteredStudents = students?.filter(s =>
        `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleGenerate = (student: any) => {
        if (!selectedTerm) {
            toast.error("Please select a term first.")
            return
        }
        recordReportMutation.mutate({
            studentId: student.id,
            classId: student.class_id
        })
        toast.success(`Generating report for ${student.first_name}...`)
    }

    // Placeholder data generator for PDF
    const mockTranscriptData = (student: any) => ({
        schoolName: 'GradeMaster Elite Academy',
        schoolAddress: '123 Academic Blvd, Kigali, Rwanda',
        studentName: `${student.first_name} ${student.last_name}`,
        studentId: student.student_id,
        className: student.classes?.name || 'Unassigned',
        term: terms?.find(t => t.id === selectedTerm)?.name.replace('_', ' ') || 'Term X',
        year: terms?.find(t => t.id === selectedTerm)?.academic_years?.label || '2025',
        subjects: [
            { name: 'Mathematics', ca: '42.5', exam: '40', total: '82.5', grade: 'A', remark: 'Excellent performance' },
            { name: 'English Literature', ca: '38.0', exam: '42', total: '80.0', grade: 'A', remark: 'Distinguished writing' },
            { name: 'Physics', ca: '35.0', exam: '30', total: '65.0', grade: 'B', remark: 'Strong theoretical grasp' }
        ],
        summary: {
            totalMarks: '227.5/300',
            average: '75.8',
            rank: '4 of 42',
            decision: 'Promoted'
        }
    })

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/50 pb-8 md:pb-10 px-2">
                <div className="space-y-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black tracking-[0.3em] text-[8px] px-4 h-7 mb-2 rounded-full italic">Certification Protocol</Badge>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic selection:bg-emerald-500/40">Credential Nexus</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[8px] md:text-[10px] flex items-center gap-3 opacity-70">Official transcript & report card generation engine</p>
                </div>
                <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <Button variant="outline" className="border-border bg-card/40 backdrop-blur-xl text-muted-foreground hover:text-foreground h-12 md:h-14 px-6 md:px-8 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all shadow-xl shadow-black/5 flex-shrink-0">
                        <Layers className="mr-3 h-4 w-4 text-emerald-500" /> <span className="hidden sm:inline">Batch Processing</span><span className="sm:hidden">Batch</span>
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black h-12 md:h-14 px-8 md:px-10 rounded-[1.2rem] md:rounded-[1.5rem] transition-all active:scale-95 uppercase tracking-widest text-[9px] md:text-[10px] flex gap-3 shadow-xl shadow-emerald-500/20 group flex-shrink-0">
                        <Settings2 className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Layout Config</span><span className="sm:hidden">Config</span>
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-3 sm:col-span-2 lg:col-span-2 px-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-2 opacity-60">Identity Vector</Label>
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        <Input
                            placeholder="Identify subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border-border bg-card/30 backdrop-blur-2xl pl-12 h-12 md:h-14 text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500/40 rounded-[1.2rem] md:rounded-[1.5rem] shadow-xl shadow-black/5"
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-2 opacity-60">Section Allocation</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="h-14 bg-card/30 backdrop-blur-2xl border-border rounded-[1.5rem] text-foreground focus:ring-emerald-500/40 shadow-xl shadow-black/5">
                            <SelectValue placeholder="All Academic Sections" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border text-foreground rounded-2xl">
                            <SelectItem value="all">Global Registry</SelectItem>
                            {classes?.map(c => <SelectItem key={c.id} value={c.id} className="rounded-xl">{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-2 opacity-60">Temporal Phase</Label>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                        <SelectTrigger className={`h-14 bg-card/30 backdrop-blur-2xl border-border rounded-[1.5rem] text-foreground focus:ring-emerald-500/40 shadow-xl shadow-black/5 ${!selectedTerm ? 'border-amber-500/30 ring-1 ring-amber-500/20' : ''}`}>
                            <SelectValue placeholder="Target Academic Term" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border text-foreground rounded-2xl">
                            {terms?.map(t => (
                                <SelectItem key={t.id} value={t.id} className="rounded-xl">
                                    {t.name.replace('_', ' ')} ({t.academic_years?.label})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-[2.5rem] bg-card/20 animate-pulse border border-border/50" />
                    ))
                ) : filteredStudents?.length === 0 ? (
                    <div className="col-span-full h-80 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-[4rem] bg-card/10 gap-6">
                        <FileSearch className="h-16 w-16 text-muted-foreground/10" />
                        <p className="font-black text-xs uppercase tracking-[0.5em] text-muted-foreground/30 italic">Registry vector nullified</p>
                    </div>
                ) : filteredStudents?.map((student) => (
                    <Card key={student.id} className="group overflow-hidden border-border bg-card/20 backdrop-blur-3xl hover:bg-card/40 hover:border-emerald-500/40 transition-all duration-500 rounded-[2.5rem] relative shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-2">
                        <CardHeader className="p-8">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-background border border-border/70 group-hover:border-emerald-500/50 transition-all rotate-3 group-hover:rotate-0">
                                        <User className="h-8 w-8 text-muted-foreground/30 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter truncate max-w-[180px] group-hover:text-emerald-500 transition-colors">
                                            {student.first_name} {student.last_name}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-50">{student.student_id}</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 py-1 px-4 font-black text-[9px] uppercase tracking-[0.2em] rounded-full">
                                    {student.classes?.name || 'N/A'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 pt-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-background/40 border border-border/60 group-hover:bg-background/60 transition-colors">
                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em] block mb-2 opacity-40">Status Vector</span>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase text-foreground/80 tracking-widest">Authorized</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-background/40 border border-border/60 group-hover:bg-background/60 transition-colors">
                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em] block mb-2 opacity-40">Performance</span>
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest italic group-hover:scale-110 transition-transform origin-left">Distinguished</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-0 flex border-t border-border bg-card/20">
                            <Button
                                variant="ghost"
                                onClick={() => handleGenerate(student)}
                                className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-emerald-500 group/btn rounded-none border-r border-border"
                            >
                                <Eye size={14} className="mr-2" /> Preview result
                            </Button>

                            {selectedTerm && (
                                <PDFDownloadLink
                                    document={<TranscriptDocument data={mockTranscriptData(student)} />}
                                    fileName={`Transcript_${student.last_name}_${student.student_id}.pdf`}
                                    className="flex-1"
                                >
                                    {({ loading }) => (
                                        <Button
                                            variant="ghost"
                                            className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-400 group/btn rounded-none hover:bg-emerald-500/5"
                                            disabled={loading}
                                            onClick={() => handleGenerate(student)}
                                        >
                                            {loading ? <Loader2 className="animate-spin h-3 w-3" /> : (
                                                <><Download size={14} className="mr-2" /> Download PDF</>
                                            )}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
