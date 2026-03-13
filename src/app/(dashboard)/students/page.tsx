'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Plus,
    Search,
    FileText,
    Trash2,
    UserPlus,
    Filter,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Download,
    AlertCircle,
    CheckCircle2,
    Clock,
    Loader2,
    ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'
import Link from 'next/link'

interface StudentRow {
    id: string
    student_id: string
    first_name: string
    last_name: string
    gender: string
    date_of_birth: string
    enrollment_date: string
    class_id: string
    is_active: boolean
    photo_url?: string | null
    classes: { name: string } | null
}

export default function StudentsPage() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: students, isLoading } = useQuery({
        queryKey: ['students'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select(`
          *,
          classes (name)
        `)
                .order('last_name')
            if (error) throw error
            return data as unknown as StudentRow[]
        }
    })

    const filteredStudents = students?.filter(s =>
        `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-200 relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic">Student Registry</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px]">Academic enrollment & student data command</p>
                </div>
                <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <Button variant="outline" className="h-12 md:h-14 px-6 md:px-8 border-border bg-card/40 backdrop-blur-xl text-muted-foreground hover:text-foreground rounded-[1.2rem] md:rounded-[1.5rem] flex items-center gap-3 uppercase font-black text-[9px] md:text-[10px] tracking-widest shadow-xl transition-all flex-shrink-0">
                        <Download size={16} /> <span className="hidden sm:inline">Data Export</span><span className="sm:hidden">Export</span>
                    </Button>
                    <Link href="/students/register" className="flex-shrink-0">
                        <Button className="h-12 md:h-14 px-8 md:px-10 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black uppercase tracking-widest rounded-[1.2rem] md:rounded-[1.5rem] flex items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-[9px] md:text-[10px]">
                            <Plus size={18} /> Register
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder="Identify student by name or unique ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border-border bg-card/40 backdrop-blur-2xl pl-12 h-14 text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500/40 rounded-[1.5rem] shadow-xl shadow-black/5"
                            />
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-border bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-blue-500/50" />
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-10 md:w-12 pl-4 md:pl-6"></TableHead>
                                    <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-14 pl-2 md:pl-4">Student Identity</TableHead>
                                    <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-14 hidden sm:table-cell">Official ID</TableHead>
                                    <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-14 hidden md:table-cell">Class Allocation</TableHead>
                                    <TableHead className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-14">Status</TableHead>
                                    <TableHead className="text-right text-muted-foreground font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] h-12 md:h-14 pr-4 md:pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <TableRow key={i} className="animate-pulse bg-muted/20 border-none transition-none">
                                            <TableCell colSpan={6} className="h-20 bg-muted/30 mb-3 rounded-2xl opacity-50" />
                                        </TableRow>
                                    ))
                                ) : filteredStudents?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-80 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                                                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Registry search returned zero matches.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents?.map((student) => (
                                        <TableRow key={student.id} className="border-border hover:bg-emerald-500/5 group/row transition-all duration-300">
                                            <TableCell><Checkbox className="border-border" /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-border rounded-lg group-hover/row:border-emerald-500/50 transition-all">
                                                        <AvatarImage src={student.photo_url ?? undefined} />
                                                        <AvatarFallback className="bg-background text-muted-foreground font-bold text-xs">
                                                            {student.first_name[0]}{student.last_name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground group-hover/row:text-emerald-500 transition-colors uppercase">{student.first_name} {student.last_name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">{student.gender} • {new Date(student.enrollment_date).getFullYear()} Enrollment</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <code className="text-[10px] md:text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                                    {student.student_id}
                                                </code>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <span className="text-xs font-bold text-muted-foreground italic">
                                                    {student.classes?.name || 'Unassigned'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "h-5 md:h-6 text-[8px] md:text-[9px] uppercase font-black px-2 md:px-4 tracking-widest rounded-full",
                                                    student.is_active ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                                )}>
                                                    {student.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                                                            <MoreVertical size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-background border-border text-foreground">
                                                        <DropdownMenuItem className="cursor-pointer">Edit Profile</DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = `/students/${student.id}`}>
                                                            View Results
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer text-emerald-500 font-bold">Promote Student</DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-border" />
                                                        <DropdownMenuItem className="cursor-pointer text-red-500 font-bold">Deactivate</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-between px-6 py-4 bg-card/40 border-t border-border">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Showing {filteredStudents?.length || 0} students</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border bg-background text-muted-foreground disabled:opacity-30">
                                    <ChevronLeft size={16} />
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border bg-background text-muted-foreground disabled:opacity-30">
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border-border bg-card/60 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                        <CardHeader className="relative">
                            <CardTitle className="text-md font-bold text-foreground flex items-center gap-2 uppercase tracking-tighter italic">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Quick Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative pb-8">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">Total Active</span>
                                    <div className="text-3xl font-black text-foreground">{filteredStudents?.length || 0}</div>
                                </div>
                                <div className="text-emerald-500 text-[10px] font-black uppercase bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                    +12% this term
                                </div>
                            </div>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[74%] shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase text-center tracking-widest opacity-50">Capacity Tracking (74%)</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/60 shadow-2xl border-l-4 border-l-emerald-500 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-md font-bold text-foreground uppercase tracking-tighter italic">System Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="ghost" className="justify-start text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest group">
                                <FileText className="mr-3 h-4 w-4 text-emerald-500" />
                                View Promotion Lists
                                <ArrowRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                            </Button>
                            <Button variant="ghost" className="justify-start text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest group">
                                <UserPlus className="mr-3 h-4 w-4 text-blue-500" />
                                Import Bulk Data
                                <ArrowRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                            </Button>
                            <Button variant="ghost" className="justify-start text-[10px] font-black text-muted-foreground hover:text-red-500 uppercase tracking-widest group">
                                <Trash2 className="mr-3 h-4 w-4 text-red-500" />
                                Cleanup Records
                                <ArrowRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
