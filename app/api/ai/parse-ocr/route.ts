import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { text } = await req.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing OCR text input" }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    // We explicitly ask the model to return JSON that matches our expected ParsedQuestion schema.
    // It should handle all the messy formatting, multiple choice extractions, and answer keys.
    const prompt = `
      You are an expert grading assistant. I am giving you the raw, messy OCR text dump of a teacher's assessment PDF.
      
      Your task is to extract all the individual questions, their multiple-choice options (if any), and the correct answer if an answer key is provided.
      Ignore random headers, page numbers, or instructional filler text.

      Return the data EXACTLY as a JSON array of objects with the following schema:
      [
        {
          "number": 1, // The question number
          "text": "The full text of the question, including any A/B/C/D multiple choice options nicely formatted on newlines.",
          "answer": "The correct answer to the question (e.g., 'B' or '44'). If no answer key is found, leave this as an empty string."
        }
      ]

      Here is the raw OCR text:
      ---
      ${text}
      ---
      
      Output exactly and only the raw JSON array. Do not wrap it in markdown codeblocks.
    `

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    })

    const resultText = response.text
    if (!resultText) {
      throw new Error("AI returned no text")
    }

    // Safety fallback in case the model returns markdown ticks despite instructions
    const cleanJson = resultText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "").trim()
    const questions = JSON.parse(cleanJson)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("AI parsing error:", error)
    return NextResponse.json({ error: "Failed to parse questions intelligently" }, { status: 500 })
  }
}
