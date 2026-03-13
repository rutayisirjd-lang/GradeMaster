'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-transparent hover:border-border transition-all">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border rounded-2xl p-2 shadow-2xl">
                <DropdownMenuItem
                    onClick={() => setTheme('light')}
                    className="flex items-center gap-2 p-3 rounded-xl cursor-pointer focus:bg-accent"
                >
                    <Sun size={16} /> <span className="text-xs font-black uppercase tracking-widest">Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme('dark')}
                    className="flex items-center gap-2 p-3 rounded-xl cursor-pointer focus:bg-accent"
                >
                    <Moon size={16} /> <span className="text-xs font-black uppercase tracking-widest">Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme('system')}
                    className="flex items-center gap-2 p-3 rounded-xl cursor-pointer focus:bg-accent"
                >
                    <span className="text-xs font-black uppercase tracking-widest pl-6">System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
