'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Plus,
    Calendar,
    Lock,
    Unlock,
    Trash2,
    CheckCircle2,
    MoreHorizontal,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'
import React from 'react'

export default function AcademicYearPage() {
    const queryClient = useQueryClient()
    const supabase = createClient()
    const [isAddYearOpen, setIsAddYearOpen] = React.useState(false)

    // Fetch Academic Years
    const { data: years, isLoading } = useQuery({
        queryKey: ['academic-years'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('academic_years')
                .select('*')
                .order('start_date', { ascending: false })
            if (error) throw error
            return data
        }
    })

    // Add Year Mutation
    const addYearMutation = useMutation({
        mutationFn: async (values: { label: string, start_date: string, end_date: string }) => {
            const { error } = await supabase.from('academic_years').insert([values])
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] })
            setIsAddYearOpen(false)
            toast.success('Academic year added successfully')
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Set Current Mutation
    const setCurrentMutation = useMutation({
        mutationFn: async (id: string) => {
            // Supabase RLS/Function should handle this, but here's a transaction logic if needed
            // 1. Reset all to false
            await supabase.from('academic_years').update({ is_current: false }).neq('id', id)
            // 2. Set target to true
            const { error } = await supabase.from('academic_years').update({ is_current: true }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] })
            toast.success('Current academic year updated')
        }
    })

    const handleAddYear = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const label = formData.get('label') as string
        const start_date = formData.get('start_date') as string
        const end_date = formData.get('end_date') as string

        addYearMutation.mutate({ label, start_date, end_date })
    }

    const activeYear = years?.find(year => year.is_current);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic selection:bg-emerald-500/40">Academic Cycle</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-500" /> Manage institutional timelines and terms
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-border bg-card text-muted-foreground hover:text-foreground h-11 px-6 rounded-2xl transition-all shadow-xl shadow-black/20 font-black uppercase text-[10px] tracking-widest">
                        Cycle History
                    </Button>
                    <Dialog open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-background font-black h-11 px-8 shadow-xl shadow-emerald-500/10 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">
                                Initialize New Year
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border text-foreground">
                            <form onSubmit={handleAddYear}>
                                <DialogHeader>
                                    <DialogTitle>Add Academic Year</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Create a new session period for the school.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="label">Year Label (e.g., 2025-2026)</Label>
                                        <Input id="label" name="label" placeholder="2025-2026" className="bg-background border-border" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="start_date">Start Date</Label>
                                            <Input id="start_date" name="start_date" type="date" className="bg-background border-border" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="end_date">End Date</Label>
                                            <Input id="end_date" name="end_date" type="date" className="bg-background border-border" required />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={addYearMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-foreground">
                                        {addYearMutation.isPending ? 'Adding...' : 'Add Year'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                ) : years?.length === 0 ? (
                    <Card className="border-dashed border-2 border-border bg-background">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <CardTitle className="text-foreground">No Academic Years Found</CardTitle>
                            <CardDescription className="text-muted-foreground mt-2">
                                Start by adding your first academic session.
                            </CardDescription>
                        </CardContent>
                    </Card>
                ) : (
                    years?.map((year) => (
                        <Card key={year.id} className={cn(
                            "border-border bg-card transition-all rounded-3xl overflow-hidden",
                            year.is_current ? "ring-2 ring-emerald-500 shadow-2xl shadow-emerald-500/10" : "opacity-80 hover:opacity-100"
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/50">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-xl font-black text-foreground uppercase italic tracking-tighter">{year.label}</CardTitle>
                                        {year.is_current && <Badge className="bg-emerald-500 text-slate-950 font-black uppercase tracking-widest text-[9px] px-3">Active Focus</Badge>}
                                    </div>
                                    <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                        <Calendar size={12} className="text-emerald-500" /> {new Date(year.start_date).toLocaleDateString()} — {new Date(year.end_date).toLocaleDateString()}
                                    </CardDescription>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-xl">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-2xl p-2 shadow-2xl">
                                        <DropdownMenuItem
                                            className="cursor-pointer rounded-xl font-bold uppercase text-[10px] tracking-widest p-3"
                                            onClick={() => setCurrentMutation.mutate(year.id)}
                                        >
                                            <CheckCircle2 className="mr-3 h-4 w-4 text-emerald-500" />
                                            <span>Set as Active Cycle</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-border/50 my-1" />
                                        <DropdownMenuItem className="cursor-pointer rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 text-red-500 focus:text-red-500">
                                            <Trash2 className="mr-3 h-4 w-4" />
                                            <span>Terminate Session</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>

                            <CardContent className="pt-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <TermItem label="Term 1" isLocked={false} />
                                    <TermItem label="Term 2" isLocked={false} />
                                    <TermItem label="Term 3" isLocked={true} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div >
        </div >
    )
}

function TermItem({ label, isLocked }: { label: string; isLocked: boolean }) {
    return (
        <div className={cn(
            "flex flex-col gap-3 p-5 rounded-2xl border transition-all cursor-pointer group shadow-lg",
            isLocked ? "bg-muted border-border/50 opacity-40 grayscale" : "bg-background border-border hover:border-emerald-500/50 hover:shadow-emerald-500/5"
        )}>
            <div className="flex items-center justify-between">
                <span className="font-black text-xs text-muted-foreground group-hover:text-emerald-500 transition-colors uppercase tracking-widest">{label}</span>
                {isLocked ? <Lock className="h-3 w-3 text-red-500/50" /> : <Unlock className="h-3 w-3 text-emerald-500" />}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <span className="text-[9px] uppercase font-black text-muted-foreground/30 tracking-widest">Operation Status</span>
                <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest",
                    isLocked ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                )}>
                    {isLocked ? 'Encrypted' : 'Open'}
                </span>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
