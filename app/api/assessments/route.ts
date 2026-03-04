import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const assessments = await prisma.assessment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } }
    }
  })

  return NextResponse.json(assessments)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, date, questions, rawPdfUrl } = await req.json()

    // Create the assessment and its questions in a transaction
    const assessment = await prisma.assessment.create({
      data: {
        title,
        date: new Date(date),
        userId: session.user.id,
        rawPdfUrl: rawPdfUrl || "",
        questions: {
          create: questions.map((q: { number: number, text: string, answer?: string }) => ({
            questionNumber: q.number,
            questionText: q.text,
            correctAnswer: q.answer || ""
          }))
        }
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    console.error("Failed to save assessment", error)
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 })
  }
}
