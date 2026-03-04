import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resources = await prisma.resource.findMany({
    where: { userId: session.user.id },
    include: {
      skills: { include: { skill: true } }
    },
    orderBy: { title: "asc" }
  })
  
  return NextResponse.json(resources)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { title, url, type, description, skillIds } = await req.json()
    
    if (!title || !url || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const resource = await prisma.resource.create({
      data: {
        title, url, type, description: description || "", userId: session.user.id,
        skills: {
          create: (skillIds || []).map((id: string) => ({
             skill: { connect: { id } }
          }))
        }
      }
    })
    
    return NextResponse.json(resource, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
  }
}
