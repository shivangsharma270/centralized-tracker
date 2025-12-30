
import { GoogleGenAI, Type } from "@google/genai";
import { Concern } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateConcernSummary(concerns: Concern[]) {
  const dataString = JSON.stringify(concerns.slice(0, 50)); // Limit to first 50 for token management

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following concern tracking data and provide a consolidated summary. 
    Focus on trends, urgent issues, and overall health of the project.
    
    Data: ${dataString}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING, description: "A high-level paragraph overview of the concerns." },
          keyInsights: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of 3-5 critical insights or patterns found in the data."
          },
          recommendations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Actionable recommendations to resolve open concerns."
          }
        },
        required: ["overview", "keyInsights", "recommendations"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
}
