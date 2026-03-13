'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Building2,
    MapPin,
    User,
    Mail,
    Phone,
    Globe,
    Save,
    Camera,
    MessageSquare,
    School,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import React from 'react'
import { Separator } from '@/components/ui/separator'

export default function SchoolSettingsPage() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    // Fetch School Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['school-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('school_settings')
                .select('*')
                .single()
            if (error && error.code !== 'PGRST116') throw error
            return data
        }
    })

    // Update Settings Mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (values: any) => {
            if (settings?.id) {
                const { error } = await supabase
                    .from('school_settings')
                    .update(values)
                    .eq('id', settings.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('school_settings').insert([values])
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-settings'] })
            toast.success('School settings updated')
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())
        updateSettingsMutation.mutate(data)
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                    <School className="h-8 w-8 text-emerald-500" /> School Profile
                </h1>
                <p className="text-muted-foreground mt-1">Configure your institution's public branding and identity.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Logo Section */}
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Logo & Identity</h3>
                        <Card className="border-border bg-card overflow-hidden shadow-xl shadow-black/20">
                            <CardContent className="pt-6 flex flex-col items-center">
                                <div className="relative group cursor-pointer h-32 w-32 rounded-2xl border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden hover:border-emerald-500 transition-all">
                                    {settings?.school_logo_url ? (
                                        <img src={settings.school_logo_url} alt="Logo" className="h-full w-full object-cover" />
                                    ) : (
                                        <Camera className="h-10 w-10 text-muted-foreground/30 group-hover:text-emerald-500" />
                                    )}
                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-bold text-foreground uppercase transform translate-y-2 group-hover:translate-y-0 transition-transform">Change Logo</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-center text-xs text-muted-foreground px-4">
                                    Recommendation: Square image (512x512px).
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Details Section */}
                    <div className="md:col-span-2 space-y-8">
                        <Card className="border-border bg-card shadow-xl shadow-black/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-foreground">Institutional Details</CardTitle>
                                <CardDescription className="text-muted-foreground">Essential information about your school.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="school_name" className="text-muted-foreground uppercase font-black text-[9px] tracking-widest ml-1">Official Name</Label>
                                        <Input
                                            id="school_name"
                                            name="school_name"
                                            defaultValue={settings?.school_name}
                                            className="bg-background border-border focus:ring-emerald-500 text-foreground"
                                            placeholder="GradeMaster Academy"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="school_motto" className="text-muted-foreground uppercase font-black text-[9px] tracking-widest ml-1">Institutional Motto</Label>
                                        <Input
                                            id="school_motto"
                                            name="school_motto"
                                            defaultValue={settings?.school_motto}
                                            className="bg-background border-border focus:ring-emerald-500 text-foreground"
                                            placeholder="Knowledge is Power"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="school_address" className="text-muted-foreground uppercase font-black text-[9px] tracking-widest ml-1">Physical Address</Label>
                                    <Textarea
                                        id="school_address"
                                        name="school_address"
                                        defaultValue={settings?.school_address}
                                        className="bg-background border-border h-24 focus:ring-emerald-500 text-foreground"
                                        placeholder="123 Academic Way, Kigali, Rwanda"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="country" className="text-muted-foreground uppercase font-black text-[9px] tracking-widest ml-1">Country</Label>
                                        <Input id="country" name="country" defaultValue={settings?.country || 'Rwanda'} className="bg-background border-border focus:ring-emerald-500 text-foreground" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="principal_name" className="text-muted-foreground uppercase font-black text-[9px] tracking-widest ml-1">Principal's Name</Label>
                                        <Input id="principal_name" name="principal_name" defaultValue={settings?.principal_name} className="bg-background border-border focus:ring-emerald-500 text-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card shadow-xl shadow-black/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-foreground">Report Customization</CardTitle>
                                <CardDescription className="text-muted-foreground">Text that appears on all student transcripts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <Label htmlFor="report_footer_text" className="text-muted-foreground uppercase font-black text-[9px] tracking-widest ml-1">Transcript Footer Note</Label>
                                    <Textarea
                                        id="report_footer_text"
                                        name="report_footer_text"
                                        defaultValue={settings?.report_footer_text}
                                        className="bg-background border-border h-20 focus:ring-emerald-500 text-foreground"
                                        placeholder="This document is an official transcript of academic records."
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="pt-6 border-t border-border flex justify-end gap-3">
                                <Button variant="outline" type="button" className="border-border text-muted-foreground transition-all hover:text-foreground">Cancel</Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black transition-all shadow-lg shadow-emerald-500/10 active:scale-95 px-8 rounded-2xl h-11 uppercase text-[10px] tracking-widest"
                                    disabled={updateSettingsMutation.isPending}
                                >
                                    {updateSettingsMutation.isPending ? 'Propagating...' : 'Deploy Changes'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}
