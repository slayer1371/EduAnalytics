import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { extractHandwrittenAnswers } from "@/lib/vision"
import { put } from "@vercel/blob"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const studentId = formData.get("studentId") as string
    const assessmentId = formData.get("assessmentId") as string

    if (!file || !studentId || !assessmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")
    const mimeType = file.type

    // Save the file to Vercel Blob instead of local filesystem
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `uploaded-${Date.now()}-${safeFilename}`
    
    // Upload the file directly to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: mimeType,
    })

    // Extract answers directly from the image using Gemini 2.0 Flash Vision
    const parsedAnswers = await extractHandwrittenAnswers(base64Image, mimeType)

    // Ensure the student exists and is part of the teacher's group
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { group: true }
    })

    if (!student || student.group.userId !== session.user.id) {
       return NextResponse.json({ error: "Student not found or unauthorized" }, { status: 403 })
    }

    // Save the record using the Vercel Blob URL
    const scanUrlPlaceholder = blob.url
    const submission = await prisma.studentAssessment.create({
      data: {
        studentId,
        assessmentId,
        scanImageUrl: scanUrlPlaceholder,
        status: "PENDING_REVIEW"
      }
    })

    // Return both the created DB record and the AI's best guess JSON for the UI to review
    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      aiExtraction: parsedAnswers,
      scanImageUrl: scanUrlPlaceholder
    })
    
  } catch (error) {
    console.error("Upload & OCR failed:", error)
    return NextResponse.json({ error: "Failed to process the assessment image" }, { status: 500 })
  }
}
