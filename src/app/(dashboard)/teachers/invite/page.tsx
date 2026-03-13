'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Plus,
    Mail,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    Send,
    UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    first_name: z.string().min(2, 'First name is too short'),
    last_name: z.string().min(2, 'Last name is too short'),
    role: z.enum(['class_teacher', 'subject_teacher']),
})

type InviteForm = z.infer<typeof inviteSchema>

export default function InviteTeacherPage() {
    const supabase = createClient()
    const router = useRouter()
    const { register, handleSubmit, formState: { errors } } = useForm<InviteForm>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            role: 'subject_teacher'
        }
    })

    const inviteMutation = useMutation({
        mutationFn: async (values: InviteForm) => {
            const { data: { user } } = await supabase.auth.getUser()
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

            const { error } = await supabase.from('invitations').insert([{
                email: values.email,
                role: values.role,
                token: token,
                invited_by: user!.id,
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            }])

            if (error) throw error

            // In a real app, this would trigger an Edge Function to send email
            console.log(`Invitation link: ${window.location.origin}/onboarding?token=${token}`)
            return token
        },
        onSuccess: (token) => {
            toast.success('Invitation sent successfully!')
            router.push('/teachers')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send invitation')
        }
    })

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon" className="h-10 w-10 border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400 hover:text-white">
                    <Link href="/teachers">
                        <ArrowLeft size={18} />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Invite Staff Member</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Onboard new faculty to the GradeMaster engine.</p>
                </div>
            </div>

            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-3xl shadow-2xl shadow-black/40 rounded-3xl overflow-hidden border-t-2 border-t-emerald-500">
                <form onSubmit={handleSubmit((data) => inviteMutation.mutate(data))}>
                    <CardHeader className="pb-8 pt-10 px-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <UserPlus className="text-emerald-500" size={24} />
                            </div>
                            <CardTitle className="text-xl font-black text-white uppercase italic tracking-tighter">New Invitation</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400 font-medium">
                            Invitations expire after 48 hours. Teachers will receive a link to set their password and complete their profile profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-10 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">First Name</Label>
                                <Input
                                    {...register('first_name')}
                                    placeholder="John"
                                    className="h-12 bg-slate-950 border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-700"
                                />
                                {errors.first_name && <p className="text-xs text-red-500 font-bold ml-1">{errors.first_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Last Name</Label>
                                <Input
                                    {...register('last_name')}
                                    placeholder="Doe"
                                    className="h-12 bg-slate-950 border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-700"
                                />
                                {errors.last_name && <p className="text-xs text-red-500 font-bold ml-1">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                                <Input
                                    {...register('email')}
                                    placeholder="teacher@school.com"
                                    className="h-12 bg-slate-950 border-slate-800 rounded-2xl text-slate-200 pl-11 placeholder:text-slate-700"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500 font-bold ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Staff Role</Label>
                            <Select
                                defaultValue="subject_teacher"
                                onValueChange={(val) => register('role').onChange({ target: { value: val, name: 'role' } } as any)}
                            >
                                <SelectTrigger className="h-12 bg-slate-950 border-slate-800 rounded-2xl text-slate-200">
                                    <SelectValue placeholder="Select Permission Level" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="class_teacher">Class Teacher (Full Management)</SelectItem>
                                    <SelectItem value="subject_teacher">Subject Teacher (Mark Entry Only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="px-10 py-10 bg-slate-950/20 border-t border-slate-800 mt-6 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-500">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Enforced SSL Layer</span>
                        </div>
                        <Button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 h-12 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-emerald-500/10 active:scale-95"
                            disabled={inviteMutation.isPending}
                        >
                            {inviteMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting...</>
                            ) : (
                                <><Send className="mr-2 h-4 w-4" /> Ship Invitation</>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="flex flex-col items-center gap-4 pt-4">
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">GradeMaster Secure Relay Service</p>
                <div className="h-px w-20 bg-slate-800" />
            </div>
        </div>
    )
}
