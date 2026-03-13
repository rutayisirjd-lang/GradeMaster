'use client'

import React from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DashboardShell({
    children,
    userEmail,
    role
}: {
    children: React.ReactNode
    userEmail: string
    role: string
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

    return (
        <div className="flex h-screen w-full bg-background text-foreground font-sans antialiased overflow-hidden">

            {/* Desktop Sidebar */}
            <div className="relative z-20 flex">
               <Sidebar role={role as any} />
            </div>

            {/* Mobile Sidebar Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 lg:hidden",
                    isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <div
                    className={cn(
                        "absolute left-0 top-0 h-full w-72 bg-background border-r border-border p-4 shadow-xl transition-transform duration-300",
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-lg font-bold tracking-tight text-foreground">GradeMaster</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <Sidebar role={role as any} isMobile onAction={() => setIsMobileMenuOpen(false)} />
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden w-full">
                <TopBar
                    userEmail={userEmail}
                    role={role}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30">
                    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
