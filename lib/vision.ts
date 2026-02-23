import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Extracts student answers from an uploaded assessment image using Gemini 2.0 Flash Vision.
 * 
 * @param imageBase64 The base64 encoded string of the image (without the data URL prefix)
 * @param mimeType The mime type of the image (e.g. 'image/jpeg', 'image/png')
 * @returns A JSON string mapping question numbers to the student's handwritten answers
 */
export async function extractHandwrittenAnswers(imageBase64: string, mimeType: string) {
  if (process.env.MOCK_GEMINI === "true") {
    console.log("[DEV] Mocking Gemini Vision response...");
    // Simulate a slight delay to mimic network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      "1": "2.73;27.3;273;27.3",
      "2": "0.603;0.063;6.03;0.063",
      "3": "6 ounces cereal",
      "4": "3 miles",
      "5": "0.23",
      "6": "96"
    };
  }

  const prompt = `
    You are an expert teacher's assistant scoring a math/general worksheet.
    
    I am providing you an image of a student's completed assessment.
    Your task is to identify every printed question, and extract the student's final written answer for it.
    
    CRITICAL INSTRUCTIONS:
    1. Ignore any scratchpad working out (e.g. long division steps in the margins).
    2. Ignore any teacher markings like red/blue checkmarks, 'corrected' text, or point deductions (e.g. -1/2).
    3. Look for the student's final answer, which might be on an answer line or circled.
    4. If a single question or question number has multiple sub-parts (e.g., multiple fill-in-the-blanks or multiple equations), extract the student's final answer for EVERY part. Join them together using a single semicolon (;) in the order they appear on the page (top to bottom, left to right).

    Return the data EXACTLY as a JSON object, where the key is the question number (e.g. "1", "2", "3") 
    and the value is the student's extracted answer string.

    Example output format:
    {
      "1": "2.73;27.3;273;27.3",
      "2": "0.603;0.063;6.03;0.063",
      "3": "6 ounces cereal"
    }
    
    Output exactly and only the raw JSON object. Do not wrap it in markdown codeblocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using the 2.5 flash model as requested
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("AI returned no text");

    // Clean any markdown if the model hallucinates it despite instructions
    const cleanJson = resultText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Vision OCR Error:", error);
    throw error;
  }
}
