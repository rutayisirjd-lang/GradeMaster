'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seedEntireSystem } from '@/app/actions/seed'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    MoreHorizontal,
    GraduationCap,
    BookOpen,
    User,
    LayoutGrid,
    Filter,
    ArrowRight,
    ClipboardList,
    Loader2,
    Trash2,
    BookOpen as SubjectIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClass, deleteClass } from '@/app/actions/classes'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import React from 'react'
import Link from 'next/link'

export default function ClassesPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isSeeding, setIsSeeding] = React.useState(false)

    const { data: classes, isLoading, error } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            console.log("🛠️ FETCHING CLASSES (MANUAL JOIN)...")
            // 1. Fetch classes first
            const { data: clsData, error: clsError } = await (supabase.from('classes' as any) as any)
                .select('*, academic_years (id, label)')
                .order('name')

            if (clsError) throw clsError
            if (!clsData) return []

            // 2. Fetch all unique teacher IDs
            const teacherIds = Array.from(new Set(clsData.map((c: any) => c.class_teacher_id).filter(Boolean)))

            let teacherMap: Record<string, any> = {}
            if (teacherIds.length > 0) {
                const { data: teachers, error: tErr } = await (supabase.from('users' as any) as any)
                    .select('id, email, first_name, last_name, role')
                    .in('id', teacherIds)

                if (!tErr && teachers) {
                    teachers.forEach((t: any) => { teacherMap[t.id] = t })
                }
            }

            // 3. Fetch students count per class
            const { data: studentsData } = await (supabase.from('students' as any) as any)
                .select('class_id')

            let studentCountMap: Record<string, number> = {}
            studentsData?.forEach((s: any) => {
                if (s.class_id) {
                    studentCountMap[s.class_id] = (studentCountMap[s.class_id] || 0) + 1
                }
            })

            // 4. Join on client side
            const joined = clsData.map((c: any) => ({
                ...c,
                class_teacher: c.class_teacher_id ? teacherMap[c.class_teacher_id] : null,
                student_count: studentCountMap[c.id] || 0
            }))

            console.log("📊 JOINED RESULT:", joined)
            return joined
        }
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
                <div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black tracking-[0.3em] text-[8px] px-4 h-7 mb-2 rounded-full">Academic Divisions</Badge>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic selection:bg-emerald-500/40 flex items-center gap-3">
                        Classes
                        {!isLoading && <Badge className="bg-emerald-500 text-slate-950 rounded-lg text-sm md:text-base">{classes?.length || 0}</Badge>}
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[8px] md:text-[10px] flex items-center gap-3 opacity-70">View and manage school class sections</p>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <div className="relative flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Filter classes..."
                            className="w-[180px] md:w-[240px] border-border bg-card/40 backdrop-blur-xl pl-10 h-12 md:h-14 rounded-2xl focus-visible:ring-emerald-500"
                        />
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black h-12 md:h-14 px-6 md:px-8 rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/10 uppercase tracking-widest text-[9px] md:text-[10px] flex-shrink-0">
                                <Plus className="mr-2 h-4 w-4 stroke-[3]" /> New Class
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border text-foreground">
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const loading = toast.loading('Creating class...')
                                const res = await createClass({
                                    name: formData.get('name') as string,
                                    level: formData.get('level') as string,
                                    section: formData.get('section') as string,
                                    capacity: parseInt(formData.get('capacity') as string),
                                })
                                if (res.success) {
                                    toast.success('Class created!', { id: loading })
                                    setIsCreateOpen(false)
                                    queryClient.invalidateQueries({ queryKey: ['classes'] })
                                } else {
                                    toast.error(res.error || 'Failed to create class', { id: loading })
                                }
                            }}>
                                <DialogHeader>
                                    <DialogTitle>Create New Class</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">Add a new class section to the current academic year.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Class Name</Label>
                                        <Input id="name" name="name" placeholder="e.g. Senior 1A" className="bg-muted border-border" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="level">Level</Label>
                                            <Select name="level" defaultValue="S1">
                                                <SelectTrigger className="bg-muted border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-background border-border text-foreground">
                                                    <SelectItem value="S1">S1</SelectItem>
                                                    <SelectItem value="S2">S2</SelectItem>
                                                    <SelectItem value="S3">S3</SelectItem>
                                                    <SelectItem value="S4">S4</SelectItem>
                                                    <SelectItem value="S5">S5</SelectItem>
                                                    <SelectItem value="S6">S6</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="section">Section</Label>
                                            <Input id="section" name="section" placeholder="e.g. A" className="bg-muted border-border" required />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="capacity">Capacity</Label>
                                        <Input id="capacity" name="capacity" type="number" defaultValue={40} className="bg-muted border-border" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Create Class</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-card/50 animate-pulse border border-border" />
                    ))
                ) : !classes || classes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-border rounded-3xl bg-background">
                        <LayoutGrid className="h-16 w-16 text-muted-foreground/20 mb-6" />
                        <h3 className="text-xl font-bold text-foreground">No Classes Configured</h3>
                        <p className="text-muted-foreground text-center mt-2 max-w-sm">
                            The academic registry is currently empty. You need to initialize the system with test data or create a manual entry.
                        </p>
                        <Button
                            disabled={isSeeding}
                            onClick={async () => {
                                setIsSeeding(true);
                                const loading = toast.loading('Initializing registry (this may take 30s)...');
                                try {
                                    const res = await seedEntireSystem();
                                    if (res.success) {
                                        toast.success('Registry initialized successfully!', { id: loading });
                                        queryClient.invalidateQueries({ queryKey: ['classes'] });
                                    } else {
                                        toast.error('Seed failed: ' + (res.error || 'Unknown error'), { id: loading });
                                    }
                                } catch (err) {
                                    toast.error('Critical failure during initialization.', { id: loading });
                                } finally {
                                    setIsSeeding(false);
                                }
                            }}
                            className="mt-8 bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-xl font-bold"
                        >
                            {isSeeding ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Seeding...</>
                            ) : (
                                "Initialize System Registry (S1-S3)"
                            )}
                        </Button>
                    </div>
                ) : (
                    classes?.map((cls) => (
                        <Card key={cls.id} className="group relative overflow-hidden border-border bg-card transition-all hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 rounded-[2rem]">
                            <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500 transform scale-x-0 group-hover:scale-x-110 transition-transform origin-left duration-500" />
                            <CardHeader className="pb-4 pt-8">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 uppercase font-black tracking-widest text-[9px]">
                                            {cls.academic_years?.label}
                                        </Badge>
                                        <CardTitle className="text-4xl font-black text-foreground tracking-tighter uppercase italic">{cls.name}</CardTitle>
                                        <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70">{cls.level || 'Ordinary Level'} • Section {cls.section || 'A'}</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 hover:bg-muted">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-background border-border text-foreground">
                                            <DropdownMenuLabel>Class Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-border" />
                                            <DropdownMenuItem className="cursor-pointer">Edit Details</DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href={`/classes/${cls.id}#subjects`} className="flex items-center">
                                                    <SubjectIcon className="mr-2 h-4 w-4" /> Manage Subjects
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border" />
                                            <DropdownMenuItem
                                                className="cursor-pointer text-red-500 hover:bg-red-500/10"
                                                onClick={async () => {
                                                    if (confirm(`Are you sure you want to delete ${cls.name}?`)) {
                                                        const loading = toast.loading('Deleting...')
                                                        const res = await deleteClass(cls.id)
                                                        if (res.success) {
                                                            toast.success('Class deleted', { id: loading })
                                                            queryClient.invalidateQueries({ queryKey: ['classes'] })
                                                        } else {
                                                            toast.error(res.error || 'Failed to delete', { id: loading })
                                                        }
                                                    }
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Archive Class
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border mt-2">
                                    <Avatar className="h-10 w-10 border border-border bg-card">
                                        <AvatarFallback className="text-emerald-500 text-xs font-black uppercase">
                                            {cls.class_teacher ? `${cls.class_teacher.first_name?.[0] || 'T'}${cls.class_teacher.last_name?.[0] || ''}` : 'CT'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em]">Class Teacher</span>
                                        <span className="text-sm font-black text-foreground uppercase tracking-tight italic">
                                            {cls.class_teacher ? `${cls.class_teacher.first_name} ${cls.class_teacher.last_name}` : 'Not Assigned'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-muted/50 border border-border">
                                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest leading-none">Students</span>
                                        <span className="text-lg font-black text-foreground tabular-nums">{cls.student_count || 0}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-muted/50 border border-border">
                                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest leading-none">Transcripts</span>
                                        <span className="text-lg font-black text-emerald-500">100%</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-8 flex justify-between gap-3 px-6">
                                <Button asChild variant="ghost" className="bg-muted hover:bg-muted/80 text-muted-foreground group/btn h-11 px-4 w-full rounded-xl font-black uppercase tracking-widest text-[10px]">
                                    <Link href={`/classes/${cls.id}`}>
                                        <ClipboardList className="mr-2 h-4 w-4 opacity-70 group-hover/btn:text-emerald-500" />
                                        Details
                                    </Link>
                                </Button>
                                <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-11 px-4 w-full group/btn rounded-xl font-black uppercase tracking-widest text-[10px]">
                                    <Link href={`/classes/${cls.id}`}>
                                        Students
                                        <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover/btn:translate-x-1" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
