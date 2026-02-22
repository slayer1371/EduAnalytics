import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Used to get the groups and students for the data entry table
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const groups = await prisma.studentGroup.findMany({
    where: { userId: session.user.id },
    include: { students: true },
    orderBy: { name: "asc" }
  })
  
  return NextResponse.json(groups)
}

// Ensure the user has at least one default group and student for MVP
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const count = await prisma.studentGroup.count({ where: { userId: session.user.id } })
  if (count === 0) {
    const group = await prisma.studentGroup.create({
      data: {
        name: "Homeroom",
        userId: session.user.id,
        students: {
          create: [
            { name: "Alice Johnson" },
            { name: "Bob Smith" },
            { name: "Charlie Davis" }
          ]
        }
      },
      include: { students: true }
    })
    return NextResponse.json([group])
  }
  
  return NextResponse.json({ success: true })
}
