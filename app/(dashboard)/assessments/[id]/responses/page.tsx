"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Save, CheckCircle2, XCircle } from "lucide-react"

type Student = { id: string; name: string }
type Group = { id: string; name: string; students: Student[] }
type Question = { id: string; questionNumber: number }
type AssessmentResponse = { assessment: { title: string; questions: Question[] }, responses: { studentId: string; questionId: string; correct: boolean }[] }

// State tracking: record[studentId][questionId] = boolean (correct)
type ResponseMap = Record<string, Record<string, boolean>>

export default function ResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [assessment, setAssessment] = useState<AssessmentResponse["assessment"] | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string>("")
  
  const [responses, setResponses] = useState<ResponseMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/students", { method: "POST" }).then(() => {
      Promise.all([
        fetch(`/api/assessments/${id}/responses`).then(r => r.json()),
        fetch("/api/students").then(r => r.json())
      ]).then(([assessmentData, groupsData]) => {
        setAssessment(assessmentData.assessment)
        setGroups(groupsData)
        if (groupsData.length > 0) setActiveGroupId(groupsData[0].id)
        
        const loaded: ResponseMap = {}
        if (assessmentData.responses) {
          assessmentData.responses.forEach((r: { studentId: string; questionId: string; correct: boolean }) => {
            if (!loaded[r.studentId]) loaded[r.studentId] = {}
            loaded[r.studentId][r.questionId] = r.correct
          })
        }
        setResponses(loaded)
        setLoading(false)
      })
    })
  }, [id])

  const toggleResponse = (studentId: string, questionId: string, currentVal?: boolean) => {
    setResponses(prev => {
      const studentData = { ...(prev[studentId] || {}) }
      if (currentVal === undefined) studentData[questionId] = true
      else if (currentVal === true) studentData[questionId] = false
      else delete studentData[questionId]
      
      return { ...prev, [studentId]: studentData }
    })
  }

  const handleBulkSet = (studentId: string, val: boolean) => {
    if (!assessment) return
    setResponses(prev => {
      const studentData = { ...prev[studentId] }
      assessment.questions.forEach(q => { studentData[q.id] = val })
      return { ...prev, [studentId]: studentData }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const payload: { studentId: string; questionId: string; correct: boolean }[] = []
    
    Object.entries(responses).forEach(([studentId, qs]) => {
      Object.entries(qs).forEach(([questionId, correct]) => {
        payload.push({ studentId, questionId, correct })
      })
    })

    try {
      const res = await fetch(`/api/assessments/${id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: payload })
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber animate-spin" /></div>
  if (!assessment) return <div className="text-center py-20 text-slate">Assessment not found</div>
  
  const activeGroup = groups.find(g => g.id === activeGroupId)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-2 animate-fade-up">
        <Link href="/assessments" className="text-slate hover:text-ink transition-colors"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="font-serif text-3xl text-ink">Enter Responses</h1>
          <p className="text-slate mt-1">Record score data for <span className="text-ink font-medium">&quot;{assessment.title}&quot;</span>.</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 animate-fade-up-delay-1">
        {groups.map(g => (
          <button 
            key={g.id}
            onClick={() => setActiveGroupId(g.id)}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeGroupId === g.id ? "bg-charcoal text-parchment" : "bg-white border border-border text-slate hover:text-ink"}`}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden animate-fade-up-delay-1">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-parchment">
                <th className="px-6 py-3.5 font-semibold text-ink text-sm sticky left-0 bg-parchment z-10 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">Student Name</th>
                {assessment.questions.map(q => (
                  <th key={q.id} className="px-4 py-3.5 font-semibold text-slate text-center text-xs uppercase tracking-wider min-w-[80px]">
                    Q{q.questionNumber}
                  </th>
                ))}
                <th className="px-6 py-3.5 font-semibold text-slate text-right text-xs uppercase tracking-wider">Quick Fill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeGroup?.students.map(student => (
                <tr key={student.id} className="hover:bg-parchment/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-ink text-sm sticky left-0 bg-cream transition-colors shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">
                    {student.name}
                  </td>
                  {assessment.questions.map(q => {
                    const status = responses[student.id]?.[q.id]
                    return (
                      <td key={q.id} className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleResponse(student.id, q.id, status)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto transition-all ${
                            status === true ? "bg-sage-muted text-sage border border-sage/30" : 
                            status === false ? "bg-terracotta-muted text-terracotta border border-terracotta/30" : 
                            "bg-parchment text-slate border border-border hover:border-amber/50"
                          }`}
                        >
                          {status === true ? <CheckCircle2 className="w-5 h-5" /> : status === false ? <XCircle className="w-5 h-5" /> : "—"}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                       <button onClick={() => handleBulkSet(student.id, true)} className="text-xs bg-sage-muted text-sage px-3 py-1.5 rounded-lg hover:bg-sage/20 font-medium transition-colors">All ✓</button>
                       <button onClick={() => handleBulkSet(student.id, false)} className="text-xs bg-terracotta-muted text-terracotta px-3 py-1.5 rounded-lg hover:bg-terracotta/20 font-medium transition-colors">All ✗</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8 py-3 font-bold flex items-center space-x-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Save Results & Generate Insights</span>
        </button>
      </div>
    </div>
  )
}
