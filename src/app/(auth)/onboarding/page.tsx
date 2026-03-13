'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Lock,
    Mail,
    User,
    AlertCircle,
    Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

import { Suspense } from 'react'

const onboardingSchema = z.object({
    firstName: z.string().min(2, 'First name is too short'),
    lastName: z.string().min(2, 'Last name is too short'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type OnboardingForm = z.infer<typeof onboardingSchema>

function OnboardingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const supabase = createClient()

    const [invitation, setInvitation] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorStatus, setErrorStatus] = useState<string | null>(null)

    const form = useForm<OnboardingForm>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            password: '',
            confirmPassword: '',
        }
    })

    // 1. Validate Token and Fetch Invitation
    useEffect(() => {
        async function validateInvitation() {
            if (!token) {
                setErrorStatus('missing_token')
                setLoading(false)
                return
            }

            const { data, error } = await (supabase.from('invitations' as any) as any)
                .select('*')
                .eq('token', token)
                .is('accepted_at', null)
                .single()

            if (error || !data) {
                setErrorStatus('invalid_token')
                setLoading(false)
                return
            }

            // Check expiry
            if (new Date(data.expires_at) < new Date()) {
                setErrorStatus('expired_token')
                setLoading(false)
                return
            }

            setInvitation(data)
            setLoading(false)
        }

        validateInvitation()
    }, [token, supabase])

    // 2. Handle Final Submission
    async function onSubmit(values: OnboardingForm) {
        setIsSubmitting(true)
        try {
            // 1. Supabase Signup with metadata
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: invitation.email,
                password: values.password,
                options: {
                    data: {
                        first_name: values.firstName,
                        last_name: values.lastName,
                        role: invitation.role
                    }
                }
            })

            if (authError) throw authError

            // 2. Mark Invitation as Accepted
            const { error: inviteError } = await (supabase.from('invitations' as any) as any)
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation.id)

            if (inviteError) console.error("Could not close invitation, but user created.", inviteError)

            toast.success('Account created! Welcome to the engine.')

            // 3. Short delay for trigger to fire
            setTimeout(() => {
                router.push('/dashboard')
            }, 1000)

        } catch (err: any) {
            toast.error(err.message || 'Onboarding failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Verifying Credentials...</p>
                </div>
            </div>
        )
    }

    if (errorStatus) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0,transparent_100%)]">
                <Card className="w-full max-w-md border-red-900/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
                    <CardHeader className="pt-10">
                        <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-red-500 h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tighter">Access Denied</CardTitle>
                        <CardDescription className="text-slate-400 font-medium">
                            {errorStatus === 'missing_token' && "No invitation token provided. Please use the link from your invite email."}
                            {errorStatus === 'invalid_token' && "This invitation link is invalid or has already been used."}
                            {errorStatus === 'expired_token' && "This invitation has expired. Please contact your Director of Studies for a new link."}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="pb-10 pt-4 flex flex-col gap-4">
                        <Button asChild className="w-full bg-slate-800 hover:bg-slate-750 text-white font-bold h-12 rounded-2xl uppercase tracking-widest text-xs">
                            <a href="/login">Return to Login</a>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />

            <Card className="w-full max-w-lg border-slate-800 bg-slate-900/40 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 rounded-[3rem] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 animate-pulse" />

                <CardHeader className="text-center pt-12 pb-8">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-4">
                        <Sparkles size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Invitation Valid</span>
                    </div>
                    <CardTitle className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">GradeMaster HQ</CardTitle>
                    <CardDescription className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Finalize Your Faculty Account</CardDescription>
                </CardHeader>

                <CardContent className="px-10 pb-12">
                    <div className="flex flex-col gap-1 p-4 rounded-3xl bg-slate-950/50 border border-slate-800/50 mb-8 items-center text-center">
                        <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Authorized Email</span>
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-blue-500" />
                            <span className="text-sm font-black text-slate-100 italic">{invitation.email}</span>
                        </div>
                        <Badge className="mt-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-2.5">
                            {invitation.role.replace('_', ' ')}
                        </Badge>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">First Name</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                                                    <Input {...field} placeholder="Jane" className="h-12 bg-slate-950/80 border-slate-800 pl-11 rounded-2xl text-slate-100 placeholder:text-slate-800" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] uppercase font-bold" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Last Name</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                                                    <Input {...field} placeholder="Doe" className="h-12 bg-slate-950/80 border-slate-800 pl-11 rounded-2xl text-slate-100 placeholder:text-slate-800" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] uppercase font-bold" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 text-center block">Establish Secure Passcode</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                                <Input type="password" {...field} placeholder="••••••••••••" className="h-14 bg-slate-950 border-slate-800 pl-12 rounded-2xl text-slate-100 text-center text-lg font-black placeholder:text-slate-800 tracking-[0.3em]" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] uppercase font-bold text-center" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="password" {...field} placeholder="Confirm Passcode" className="h-12 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-100 text-center text-sm font-black placeholder:text-slate-800 tracking-widest" />
                                        </FormControl>
                                        <FormMessage className="text-[10px] uppercase font-bold text-center" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-[1.5rem] mt-4 shadow-[0_10px_30px_rgba(16,185,129,0.2)] group active:scale-95 transition-all"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Generating Profile...</>
                                ) : (
                                    <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-200" /> Access Academic Engine</>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="bg-slate-950/30 p-8 border-t border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-blue-500 h-4 w-4" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">End-to-End Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-700">Powered by</span>
                        <span className="text-[11px] font-black text-white italic tracking-tighter">GradeMaster Core</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Initializing...</p>
                </div>
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    )
}
