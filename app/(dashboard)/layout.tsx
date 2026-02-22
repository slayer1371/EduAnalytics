import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, Target, Users, BookOpen } from "lucide-react"
import LogoutButton from "@/components/LogoutButton"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Assessments", href: "/assessments", icon: FileText },
  { name: "Skills", href: "/skills", icon: Target },
  { name: "Students", href: "/students", icon: Users },
  { name: "Resources", href: "/resources", icon: BookOpen },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-parchment text-ink flex">
      {/* Sidebar */}
      <div className="w-60 bg-charcoal text-parchment flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/8">
          <span className="font-serif text-xl tracking-tight text-parchment">
            EduAnalytics
          </span>
        </div>
        
        <div className="flex-1 py-5 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-parchment/60 hover:bg-white/8 hover:text-parchment transition-all text-sm group"
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
        
        <div className="p-3 border-t border-white/8">
          <div className="flex items-center space-x-3 px-3 py-2.5 mb-1.5 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center font-bold text-ink text-sm">
              {session.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-parchment truncate">{session.user?.name}</p>
              <p className="text-xs text-parchment/40 truncate">{session.user?.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b border-border bg-cream flex items-center justify-between px-4 z-10">
           <span className="font-serif text-lg text-ink">
            EduAnalytics
          </span>
          <LogoutButton iconOnly />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
