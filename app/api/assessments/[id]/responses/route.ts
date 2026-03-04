import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id, userId: session.user.id },
      include: {
        questions: { orderBy: { questionNumber: "asc" } }
      }
    })
    
    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 })
      
    // Fetch all existing responses for this assessment's questions
    const questionIds = assessment.questions.map((q: {id: string}) => q.id)
    const existingResponses = await prisma.studentResponse.findMany({
      where: { questionId: { in: questionIds } }
    })
      
    return NextResponse.json({ assessment, responses: existingResponses })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { responses } = await req.json()
    // responses: { studentId: string, questionId: string, correct: boolean }[]

    // Execute bulk upsert (delete then recreate for simplicity in MVP)
    await prisma.$transaction(async (tx: any) => {
      // First, delete existing responses matching these student/question pairs
      for (const res of responses) {
        // Find existing response to delete if it exists (avoids composite key issues for SQLite)
        const existing = await tx.studentResponse.findFirst({
           where: { studentId: res.studentId, questionId: res.questionId }
        })
        if (existing) {
           await tx.studentResponse.delete({ where: { id: existing.id } })
        }
      }
      
      // Then insert new ones
      if (responses.length > 0) {
        await tx.studentResponse.createMany({
          data: responses.map((r: any) => ({
             studentId: r.studentId,
             questionId: r.questionId,
             correct: r.correct,
             response: r.correct ? "1" : "0" // simplified
          }))
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Save failed" }, { status: 500 })
  }
}
