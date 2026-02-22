import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStudentRecommendations } from "@/lib/analytics"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const userId = session.user.id

    // 1. Get high-level counts
    const [stats, groups] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: { select: { assessments: true, groups: true } }
        }
      }),
      prisma.studentGroup.findMany({
        where: { userId },
        include: { students: true }
      })
    ])

    const totalStudents = groups.reduce((acc, sum) => acc + sum.students.length, 0)
    
    // 2. Compute mastery metrics. (In a real app, do this more efficiently or via materialized views)
    const allResponses = await prisma.studentResponse.findMany({
      where: {
        student: { group: { userId } }
      },
      include: {
        question: { include: { skills: { include: { skill: true } } } },
        student: { include: { group: true } }
      }
    })

    const skillMastery: Record<string, { total: number, correct: number, name: string }> = {}
    let totalQs = 0
    let totalCorrects = 0

    allResponses.forEach(r => {
      totalQs++
      if (r.correct) totalCorrects++
      
      r.question.skills.forEach(qs => {
        const id = qs.skillId
        if (!skillMastery[id]) skillMastery[id] = { total: 0, correct: 0, name: qs.skill.name }
        skillMastery[id].total++
        if (r.correct) skillMastery[id].correct++
      })
    })

    const overallMastery = totalQs > 0 ? (totalCorrects / totalQs) * 100 : 0
    
    // Format for charts
    const chartData = Object.values(skillMastery)
      .map(s => ({
        name: s.name,
        mastery: Math.round((s.correct / s.total) * 100),
      }))
      .sort((a, b) => a.mastery - b.mastery) // Lowest mastery first (to spot gaps)

    // 3. Regen and fetch recent recommendations 
    // (For MVP demo, we'll regen on fetch to keep data fresh, normally done on async worker)
    const allStudentIds = groups.flatMap(g => g.students.map(s => s.id))
    await Promise.all(allStudentIds.map(sid => generateStudentRecommendations(sid)))
    
    const recentRecommendations = await prisma.recommendation.findMany({
      where: { student: { group: { userId } } },
      orderBy: { score: 'desc' }, // Critical gaps first
      take: 10,
      include: {
        student: true,
        skill: true,
        resource: true
      }
    })

    return NextResponse.json({
      summary: {
        totalAssessments: stats?._count.assessments || 0,
        totalStudents,
        overallMastery: Math.round(overallMastery),
        criticalGaps: recentRecommendations.filter(r => r.score > 20).length // proxy for < 80% mastery
      },
      skillCharts: chartData,
      recentRecommendations
    })

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
