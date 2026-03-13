'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  GraduationCap, BookOpen, Users, FileText, ClipboardList,
  ShieldCheck, Globe, Zap, Calendar, LayoutDashboard, ChevronRight,
  BarChart3, CheckCircle2
} from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

/* ─────────────────────────────────────────────
   Loading Screen – GradeMaster logo + 3 dots
   ───────────────────────────────────────────── */
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1600)
    const t2 = setTimeout(() => onDone(), 2100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-8 transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <GraduationCap className="text-white h-10 w-10" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">GradeMaster</span>
      </div>
      {/* Three bouncing dots */}
      <div className="flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────
   Typewriter hook
   ───────────────────────────────── */
function useTypewriter(text: string, speed = 30, startDelay = 0, enabled = true) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const delay = setTimeout(() => setStarted(true), startDelay)
    return () => clearTimeout(delay)
  }, [enabled, startDelay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) return
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed)
    return () => clearTimeout(t)
  }, [displayed, text, speed, started])

  return { displayed, done: displayed.length >= text.length, started }
}

/* ─────────────────────────────────
   Scroll Reveal hook
   ───────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(entry.target) } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

/* ─────────────────────────────────
   Staggered Fade-In wrapper
   ───────────────────────────────── */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════
   Main Landing Page
   ═══════════════════════════════════════ */
export default function LandingPage() {
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // After loading screen finishes, mark ready for typewriter
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setReady(true), 200)
      return () => clearTimeout(t)
    }
  }, [loading])

  // Typewriter segments for the hero
  const line1 = useTypewriter('Empowering Education,', 35, 0, ready)
  const line2 = useTypewriter('Inspiring Excellence.', 35, 800, ready)
  const descText = useTypewriter(
    'A comprehensive grading and academic management platform built for directors, class teachers, and subject teachers.',
    12, 1800, ready
  )

  return (
    <>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}

      <main className={`min-h-screen bg-background text-foreground overflow-x-hidden font-sans transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>

        {/* ── Navbar ── */}
        <header className={`fixed w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-background/90 backdrop-blur-xl border-border shadow-sm' : 'bg-transparent border-transparent'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 bg-emerald-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <GraduationCap className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-emerald-600 transition-colors">
                GradeMaster
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              {['Features', 'Why Us', 'About'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="relative hover:text-foreground transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-emerald-500 after:transition-all hover:after:w-full"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all hover:shadow-md hover:shadow-emerald-500/20 active:scale-95"
              >
                Sign In
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative px-6 pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 max-w-xl">
              <span className={`inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/20 transition-all duration-500 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Academic Management Platform
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground min-h-[160px] md:min-h-[180px]">
                {line1.displayed.split('Education').length > 1 ? (
                  <>
                    {line1.displayed.split('Education')[0]}
                    <span className="text-emerald-600 dark:text-emerald-500">Education</span>
                    {line1.displayed.split('Education')[1]}
                  </>
                ) : (
                  <>{line1.displayed}</>
                )}
                {line1.done && <br />}
                {line2.started && (
                  <>
                    {line2.displayed.split('Excellence').length > 1 ? (
                      <>
                        {line2.displayed.split('Excellence')[0]}
                        <span className="text-amber-500">Excellence</span>
                        {line2.displayed.split('Excellence')[1]}
                      </>
                    ) : (
                      <>{line2.displayed}</>
                    )}
                  </>
                )}
                {!line2.done && (
                  <span className="inline-block w-[3px] h-[0.7em] bg-emerald-500 ml-1 animate-pulse align-baseline" />
                )}
              </h1>

              <p className={`text-lg text-muted-foreground leading-relaxed min-h-[60px] transition-opacity duration-300 ${descText.started ? 'opacity-100' : 'opacity-0'}`}>
                {descText.displayed}
                {descText.started && !descText.done && (
                  <span className="inline-block w-[2px] h-[0.8em] bg-muted-foreground/50 ml-0.5 animate-pulse align-baseline" />
                )}
              </p>

              <div className={`flex flex-col sm:flex-row gap-4 pt-2 transition-all duration-700 delay-300 ${descText.done ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 group"
                >
                  Get Started <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 py-3.5 text-base font-semibold text-foreground hover:bg-accent transition-all hover:shadow-sm active:scale-95"
                >
                  Explore Features
                </a>
              </div>
            </div>

            {/* Dashboard Preview Card */}
            <div className={`hidden lg:block transition-all duration-1000 delay-500 ${ready ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-8 translate-y-4'}`}>
              <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 transition-transform hover:scale-125" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 transition-transform hover:scale-125" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400 transition-transform hover:scale-125" />
                  <span className="ml-3 text-xs text-muted-foreground font-medium">GradeMaster Dashboard</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="h-3 w-32 bg-foreground/10 rounded animate-pulse" />
                      <div className="h-2 w-20 bg-foreground/5 rounded mt-1.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: '247', label: 'Students', color: 'emerald' },
                      { val: '18', label: 'Teachers', color: 'blue' },
                      { val: '12', label: 'Classes', color: 'amber' },
                    ].map((c, idx) => (
                      <div
                        key={c.label}
                        className={`p-4 rounded-xl bg-${c.color}-50 dark:bg-${c.color}-500/5 border border-${c.color}-100 dark:border-${c.color}-500/10 transition-all duration-500 hover:scale-105`}
                        style={{ animationDelay: `${idx * 200}ms` }}
                      >
                        <div className={`text-2xl font-bold text-${c.color}-600 dark:text-${c.color}-500`}>{c.val}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-28 rounded-xl bg-muted/40 border border-border animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-xl bg-muted/30 border border-border" />
                    <div className="h-16 rounded-xl bg-muted/30 border border-border" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="px-6 py-20 bg-muted/30 border-y border-border">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-16 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Everything You Need
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A complete academic management toolkit designed for schools and institutions of all sizes.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[
                { title: 'Marks Entry', desc: 'Flexible grade management with quiz, homework, and exam categories.', icon: ClipboardList, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { title: 'Student Records', desc: 'Track enrollment, performance trends, and individual histories.', icon: Users, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { title: 'Report Cards', desc: 'Generate polished transcripts and progress reports instantly.', icon: FileText, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { title: 'Analytics', desc: 'Visualize class rankings, subject performance, and trends.', icon: BarChart3, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
              ].map((card, idx) => (
                <FadeIn key={card.title} delay={idx * 150}>
                  <div className="bg-background border border-border rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full group">
                    <div className={`h-11 w-11 rounded-lg ${card.bg} flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { title: 'Director Dashboard', desc: 'Full institutional oversight with real-time metrics.', icon: LayoutDashboard, color: 'text-emerald-600 dark:text-emerald-500' },
                { title: 'Academic Terms', desc: 'Seamlessly track progress across terms and academic years.', icon: Calendar, color: 'text-blue-600 dark:text-blue-500' },
                { title: 'Role-Based Access', desc: 'Secure permissions for directors, class teachers, and subject teachers.', icon: ShieldCheck, color: 'text-rose-600 dark:text-rose-500' },
                { title: 'Real-time Stats', desc: 'Live enrollment and faculty metrics at a glance.', icon: Zap, color: 'text-amber-600 dark:text-amber-500' },
                { title: 'School Branding', desc: 'White-label your reports with your school logo and motto.', icon: Globe, color: 'text-teal-600 dark:text-teal-500' },
                { title: 'Assessment System', desc: 'Flexible categorization with automatic weighting.', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-500' },
              ].map((feature, idx) => (
                <FadeIn key={feature.title} delay={idx * 100}>
                  <div className="flex items-start gap-4 bg-background border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full group">
                    <div className="shrink-0">
                      <feature.icon className={`h-5 w-5 mt-0.5 ${feature.color} transition-transform group-hover:scale-110`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why GradeMaster ── */}
        <section id="why-us" className="px-6 py-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  Why GradeMaster?
                </h2>
                <div className="space-y-6">
                  {[
                    { title: 'Fast & Reliable', desc: "Optimized for speed. Record marks and generate reports faster than any legacy system.", icon: Zap },
                    { title: 'Secure by Design', desc: "Role-based access control and encrypted data keep your institution's information safe.", icon: ShieldCheck },
                    { title: 'Easy to Use', desc: 'An intuitive interface that teachers and directors can use from day one — no training needed.', icon: CheckCircle2 },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="shrink-0 h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 transition-transform group-hover:scale-110 group-hover:rotate-3">
                        <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Stats side */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { number: '500+', label: 'Students Managed', color: 'text-emerald-600 dark:text-emerald-500' },
                { number: '50+', label: 'Teachers Active', color: 'text-blue-600 dark:text-blue-500' },
                { number: '99.9%', label: 'Uptime', color: 'text-amber-600 dark:text-amber-500' },
                { number: '10x', label: 'Faster Reports', color: 'text-purple-600 dark:text-purple-500' },
              ].map((stat, idx) => (
                <FadeIn key={stat.label} delay={idx * 150}>
                  <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className={`text-3xl font-bold ${stat.color} mb-1 transition-transform group-hover:scale-110`}>{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <FadeIn>
          <section id="about" className="px-6 py-20 bg-emerald-600 dark:bg-emerald-700 transition-colors">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Ready to Transform Your School?
              </h2>
              <p className="text-emerald-100 text-lg">
                Join schools already using GradeMaster to streamline their academic management.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-emerald-700 px-8 py-3.5 text-base font-semibold hover:bg-emerald-50 transition-all shadow-sm hover:shadow-lg active:scale-95 group"
              >
                Get Started Today <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        </FadeIn>

        {/* ── Footer ── */}
        <footer className="px-6 py-12 border-t border-border transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <GraduationCap className="text-white h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">GradeMaster</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2025 GradeMaster. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
