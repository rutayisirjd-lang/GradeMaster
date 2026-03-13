'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Lock, Power, BookOpen, ShieldCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}

export function TeacherActions({ teacher, toggleTeacherStatus }: any) {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [assignSubjectOpen, setAssignSubjectOpen] = useState(false)
    const [assignClassOpen, setAssignClassOpen] = useState(false)

    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedSubjectId, setSelectedSubjectId] = useState('')

    // Fetch global data when dialogs open
    const { data: globalData } = useQuery({
        queryKey: ['assignment-metadata'],
        queryFn: async () => {
            const [
                { data: classes },
                { data: subjects },
                { data: actYear }
            ] = await Promise.all([
                supabase.from('classes').select('id, name, class_teacher_id'),
                supabase.from('subjects').select('id, name').eq('is_active', true).order('name'),
                supabase.from('academic_years').select('id').eq('is_current', true).single()
            ])
            return { classes, subjects, currentYear: actYear?.id }
        },
        enabled: assignSubjectOpen || assignClassOpen
    })

    const assignSubjectMutation = useMutation({
        mutationFn: async () => {
            if (!selectedClassId || !selectedSubjectId || !globalData?.currentYear) throw new Error("Please select all fields.");
            const { error } = await supabase.from('class_subjects').insert([{
                teacher_id: teacher.id,
                class_id: selectedClassId,
                subject_id: selectedSubjectId,
                academic_year_id: globalData.currentYear
            }]);
            if (error) {
                if (error.code === '23505') {
                    throw new Error("This subject is already assigned to this class.");
                }
                throw error;
            }
        },
        onSuccess: () => {
            toast.success("Assignment saved!")
            setAssignSubjectOpen(false)
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
        },
        onError: (err: any) => toast.error(err.message)
    })

    const assignClassMutation = useMutation({
        mutationFn: async () => {
            if (!selectedClassId) throw new Error("Please select a class.");
            // Update class teacher id in classes
            const { error } = await supabase.from('classes').update({
                class_teacher_id: teacher.id
            }).eq('id', selectedClassId);

            if (error) throw error;

            // Upgrade role if necessary
            if (teacher.role !== 'class_teacher') {
                await supabase.from('users').update({ role: 'class_teacher' }).eq('id', teacher.id)
            }
        },
        onSuccess: () => {
            toast.success("Class Teacher assigned successfully!")
            setAssignClassOpen(false)
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
        },
        onError: (err: any) => toast.error(err.message)
    })

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800">
                        <MoreHorizontal size={16} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-50">
                    <DropdownMenuLabel>Staff Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />

                    <DropdownMenuItem className="cursor-pointer hover:bg-slate-800" onSelect={(e) => {
                        e.preventDefault()
                        setAssignSubjectOpen(true)
                    }}>
                        <BookOpen size={14} className="mr-2 text-blue-400" /> Assign Subject
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer hover:bg-slate-800" onSelect={(e) => {
                        e.preventDefault()
                        setAssignClassOpen(true)
                    }}>
                        <ShieldCheck size={14} className="mr-2 text-emerald-400" /> Make Class Teacher
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-800" />

                    <DropdownMenuItem
                        className={cn("cursor-pointer", teacher.is_active !== false ? "text-red-400 focus:text-red-400" : "text-emerald-400 focus:text-emerald-400")}
                        onClick={() => toggleTeacherStatus.mutate({ id: teacher.id, status: teacher.is_active !== false })}
                    >
                        {teacher.is_active !== false ? <Lock size={14} className="mr-2" /> : <Power size={14} className="mr-2" />}
                        {teacher.is_active !== false ? 'Deactivate Account' : 'Reactivate Account'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialogs */}
            <Dialog open={assignSubjectOpen} onOpenChange={setAssignSubjectOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Assign Subject</DialogTitle>
                        <DialogDescription>Assign a class and subject to {teacher?.first_name} {teacher?.last_name}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Class</Label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Choose a class" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    {globalData?.classes?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Subject</Label>
                            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Choose a subject" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    {globalData?.subjects?.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setAssignSubjectOpen(false)} className="hover:bg-slate-800 hover:text-white">Cancel</Button>
                        <Button onClick={() => assignSubjectMutation.mutate()} disabled={assignSubjectMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                            {assignSubjectMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={assignClassOpen} onOpenChange={setAssignClassOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Make Class Teacher</DialogTitle>
                        <DialogDescription>Select the class that {teacher?.first_name} {teacher?.last_name} will manage.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Class to Manage</Label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Choose a class" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    {globalData?.classes?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} {c.class_teacher_id === teacher.id ? '(Already Assigned)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setAssignClassOpen(false)} className="hover:bg-slate-800 hover:text-white">Cancel</Button>
                        <Button onClick={() => assignClassMutation.mutate()} disabled={assignClassMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                            {assignClassMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            Make Class Teacher
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
