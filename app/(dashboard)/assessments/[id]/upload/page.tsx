"use client"

import { useState, use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UploadSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: assessmentId } = use(params)
  
  const [studentId, setStudentId] = useState("")
  const [students, setStudents] = useState<{id: string, name: string}[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/students")
        if (res.ok) {
          const data = await res.json()
          const allStudents = data.flatMap((g: any) => g.students || [])
          setStudents(allStudents)
        }
      } catch (err) {
        console.error("Failed to load students", err)
      } finally {
        setIsLoadingStudents(false)
      }
    }
    fetchStudents()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !studentId) {
      setError("Please select a student and a file.")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("assessmentId", assessmentId)
      formData.append("studentId", studentId)

      const res = await fetch("/api/submissions/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Upload failed")

      // Redirect to the verification UI and pass the submission DB ID
      // You could also pass the `data.aiExtraction` in the URL or via a global store,
      // but typically we'd save it temporarily to the DB or just pass via query params for MVP
      const encodedJSON = encodeURIComponent(JSON.stringify(data.aiExtraction))
      const encodedUrl = encodeURIComponent(data.scanImageUrl)
      router.push(`/assessments/${assessmentId}/verify?sub=${data.submissionId}&ai=${encodedJSON}&img=${encodedUrl}`)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border mt-8">
      <h1 className="text-2xl font-bold mb-6">Upload Student Submission</h1>
      
      <form onSubmit={handleUpload} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
           {isLoadingStudents ? (
             <div className="text-sm text-gray-500 py-2">Loading students...</div>
           ) : (
             <select
               value={studentId}
               onChange={(e) => setStudentId(e.target.value)}
               className="w-full px-3 py-2 border rounded-md bg-white"
               required
             >
               <option value="" disabled>Select a student</option>
               {students.map((student) => (
                 <option key={student.id} value={student.id}>
                   {student.name}
                 </option>
               ))}
             </select>
           )}
           <p className="text-xs text-gray-500 mt-1">Select the student whose submission you are uploading.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Worksheet Image</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4出0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                  <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" required />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
          {file && <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isUploading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isUploading ? "Extracting Answers via AI..." : "Upload & Analyze"}
        </button>
      </form>
    </div>
  )
}
