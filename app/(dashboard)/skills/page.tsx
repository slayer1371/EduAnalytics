"use client"

import { useState, useEffect } from "react"
import { Target, Plus, Loader2, BookOpen } from "lucide-react"

type Skill = {
  id: string
  name: string
  subject: string
  gradeLevel: string
  description: string
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const fetchSkills = () => {
    setLoading(true)
    fetch("/api/skills")
      .then(res => res.json())
      .then(data => {
        setSkills(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSkills()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, gradeLevel, description })
    })

    if (res.ok) {
      setIsCreating(false)
      setName("")
      setSubject("")
      setGradeLevel("")
      setDescription("")
      fetchSkills()
    }
    setIsSaving(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-up">
        <div>
          <h1 className="font-serif text-3xl text-ink">Skills Library</h1>
          <p className="text-slate mt-1">Manage educational standards and learning objectives</p>
        </div>
        
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-sage"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="card accent-left-sage p-6 animate-fade-up">
          <h3 className="font-serif text-xl text-ink mb-6">Create New Skill</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Skill Code/Name</label>
                <input required placeholder="e.g. MATH.ALG.1" value={name} onChange={e => setName(e.target.value)} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Subject</label>
                <input required placeholder="e.g. Mathematics" value={subject} onChange={e => setSubject(e.target.value)} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate uppercase tracking-wider">Grade Level</label>
                <input required placeholder="e.g. 9th Grade" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate uppercase tracking-wider">Description</label>
              <textarea placeholder="Solve linear equations with one variable..." value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={isSaving} className="btn-sage flex items-center space-x-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Skill</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden animate-fade-up-delay-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sage animate-spin mb-4" />
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-sage-muted rounded-full flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-sage" />
            </div>
            <h3 className="font-serif text-xl text-ink mb-2">No skills defined</h3>
            <p className="text-slate max-w-sm text-sm">Create standard skills so you can map them to assessment questions.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {skills.map((skill) => (
              <div key={skill.id} className="bg-white hover:shadow-md border border-border p-5 rounded-xl transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className="badge badge-sage">
                    <BookOpen className="w-3 h-3" />
                    <span>{skill.subject}</span>
                  </span>
                  <span className="badge badge-slate">{skill.gradeLevel}</span>
                </div>
                <h4 className="text-base font-bold text-ink mb-2">{skill.name}</h4>
                <p className="text-sm text-slate line-clamp-3">{skill.description || "No description provided."}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
