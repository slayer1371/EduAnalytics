"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, Loader2, Link as LinkIcon, ExternalLink } from "lucide-react"

type Skill = { id: string; name: string }
type Resource = {
  id: string
  title: string
  url: string
  type: string
  description: string
  skills: { skill: Skill }[]
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Form State
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [type, setType] = useState("Video")
  const [description, setDescription] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/resources").then(r => r.json()),
      fetch("/api/skills").then(r => r.json())
    ]).then(([rData, sData]) => {
      setResources(rData)
      setAvailableSkills(sData)
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, type, description, skillIds: selectedSkills })
    })

    if (res.ok) {
      setIsCreating(false)
      setTitle("")
      setUrl("")
      setType("Video")
      setDescription("")
      setSelectedSkills([])
      fetchData()
    }
    setIsSaving(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-up">
        <div>
          <h1 className="font-serif text-3xl text-ink">Resource Library</h1>
          <p className="text-slate mt-1">Manage instructional content for the recommendation engine</p>
        </div>
        
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="card accent-left-amber p-6 animate-fade-up">
          <h3 className="font-serif text-xl text-ink mb-6">Create New Resource</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider">Resource Title</label>
                  <input required placeholder="e.g. Intro to Algebra Video" value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider">Target URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                    <input required type="url" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} className="input-field pl-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate uppercase tracking-wider">Content Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="input-field appearance-none">
                      <option>Video</option>
                      <option>Worksheet</option>
                      <option>Article</option>
                      <option>Interactive Game</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider">Teacher Notes (Optional)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input-field resize-none" />
                </div>
              </div>

              {/* Skill Linkage */}
              <div className="border border-border rounded-xl p-4 bg-white flex flex-col h-full">
                <label className="text-xs font-semibold text-slate uppercase tracking-wider mb-3 block">Link to Target Skills (Triggers Recommendation)</label>
                <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-2">
                  {availableSkills.map(skill => (
                    <label key={skill.id} className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedSkills.includes(skill.id) ? "border-amber bg-amber-muted text-ink" : "border-border bg-parchment text-slate hover:bg-cream"}`}>
                      <input type="checkbox" className="hidden" checked={selectedSkills.includes(skill.id)} onChange={() => toggleSkill(skill.id)} />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSkills.includes(skill.id) ? "bg-amber border-amber" : "border-slate/30"}`}>
                        {selectedSkills.includes(skill.id) && <div className="w-2 h-2 bg-ink rounded-sm" />}
                      </div>
                      <span className="text-sm font-medium select-none">{skill.name}</span>
                    </label>
                  ))}
                  {availableSkills.length === 0 && <p className="text-xs text-slate italic p-2">Create skills first to enable linking.</p>}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={() => setIsCreating(false)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={isSaving} className="btn-primary flex items-center space-x-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Resource</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 animate-fade-up-delay-1">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber animate-spin" /></div>
        ) : resources.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center px-4 card">
            <div className="w-16 h-16 bg-amber-muted rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8" style={{ color: '#b07d1e' }} />
            </div>
            <h3 className="font-serif text-xl text-ink mb-2">No resources available</h3>
            <p className="text-slate max-w-sm text-sm">Add learning materials that the recommendation engine can assign to struggling students.</p>
          </div>
        ) : (
          resources.map(resource => (
             <div key={resource.id} className="card p-6 flex flex-col group hover:translate-y-[-2px] transition-all hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <span className="badge badge-amber">
                    {resource.type}
                  </span>
                  <a href={resource.url} target="_blank" rel="noreferrer" className="text-slate hover:text-ink transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                <h4 className="text-lg font-bold text-ink mb-2 leading-tight">{resource.title}</h4>
                <p className="text-sm text-slate mb-6 flex-1">{resource.description}</p>
                
                <div className="pt-4 border-t border-border">
                   <p className="text-[10px] text-slate uppercase font-bold tracking-wider mb-2">Targeted Skills</p>
                   <div className="flex flex-wrap gap-1.5">
                     {resource.skills.slice(0, 3).map(s => (
                       <span key={s.skill.id} className="badge badge-sage">
                         {s.skill.name}
                       </span>
                     ))}
                     {resource.skills.length > 3 && (
                       <span className="badge badge-slate">
                         +{resource.skills.length - 3}
                       </span>
                     )}
                     {resource.skills.length === 0 && <span className="text-xs text-slate italic">None</span>}
                   </div>
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  )
}
