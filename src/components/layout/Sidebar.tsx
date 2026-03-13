'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    UserSquare2,
    BookOpen,
    ClipboardCheck,
    BarChart3,
    Settings,
    GraduationCap,
    LogOut,
    School,
    Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItemProps {
    href: string
    icon: React.ElementType
    label: string
    active?: boolean
    collapsed?: boolean
}

const NavItem = ({ href, icon: Icon, label, active, collapsed, onAction }: NavItemProps & { onAction?: () => void }) => {
    return (
        <Link href={href} onClick={onAction}>
            <span className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
                collapsed && "justify-center px-2"
            )}>
                <Icon className={cn(
                    "h-[18px] w-[18px] transition-all duration-200 group-hover:scale-110",
                    active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {!collapsed && <span>{label}</span>}
                {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </span>
        </Link>
    )
}

export function Sidebar({
    role,
    isMobile,
    onAction
}: {
    role: 'director' | 'class_teacher' | 'subject_teacher',
    isMobile?: boolean,
    onAction?: () => void
}) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const menuItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['director', 'class_teacher', 'subject_teacher'] },
        { href: '/classes', icon: Users, label: 'Classes', roles: ['director', 'class_teacher'] },
        { href: '/students', icon: UserSquare2, label: 'Students', roles: ['director', 'class_teacher'] },
        { href: '/teachers', icon: Users, label: 'Teachers', roles: ['director'] },
        { href: '/subjects', icon: BookOpen, label: 'Subjects', roles: ['director'] },
        { href: '/marks', icon: ClipboardCheck, label: 'Marks', roles: ['director', 'class_teacher', 'subject_teacher'] },
        { href: '/reports', icon: BarChart3, label: 'Reports', roles: ['director', 'class_teacher'] },
        { href: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['director', 'class_teacher', 'subject_teacher'] },
    ]

    const settingsItems = [
        { href: '/settings/school', icon: School, label: 'School Profile', roles: ['director'] },
        { href: '/settings/academic-year', icon: Calendar, label: 'Academic Year', roles: ['director'] },
        { href: '/settings/profile', icon: Settings, label: 'My Profile', roles: ['director', 'class_teacher', 'subject_teacher'] },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const filteredItems = menuItems.filter(item => item.roles.includes(role))
    const filteredSettings = settingsItems.filter(item => item.roles.includes(role))

    return (
        <aside className={cn(
            isMobile
                ? "flex w-full flex-col bg-transparent"
                : "sticky top-0 z-40 hidden h-screen flex-col border-r border-border bg-background transition-all duration-300 lg:flex",
            !isMobile && "w-[250px]"
        )}>
            {!isMobile && (
                <div className="flex h-16 items-center border-b border-border px-5">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                            <GraduationCap className="text-white h-4 w-4" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-emerald-600 transition-colors">GradeMaster</span>
                    </Link>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-6">
                <div className="space-y-1">
                    {filteredItems.map((item) => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            active={pathname === item.href || pathname.startsWith(item.href + '/')}
                            onAction={onAction}
                        />
                    ))}
                </div>

                <div className="mt-8 space-y-1">
                    <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</h3>
                    {filteredSettings.map((item) => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            active={pathname === item.href}
                            onAction={onAction}
                        />
                    ))}
                </div>
            </div>

            <div className="border-t border-border p-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 h-auto text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-[18px] w-[18px]" />
                    <span>Sign Out</span>
                </Button>
            </div>
        </aside>
    )
}
