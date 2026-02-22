"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, User, ArrowRight, Loader2, Target } from "lucide-react"

type Student = { id: string; name: string }
type Group = { id: string; name: string; students: Student[] }

export default function StudentsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/students")
      .then(r => r.json())
      .then(data => {
        setGroups(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber animate-spin" /></div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end animate-fade-up">
        <div>
          <h1 className="font-serif text-3xl text-ink">Student Roster</h1>
          <p className="text-slate mt-1">View performance profiles by student group</p>
        </div>
        <button className="btn-ghost cursor-not-allowed opacity-50" title="MVP Limitation">
          Add Group
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up-delay-1">
        {groups.map(group => (
          <div key={group.id} className="card overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border bg-charcoal text-parchment flex items-center justify-between rounded-t-xl" style={{ borderRadius: '11px 11px 0 0' }}>
              <h3 className="font-bold text-base flex items-center">
                <Users className="w-4 h-4 text-amber mr-2" />
                {group.name}
              </h3>
              <span className="badge bg-white/10 text-parchment/70">
                {group.students.length} students
              </span>
            </div>
            
            <div className="divide-y divide-border flex-1">
              {group.students.map(student => (
                <div key={student.id} className="p-4 flex items-center justify-between group hover:bg-parchment transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amber-muted flex items-center justify-center font-bold text-sm" style={{ color: '#b07d1e' }}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-ink text-sm">{student.name}</p>
                    </div>
                  </div>
                  <Link 
                    href={`/students/${student.id}`}
                    className="flex justify-center items-center w-8 h-8 rounded-lg bg-parchment border border-border text-slate group-hover:bg-amber group-hover:text-ink group-hover:border-amber transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
              {group.students.length === 0 && (
                <div className="p-6 flex flex-col items-center justify-center text-slate">
                  <User className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No students in this group.</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-parchment border-t border-border flex justify-center cursor-not-allowed opacity-50" title="MVP Limitation">
               <button className="text-xs font-medium transition-colors" style={{ color: '#b07d1e' }}>
                  + Add Student
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
