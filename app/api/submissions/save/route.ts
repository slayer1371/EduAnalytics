import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStudentRecommendations } from "@/lib/analytics"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { submissionId, answers, correctOverrides = {} } = await req.json()
    
    if (!submissionId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Fetch the submission and its parent assessment (with correct answers)
    const submission = await prisma.studentAssessment.findUnique({
      where: { id: submissionId },
      include: {
        assessment: {
          include: { questions: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const { studentId, assessment } = submission

    // Helper to remove all spacing and ignore case for robust grading
    const normalizeAnswer = (str: string) => (str || "").replace(/\s+/g, "").toLowerCase()
    
    // 2. Grade the provided answers against the correct answers and prepare DB records
    const studentResponses: any[] = []
    
    for (const question of assessment.questions) {
      // The answers object is keyed by question number (as a string)
      const studentExtractedAnswer = answers[String(question.questionNumber)]
      
      let isCorrect = false
      if (correctOverrides[String(question.questionNumber)] !== undefined) {
        // Teacher manually overrode this question's grade
        isCorrect = correctOverrides[String(question.questionNumber)]
      } else {
        // Fallback to strict normalized comparison
        isCorrect = studentExtractedAnswer 
          ? normalizeAnswer(studentExtractedAnswer) === normalizeAnswer(question.correctAnswer)
          : false
      }

      studentResponses.push({
        studentId,
        questionId: question.id,
        response: studentExtractedAnswer || "",
        correct: isCorrect
      })
    }

    // 3. Save all responses map to database
    await prisma.$transaction(async (tx) => {
      // Delete any previous responses the student had for these questions to avoid duplicates
      await tx.studentResponse.deleteMany({
        where: { 
          studentId, 
          questionId: { in: assessment.questions.map((q: any) => q.id) } 
        }
      })
      
      // Insert new responses
      await tx.studentResponse.createMany({
        data: studentResponses
      })

      // Mark the submission document as fully graded
      await tx.studentAssessment.update({
        where: { id: submissionId },
        data: { status: "GRADED" }
      })
    })

    // 4. Fire the existing analytics engine!
    // This will generate skill-based recommendations for the student
    await generateStudentRecommendations(studentId)

    return NextResponse.json({ success: true, gradedResponses: studentResponses })
    
  } catch (error) {
    console.error("Failed to save and grade submission:", error)
    return NextResponse.json({ error: "Failed to grade assessment and generate analytics" }, { status: 500 })
  }
}
