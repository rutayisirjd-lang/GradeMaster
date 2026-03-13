'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Plus,
    Search,
    BookOpen,
    Trash2,
    Edit2,
    MoreHorizontal,
    LayoutGrid,
    List,
    Activity,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Clock,
    ArrowRight,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import React from 'react'
import Link from 'next/link'

export default function SubjectsPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: subjects, isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('name')
            if (error) throw error

            const [
                { data: classSubjects },
                { data: students },
                { data: tsResults }
            ] = await Promise.all([
                supabase.from('class_subjects').select('id, subject_id, class_id'),
                supabase.from('students').select('id, class_id'),
                supabase.from('term_subject_results').select('class_subject_id, final_score')
            ]);

            const csBySubject = (classSubjects || []).reduce((acc: Record<string, { csIds: string[], classIds: string[] }>, cs: any) => {
                if (!acc[cs.subject_id]) acc[cs.subject_id] = { csIds: [], classIds: [] };
                acc[cs.subject_id].csIds.push(cs.id);
                acc[cs.subject_id].classIds.push(cs.class_id);
                return acc;
            }, {} as Record<string, { csIds: string[], classIds: string[] }>);

            return data.map((sub: any) => {
                const subData = csBySubject?.[sub.id] || { csIds: [], classIds: [] };
                const enrolled = students?.filter((s: any) => subData.classIds.includes(s.class_id))?.length || 0;

                const marks = tsResults?.filter((r: any) => subData.csIds.includes(r.class_subject_id) && r.final_score != null) || [];
                const sumMarks = marks.reduce((acc: number, curr: any) => acc + Number(curr.final_score), 0);
                const avgPerf = marks.length > 0 ? (sumMarks / marks.length).toFixed(1) : null;

                return {
                    ...sub,
                    enrollment: enrolled,
                    avgPerf: avgPerf ? `${avgPerf}%` : 'N/A'
                }
            });
        }
    })

    const filteredSubjects = subjects?.filter(s =>
        `${s.name} ${s.code}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-10 animate-in fade-in duration-200 relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
                <div className="space-y-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black tracking-[0.3em] text-[8px] px-4 h-7 mb-2 rounded-full">Academic Core</Badge>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic selection:bg-emerald-500/40">Curriculum Matrix</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-3 opacity-70">Academic subject management and course codes</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group lg:w-80">
                        <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                        <Input
                            placeholder="Identify curriculum by title or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border-border bg-card/40 backdrop-blur-2xl pl-12 h-14 text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500/40 rounded-[1.5rem] shadow-xl shadow-black/5"
                        />
                    </div>
                    <Button className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-[10px]">
                        <Plus size={20} className="stroke-[3]" /> Add Subject
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-64 rounded-[2.5rem] bg-card/20 animate-pulse border border-border/50" />
                    ))
                ) : filteredSubjects?.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-32 border-2 border-dashed border-border/50 rounded-[4rem] bg-card/10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-20" />
                        <BookOpen className="h-20 w-20 text-muted-foreground/10 mb-8 group-hover:scale-110 transition-transform duration-500" />
                        <h3 className="text-2xl font-black text-muted-foreground italic uppercase tracking-tighter opacity-40">Registry Vector Null</h3>
                        <p className="text-muted-foreground opacity-30 text-center mt-3 max-w-sm text-[10px] font-black uppercase tracking-[0.3em]">
                            Official curriculum database is currently unpopulated.
                        </p>
                    </div>
                ) : (
                    filteredSubjects?.map((subject) => (
                        <Card key={subject.id} className="group relative border-border bg-card/20 backdrop-blur-3xl transition-all duration-500 rounded-[2.5rem] shadow-2xl overflow-hidden hover:border-emerald-500/40 hover:-translate-y-2 hover:bg-card/30">
                            <div className="absolute top-4 right-4 z-20">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 rounded-2xl transition-all border border-transparent hover:border-emerald-500/20">
                                            <MoreHorizontal size={18} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-background border-border text-foreground rounded-2xl p-2 w-48 shadow-2xl">
                                        <DropdownMenuItem className="cursor-pointer">Edit Course</DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">View Analytics</DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuItem className="cursor-pointer text-red-500">Archive</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <CardHeader className="pb-3 pt-8">
                                <div className="flex flex-col gap-1">
                                    <Badge variant="outline" className="w-fit text-emerald-500 border-emerald-500/30 bg-emerald-500/10 uppercase font-black text-[9px] tracking-widest px-2 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                                        {subject.code}
                                    </Badge>
                                    <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tighter mt-1 italic">{subject.name}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed h-8">
                                    {subject.description || 'No description provided for this core subject.'}
                                </p>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Avg Perf.</span>
                                        <div className="flex items-center gap-1">
                                            {subject.avgPerf !== 'N/A' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                                            <span className="text-sm font-black text-foreground uppercase tracking-tighter tabular-nums">{subject.avgPerf}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Enrollment</span>
                                        <span className="text-sm font-black text-foreground uppercase tracking-tighter tabular-nums">{subject.enrollment} Students</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 pb-4 bg-muted/30 border-t border-border flex justify-between group/footer">
                                <Link href={`/subjects/${subject.id}`}>
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all">
                                        Details
                                    </Button>
                                </Link>
                                <Link href={`/subjects/${subject.id}`}>
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500 hover:text-emerald-400 group/btn transition-all">
                                        View Insights
                                        <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover/btn:opacity-100 transform translate-x-1 group-hover/btn:translate-x-0 transition-all" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
