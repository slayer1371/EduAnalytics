import { prisma } from "./prisma"

export async function generateStudentRecommendations(studentId: string) {
  // 1. Fetch all responses for the student, including the questions and their mapped skills
  const responses = await prisma.studentResponse.findMany({
    where: { studentId },
    include: {
      question: {
        include: {
          skills: { include: { skill: true } }
        }
      }
    }
  })

  // 2. Aggregate performance by skill
  const skillStats: Record<string, { total: number; correct: number; skill: any }> = {}
  
  responses.forEach(r => {
    r.question.skills.forEach(qs => {
      const skillId = qs.skillId
      const skill = qs.skill
      
      if (!skillStats[skillId]) {
        skillStats[skillId] = { total: 0, correct: 0, skill }
      }
      
      skillStats[skillId].total += 1
      if (r.correct) skillStats[skillId].correct += 1
    })
  })

  // 3. Calculate mastery and assign recommendations
  const newRecommendations: any[] = []
  
  for (const [skillId, stats] of Object.entries(skillStats)) {
    const masteryPercent = (stats.correct / stats.total) * 100
    
    // Only generate recommendations for skills below 80%
    if (masteryPercent < 80) {
      // Find resources tied to this skill
      const linkedResources = await prisma.skillResource.findMany({
        where: { skillId },
        include: { resource: true }
      })

      // Generate a recommendation linking the student to each resource
      linkedResources.forEach(lr => {
        // Calculate a "priority score" (lower mastery = higher score)
        const priorityScore = 100 - masteryPercent
        
        newRecommendations.push({
          studentId,
          skillId,
          resourceId: lr.resourceId,
          score: priorityScore,
        })
      })
    }
  }

  // 4. Save to database (Upsert / Replace for simplicity)
  await prisma.$transaction(async (tx) => {
    // Delete old recommendations for these skills
    await tx.recommendation.deleteMany({
      where: { studentId, skillId: { in: Object.keys(skillStats) } }
    })
    
    // Insert new ones
    if (newRecommendations.length > 0) {
      await tx.recommendation.createMany({
        data: newRecommendations
      })
    }
  })

  return newRecommendations
}
