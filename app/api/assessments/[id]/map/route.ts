import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get an assessment with its questions and their mapped skills
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id, userId: session.user.id },
      include: {
        questions: {
          include: {
            skills: {
              include: { skill: true }
            }
          },
          orderBy: { questionNumber: "asc" }
        }
      }
    })
    
    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(assessment)
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// Update skill mappings for a set of questions
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  try {
    const { mappings } = await req.json()
    // mappings: { questionId: string, skillIds: string[] }[]

    // Verify ownership
    const assessment = await prisma.assessment.findUnique({
      where: { id, userId: session.user.id }
    })
    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Execute updates in a transaction
    await prisma.$transaction(
      mappings.map((m: any) => {
        return prisma.question.update({
          where: { id: m.questionId },
          data: {
            skills: {
              deleteMany: {}, // Clear existing exact-match mappings for this question
              create: m.skillIds.map((skillId: string) => ({
                skill: { connect: { id: skillId } }
              }))
            }
          }
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
