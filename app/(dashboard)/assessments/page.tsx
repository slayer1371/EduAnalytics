"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileUp, FileText, Loader2, Calendar, FileQuestion } from "lucide-react"

type Assessment = {
  id: string
  title: string
  date: string
  createdAt: string
  _count: {
    questions: number
  }
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        setAssessments(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load assessments", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-up">
        <div>
          <h1 className="font-serif text-3xl text-ink">Assessments</h1>
          <p className="text-slate mt-1">Manage and digitize student assessments</p>
        </div>
        
        <Link 
          href="/assessments/upload" 
          className="btn-primary"
        >
          <FileUp className="w-4 h-4" />
          <span>Upload PDF</span>
        </Link>
      </div>

      <div className="card overflow-hidden animate-fade-up-delay-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber animate-spin mb-4" />
            <p className="text-slate">Loading assessments...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 bg-amber-muted rounded-full flex items-center justify-center mb-6">
              <FileUp className="w-8 h-8" style={{ color: '#b07d1e' }} />
            </div>
            <h3 className="font-serif text-xl text-ink mb-2">No assessments yet</h3>
            <p className="text-slate max-w-sm mb-6 text-sm">Upload your first assessment PDF to extract text and analyze student performance.</p>
            <Link 
              href="/assessments/upload" 
              className="btn-ghost"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-parchment text-slate text-xs uppercase tracking-wider">
                  <th className="px-6 py-3.5 font-semibold">Title</th>
                  <th className="px-6 py-3.5 font-semibold">Date</th>
                  <th className="px-6 py-3.5 font-semibold">Questions</th>
                  <th className="px-6 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assessments.map(assessment => (
                  <tr key={assessment.id} className="hover:bg-parchment/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-amber" />
                        <span className="font-medium text-ink text-sm">{assessment.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(assessment.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate text-sm">
                        <FileQuestion className="w-3.5 h-3.5" />
                        <span>{assessment._count.questions} questions</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/assessments/${assessment.id}/map`} className="text-sm font-medium hover:text-amber transition-colors" style={{ color: '#b07d1e' }}>Map Skills</Link>
                        <span className="text-border-strong">|</span>
                        <Link href={`/assessments/${assessment.id}/responses`} className="text-sm font-medium text-sage hover:text-sage/80 transition-colors">Responses</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
