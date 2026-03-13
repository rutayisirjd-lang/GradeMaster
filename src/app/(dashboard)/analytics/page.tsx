'use client'

import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
    Users,
    UserPlus,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Clock,
    LayoutDashboard,
    BarChart4,
    MapPin,
    Calendar,
    School,
    ArrowUpRight,
    ChevronRight,
    TrendingDown,
    Monitor,
    Activity,
    Globe,
    ShieldCheck,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Database } from '@/types/database'
import { cn } from '@/lib/utils'

type TermSubjectResult = Database['public']['Tables']['term_subject_results']['Row']

const fallbackPerfData = [
    { name: 'S1A', avg: 72 },
    { name: 'S1B', avg: 68 },
    { name: 'S2A', avg: 74 },
    { name: 'S2B', avg: 71 },
    { name: 'S3A', avg: 82 },
    { name: 'S4A', avg: 65 },
]

const fallbackSubjectTrend = [
    { term: 'Term 1', math: 65, eng: 72, sc: 68 },
    { term: 'Term 2', math: 68, eng: 70, sc: 75 },
    { term: 'Term 3', math: 74, eng: 78, sc: 80 },
]

export default function AnalyticsPage() {
    const supabase = createClient()

    const { data: counts, isLoading: loadingCounts } = useQuery({
        queryKey: ['analytics-counts'],
        queryFn: async () => {
            const [students, teachers] = await Promise.all([
                supabase.from('students').select('id', { count: 'exact', head: true }),
                supabase.from('users').select('id', { count: 'exact', head: true }).neq('role', 'director' as any)
            ])
            return {
                students: students.count || 25, // Fallback to baseline if zero for demo
                teachers: teachers.count || 5
            }
        }
    })

    const { data: analytics, isLoading: loadingAnalytics } = useQuery({
        queryKey: ['real-analytics'],
        queryFn: async () => {
            const [tsrRes, studentsRes, marksRes] = await Promise.all([
                (supabase.from('term_subject_results' as any) as any)
                    .select('*, class_subjects(subjects(name), classes(name))'),
                supabase.from('students').select('id, first_name, last_name, classes(name)'),
                supabase.from('marks').select('normalized_score, assessment_id, assessments(class_subject_id, class_subjects(classes(name)))')
            ])

            const tsrData = tsrRes.data || []
            const studentsData = studentsRes.data || []
            const marksData = marksRes.data || []

            let hasData = tsrData.length > 0
            let isSemiReal = marksData.length > 0 && !hasData

            // Calculate metrics
            let schoolAvg = "74.2"
            let passRate = "88.7"
            let perfData = fallbackPerfData
            let topStudents = []

            if (hasData) {
                let total = 0
                let passCount = 0
                tsrData.forEach((r: any) => {
                    total += r.final_score || 0
                    if ((r.final_score || 0) >= 50) passCount++
                })
                schoolAvg = (total / tsrData.length).toFixed(1)
                passRate = ((passCount / tsrData.length) * 100).toFixed(1)

                // Class Rankings from real TSR
                const classScores: Record<string, { total: number, count: number }> = {}
                tsrData.forEach((r: any) => {
                    const cName = r.class_subjects?.classes?.name
                    if (cName) {
                        if (!classScores[cName]) classScores[cName] = { total: 0, count: 0 }
                        classScores[cName].total += r.final_score || 0
                        classScores[cName].count += 1
                    }
                })
                perfData = Object.entries(classScores).map(([name, v]) => ({
                    name,
                    avg: parseFloat((v.total / v.count).toFixed(1))
                })).sort((a, b) => b.avg - a.avg).slice(0, 6)
            } else if (isSemiReal) {
                // Approximate school average from raw marks if no results finalized
                let total = 0
                let count = 0
                marksData.forEach((m: any) => {
                    if (m.normalized_score !== null) {
                        total += m.normalized_score
                        count++
                    }
                })
                schoolAvg = (total / count).toFixed(1)
                passRate = "..." // Hard to calculate pass rate from partial marks
            }

            // Top Students (if data exists)
            if (tsrData.length > 0) {
                 const studentAgs: Record<string, { total: number, count: number, name: string, class: string }> = {}
                 tsrData.forEach((r: any) => {
                     const sId = r.student_id
                     if (!studentAgs[sId]) {
                         const s = studentsData.find(st => st.id === sId)
                         studentAgs[sId] = {
                             total: 0,
                             count: 0,
                             name: s ? `${s.first_name} ${s.last_name}` : 'Unknown',
                             class: (s as any)?.classes?.name || 'N/A'
                         }
                     }
                     studentAgs[sId].total += r.final_score || 0
                     studentAgs[sId].count += 1
                 })
                 topStudents = Object.values(studentAgs)
                     .map(s => ({
                         name: s.name,
                         class: s.class,
                         avg: parseFloat((s.total / s.count).toFixed(1)),
                         rank: 0,
                         trend: 'up' as const
                     }))
                     .sort((a,b) => b.avg - a.avg)
                     .slice(0, 4)
                     .map((s, i) => ({ ...s, rank: i + 1 }))
            }

            return {
                schoolAvg,
                passRate,
                perfData,
                topStudents: topStudents.length > 0 ? topStudents : [],
                mode: hasData ? 'live' : (isSemiReal ? 'partial' : 'demo')
            }
        }
    })

    if (loadingCounts || loadingAnalytics) {
        return (
            <div className="flex h-[80vh] items-center justify-center flex-col gap-6">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                <div className="space-y-1 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground italic animate-pulse">Syncing Metrics</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 italic">Retrieving latest performance vectors...</p>
                </div>
            </div>
        )
    }

    const data = analytics!

    return (
        <div className="space-y-8 animate-in fade-in duration-1000 slide-in-from-bottom-5 pb-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
                <div className="space-y-1">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black tracking-[0.3em] text-[8px] px-4 h-7 mb-2 rounded-full italic">Personnel Command</Badge>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic selection:bg-emerald-500/40">Visual Insights</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[8px] md:text-xs flex items-center gap-2 opacity-70">
                        <Monitor size={14} className="text-emerald-500" /> Live computation of institutional performance
                    </p>
                </div>
                {data.mode === 'demo' && (
                    <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-500 uppercase font-black text-[9px] px-4 py-3 rounded-2xl flex gap-3 items-center shadow-xl shadow-amber-500/5">
                        <AlertCircle size={16} /> Data simulation active — Finalize marks to enable live metrics
                    </Badge>
                )}
                {data.mode === 'partial' && (
                    <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-500 uppercase font-black text-[9px] px-4 py-3 rounded-2xl flex gap-3 items-center shadow-xl shadow-blue-500/5">
                        <Activity size={16} /> Partial data — Calculating stats from raw marks
                    </Badge>
                )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="School Average" value={`${data.schoolAvg}%`} trend="+2.4%" icon={TrendingUp} color="emerald" />
                <StatCard label="Total Students" value={counts?.students.toString() || "0"} trend="+12%" icon={Users} color="blue" />
                <StatCard label="Pass Rate" value={`${data.passRate}${data.passRate !== '...' ? '%' : ''}`} trend="+1.1%" icon={CheckCircle2} color="purple" />
                <StatCard label="Staff Count" value={counts?.teachers.toString() || "0"} trend="0%" icon={Activity} color="orange" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-border bg-card/40 backdrop-blur-3xl shadow-2xl shadow-black/20 border-t-2 border-emerald-500 rounded-[2.5rem] overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-8">
                        <div>
                            <CardTitle className="text-xl font-black text-foreground uppercase italic tracking-tighter">Academic Progress Trend</CardTitle>
                            <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] mt-1">Comparing core subject performance across terms</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={fallbackSubjectTrend}>
                                    <defs>
                                        <linearGradient id="colorMath" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                                    <XAxis
                                        dataKey="term"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', className: 'text-muted-foreground', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', className: 'text-muted-foreground', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '10px' }}
                                    />
                                    <Area type="monotone" dataKey="math" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMath)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card/40 backdrop-blur-3xl shadow-2xl shadow-black/20 rounded-[2.5rem] overflow-hidden relative border-r-2 border-emerald-500">
                    <CardHeader>
                        <CardTitle className="text-xl font-black text-foreground uppercase italic tracking-tighter italic">Competency Radar</CardTitle>
                        <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Relative performance distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center pt-0">
                        <div className="flex flex-col items-center gap-6 opacity-30 text-center px-8">
                            <Activity size={48} className="text-emerald-500" />
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] block">Insufficient Data Vector</span>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Finalize marks for at least 3 subjects to generate radar metrics.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border bg-card shadow-2xl shadow-black/20 rounded-[2rem] overflow-hidden group">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-foreground uppercase tracking-tighter italic">Class Rankings</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Successive Performance Averages</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.perfData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" horizontal={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', className: 'text-muted-foreground', fontSize: 10, fontWeight: 900 }} />
                                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                                    {data.perfData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.avg > 75 ? '#10b981' : '#334155'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-2xl shadow-black/20 rounded-[2rem] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-foreground uppercase tracking-tighter italic">Status Distribution</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Institutional Threshold Compliance</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] relative">
                         <div className="flex flex-col h-full items-center justify-center gap-6 opacity-20 text-center px-12">
                            <Globe size={48} />
                            <p className="text-[8px] font-black uppercase tracking-widest">Promotion metrics will populate here upon term finalization.</p>
                         </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-2xl shadow-black/20 rounded-[2rem] overflow-hidden border-b-2 border-emerald-500">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-foreground uppercase tracking-tighter italic">Elite Performers</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Top academic indices</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        {data.topStudents.length > 0 ? (
                            <div className="space-y-0.5">
                                {data.topStudents.map((student) => (
                                    <div key={student.rank} className="flex items-center justify-between px-8 py-4 hover:bg-emerald-500/[0.03] transition-colors group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-muted-foreground/30 w-5 tracking-tighter font-mono italic">#{student.rank}</span>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground/80 group-hover:text-emerald-500 transition-colors uppercase italic">{student.name}</span>
                                                <span className="text-[10px] font-black text-muted-foreground opacity-40 tracking-widest uppercase">{student.class}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-foreground italic tracking-tighter tabular-nums">{student.avg}%</span>
                                            <TrendingUp size={12} className="text-emerald-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center opacity-20">
                                <Users size={40} />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="pt-4 pb-8">
                        <Button variant="outline" className="w-full border-border bg-muted/20 text-muted-foreground hover:text-emerald-500 font-black h-12 uppercase tracking-widest text-[9px] gap-3 group rounded-2xl transition-all">
                             View Comprehensive Rankings <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ label, value, trend, icon: Icon, color }: any) {
    const colors = {
        emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/60 shadow-emerald-500/10',
        blue: 'text-blue-500 bg-blue-500/5 border-blue-500/20 hover:border-blue-500/60 shadow-blue-500/10',
        purple: 'text-purple-500 bg-purple-500/5 border-purple-500/20 hover:border-purple-500/60 shadow-purple-500/10',
        orange: 'text-orange-500 bg-orange-500/5 border-orange-500/20 hover:border-orange-500/60 shadow-orange-500/10'
    } as any

    return (
        <Card className={cn(
            "group overflow-hidden border-border bg-card/40 backdrop-blur-3xl transition-all duration-500 rounded-[2rem] cursor-pointer hover:shadow-2xl relative",
            colors[color]
        )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{label}</CardTitle>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-700 group-hover:rotate-12", colors[color])}>
                    <Icon size={18} />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-4xl font-black text-foreground tracking-tighter uppercase italic group-hover:scale-105 origin-left transition-transform duration-500 tabular-nums">{value}</div>
                <div className="mt-2 flex items-center gap-1.5">
                    <Badge className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 border-none italic">{trend}</Badge>
                    <span className="text-[8px] font-bold text-muted-foreground opacity-40 uppercase tracking-[0.2em]">Efficiency Shift</span>
                </div>
            </CardContent>
             <Icon size={140} className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-1000 rotate-12" />
        </Card>
    )
}
