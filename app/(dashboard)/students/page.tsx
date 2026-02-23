"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, User, ArrowRight, Loader2, Plus, Target } from "lucide-react"

type Student = { id: string; name: string }
type Group = { id: string; name: string; students: Student[] }

export default function StudentsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const loadGroups = () => {
    fetch("/api/students")
      .then(r => r.json())
      .then(data => {
        setGroups(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleAddGroup = async () => {
    const name = window.prompt("Enter new group name (e.g. Period 2 Math):")
    if (!name) return

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
      if (res.ok) loadGroups()
    } catch (e) {
      alert("Failed to create group")
    }
  }

  const handleAddStudent = async (groupId: string) => {
    const name = window.prompt("Enter student's full name:")
    if (!name) return

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, groupId })
      })
      if (res.ok) loadGroups()
    } catch (e) {
      alert("Failed to add student")
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber animate-spin" /></div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end animate-fade-up">
        <div>
          <h1 className="font-serif text-3xl text-ink">Student Roster</h1>
          <p className="text-slate mt-1">Manage classes and view performance profiles by student group</p>
        </div>
        <button onClick={handleAddGroup} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Group</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="card text-center py-20 animate-fade-up-delay-1">
          <Users className="w-12 h-12 text-slate mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-serif text-ink mb-2">No groups yet</h3>
          <p className="text-slate mb-6">Create your first class group to start adding students.</p>
          <button onClick={handleAddGroup} className="btn-ghost">Create Group</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up-delay-1">
          {groups.map(group => (
            <div key={group.id} className="card overflow-hidden flex flex-col">
              <div className="p-5 border-b border-border bg-charcoal text-parchment flex items-center justify-between rounded-t-xl" style={{ borderRadius: '11px 11px 0 0' }}>
                <h3 className="font-bold text-base flex items-center">
                  <Users className="w-4 h-4 text-amber mr-2" />
                  {group.name}
                </h3>
                <span className="badge bg-white/10 text-parchment/70">
                  {group.students?.length || 0} students
                </span>
              </div>
              
              <div className="divide-y divide-border flex-1">
                {group.students?.map(student => (
                  <div key={student.id} className="p-4 flex items-center justify-between group-row hover:bg-parchment transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-muted flex items-center justify-center font-bold text-sm" style={{ color: '#b07d1e' }}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-ink text-sm">{student.name}</p>
                        <p className="text-xs text-slate font-mono mt-0.5">ID: {student.id}</p>
                      </div>
                    </div>
                    <Link 
                      href={`/students/${student.id}`}
                      className="flex justify-center items-center w-8 h-8 rounded-lg bg-parchment border border-border text-slate hover:bg-amber hover:text-ink hover:border-amber transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
                {(!group.students || group.students.length === 0) && (
                  <div className="p-6 flex flex-col items-center justify-center text-slate">
                    <User className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No students in this group.</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-parchment border-t border-border flex justify-center hover:bg-amber-muted transition-colors cursor-pointer" onClick={() => handleAddStudent(group.id)}>
                 <button className="text-xs text-amber font-medium transition-colors hover:text-ink flex items-center" style={{ color: '#b07d1e' }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Student
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

