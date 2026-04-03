import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSummaryAndTakeaways(transcript: string) {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following lecture transcript and provide a summary and key takeaways.
    
    Transcript:
    ${transcript}
    
    Return the response in JSON format:
    {
      "summary": "...",
      "takeaways": [
        { "title": "...", "description": "...", "icon": "bolt | data_exploration | insights | lightbulb" }
      ],
      "confidence": 95
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateQuiz(transcript: string) {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a 5-question multiple choice quiz based on the following lecture transcript.
    
    Transcript:
    ${transcript}
    
    Return the response in JSON format:
    {
      "questions": [
        {
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "...",
          "explanation": "..."
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}
