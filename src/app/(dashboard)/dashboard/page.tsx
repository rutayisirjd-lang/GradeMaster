'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Users,
    Calendar,
    TrendingUp,
    ClipboardList,
    GraduationCap,
    BookOpen,
    PieChart as PieChartIcon,
    LayoutDashboard,
    ArrowRight,
    ChevronRight,
    Loader2,
    BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export default function DashboardPage() {
    const supabase = createClient()

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const [
                studentsRes,
                teachersRes,
                classesRes,
                subjectsRes,
                termsRes,
                clsDataRes
            ] = await Promise.all([
                supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('users').select('id', { count: 'exact', head: true }).neq('role', 'director' as any),
                supabase.from('classes').select('id', { count: 'exact', head: true }),
                supabase.from('subjects').select('id', { count: 'exact', head: true }),
                supabase.from('terms').select('name, is_locked').order('name').limit(3),
                (supabase.from('classes' as any) as any)
                    .select('id, name, level, section, class_teacher_id, students(id)')
                    .order('name')
                    .limit(4)
            ])

            const termsData = termsRes.data as { name: string; is_locked: boolean }[] | null
            const currentTerm = termsData?.find(t => !t.is_locked) || termsData?.[0]
            const termLabel = currentTerm?.name?.replace('_', ' ') || 'N/A'

            const clsData = clsDataRes.data || []
            let teacherMap: Record<string, any> = {}

            if (clsData.length > 0) {
                const tIds = Array.from(new Set(clsData.map((c: any) => c.class_teacher_id).filter(Boolean)))
                if (tIds.length > 0) {
                    const { data: teachers } = await (supabase.from('users' as any) as any)
                        .select('id, first_name, last_name, email')
                        .in('id', tIds)
                    teachers?.forEach((t: any) => { teacherMap[t.id] = t })
                }
            }

            const classesOverview = clsData.map((c: any) => ({
                ...c,
                class_teacher: c.class_teacher_id ? teacherMap[c.class_teacher_id] : null
            }))

            return {
                students: studentsRes.count || 0,
                teachers: teachersRes.count || 0,
                classes: classesRes.count || 0,
                subjects: subjectsRes.count || 0,
                currentTerm: termLabel,
                classesOverview,
            }
        },
        staleTime: 1000 * 60 * 5,
    })

    const statCards = [
        { label: 'Students', value: isLoading ? '...' : String(stats?.students || 0), icon: Users, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', sub: 'Active enrolled' },
        { label: 'Faculty', value: isLoading ? '...' : String(stats?.teachers || 0), icon: GraduationCap, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', sub: `${stats?.subjects || 0} subjects` },
        { label: 'Current Term', value: isLoading ? '...' : (stats?.currentTerm || 'N/A'), icon: Calendar, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', sub: 'In progress' },
        { label: 'Classes', value: isLoading ? '...' : String(stats?.classes || 0), icon: TrendingUp, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', sub: 'This year' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Welcome back! Here&apos;s an overview of your institution.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-lg text-sm h-10">
                        Download Report
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                            <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Class Overview */}
                <Card className="lg:col-span-4 border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold">Classes Overview</CardTitle>
                            <CardDescription>Your active academic groups</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm" className="rounded-lg">
                            <Link href="/classes">View All <ArrowRight size={14} className="ml-2" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />
                            )) : stats?.classesOverview?.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-sm">No classes found.</div>
                            ) : stats?.classesOverview?.map((cls: any) => (
                                <Link key={cls.id} href={`/classes/${cls.id}`}>
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                <LayoutDashboard className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cls.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {cls.class_teacher ? `${cls.class_teacher.first_name} ${cls.class_teacher.last_name}` : 'No teacher'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                            {cls.students?.length || 0} students
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Links */}
                <Card className="lg:col-span-3 border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Quick Links</CardTitle>
                        <CardDescription>Navigate to common areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[
                                { href: '/students', label: 'Students', desc: `${stats?.students || 0} enrolled`, icon: Users, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                                { href: '/teachers', label: 'Teachers', desc: `${stats?.teachers || 0} active`, icon: GraduationCap, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                                { href: '/classes', label: 'Classes', desc: `${stats?.classes || 0} sections`, icon: LayoutDashboard, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                                { href: '/subjects', label: 'Subjects', desc: `${stats?.subjects || 0} active`, icon: BookOpen, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                            ].map((item) => (
                                <Link key={item.href} href={item.href}>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all cursor-pointer group">
                                        <div className={`h-9 w-9 rounded-lg ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                            <item.icon className={`h-4 w-4 ${item.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {[
                    { href: '/marks', title: 'Enter Marks', desc: 'Record student grades and assessments.', icon: ClipboardList, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-500/30' },
                    { href: '/reports', title: 'Generate Reports', desc: 'Create transcripts and progress reports.', icon: BarChart3, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-500/30' },
                    { href: '/analytics', title: 'View Analytics', desc: 'Explore performance data and trends.', icon: PieChartIcon, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', hoverBorder: 'hover:border-purple-200 dark:hover:border-purple-500/30' },
                ].map((action) => (
                    <Link key={action.href} href={action.href} className="group">
                        <Card className={`h-full border-border ${action.hoverBorder} hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                            <CardContent className="p-6 space-y-4">
                                <div className={`h-11 w-11 rounded-lg ${action.bg} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                    <action.icon className={`h-5 w-5 ${action.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-foreground mb-1">{action.title}</h3>
                                    <p className="text-sm text-muted-foreground">{action.desc}</p>
                                </div>
                                <div className={`flex items-center gap-2 text-sm font-medium ${action.color} group-hover:translate-x-1 transition-transform`}>
                                    Go to {action.title.split(' ')[1]} <ArrowRight size={14} />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
