import Link from "next/link"
import { ArrowRight, BarChart3, ScanText, Target } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-parchment text-ink overflow-hidden relative">
      {/* Subtle warm gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-amber-muted to-transparent pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between p-6 max-w-6xl mx-auto animate-fade-up">
        <div className="font-serif text-2xl text-ink tracking-tight">
          EduAnalytics
        </div>
        <div className="flex items-center space-x-5">
          <Link href="/login" className="text-slate hover:text-ink transition-colors font-medium text-sm">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center">
        {/* Editorial pill badge */}
        <div className="animate-fade-up-delay-1 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-muted text-sm font-semibold mb-10" style={{ color: '#b07d1e' }}>
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber" />
          <span>MVP Edition v1.0</span>
        </div>
        
        <h1 className="animate-fade-up-delay-1 font-serif text-5xl md:text-7xl tracking-tight mb-8 leading-[1.1]">
          Turn Assessments Into <br />
          <span className="text-amber italic">
            Targeted Action
          </span>
        </h1>
        
        <p className="animate-fade-up-delay-2 text-lg text-slate max-w-2xl mb-12 leading-relaxed">
          Upload PDF assessments, instantly detect skill gaps using OCR, and generate personalized instructional recommendations for every student.
        </p>
        
        <div className="animate-fade-up-delay-2 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-28">
          <Link href="/register" className="btn-primary group px-8 py-3.5 text-base">
            <span>Start Analyzing Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="btn-ghost px-8 py-3.5 text-base">
            View Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl text-left">
          <div className="card accent-left-amber p-7 animate-fade-up-delay-1 hover:translate-y-[-2px] transition-transform">
            <div className="w-11 h-11 rounded-xl bg-amber-muted flex items-center justify-center mb-5">
              <ScanText className="text-amber w-5 h-5" style={{ color: '#b07d1e' }} />
            </div>
            <h3 className="font-serif text-xl text-ink mb-2">Instant OCR Ingestion</h3>
            <p className="text-slate text-sm leading-relaxed">Drag and drop printed assessments. We&apos;ll automatically digitize questions and student responses.</p>
          </div>
          <div className="card accent-left-sage p-7 animate-fade-up-delay-2 hover:translate-y-[-2px] transition-transform">
            <div className="w-11 h-11 rounded-xl bg-sage-muted flex items-center justify-center mb-5">
              <Target className="text-sage w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl text-ink mb-2">Skill Map Tracking</h3>
            <p className="text-slate text-sm leading-relaxed">Tag every question to standard skills and watch as student mastery is charted automatically over time.</p>
          </div>
          <div className="card accent-left-terracotta p-7 animate-fade-up-delay-3 hover:translate-y-[-2px] transition-transform">
            <div className="w-11 h-11 rounded-xl bg-terracotta-muted flex items-center justify-center mb-5">
              <BarChart3 className="text-terracotta w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl text-ink mb-2">Actionable Insights</h3>
            <p className="text-slate text-sm leading-relaxed">Stop guessing. Our dashboard highlights critical skill gaps and recommends exact resources to close them.</p>
          </div>
        </div>
      </main>

      {/* Footer line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  )
}
