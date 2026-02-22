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
    // 1. Get student basic info
    const student = await prisma.student.findUnique({
      where: { id },
      include: { group: true }
    })
    
    if (!student || student.group.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    // 2. Aggregate skill mastery for this specific student
    const responses = await prisma.studentResponse.findMany({
      where: { studentId: id },
      include: {
        question: {
          include: {
            skills: { include: { skill: true } },
            assessment: { select: { title: true, date: true } }
          }
        },
      },
    })

    const skillStats: Record<string, { total: number, correct: number, name: string, subject: string }> = {}
    let sortedAssessments = new Set()

    responses.forEach((r: any) => {
      sortedAssessments.add(r.question.assessment.title)
      r.question.skills.forEach((qs: any) => {
        const sid = qs.skillId
        if (!skillStats[sid]) {
          skillStats[sid] = { total: 0, correct: 0, name: qs.skill.name, subject: qs.skill.subject }
        }
        skillStats[sid].total++
        if (r.correct) skillStats[sid].correct++
      })
    })

    const skillCharts = Object.values(skillStats).map(s => ({
      name: s.name,
      subject: s.subject,
      mastery: Math.round((s.correct / s.total) * 100)
    }))

    // 3. Get active actionable recommendations
    const recommendations = await prisma.recommendation.findMany({
      where: { studentId: id },
      orderBy: { score: 'desc' },
      include: { skill: true, resource: true }
    })

    return NextResponse.json({
        student,
        stats: {
          assessmentsTaken: sortedAssessments.size,
          totalQuestions: responses.length,
          overallScore: responses.length > 0 ? Math.round((responses.filter((r: any) => r.correct).length / responses.length) * 100) : 0
        },
        skillCharts,
        recommendations
    })

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to load student data" }, { status: 500 })
  }
}
