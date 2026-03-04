"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ocr } from "@/lib/ocr"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { Upload, FileText, CheckCircle2, ArrowRight, Loader2 } from "lucide-react"

const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false })
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false })

type ParsedQuestion = {
  number: number
  text: string
  answer: string
}

export default function UploadAssessmentPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [step, setStep] = useState<"UPLOAD" | "OCR" | "REVIEW">("UPLOAD")
  
  // OCR Progress
  const [processingPage, setProcessingPage] = useState(0)
  
  // Review Mode Editing
  const [title, setTitle] = useState("New Assessment")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`
    })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const startOcrProcessing = async () => {
    setStep("OCR")
    setProcessingPage(1)
    
    await ocr.init()
    
    let fullText = ""
    for (let i = 1; i <= (numPages || 1); i++) {
      setProcessingPage(i)
      
      let canvas: HTMLCanvasElement | null = null
      
      for (let attempt = 0; attempt < 20; attempt++) {
        canvas = document.querySelector(`.react-pdf__Page[data-page-number="${i}"] canvas`) as HTMLCanvasElement
        if (canvas) break
        await new Promise(r => setTimeout(r, 500)) 
      }
      
      if (canvas) {
        try {
          const text = await ocr.recognizeImage(canvas)
          fullText += text + "\n\n"
        } catch (e) {
          console.error("OCR failed for page", i, e)
        }
      } else {
        console.warn(`Could not find canvas for page ${i} after waiting`)
      }
    }
    
    await parseTextToQuestions(fullText)
    setStep("REVIEW")
  }

  const parseTextToQuestions = async (text: string) => {
    console.log("Raw OCR Text Extracted:", text)
    
    if (!text || text.trim().length === 0) {
       setQuestions([{ number: 1, text: "No text was detected on the page.", answer: "" }])
       setStep("REVIEW")
       return
    }

    try {
      const res = await fetch("/api/ai/parse-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })

      if (!res.ok) throw new Error("AI Parsing failed")

      const data = await res.json()
      
      if (data.questions && data.questions.length > 0) {
         setQuestions(data.questions)
      } else {
         throw new Error("AI returned empty array")
      }
    } catch (e) {
      console.error("AI Extractor failed, using fallback", e)
      setQuestions([
        {
          number: 1,
          text: text.trim().slice(0, 1000) + (text.length > 1000 ? "..." : ""),
          answer: ""
        }
      ])
    }
    
    setStep("REVIEW")
  }

  const updateQuestion = (index: number, field: keyof ParsedQuestion, value: string | number) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          questions,
          rawPdfUrl: "/local-file.pdf"
        })
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-serif text-3xl text-ink mb-2">Ingest Assessment</h1>
        <p className="text-slate">Upload an assessment PDF to automatically extract questions and answers.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center space-x-4 mb-8 animate-fade-up-delay-1">
        <div className={`flex items-center ${step === "UPLOAD" ? "text-amber" : "text-sage"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-3 text-sm font-bold ${step === "UPLOAD" ? "border-amber bg-amber-muted" : "border-sage bg-sage-muted"}`}>
            {step === "UPLOAD" ? "1" : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <span className="font-semibold text-ink text-sm">Upload PDF</span>
        </div>
        <div className="h-px bg-border flex-1" />
        <div className={`flex items-center ${step === "OCR" ? "text-amber" : step === "REVIEW" ? "text-sage" : "text-slate"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-3 text-sm font-bold ${step === "OCR" ? "border-amber bg-amber-muted" : step === "REVIEW" ? "border-sage bg-sage-muted" : "border-border bg-parchment"}`}>
            {step === "REVIEW" ? <CheckCircle2 className="w-5 h-5" /> : "2"}
          </div>
          <span className="font-semibold text-sm">OCR Processing</span>
        </div>
        <div className="h-px bg-border flex-1" />
        <div className={`flex items-center ${step === "REVIEW" ? "text-amber" : "text-slate"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-3 text-sm font-bold ${step === "REVIEW" ? "border-amber bg-amber-muted" : "border-border bg-parchment"}`}>
            3
          </div>
          <span className="font-semibold text-sm">Manual Review</span>
        </div>
      </div>

      {/* Render the PDF pages off-screen */}
      {file && (step === "UPLOAD" || step === "OCR") && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, zIndex: -1 }}>
           <Document file={file} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
              {Array.from(new Array(numPages || 0), (_, index) => (
                <Page key={`page_${index + 1}`} pageNumber={index + 1} renderTextLayer={false} renderAnnotationLayer={false} scale={2} />
              ))}
           </Document>
        </div>
      )}

      {step === "UPLOAD" && (
        <div className="card p-10 flex flex-col items-center justify-center text-center border-dashed border-2 border-border-strong animate-fade-up-delay-1" style={{ borderStyle: 'dashed' }}>
          <div className="w-16 h-16 bg-amber-muted rounded-full flex items-center justify-center mb-6">
            <Upload className="w-8 h-8" style={{ color: '#b07d1e' }} />
          </div>
          <h3 className="font-serif text-xl text-ink mb-2">Drag & Drop PDF</h3>
          <p className="text-slate mb-8 max-w-sm text-sm">Upload a printed or clearly handwritten assessment to begin extraction.</p>
          
          <label className="btn-secondary relative cursor-pointer">
            <span>Browse Files</span>
            <input type="file" accept="application/pdf" className="sr-only" onChange={handleFileChange} />
          </label>

          {file && (
            <div className="mt-8 p-4 card w-full max-w-md flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <FileText className="text-amber" />
                <span className="text-ink truncate text-sm font-medium">{file.name}</span>
              </div>

              <button 
                onClick={startOcrProcessing}
                className="btn-primary ml-4 text-sm"
               >
                 <span>Process</span>
                 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {step === "OCR" && (
        <div className="card-elevated p-16 flex flex-col items-center justify-center text-center animate-fade-up">
          <Loader2 className="w-14 h-14 text-amber animate-spin mb-8" />
          <h3 className="font-serif text-2xl text-ink mb-4">Extracting Text via Tesseract.js</h3>
          <p className="text-slate mb-6">Analyzing document structure and recognizing characters...</p>
          <div className="w-full max-w-md bg-parchment rounded-full h-2 mb-4 overflow-hidden">
            <div 
              className="bg-amber h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(processingPage / Math.max(numPages, 1)) * 100}%` }}
            />
          </div>
          <p className="text-sm font-mono text-slate">Processing page {processingPage} of {numPages || 1}</p>
        </div>
      )}

      {step === "REVIEW" && (
        <div className="space-y-6 animate-fade-up">
          <div className="card p-6">
            <h3 className="font-serif text-lg text-ink mb-4">Assessment Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1.5">Assessment Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1.5">Date Administered</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="card accent-left-sage p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-lg text-ink flex items-center">
                <CheckCircle2 className="w-5 h-5 text-sage mr-2" />
                Review Extracted Questions
              </h3>
              <p className="text-sm text-slate">Please correct any OCR errors below</p>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-white flex gap-4">
                  <div className="w-14 shrink-0">
                    <label className="block text-[10px] font-semibold text-slate uppercase tracking-wider mb-1">No.</label>
                    <input 
                      type="number" 
                      value={q.number}
                      onChange={e => updateQuestion(idx, 'number', parseInt(e.target.value))}
                      className="input-field text-center !p-2"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate uppercase tracking-wider mb-1">Question Text</label>
                      <textarea 
                        value={q.text}
                        onChange={e => updateQuestion(idx, 'text', e.target.value)}
                        rows={2}
                        className="input-field resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate uppercase tracking-wider mb-1">Expected Answer (Optional)</label>
                      <input 
                        type="text" 
                        value={q.answer}
                        onChange={e => updateQuestion(idx, 'answer', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
               <button 
                onClick={() => setQuestions([...questions, { number: questions.length + 1, text: "New Question", answer: "" }])}
                className="text-sm font-medium transition-colors hover:text-amber" style={{ color: '#b07d1e' }}
               >
                 + Add Missing Question
               </button>
               
               <button 
                 onClick={handleSave}
                 disabled={saving}
                 className="btn-sage px-8 py-3 font-bold flex items-center space-x-2"
               >
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                 <span>Save Assessment</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
