'use client'

import React from 'react'
import { Bell, Search, User, Settings, LogOut, Menu } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function TopBar({
    userEmail,
    role,
    onMenuClick
}: {
    userEmail: string;
    role: string;
    onMenuClick?: () => void
}) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const title = role === 'director' ? 'Director' : role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    const initials = userEmail.substring(0, 2).toUpperCase()

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4 md:px-6 shadow-sm">
            {/* Mobile menu button */}
            <div className="flex items-center gap-3 lg:hidden">
                <Button variant="ghost" size="icon" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Search */}
            <div className="hidden md:flex w-full max-w-md items-center">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search students, classes..."
                        className="w-full pl-10 h-10 bg-muted/50 border-border rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
                <ThemeToggle />

                <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-accent transition-colors">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500"></span>
                </Button>

                <div className="h-6 w-px bg-border hidden sm:block" />

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-medium text-foreground">{userEmail}</span>
                        <span className="text-xs text-muted-foreground">{title}</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-transparent">
                                <Avatar className="h-9 w-9 border border-border hover:border-emerald-500 transition-colors">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-emerald-600 text-white text-xs font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer rounded-lg">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer rounded-lg">
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500 rounded-lg"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm">Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
