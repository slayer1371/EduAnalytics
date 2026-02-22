"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"
import { ArrowLeft, Loader2, User, Target, ExternalLink, Star, FileText } from "lucide-react"

type StudentData = {
  student: { id: string; name: string; group: { name: string } }
  stats: { assessmentsTaken: number; totalQuestions: number; overallScore: number }
  skillCharts: { name: string; subject: string; mastery: number }[]
  recommendations: {
    id: string; score: number;
    skill: { name: string };
    resource: { title: string; url: string; type: string }
  }[]
}

export default function StudentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber animate-spin" /></div>
  if (!data || data.student === undefined) return <div className="text-center py-20 text-slate">Student not found</div>

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-2 animate-fade-up">
        <Link href="/students" className="text-slate hover:text-ink transition-colors"><ArrowLeft className="w-6 h-6" /></Link>
        <div className="flex-1 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-3xl text-ink flex items-center">
              <User className="w-7 h-7 text-amber mr-3" />
              {data.student.name}
            </h1>
            <p className="text-slate mt-1">Group: <span className="text-ink font-medium">{data.student.group.name}</span></p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-up-delay-1">
        {/* Left Column: Stats & Radar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
             <h3 className="font-serif text-lg text-ink mb-4">Overall Performance</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-slate flex items-center text-sm"><Star className="w-4 h-4 mr-2 text-amber" /> Mastery Average</span>
                  <span className="text-2xl font-mono font-bold text-ink">{data.stats.overallScore}%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-slate flex items-center text-sm"><FileText className="w-4 h-4 mr-2 text-slate" /> Assessments</span>
                  <span className="font-mono font-semibold text-ink">{data.stats.assessmentsTaken}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate flex items-center text-sm"><Target className="w-4 h-4 mr-2 text-sage" /> Questions Addressed</span>
                  <span className="font-mono font-semibold text-ink">{data.stats.totalQuestions}</span>
                </div>
             </div>
          </div>

          <div className="card p-6 flex flex-col h-[350px]">
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wider text-center mb-2">Skill Competency Profile</h3>
            <div className="flex-1 w-full relative">
              {data.skillCharts.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skillCharts}>
                    <PolarGrid stroke="#e5e2db" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#faf8f3", borderColor: "#e5e2db", borderRadius: "8px", color: "#1a1a2e" }} />
                    <Radar name="Mastery %" dataKey="mastery" stroke="#e8a838" fill="#e8a838" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-slate">
                  <p>Need at least 3 tagged skills<br/>to generate radar profile.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Gaps & Resources */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
           <div className="card p-6 flex-1">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl text-ink">Targeted Intervention Plan</h3>
                <span className="badge badge-amber">
                  {data.recommendations.length} ActionItems
                </span>
             </div>

             {data.recommendations.length > 0 ? (
               <div className="space-y-4">
                 {data.recommendations.map(rec => (
                   <div key={rec.id} className="p-5 rounded-xl border border-border accent-left-terracotta bg-white hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Target className="w-4 h-4 text-terracotta" />
                          <span className="text-sm font-bold text-ink uppercase tracking-wider">{rec.skill.name}</span>
                        </div>
                        <p className="text-xs text-slate max-w-sm">
                           Mastery is below expectations. The engine suggests assigning the following resource:
                        </p>
                      </div>
                      
                      <a 
                        href={rec.resource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group flex flex-col items-center justify-center p-3 rounded-xl bg-amber-muted border border-amber/20 hover:bg-amber hover:border-amber transition-all text-center min-w-[140px]"
                      >
                         <span className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate group-hover:text-ink">{rec.resource.type}</span>
                         <span className="text-sm font-bold text-ink flex items-center">
                           {rec.resource.title} <ExternalLink className="w-4 h-4 ml-1.5 opacity-70" />
                         </span>
                      </a>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate border border-dashed border-border rounded-xl">
                  <Star className="w-12 h-12 text-sage/50 mb-3" />
                  <p className="text-sm">No critical skill gaps identified.</p>
                  <p className="text-xs mt-1">Student is performing at or above expectations across all measured standards.</p>
                </div>
             )}
           </div>

           <div className="card p-6">
             <h3 className="font-serif text-lg text-ink mb-4">Historical Skill Breakdown</h3>
             <div className="space-y-3">
               {data.skillCharts.sort((a,b) => b.mastery - a.mastery).map(skill => (
                 <div key={skill.name} className="flex items-center">
                   <div className="w-32 truncate text-sm font-medium text-ink" title={skill.name}>{skill.name}</div>
                   <div className="flex-1 mx-4 bg-parchment rounded-full h-2 overflow-hidden">
                     <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${skill.mastery}%`,
                          backgroundColor: skill.mastery >= 80 ? '#4a7c6f' : skill.mastery >= 60 ? '#e8a838' : '#c75c2e'
                        }}
                     />
                   </div>
                   <div className="w-12 text-right text-sm font-mono font-bold text-ink">{skill.mastery}%</div>
                 </div>
               ))}
               {data.skillCharts.length === 0 && <p className="text-xs text-slate">No data available.</p>}
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
