'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import {
    Users,
    BookOpen,
    ArrowLeft,
    Plus,
    Trash2,
    UserPlus,
    LayoutDashboard,
    GraduationCap,
    Calendar,
    Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createStudent, deleteStudent } from '@/app/actions/students'

export default function ClassDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: cls, isLoading } = useQuery({
        queryKey: ['class', id],
        queryFn: async () => {
            console.log("🛠️ FETCHING CLASS DETAILS (MANUAL JOIN)...")
            // 1. Fetch class itself
            const { data: classData, error: classErr } = await (supabase.from('classes' as any) as any)
                .select('*, academic_years(label)')
                .eq('id', id)
                .single()
            if (classErr) throw classErr

            // 2. Fetch class teacher
            let class_teacher = null
            if (classData.class_teacher_id) {
                const { data: teacher } = await (supabase.from('users' as any) as any).select('id, email, first_name, last_name').eq('id', classData.class_teacher_id).single()
                class_teacher = teacher
            }

            // 3. Fetch students
            const { data: students } = await (supabase.from('students' as any) as any).select('id, student_id, first_name, last_name, gender, is_active').eq('class_id', id)

            // 4. Fetch class_subjects + merged data
            const { data: subjectsData } = await (supabase.from('class_subjects' as any) as any)
                .select('id, subject_id, teacher_id, subjects(name, code)')
                .eq('class_id', id)

            let teacherIds = Array.from(new Set((subjectsData || []).map((s: any) => s.teacher_id).filter(Boolean)))
            let instructorMap: Record<string, any> = {}
            if (teacherIds.length > 0) {
                const { data: teachers } = await (supabase.from('users' as any) as any).select('id, first_name, last_name').in('id', teacherIds)
                teachers?.forEach((t: any) => { instructorMap[t.id] = t })
            }

            const class_subjects = (subjectsData || []).map((s: any) => ({
                ...s,
                instructor: s.teacher_id ? instructorMap[s.teacher_id] : null
            }))

            return {
                ...classData,
                class_teacher,
                students,
                class_subjects
            }
        }
    })

    const { data: faculty } = useQuery({
        queryKey: ['faculty'],
        queryFn: async () => {
            const { data, error } = await supabase.from('users').select('id, first_name, last_name, role').neq('role', 'director')
            if (error) throw error
            return data
        }
    })

    const { data: allSubjects } = useQuery({
        queryKey: ['all-subjects'],
        queryFn: async () => {
            const { data, error } = await supabase.from('subjects').select('id, name, code')
            if (error) throw error
            return data
        }
    })

    if (isLoading) return <div className="flex h-64 items-center justify-center"><LayoutDashboard className="animate-spin text-emerald-500" /></div>
    if (!cls) return <div>Class not found</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl">
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{cls.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{cls.level}{cls.section}</Badge>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{cls.academic_years?.label}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-slate-800 bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border-t-4 border-t-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-white italic uppercase">Student Registry</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cls.students?.length} enrolled students</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                    <UserPlus size={14} className="mr-2" /> Add Student
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800 text-white">
                                <form onSubmit={async (e) => {
                                    e.preventDefault()
                                    const formData = new FormData(e.currentTarget)
                                    const loading = toast.loading('Adding student...')
                                    const res = await createStudent({
                                        first_name: formData.get('first_name') as string,
                                        last_name: formData.get('last_name') as string,
                                        gender: formData.get('gender') as any,
                                        date_of_birth: formData.get('dob') as string,
                                        class_id: cls.id,
                                        student_id: formData.get('student_id') as string || `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                                    })
                                    if (res.success) {
                                        toast.success('Student added successfully', { id: loading })
                                        queryClient.invalidateQueries({ queryKey: ['class', id] })
                                    } else {
                                        toast.error(res.error || 'Failed to add student', { id: loading })
                                    }
                                }}>
                                    <DialogHeader>
                                        <DialogTitle>Add New Student to {cls.name}</DialogTitle>
                                        <DialogDescription className="text-slate-400">Enter student details to enroll them in this class.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>First Name</Label>
                                                <Input name="first_name" placeholder="John" className="bg-slate-950 border-slate-800" required />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Last Name</Label>
                                                <Input name="last_name" placeholder="Doe" className="bg-slate-950 border-slate-800" required />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Gender</Label>
                                            <Select name="gender" defaultValue="male">
                                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Date of Birth</Label>
                                            <Input name="dob" type="date" className="bg-slate-950 border-slate-800" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Student ID (Optional)</Label>
                                            <Input name="student_id" placeholder="Auto-generated if blank" className="bg-slate-950 border-slate-800" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Enroll Student</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase">ID</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase">Name</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase">Gender</TableHead>
                                    <TableHead className="text-right text-[10px] font-black text-slate-500 uppercase">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cls.students?.map((student: any) => (
                                    <TableRow key={student.id} className="border-slate-800/40 hover:bg-slate-800/20 group">
                                        <TableCell className="text-xs font-mono text-slate-400">{student.student_id}</TableCell>
                                        <TableCell className="font-bold text-slate-200">{student.first_name} {student.last_name}</TableCell>
                                        <TableCell className="text-xs text-slate-500 uppercase">{student.gender}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600 hover:text-red-500"
                                                onClick={async () => {
                                                    if (confirm(`Remove ${student.first_name} ${student.last_name} from system?`)) {
                                                        const loading = toast.loading('Removing...')
                                                        const res = await deleteStudent(student.id)
                                                        if (res.success) {
                                                            toast.success('Student removed', { id: loading })
                                                            queryClient.invalidateQueries({ queryKey: ['class', id] })
                                                        } else {
                                                            toast.error(res.error || 'Failed to remove', { id: loading })
                                                        }
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-slate-800 bg-slate-900 rounded-3xl overflow-hidden border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="text-sm font-black text-white uppercase italic tracking-widest">Class Teacher</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-slate-800">
                                    <AvatarFallback className="bg-blue-600 text-white font-black uppercase">{cls.class_teacher?.first_name?.[0]}{cls.class_teacher?.last_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-slate-200">{cls.class_teacher ? `${cls.class_teacher.first_name} ${cls.class_teacher.last_name}` : 'Not Assigned'}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{cls.class_teacher?.email || 'Assign a teacher via settings'}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-slate-800 pt-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-slate-500 hover:text-white">Change Teacher</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                                    <form onSubmit={async (e) => {
                                        e.preventDefault()
                                        const formData = new FormData(e.currentTarget)
                                        const teacherId = formData.get('teacher_id') as string
                                        const loading = toast.loading('Updating teacher...')
                                        const { error } = await supabase.from('classes').update({ class_teacher_id: teacherId }).eq('id', cls.id)
                                        if (error) toast.error(error.message, { id: loading })
                                        else {
                                            toast.success('Teacher updated', { id: loading })
                                            queryClient.invalidateQueries({ queryKey: ['class', id] })
                                        }
                                    }}>
                                        <DialogHeader>
                                            <DialogTitle>Assign Class Teacher</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Label>Select Faculty Member</Label>
                                            <Select name="teacher_id" defaultValue={cls.class_teacher_id}>
                                                <SelectTrigger className="bg-slate-950 border-slate-800 mt-2">
                                                    <SelectValue placeholder="Choose a teacher" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                    {faculty?.map((f: any) => (
                                                        <SelectItem key={f.id} value={f.id}>{f.first_name} {f.last_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="bg-blue-600">Save Assignment</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>

                    <Card id="subjects" className="border-slate-800 bg-slate-900 rounded-3xl overflow-hidden border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black text-white uppercase italic tracking-widest">Subjects</CardTitle>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10">
                                        <Plus size={16} />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                                    <form onSubmit={async (e) => {
                                        e.preventDefault()
                                        const formData = new FormData(e.currentTarget)
                                        const loading = toast.loading('Assigning subject...')
                                        const { assignTeacherToSubject } = await import('@/app/actions/classes')
                                        const res = await assignTeacherToSubject({
                                            class_id: cls.id,
                                            subject_id: formData.get('subject_id') as string,
                                            teacher_id: formData.get('teacher_id') as string
                                        })
                                        if (res.success) {
                                            toast.success('Subject assigned', { id: loading })
                                            queryClient.invalidateQueries({ queryKey: ['class', id] })
                                        } else {
                                            toast.error(res.error || 'Failed to assign', { id: loading })
                                        }
                                    }}>
                                        <DialogHeader>
                                            <DialogTitle>Assign Subject & Teacher</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Subject</Label>
                                                <Select name="subject_id" required>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800">
                                                        <SelectValue placeholder="Select subject" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                        {allSubjects?.map((s: any) => (
                                                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Instructor</Label>
                                                <Select name="teacher_id" required>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800">
                                                        <SelectValue placeholder="Select teacher" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                        {faculty?.map((f: any) => (
                                                            <SelectItem key={f.id} value={f.id}>{f.first_name} {f.last_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="bg-purple-600">Assign Subject</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {cls.class_subjects?.map((sub: any) => (
                                <div key={sub.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 group hover:border-purple-500/30 transition-all flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-100 uppercase italic tracking-tight">{sub.subjects.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{sub.instructor ? `${sub.instructor.first_name} ${sub.instructor.last_name}` : 'No Teacher'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[8px] border-slate-800 text-slate-600 uppercase">{sub.subjects.code}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-700 hover:text-red-500"
                                            onClick={async () => {
                                                if (confirm('Unassign this subject?')) {
                                                    const { error } = await supabase.from('class_subjects').delete().eq('id', sub.id)
                                                    if (error) toast.error(error.message)
                                                    else queryClient.invalidateQueries({ queryKey: ['class', id] })
                                                }
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
