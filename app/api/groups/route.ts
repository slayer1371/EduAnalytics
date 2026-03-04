import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "Group name is required" }, { status: 400 })

    const group = await prisma.studentGroup.create({
      data: {
        name,
        userId: session.user.id
      }
    })

    return NextResponse.json(group)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create group" }, { status: 500 })
  }
}
