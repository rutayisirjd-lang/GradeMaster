'use client'

import React from 'react'
import { createFacultyAccount } from '@/app/actions/users'
import {
    GraduationCap,
    UserPlus,
    Mail,
    Lock,
    Loader2,
    ArrowRight,
    ShieldCheck,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

const adminSchema = z.object({
    email: z.string().email('Invalid email address'),
    first_name: z.string().min(2, 'First name is too short'),
    last_name: z.string().min(2, 'Last name is too short'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type AdminForm = z.infer<typeof adminSchema>

export default function RegisterAdminPage() {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<AdminForm>({
        resolver: zodResolver(adminSchema),
    })

    const onFormSubmit = async (data: AdminForm) => {
        console.log('Starting form submission with:', { ...data, password: '***' })
        setIsPending(true)
        try {
            // Force the role to 'director' for this page
            console.log('Calling server action: createFacultyAccount')
            const result = await createFacultyAccount({ ...data, role: 'director' })
            console.log('Server Action result received:', result)

            if (result.error) {
                console.error('Server Action returned error:', result.error)
                toast.error(result.error)
                // Fallback alert for diagnostics
                window.alert('REGISTRATION ERROR: ' + result.error)
            } else {
                console.log('Registration success! Redirecting to login...')
                toast.success('Admin Director account created successfully!')
                router.push('/login')
            }
        } catch (err: any) {
            console.error('Submission Crash caught on client:', err)
            toast.error(err.message || 'An unexpected connection error occurred')
            window.alert('CRASH: ' + (err.message || 'Unexpected failure. Check console.'))
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
            <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20 transform -rotate-6 transition-transform hover:rotate-0">
                        <GraduationCap className="text-slate-950" size={32} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic selection:bg-emerald-500/40">GradeMaster</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Administrative Genesis Node</p>
                    </div>
                </div>

                <Alert className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 rounded-3xl p-6 border-dashed">
                    <AlertCircle className="h-5 w-5 text-emerald-500" />
                    <AlertTitle className="font-black uppercase tracking-widest text-xs mb-1">Development Access Only</AlertTitle>
                    <AlertDescription className="text-[10px] uppercase font-bold tracking-widest opacity-70">
                        This endpoint allows for the direct creation of a Station Director (Admin) account for system setup.
                    </AlertDescription>
                </Alert>

                <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-3xl shadow-3xl shadow-black/80 rounded-[3rem] overflow-hidden border-t-2 border-t-emerald-500 relative">
                    <form onSubmit={handleSubmit(onFormSubmit)}>
                        <CardHeader className="pt-12 pb-8 px-10 text-center">
                            <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tighter">Create Director</CardTitle>
                            <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                Your administrative account for GradeMaster orchestration.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-10 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">First Name</Label>
                                    <Input
                                        {...register('first_name')}
                                        placeholder="Admin"
                                        className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-800"
                                    />
                                    {errors.first_name && <p className="text-xs text-red-500 font-bold ml-1">{errors.first_name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Last Name</Label>
                                    <Input
                                        {...register('last_name')}
                                        placeholder="User"
                                        className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-800"
                                    />
                                    {errors.last_name && <p className="text-xs text-red-500 font-bold ml-1">{errors.last_name.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Admin Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 transition-colors group-focus-within:text-emerald-500" />
                                    <Input
                                        {...register('email')}
                                        placeholder="admin@school.com"
                                        className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 pl-14 placeholder:text-slate-800"
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500 font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Root Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 transition-colors group-focus-within:text-emerald-500" />
                                    <Input
                                        type="password"
                                        {...register('password')}
                                        placeholder="••••••••"
                                        className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 pl-14 placeholder:text-slate-800"
                                    />
                                </div>
                                {errors.password && <p className="text-xs text-red-500 font-bold ml-1">{errors.password.message}</p>}
                            </div>
                        </CardContent>

                        <CardFooter className="px-10 py-12 flex flex-col gap-6">
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 group"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Finalizing Genesis...</>
                                ) : (
                                    <><ShieldCheck className="mr-3 h-5 w-5 group-hover:scale-125 transition-transform" /> Register Root Admin</>
                                )}
                            </Button>

                            <Button asChild variant="ghost" className="text-slate-600 hover:text-white font-bold uppercase tracking-widest text-[9px]">
                                <Link href="/login">Already have an account? Log In</Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="flex flex-col items-center gap-4 text-slate-800 font-black italic uppercase tracking-[0.5em] text-[8px] pt-4">
                    GradeMaster V1.0-Alpha Core
                </div>
            </div>
        </div>
    )
}
