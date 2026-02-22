"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Loader2, TrendingUp, Users, FileText, Target, AlertCircle, ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react"

type DashboardData = {
  summary: {
    totalAssessments: number
    totalStudents: number
    overallMastery: number
    criticalGaps: number
  }
  skillCharts: { name: string; mastery: number }[]
  recentRecommendations: {
    id: string
    score: number
    student: { id: string; name: string }
    skill: { id: string; name: string }
    resource: { id: string; title: string; url: string; type: string }
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        console.error("Dashboard load error", e)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-amber animate-spin mb-4" />
        <p className="text-slate font-medium tracking-wide">Crunching analytics...</p>
      </div>
    )
  }

  if (!data) return <div className="text-center py-20 text-slate">Failed to load payload</div>

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-serif text-3xl text-ink">Platform Overview</h1>
        <p className="text-slate mt-1">High-level insights into student performance & skill gaps</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up-delay-1">
        <div className="card accent-left-sage p-5 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity">
            <TrendingUp className="w-14 h-14 text-sage" />
          </div>
          <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Overall Mastery</p>
          <div className="text-3xl font-mono font-bold text-ink flex items-baseline gap-0.5">
            {data.summary.overallMastery}<span className="text-lg text-slate">%</span>
          </div>
          <p className="text-xs text-sage mt-2 flex items-center font-medium"><TrendingUp className="w-3 h-3 mr-1" /> Across all skills</p>
        </div>
        
        <div className="card accent-left-terracotta p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.06]">
            <AlertCircle className="w-14 h-14 text-terracotta" />
          </div>
          <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Critical Gaps</p>
          <div className="text-3xl font-mono font-bold text-terracotta">{data.summary.criticalGaps}</div>
          <p className="text-xs text-terracotta/70 mt-2 font-medium">Skills scoring below 80%</p>
        </div>

        <div className="card p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.06]">
            <Users className="w-14 h-14 text-ink" />
          </div>
          <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Total Students</p>
          <div className="text-3xl font-mono font-bold text-ink">{data.summary.totalStudents}</div>
          <p className="text-xs text-slate mt-2">Actively tracked</p>
        </div>

        <div className="card p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.06]">
            <FileText className="w-14 h-14 text-ink" />
          </div>
          <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">Assessments Processed</p>
          <div className="text-3xl font-mono font-bold text-ink">{data.summary.totalAssessments}</div>
          <p className="text-xs text-slate mt-2">Via OCR & manual entry</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-up-delay-2">
        {/* Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-serif text-lg text-ink">Skill Mastery Distribution</h3>
              <p className="text-sm text-slate">Lowest performing skills to the left</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-terracotta mr-1.5" />Gaps</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-sage mr-1.5" />Mastery</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] w-full mt-2">
            {data.skillCharts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.skillCharts} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#6b7280", fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={{ stroke: "#e5e2db" }} 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                  />
                  <YAxis 
                    tick={{ fill: "#6b7280", fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 100]} 
                    tickFormatter={(val) => `${val}%`} 
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(26,26,46,0.03)" }}
                    contentStyle={{ backgroundColor: "#faf8f3", borderColor: "#e5e2db", borderRadius: "10px", color: "#1a1a2e", fontSize: "13px" }}
                    itemStyle={{ color: "#1a1a2e", fontWeight: "bold" }}
                    formatter={(val: number) => [`${val}%`, "Mastery"]}
                  />
                  <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
                    {data.skillCharts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.mastery < 80 ? "#c75c2e" : "#4a7c6f"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate">
                <Target className="w-12 h-12 text-border-strong mb-3" />
                <p>No skill data mapped yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Actionable Recommendations Feed */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-amber-muted">
            <h3 className="font-serif text-lg text-ink flex items-center">
              <Target className="w-5 h-5 mr-2" style={{ color: '#b07d1e' }} />
              Actionable Insights
            </h3>
            <p className="text-sm text-slate mt-0.5">Engine generated recommendations</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
            {data.recentRecommendations.length > 0 ? (
              data.recentRecommendations.map(rec => (
                <div key={rec.id} className="p-4 rounded-xl border border-border bg-white hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-ink">{rec.student.name}</span>
                    <span className="badge badge-terracotta">
                      High Priority Gap
                    </span>
                  </div>
                  <p className="text-xs text-slate mb-3">
                    Struggling with: <span className="font-semibold text-ink">{rec.skill.name}</span>
                  </p>
                  
                  <div className="p-2.5 rounded-lg bg-amber-muted border border-amber/20 group cursor-pointer hover:bg-amber/15 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="badge badge-amber text-[10px] uppercase tracking-wider">{rec.resource.type}</span>
                        <span className="text-sm font-semibold text-ink truncate">{rec.resource.title}</span>
                      </div>
                      <a href={rec.resource.url} target="_blank" rel="noreferrer" className="shrink-0 group-hover:bg-amber p-1.5 rounded-md text-slate group-hover:text-ink transition-all">
                         <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate space-y-3">
                <CheckCircle2 className="w-10 h-10 text-sage/50" />
                <p className="text-sm px-4">No critical skill gaps identified requiring remediation.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border text-center">
             <Link href="/resources" className="text-sm font-medium flex items-center justify-center pb-1 transition-colors hover:text-amber" style={{ color: '#b07d1e' }}>
               Manage Resource Library <ArrowRight className="w-4 h-4 ml-1" />
             </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
