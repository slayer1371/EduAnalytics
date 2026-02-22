"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export default function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center justify-center space-x-2 w-full px-3 py-2 text-sm text-parchment/50 hover:bg-terracotta/10 hover:text-terracotta rounded-lg transition-all"
    >
      <LogOut className="w-4 h-4" />
      {!iconOnly && <span className="font-medium">Sign Out</span>}
    </button>
  )
}
