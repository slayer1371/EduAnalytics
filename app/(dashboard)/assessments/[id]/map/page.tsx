"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Save, MapPin, Search, CheckCircle2 } from "lucide-react"

type Skill = { id: string; name: string; subject: string; gradeLevel: string }
type Question = { 
  id: string; 
  questionNumber: number; 
  questionText: string; 
  skills: { skill: Skill }[] 
}
type Assessment = { id: string; title: string; questions: Question[] }

export default function MapSkillsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [mappings, setMappings] = useState<Record<string, Set<string>>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/assessments/${id}/map`).then(r => r.json()),
      fetch("/api/skills").then(r => r.json())
    ]).then(([assessmentData, skillsData]) => {
      setAssessment(assessmentData)
      setAvailableSkills(skillsData)
      
      const initialMappings: Record<string, Set<string>> = {}
      if (assessmentData.questions) {
        assessmentData.questions.forEach((q: Question) => {
          initialMappings[q.id] = new Set(q.skills.map(s => s.skill.id))
        })
      }
      setMappings(initialMappings)
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [id])

  const toggleSkill = (questionId: string, skillId: string) => {
    setMappings(prev => {
      const current = new Set(prev[questionId])
      if (current.has(skillId)) current.delete(skillId)
      else current.add(skillId)
      return { ...prev, [questionId]: current }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = Object.entries(mappings).map(([questionId, skillSet]) => ({
      questionId,
      skillIds: Array.from(skillSet)
    }))

    try {
      const res = await fetch(`/api/assessments/${id}/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: payload })
      })
      if (res.ok) {
        router.push("/assessments")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const filteredSkills = availableSkills.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber animate-spin" /></div>
  }

  if (!assessment) {
    return <div className="text-center py-20 text-slate">Assessment not found</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-2 animate-fade-up">
        <Link href="/assessments" className="text-slate hover:text-ink transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-ink flex items-center">
            <MapPin className="w-6 h-6 text-amber mr-3" />
            Map Skills
          </h1>
          <p className="text-slate mt-1">Tag questions in <span className="text-ink font-medium">"{assessment.title}"</span> with educational skills.</p>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)] animate-fade-up-delay-1">
        {/* Left pane: Questions list */}
        <div className="flex-1 card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-parchment">
            <h3 className="font-semibold text-ink text-sm">Questions Tracker</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {assessment.questions.map(q => {
              const mappedCount = mappings[q.id]?.size || 0
              return (
                <div key={q.id} className="p-4 rounded-xl border border-border bg-white hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber text-ink text-xs font-bold text-center">
                      {q.questionNumber}
                    </span>
                    <span className={`badge ${mappedCount > 0 ? "badge-sage" : "badge-slate"}`}>
                      {mappedCount} skill{mappedCount !== 1 && "s"} tagged
                    </span>
                  </div>
                  <p className="text-sm text-ink font-medium mb-4">{q.questionText}</p>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate font-semibold uppercase tracking-wider">Tag Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSkills.map(skill => {
                        const isSelected = mappings[q.id]?.has(skill.id)
                        return (
                          <button
                            key={skill.id}
                            onClick={() => toggleSkill(q.id, skill.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected 
                                ? "bg-amber text-ink shadow-sm" 
                                : "bg-parchment border border-border text-slate hover:border-amber/50 hover:text-ink"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>{skill.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right pane: Skill Reference Library */}
        <div className="w-80 shrink-0 card flex flex-col overflow-hidden hidden lg:flex">
          <div className="p-4 border-b border-border bg-parchment">
            <h3 className="font-semibold text-ink text-sm mb-3">Skill Reference</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
              <input 
                type="text" 
                placeholder="Search skills..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredSkills.map(skill => (
              <div key={skill.id} className="p-3 rounded-xl border border-border bg-white">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-sage">{skill.name}</span>
                  <span className="badge badge-slate">{skill.gradeLevel}</span>
                </div>
              </div>
            ))}
            {filteredSkills.length === 0 && (
              <div className="text-center py-10 text-sm text-slate">No skills found. Add them in the Skills Library.</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8 py-3 font-bold flex items-center space-x-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Save Skill Mappings</span>
        </button>
      </div>
    </div>
  )
}
