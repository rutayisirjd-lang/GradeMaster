'use client'

import React, { useState } from 'react'
import {
    Plus, Search, UserSquare2, ArrowRight, BookOpen,
    ShieldCheck, GraduationCap, Mail, Phone, MoreVertical,
    CheckCircle2, XCircle, Loader2, Filter, Download, AlertCircle
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function TeachersPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const queryClient = useQueryClient()
    const supabase = createClient()

    // We fetch users and class_subjects separately because of a schema relationship cache issue in the DB
    const { data: teachers, isLoading, isError, error: queryError } = useQuery({
        queryKey: ['teachers-with-assignments'],
        queryFn: async () => {
            // 1. Fetch teachers
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .neq('role', 'director' as any)
                .order('first_name')
            
            if (userError) throw userError
            if (!userData) return []

            // 2. Fetch all assignments
            const { data: assignments, error: assignmentsError } = await (supabase
                .from('class_subjects' as any) as any)
                .select(`
                    id,
                    teacher_id,
                    classes (name),
                    subjects (name)
                `)
            
            if (assignmentsError) {
                console.warn("Assignments fetch failed, showing teachers without classes:", assignmentsError)
                return userData.map(u => ({ ...u, class_subjects: [] }))
            }

            // 3. Map assignments to teachers
            return userData.map(user => ({
                ...user,
                class_subjects: assignments.filter((a: any) => a.teacher_id === user.id)
            }))
        }
    })

    const toggleTeacherStatus = async (userId: string, currentStatus: boolean) => {
        const loading = toast.loading('Updating teacher status...')
        const { error } = await supabase
            .from('users')
            .update({ is_active: !currentStatus })
            .eq('id', userId)

        if (error) {
            toast.error(error.message, { id: loading })
        } else {
            toast.success('Status updated successfully', { id: loading })
            queryClient.invalidateQueries({ queryKey: ['teachers-with-assignments'] })
        }
    }

    const filteredTeachers = teachers?.filter(t =>
        `${t.first_name} ${t.last_name} ${t.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-200 relative pb-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
                <div className="space-y-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black tracking-[0.3em] text-[8px] px-4 h-7 mb-2 rounded-full italic">Personnel Command</Badge>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic selection:bg-emerald-500/40">Faculty Ledger</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[8px] md:text-[10px] flex items-center gap-3 opacity-70">Institutional staff management & role allocation</p>
                </div>
                <div className="flex items-center gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black uppercase tracking-widest text-[9px] md:text-[10px] h-12 md:h-14 px-8 md:px-10 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 rounded-2xl flex items-center gap-3">
                                <Plus size={18} className="stroke-[3]" /> Register Faculty
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border text-foreground rounded-3xl max-w-md">
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const loading = toast.loading('Creating teacher...')
                                const { createTeacher } = await import('@/app/actions/teachers')
                                const res = await createTeacher({
                                    email: formData.get('email') as string,
                                    first_name: formData.get('first_name') as string,
                                    last_name: formData.get('last_name') as string,
                                    role: formData.get('role') as any,
                                    phone: formData.get('phone') as string
                                })
                                if (res.success) {
                                    toast.success('Teacher created! Password: Teacher@2025', { id: loading, duration: 5000 })
                                    queryClient.invalidateQueries({ queryKey: ['teachers-with-assignments'] })
                                } else {
                                    toast.error(res.error || 'Failed to create', { id: loading })
                                }
                            }}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">New Staff Entry</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Generate credentials for new faculty members.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">First Name</Label>
                                            <Input name="first_name" placeholder="Marie" className="bg-muted border-border h-11 rounded-xl" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Last Name</Label>
                                            <Input name="last_name" placeholder="Uwase" className="bg-muted border-border h-11 rounded-xl" required />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Email Address</Label>
                                        <Input name="email" type="email" placeholder="m.uwase@school.com" className="bg-muted border-border h-11 rounded-xl" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Primary Authority</Label>
                                        <Select name="role" defaultValue="subject_teacher">
                                            <SelectTrigger className="bg-muted border-border h-11 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border text-foreground">
                                                <SelectItem value="class_teacher">Class Teacher</SelectItem>
                                                <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase tracking-tighter h-12 rounded-2xl">Confirm Registration</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 px-2 overflow-x-auto pb-2 no-scrollbar">
                    <div className="relative flex-1 group min-w-[200px] max-w-md">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                        <Input
                            placeholder="Identify staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border-border bg-card/40 backdrop-blur-2xl pl-12 h-12 md:h-14 text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500/40 rounded-[1.2rem] md:rounded-[1.5rem] shadow-xl shadow-black/5"
                        />
                    </div>
                </div>

                <div className="rounded-[2.5rem] border border-border bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-blue-500/50" />
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-16 pl-6 md:pl-10">Staff Identity</TableHead>
                                <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-16 hidden md:table-cell">Departmental Authority</TableHead>
                                <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-16 hidden sm:table-cell">Operational Status</TableHead>
                                <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-16 text-right pr-6 md:pr-10">Management</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i} className="animate-pulse bg-muted/20 border-none transition-none">
                                        <TableCell colSpan={4} className="h-24 bg-muted/30 mb-3 rounded-2xl opacity-50" />
                                    </TableRow>
                                ))
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-80 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6 text-red-500/60">
                                            <AlertCircle className="h-14 w-14" />
                                            <div className="space-y-2 text-center p-8">
                                                <p className="font-black uppercase tracking-[0.3em] text-[10px]">Transmission Failure</p>
                                                <p className="text-[9px] uppercase font-bold max-w-xs mx-auto leading-relaxed">{queryError?.message || 'Unknown database exception'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (!filteredTeachers || filteredTeachers.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-80 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6 opacity-40">
                                            <UserSquare2 className="h-14 w-14 text-muted-foreground" />
                                            <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">No staff records found in this vector.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTeachers.map((teacher: any) => (
                                    <TableRow key={teacher.id} className="border-border hover:bg-emerald-500/5 group/row transition-all duration-300">
                                        <TableCell className="pl-6 md:pl-10">
                                            <div className="flex items-center gap-3 md:gap-4 py-2 md:py-3">
                                                <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-border rounded-xl md:rounded-2xl bg-background transition-all group-hover/row:border-emerald-500/50 group-hover/row:scale-105 shadow-sm">
                                                    <AvatarImage src={teacher.avatar_url} />
                                                    <AvatarFallback className="bg-emerald-500 text-slate-950 font-black text-[10px] md:text-xs">
                                                        {teacher.first_name[0]}{teacher.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm md:text-base font-black text-foreground italic tracking-tight group-hover/row:text-emerald-500 transition-colors uppercase">{teacher.first_name} {teacher.last_name}</span>
                                                    <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest hidden sm:inline">{teacher.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        teacher.role === 'class_teacher' ? "bg-emerald-400" : "bg-blue-400"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-[0.15em] italic",
                                                        teacher.role === 'class_teacher' ? "text-emerald-400" : "text-blue-400"
                                                    )}>
                                                        {teacher.role?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {teacher.class_subjects?.map((a: any) => (
                                                        <Badge key={a.id} className="text-[8px] font-black uppercase bg-muted border-border text-muted-foreground tracking-tighter">
                                                            {a.classes?.name} · {a.subjects?.name}
                                                        </Badge>
                                                    ))}
                                                    {(!teacher.class_subjects || teacher.class_subjects.length === 0) && (
                                                        <span className="text-[9px] text-muted-foreground opacity-50 font-bold uppercase tracking-widest italic">Unassigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex flex-col gap-1.5 px-1 py-1 rounded-xl bg-muted/50 border border-border w-fit">
                                                <div className="flex items-center gap-2 px-3 py-1.5">
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        teacher.is_active !== false ? "bg-emerald-500 glow-emerald" : "bg-red-500"
                                                    )} />
                                                    <span className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">
                                                        {teacher.is_active !== false ? 'Authorized' : 'Restricted'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 md:pr-10">
                                            <TeacherActions teacher={teacher} toggleTeacherStatus={toggleTeacherStatus} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <style jsx global>{`
                .glow-emerald { box-shadow: 0 0 10px rgba(16,185,129,0.5); }
            `}</style>
        </div>
    )
}

function TeacherActions({ teacher, toggleTeacherStatus }: { teacher: any, toggleTeacherStatus: any }) {
    const queryClient = useQueryClient()
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    return (
        <div className="flex justify-end gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-muted/50 rounded-xl border border-transparent hover:border-border">
                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-background border-border text-foreground rounded-2xl p-2 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-3 py-2">Commands</DropdownMenuLabel>
                        
                        <DialogTrigger asChild>
                            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer">
                                <UserSquare2 size={16} /> Edit Profile
                            </DropdownMenuItem>
                        </DialogTrigger>

                        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-not-allowed opacity-50">
                            <Mail size={16} /> Contact Staff
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border my-2" />
                        <DropdownMenuItem
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                                teacher.is_active !== false ? "text-red-400 hover:bg-red-500/10" : "text-emerald-400 hover:bg-emerald-500/10"
                            )}
                            onClick={() => toggleTeacherStatus(teacher.id, teacher.is_active !== false)}
                        >
                            {teacher.is_active !== false ? (
                                <><XCircle size={16} /> Restrict Access</>
                            ) : (
                                <><CheckCircle2 size={16} /> Restore Access</>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent className="bg-background border-border text-foreground rounded-3xl max-w-md">
                    <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const loading = toast.loading('Updating staff records...')
                        const { updateTeacher } = await import('@/app/actions/teachers')
                        
                        const res = await updateTeacher(teacher.id, {
                            first_name: formData.get('first_name') as string,
                            last_name: formData.get('last_name') as string,
                            role: formData.get('role') as any,
                            phone: formData.get('phone') as string
                        })

                        if (res.success) {
                            toast.success('Records synchronized successfully', { id: loading })
                            setIsEditDialogOpen(false)
                            queryClient.invalidateQueries({ queryKey: ['teachers-with-assignments'] })
                        } else {
                            toast.error(res.error || 'Update failed', { id: loading })
                        }
                    }}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Update Personnel</DialogTitle>
                            <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Modify identity and authority parameters for {teacher.first_name}.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">First Name</Label>
                                    <Input name="first_name" defaultValue={teacher.first_name} className="bg-muted border-border h-11 rounded-xl" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Last Name</Label>
                                    <Input name="last_name" defaultValue={teacher.last_name} className="bg-muted border-border h-11 rounded-xl" required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Contact Phone</Label>
                                <Input name="phone" defaultValue={teacher.phone || ''} placeholder="+250..." className="bg-muted border-border h-11 rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Primary Authority</Label>
                                <Select name="role" defaultValue={teacher.role}>
                                    <SelectTrigger className="bg-muted border-border h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        <SelectItem value="class_teacher">Class Teacher</SelectItem>
                                        <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase tracking-tighter h-12 rounded-2xl">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
