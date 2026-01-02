
import { GoogleGenAI, Type } from "@google/genai";
import { Concern, ProxyConcern, LegalConcern, ImportantThread } from "../types.ts";

export async function generateConcernSummary(concerns: Concern[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataString = JSON.stringify(concerns.slice(0, 50));

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
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
}

export async function generateGlobalExecutiveSummary(
  social: Concern[], 
  proxy: ProxyConcern[], 
  legal: LegalConcern[], 
  important: ImportantThread[]
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const payload = {
    socialCount: social.length,
    proxyCount: proxy.length,
    legalCount: legal.length,
    importantCount: important.length,
    socialSample: social.slice(0, 10).map(i => i['Mail Thread']),
    proxySample: proxy.slice(0, 10).map(i => i['Status']),
    legalSample: legal.slice(0, 10).map(i => i['Subject']),
    importantSample: important.slice(0, 10).map(i => i['Threads Subject']),
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a Senior Operational Director. Analyze the operational health across 4 departments based on this volume and sample data: ${JSON.stringify(payload)}.
    
    Provide an executive summary, a health status (green/amber/red), a short deep-dive for each department, and 3 top priorities.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          statusColor: { type: Type.STRING, description: "Must be 'green', 'amber', or 'red'" },
          departmentalDeepDive: {
            type: Type.OBJECT,
            properties: {
              social: { type: Type.STRING },
              proxy: { type: Type.STRING },
              legal: { type: Type.STRING },
              important: { type: Type.STRING },
            },
            required: ["social", "proxy", "legal", "important"]
          },
          keyPriorities: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["executiveSummary", "statusColor", "departmentalDeepDive", "keyPriorities"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Global AI Error", e);
    return null;
  }
}
