"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifySubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: assessmentId } = use(params)
  const searchParams = useSearchParams()
  const submissionId = searchParams.get("sub")
  const aiDataString = searchParams.get("ai")
  const imgUrl = searchParams.get("img")

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (aiDataString) {
      try {
        setAnswers(JSON.parse(decodeURIComponent(aiDataString)))
      } catch (e) {
        console.error("Failed to parse AI data", e)
      }
    }
  }, [aiDataString])

  const handleAnswerChange = (qNum: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qNum]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/submissions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          answers
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")

      alert("Success! Answers verified, graded, and saved to DB. Analytics engine triggered.")
      router.push(`/assessments/${assessmentId}/responses`)
    } catch (e: any) {
      console.error(e)
      alert("Failed to save: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const isPdf = imgUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verify AI Extraction</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Confirm & Save to Analytics"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: The Image/PDF Preview */}
        <div className="bg-gray-100 p-4 rounded-lg border flex flex-col items-center justify-center min-h-[600px] h-full overflow-hidden">
          <p className="text-gray-500 mb-4 font-medium">Original Student Submission</p>
          <div className="w-full h-full min-h-[500px] bg-white border border-gray-300 rounded-md overflow-hidden flex items-center justify-center">
             {imgUrl ? (
               isPdf ? (
                 <object data={imgUrl} type="application/pdf" className="w-full h-full min-h-[600px]">
                   <p>Your browser does not support PDFs. <a href={imgUrl}>Download the PDF</a>.</p>
                 </object>
               ) : (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={imgUrl} alt="Student Submission" className="max-w-full max-h-[800px] object-contain" />
               )
             ) : (
               <span className="text-gray-400">No preview available</span>
             )}
          </div>
        </div>

        {/* Right Side: The Extracted Answers Form */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Student's Answers</h2>
          <p className="text-sm text-gray-500 mb-6">
            Gemini 2.5 Flash Vision has extracted these answers. 
            Review and correct any mistakes made by the AI before saving.
          </p>

          <div className="space-y-4">
            {Object.keys(answers).length === 0 && (
              <p className="text-red-500 italic">No answers found or parsing failed.</p>
            )}

            {Object.entries(answers).map(([qNum, answer]) => (
              <div key={qNum} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Question {qNum}
                </label>
                <input
                  type="text"
                  value={answer as string}
                  onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                  className="px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
