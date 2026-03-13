'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    User,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    Loader2,
    Smartphone,
    Fingerprint,
    Key,
    Mail,
    Lock,
    Camera,
    LogOut,
    ChevronRight,
    Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export default function ProfilePage() {
    const supabase = createClient()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [mfaFactors, setMfaFactors] = useState<any[]>([])
    const [isEnrolling, setIsEnrolling] = useState(false)
    const [enrollData, setEnrollData] = useState<any>(null)
    const [verificationCode, setVerificationCode] = useState('')

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
                setProfile(profile)

                // Load MFA factors
                const { data: factors, error } = await supabase.auth.mfa.listFactors()
                if (factors) setMfaFactors(factors.all)
            }
            setLoading(false)
        }
        loadData()
    }, [supabase])

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const { error } = await supabase.from('users').update({
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            phone: formData.get('phone'),
        }).eq('id', user.id)

        if (error) toast.error(error.message)
        else toast.success('Profile updated successfully')
    }

    const startMfaEnrollment = async () => {
        setIsEnrolling(true)
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'GradeMaster'
            })
            if (error) throw error
            setEnrollData(data)
        } catch (err: any) {
            toast.error(err.message)
            setIsEnrolling(false)
        }
    }

    const verifyMfa = async () => {
        if (!enrollData) return
        try {
            const { data, error } = await supabase.auth.mfa.challenge({ factorId: enrollData.id })
            if (error) throw error

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: enrollData.id,
                challengeId: data.id,
                code: verificationCode
            })
            if (verifyError) throw verifyError

            // Success - update factor list
            const { data: newFactors } = await supabase.auth.mfa.listFactors()
            if (newFactors) setMfaFactors(newFactors.all)

            // Update users table to show MFA enabled
            await supabase.from('users').update({ mfa_enabled: true }).eq('id', user.id)

            toast.success('Two-factor authentication enabled!')
            setIsEnrolling(false)
            setEnrollData(null)
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <Avatar className="h-24 w-24 border-2 border-border rounded-3xl bg-card overflow-hidden group-hover:border-emerald-500 transition-all">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-background text-muted-foreground font-black text-2xl uppercase">
                                {profile?.first_name[0]}{profile?.last_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <button className="absolute bottom-0 right-0 h-8 w-8 rounded-xl bg-emerald-600 border-2 border-background flex items-center justify-center text-slate-950 hover:bg-emerald-500 transition-all shadow-lg">
                            <Camera size={14} />
                        </button>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">{profile?.first_name} {profile?.last_name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[9px] uppercase tracking-widest">{profile?.role.replace('_', ' ')}</Badge>
                            <span className="text-muted-foreground font-mono text-[10px] uppercase">{user?.email}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-border bg-card/50 text-muted-foreground h-11 px-6 rounded-2xl font-bold uppercase tracking-tight text-xs">
                        Account Logs
                    </Button>
                    <Button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 h-11 px-6 rounded-2xl font-bold uppercase tracking-tight text-xs border border-red-500/20">
                        <LogOut size={14} className="mr-2" /> Deactivate
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-card border border-border p-1 rounded-2xl h-14 mb-8">
                    <TabsTrigger value="general" className="rounded-xl px-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-slate-950 font-black uppercase text-[10px] tracking-widest transition-all">General Profile</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-xl px-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-slate-950 font-black uppercase text-[10px] tracking-widest transition-all">Security & MFA</TabsTrigger>
                    <TabsTrigger value="preferences" className="rounded-xl px-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-slate-950 font-black uppercase text-[10px] tracking-widest transition-all">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card className="border-border bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                        <form onSubmit={handleUpdateProfile}>
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tighter">Personal Identity</CardTitle>
                                <CardDescription className="text-muted-foreground">Core personal information and contact metadata.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Legal First Name</Label>
                                        <Input name="first_name" defaultValue={profile?.first_name} className="h-12 bg-background border-border rounded-2xl text-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Legal Last Name</Label>
                                        <Input name="last_name" defaultValue={profile?.last_name} className="h-12 bg-background border-border rounded-2xl text-foreground" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Email Address (Locked)</Label>
                                        <Input disabled defaultValue={user?.email} className="h-12 bg-muted/50 border-border rounded-2xl text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Contact Phone</Label>
                                        <Input name="phone" defaultValue={profile?.phone} placeholder="+250 000 000 000" className="h-12 bg-background border-border rounded-2xl text-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="px-8 py-6 bg-muted/20 border-t border-border flex justify-end">
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/10 active:scale-95 transition-all text-slate-950">
                                    Save Profile Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-border bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                            <CardHeader className="p-8">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                        <ShieldCheck className="text-emerald-500" size={20} />
                                    </div>
                                    <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tighter">Two-Factor Auth</CardTitle>
                                </div>
                                <CardDescription className="text-muted-foreground leading-relaxed font-semibold">
                                    Enforce advanced account protection using biometric or TOTP authentication protocols.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                                <div className="space-y-4">
                                    {mfaFactors.length === 0 ? (
                                        <div className="p-6 rounded-2xl border-2 border-dashed border-border bg-muted/50 text-center">
                                            <ShieldAlert className="h-8 w-8 text-red-500/50 mx-auto mb-4" />
                                            <p className="text-xs font-black uppercase text-muted-foreground/30 tracking-widest">Security Incomplete</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Multi-factor authentication is currently disabled.</p>
                                        </div>
                                    ) : (
                                        mfaFactors.map(factor => (
                                            <div key={factor.id} className="flex items-center justify-between p-4 rounded-2xl bg-background/80 border border-emerald-500/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-500">
                                                        <Smartphone size={20} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-foreground uppercase italic tracking-tighter">TOTP Authenticator</span>
                                                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Added on {new Date(factor.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase tracking-widest">Active</Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 pt-0">
                                <Dialog open={isEnrolling} onOpenChange={setIsEnrolling}>
                                    <DialogTrigger asChild>
                                        <Button
                                            onClick={startMfaEnrollment}
                                            className="w-full bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl transition-all"
                                        >
                                            {mfaFactors.length > 0 ? 'Add Another Factor' : 'Initialize MFA Enrollment'}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-background border-border text-foreground rounded-[2rem] max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-center">Secure Enrollment</DialogTitle>
                                            <DialogDescription className="text-center text-muted-foreground uppercase font-black text-[9px] tracking-widest">Phase 1: Sync Authenticator Device</DialogDescription>
                                        </DialogHeader>
                                        {enrollData && (
                                            <div className="space-y-6 pt-4">
                                                <div className="bg-white p-4 rounded-3xl mx-auto w-48 h-48 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                                    <img src={enrollData.totp.qr_code} alt="MFA QR Code" className="w-full h-full" />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <p className="text-xs text-muted-foreground font-medium">Scan this code with Google Authenticator or similar.</p>
                                                    <div className="p-3 rounded-xl bg-background border border-border font-mono text-sm tracking-widest text-emerald-500 border-dashed">
                                                        {enrollData.totp.secret}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest text-center block">Enter 6-digit verification code</Label>
                                                    <Input
                                                        value={verificationCode}
                                                        onChange={(e) => setVerificationCode(e.target.value)}
                                                        className="h-14 bg-background border-border rounded-2xl text-center text-2xl font-black text-emerald-500 tracking-[0.4em]"
                                                        maxLength={6}
                                                        placeholder="000 000"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <DialogFooter className="pt-4">
                                            <Button onClick={verifyMfa} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-950">
                                                Finish Enrollment
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>

                        <Card className="border-border bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                            <CardHeader className="p-8">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Key className="text-blue-500" size={20} />
                                    </div>
                                    <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tighter">Access Passcodes</CardTitle>
                                </div>
                                <CardDescription className="text-muted-foreground leading-relaxed font-semibold">
                                    Rotate your login credentials regularly to maintain peak system security.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-4">
                                <div className="p-4 rounded-2xl bg-background border border-border group hover:border-blue-500/30 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Lock size={16} className="text-muted-foreground/50 group-hover:text-blue-500 transition-colors" />
                                            <span className="text-xs font-black text-foreground/70 uppercase tracking-tight">System Login Password</span>
                                        </div>
                                        <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-blue-500" />
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-background border border-border group hover:border-blue-500/30 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Fingerprint size={16} className="text-muted-foreground/50 group-hover:text-blue-500 transition-colors" />
                                            <span className="text-xs font-black text-foreground/70 uppercase tracking-tight">Device Biometrics (WebAuthn)</span>
                                        </div>
                                        <Badge className="bg-muted text-muted-foreground/20 border-none font-black text-[8px] uppercase tracking-widest">Coming Soon</Badge>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 pt-0">
                                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-blue-300 font-medium leading-relaxed">
                                        GradeMaster employs Argon2id hashing algorithms for all passcode persistence.
                                    </p>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                    <Card className="border-border bg-card/40 backdrop-blur-3xl rounded-3xl p-20 text-center">
                        <p className="text-muted-foreground font-black uppercase tracking-[0.4em] italic text-xs">No customizable flags in current engine build</p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
