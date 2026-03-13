'use client'

import React, { useState } from 'react'
import { seedEntireSystem } from '@/app/actions/seed'
import { GraduationCap, Loader2, CheckCircle2, XCircle, Rocket, Database, Users, BookOpen, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SeedPage() {
    const [isRunning, setIsRunning] = useState(false)
    const [log, setLog] = useState<string[]>([])
    const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSeed = async () => {
        setIsRunning(true)
        setLog(['⏳ Initializing seed process...'])
        setResult('idle')

        try {
            const res = await seedEntireSystem()
            setLog(res.log)
            setResult(res.success ? 'success' : 'error')
        } catch (err: any) {
            setLog(prev => [...prev, `💥 Client Error: ${err.message}`])
            setResult('error')
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-3xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                            <GraduationCap size={32} className="text-slate-900" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">
                        System Seed
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        One-Click Full Database Population
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: '6 Accounts', desc: '1 Dir, 2 CT, 3 ST' },
                        { icon: BookOpen, label: '10 Subjects', desc: 'Math to Economics' },
                        { icon: Database, label: '23 Students', desc: 'Across 4 classes' },
                        { icon: BarChart3, label: 'Sample Marks', desc: 'Quiz scores' },
                    ].map((item) => (
                        <div key={item.label} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                            <item.icon className="mx-auto text-emerald-500" size={24} />
                            <p className="text-sm font-black text-white uppercase tracking-tight">{item.label}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                <div className="text-center">
                    <Button
                        onClick={handleSeed}
                        disabled={isRunning}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm h-14 px-12 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isRunning ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Seeding Database...</>
                        ) : (
                            <><Rocket className="mr-2 h-5 w-5" /> Launch Full Seed</>
                        )}
                    </Button>
                </div>

                {/* Result Banner */}
                {result === 'success' && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                        <div>
                            <p className="text-sm font-black text-emerald-400 uppercase tracking-tight">Seed Complete!</p>
                            <p className="text-xs text-emerald-500/70">All accounts and test data have been created. You can now log in.</p>
                        </div>
                    </div>
                )}
                {result === 'error' && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                        <XCircle className="text-red-500 shrink-0" size={24} />
                        <div>
                            <p className="text-sm font-black text-red-400 uppercase tracking-tight">Seed Failed</p>
                            <p className="text-xs text-red-500/70">Check the log below for details. You may need to verify your .env.local keys.</p>
                        </div>
                    </div>
                )}

                {/* Log Output */}
                {log.length > 0 && (
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                        <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execution Log</p>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5">
                            {log.map((line, i) => (
                                <div key={i} className={
                                    line.startsWith('✅') ? 'text-emerald-400' :
                                        line.startsWith('❌') || line.startsWith('💥') ? 'text-red-400' :
                                            line.startsWith('⚠️') ? 'text-yellow-400' :
                                                line.startsWith('⏩') ? 'text-blue-400' :
                                                    line.startsWith('🚀') || line.startsWith('🎉') ? 'text-emerald-300 font-bold' :
                                                        line.startsWith('👤') || line.startsWith('🏫') || line.startsWith('📅') || line.startsWith('📆') || line.startsWith('📚') || line.startsWith('🏛️') || line.startsWith('🔗') || line.startsWith('🎒') || line.startsWith('📝') || line.startsWith('📋') ? 'text-white font-bold mt-2' :
                                                            'text-slate-500'
                                }>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Credentials Table */}
                {result === 'success' && (
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                        <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login Credentials</p>
                        </div>
                        <div className="p-6">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <th className="text-left pb-3">Role</th>
                                        <th className="text-left pb-3">Email</th>
                                        <th className="text-left pb-3">Password</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-mono">
                                    <tr className="border-t border-slate-800"><td className="py-2 text-emerald-400 font-bold">Director</td><td className="py-2">director@grademaster.rw</td><td className="py-2 text-slate-400">Director@2025</td></tr>
                                    <tr className="border-t border-slate-800"><td className="py-2 text-blue-400 font-bold">Class Teacher</td><td className="py-2">ct.uwase@grademaster.rw</td><td className="py-2 text-slate-400">Teacher@2025</td></tr>
                                    <tr className="border-t border-slate-800"><td className="py-2 text-blue-400 font-bold">Class Teacher</td><td className="py-2">ct.nkurunziza@grademaster.rw</td><td className="py-2 text-slate-400">Teacher@2025</td></tr>
                                    <tr className="border-t border-slate-800"><td className="py-2 text-purple-400 font-bold">Subject Teacher</td><td className="py-2">st.mugabo@grademaster.rw</td><td className="py-2 text-slate-400">Teacher@2025</td></tr>
                                    <tr className="border-t border-slate-800"><td className="py-2 text-purple-400 font-bold">Subject Teacher</td><td className="py-2">st.uwimana@grademaster.rw</td><td className="py-2 text-slate-400">Teacher@2025</td></tr>
                                    <tr className="border-t border-slate-800"><td className="py-2 text-purple-400 font-bold">Subject Teacher</td><td className="py-2">st.ndayisaba@grademaster.rw</td><td className="py-2 text-slate-400">Teacher@2025</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-[9px] text-slate-700 font-black uppercase tracking-[0.3em] italic">
                    GradeMaster Development Utility • Not for Production Use
                </p>
            </div>
        </div>
    )
}
