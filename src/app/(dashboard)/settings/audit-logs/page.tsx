'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import {
    Activity,
    User,
    Terminal,
    Clock,
    ShieldAlert,
    FileCode,
    Calendar,
    Search,
    ChevronRight,
    Database,
    ArrowRight,
    Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import React from 'react'
import { format } from 'date-fns'

export default function AuditLogsPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: logs, isLoading } = useQuery<any[]>({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audit_log')
                .select('*, users(first_name, last_name, email)')
                .order('created_at', { ascending: false })
                .limit(100)
            if (error) throw error
            return data
        }
    })

    const filteredLogs = logs?.filter((log: any) =>
        `${log.action} ${log.table_name} ${log.users?.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/50 pb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic selection:bg-emerald-500/40">Security Ledger</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-1">
                        <Shield size={14} className="text-emerald-500" /> Immutable system activity & audit trails
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-border bg-card text-muted-foreground h-11 px-6 rounded-2xl transition-all shadow-xl shadow-black/20 font-black uppercase text-[10px] tracking-widest">
                        Export Logs
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                    <Input
                        placeholder="Search by action, table or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full lg:w-96 border-border bg-card/50 backdrop-blur pl-12 h-12 text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500 rounded-2xl shadow-xl shadow-black/20"
                    />
                </div>

                <Card className="border-border bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-6">Timestamp</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-6">Operator</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-6">Execution</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-6">Target</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-6">Context</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i} className="h-16 rounded-2xl bg-card/50 animate-pulse border-b border-border" />
                                ))
                            ) : filteredLogs?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center border-2 border-dashed border-border rounded-3xl bg-background/20 text-muted-foreground font-black uppercase italic tracking-widest text-xs">
                                        No matching audit records found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs?.map((log) => (
                                <TableRow key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                                    <TableCell className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground/80 tracking-tight">{new Date(log.created_at).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase">{new Date(log.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-8 w-8 flex items-center justify-center rounded-lg bg-background border border-border transition-all group-hover:border-emerald-500/40`}>
                                                {log.action.includes('delete') ? (
                                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                                ) : log.action.includes('update') ? (
                                                    <Database className="h-4 w-4 text-blue-500" />
                                                ) : (
                                                    <Activity className="h-4 w-4 text-emerald-500" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground/80">{log.users?.first_name} {log.users?.last_name}</span>
                                                <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase">{log.users?.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground/80 uppercase italic">{log.action.replace('_', ' ')}</span>
                                            <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase">{log.table_name || 'System'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-6">
                                        <span className="text-xs font-bold text-foreground/80">{log.row_id || 'N/A'}</span>
                                    </TableCell>
                                    <TableCell className="p-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-foreground/80">{log.ip_address || '127.0.0.1'}</span>
                                            <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase">{log.user_agent || 'Unknown'}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
