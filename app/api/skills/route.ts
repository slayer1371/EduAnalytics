import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const skills = await prisma.skill.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" }
  })
  
  return NextResponse.json(skills)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name, subject, gradeLevel, description } = await req.json()
    
    if (!name || !subject || !gradeLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const skill = await prisma.skill.create({
      data: { name, subject, gradeLevel, description: description || "", userId: session.user.id }
    })
    
    return NextResponse.json(skill, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 })
  }
}
