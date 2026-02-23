import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id, userId: session.user.id },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' }
        }
      }
    })

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    return NextResponse.json(assessment)
  } catch (error) {
    console.error("Failed to fetch assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
