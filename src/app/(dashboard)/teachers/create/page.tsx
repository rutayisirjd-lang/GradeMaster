'use client'

import React from 'react'
import {
    Plus,
    Mail,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    Check,
    UserPlus,
    KeyRound,
    AlertCircle
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { createFacultyAccount } from '@/app/actions/users'

const createSchema = z.object({
    email: z.string().email('Invalid email address'),
    first_name: z.string().min(2, 'First name is too short'),
    last_name: z.string().min(2, 'Last name is too short'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['director', 'class_teacher', 'subject_teacher']),
})

type CreateForm = z.infer<typeof createSchema>

export default function CreateTeacherPage() {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const { register, handleSubmit, control, formState: { errors } } = useForm<CreateForm>({
        resolver: zodResolver(createSchema),
        defaultValues: {
            role: 'subject_teacher'
        }
    })

    const onFormSubmit = async (data: CreateForm) => {
        setIsPending(true)
        const result = await createFacultyAccount(data)
        setIsPending(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Faculty account created successfully!')
            router.push('/teachers')
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon" className="h-10 w-10 border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400 hover:text-white">
                    <Link href="/teachers">
                        <ArrowLeft size={18} />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Direct Registration</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" /> Administrative User Provisioning
                    </p>
                </div>
            </div>

            <Alert className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 rounded-3xl p-6">
                <AlertCircle className="h-5 w-5 text-emerald-500" />
                <AlertTitle className="font-black uppercase tracking-widest text-xs mb-1">Direct Creation Mode</AlertTitle>
                <AlertDescription className="text-[10px] uppercase font-bold tracking-widest opacity-70">
                    This account will be active immediately. No email confirmation required.
                </AlertDescription>
            </Alert>

            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-3xl shadow-2xl shadow-black/60 rounded-[2.5rem] overflow-hidden border-t-2 border-t-emerald-500/50 relative">
                <div className="absolute top-0 right-0 p-8">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <UserPlus className="text-emerald-500" size={24} />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <CardHeader className="pb-8 pt-10 px-10">
                        <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tighter">New Faculty Account</CardTitle>
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            Provision a new account with immediate system access.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-10 space-y-8">
                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">First Name</Label>
                                <Input
                                    {...register('first_name')}
                                    placeholder="Enter first name..."
                                    className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-700 focus:ring-emerald-500/20 transition-all font-bold"
                                />
                                {errors.first_name && <p className="text-xs text-red-500 font-bold ml-1">{errors.first_name.message}</p>}
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Last Name</Label>
                                <Input
                                    {...register('last_name')}
                                    placeholder="Enter last name..."
                                    className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-700 focus:ring-emerald-500/20 transition-all font-bold"
                                />
                                {errors.last_name && <p className="text-xs text-red-500 font-bold ml-1">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Work Email Address</Label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 transition-colors group-focus-within:text-emerald-500" />
                                <Input
                                    {...register('email')}
                                    placeholder="faculty@grademaster.app"
                                    className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 pl-14 placeholder:text-slate-700 focus:ring-emerald-500/20 transition-all font-bold"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500 font-bold ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">System Password</Label>
                            <div className="relative group">
                                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 transition-colors group-focus-within:text-emerald-500" />
                                <Input
                                    type="password"
                                    {...register('password')}
                                    placeholder="Minimum 6 characters..."
                                    className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 pl-14 placeholder:text-slate-700 focus:ring-emerald-500/20 transition-all font-bold"
                                />
                            </div>
                            {errors.password && <p className="text-xs text-red-500 font-bold ml-1">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Permission Level</Label>
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <SelectTrigger className="h-14 bg-slate-950/50 border-slate-800 rounded-2xl text-slate-200 px-6 font-bold">
                                            <SelectValue placeholder="Assign access role..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 rounded-2xl shadow-3xl">
                                            <SelectItem value="director" className="rounded-xl py-3 focus:bg-emerald-500/10">Full Station Director (System Admin)</SelectItem>
                                            <SelectItem value="class_teacher" className="rounded-xl py-3 focus:bg-emerald-500/10">Class Teacher (Full Class Mgmt)</SelectItem>
                                            <SelectItem value="subject_teacher" className="rounded-xl py-3 focus:bg-emerald-500/10">Subject Teacher (Mark Entry Only)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="px-10 py-10 bg-slate-950/40 border-t border-slate-800 mt-10">
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[1.25rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 group"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Provisioning Node...</>
                            ) : (
                                <><Check className="mr-3 h-5 w-5 group-hover:scale-125 transition-transform" /> Finalize Registration</>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="flex flex-col items-center gap-6 pt-8 pb-12">
                <div className="flex items-center gap-4 text-slate-700 font-black italic uppercase tracking-[0.4em] text-[8px]">
                    <div className="h-px w-12 bg-slate-900" />
                    GradeMaster Direct Provisioning
                    <div className="h-px w-12 bg-slate-900" />
                </div>
            </div>
        </div>
    )
}
