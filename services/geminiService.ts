import { GoogleGenAI, Type } from "@google/genai";
import { ApplicationStatus } from "../types";

// Initialize Gemini Client
// In a real app, strict error handling for missing API key would be here, 
// but we assume it exists per instructions or fails gracefully.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface EmailAnalysisResult {
  suggestedStatus: ApplicationStatus | null;
  companyName: string | null;
  isRecruitingEmail: boolean;
  reasoning: string;
}

export const analyzeEmailWithGemini = async (emailText: string, subject: string): Promise<EmailAnalysisResult> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key available for Gemini.");
    return {
      suggestedStatus: null,
      companyName: null,
      isRecruitingEmail: false,
      reasoning: "API Key missing. Cannot analyze."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Analyze the following email content related to a job search.
        Subject: ${subject}
        Body Snippet: ${emailText}

        Determine:
        1. Is this a recruiting or job application related email?
        2. Can you identify the Company Name?
        3. Does the content suggest a specific status change for an application?
           Map to one of these statuses if applicable: 
           ['Application Submitted', 'Recruiter Screen', 'Technical Phone Screen', 'Hiring Manager', 'Onsite', 'Offer', 'Rejected', 'Withdrawn'].
           If it's just an initial outreach or scheduling, use your best judgment.
        
        Return JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isRecruitingEmail: { type: Type.BOOLEAN },
            companyName: { type: Type.STRING, nullable: true },
            suggestedStatus: { type: Type.STRING, nullable: true },
            reasoning: { type: Type.STRING },
          },
          required: ["isRecruitingEmail", "reasoning"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text);

    // Map string status back to Enum if possible
    let mappedStatus: ApplicationStatus | null = null;
    if (result.suggestedStatus) {
      const statusValues = Object.values(ApplicationStatus);
      if (statusValues.includes(result.suggestedStatus as ApplicationStatus)) {
        mappedStatus = result.suggestedStatus as ApplicationStatus;
      }
    }

    return {
      suggestedStatus: mappedStatus,
      companyName: result.companyName || null,
      isRecruitingEmail: result.isRecruitingEmail,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      suggestedStatus: null,
      companyName: null,
      isRecruitingEmail: false,
      reasoning: "Analysis failed due to an error."
    };
  }
};
