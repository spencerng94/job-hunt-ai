import { GoogleGenAI, Type } from "@google/genai";
import { ApplicationStatus } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface EmailAnalysisResult {
  suggestedStatus: ApplicationStatus | null;
  companyName: string | null;
  isRecruitingEmail: boolean;
  reasoning: string;
}

export interface ExtractedJobDetails {
  companyName: string;
  roleTitle: string;
  jobLink?: string;
  nextInterviewDate?: string;
  status: ApplicationStatus;
}

// Fallback logic for when AI is unavailable
const fallbackExtraction = (emailText: string, subject: string): ExtractedJobDetails => {
  let company = '';
  let role = '';
  
  // Try to extract Company from Subject like "Interview at Google" or "Application for Microsoft"
  const companyMatch = subject.match(/(?:at|for|to)\s+([A-Z][a-zA-Z0-9\s\.]+)/);
  if (companyMatch && companyMatch[1]) {
    company = companyMatch[1].trim();
    // Clean up if it grabbed too much
    if (company.includes(' - ')) company = company.split(' - ')[0];
  } else {
    // If no preposition, check if subject starts with company? Riskier. 
    // Let's try splitting by dash or pipe
    const splitMatch = subject.split(/[-|–]/);
    if (splitMatch.length > 1) {
        // Assume the last part might be the company if short
        const candidate = splitMatch[splitMatch.length - 1].trim();
        if (candidate.length < 30) company = candidate;
    }
  }

  // Try to extract Role
  // Look for "Role:", "Position:" in body
  const roleMatch = emailText.match(/(?:Role|Position|Opening):\s*([^\n\.]+)/i);
  if (roleMatch) {
    role = roleMatch[1].trim();
  } else {
    // Check subject for common role keywords
    const commonRoles = ['Engineer', 'Developer', 'Designer', 'Manager', 'Product', 'Analyst'];
    const subjectWords = subject.split(' ');
    // If subject contains a role word, try to grab the phrase
    if (commonRoles.some(r => subject.includes(r))) {
        // This is a naive heuristic: assume the whole subject part before "at" is the role
        const splitAt = subject.split(/\s(at|for)\s/);
        if (splitAt.length > 0) role = splitAt[0];
    }
  }

  return {
    companyName: company || 'Unknown Company',
    roleTitle: role || 'Unknown Role',
    status: ApplicationStatus.RECRUITER_SCREEN,
    jobLink: ''
  };
};

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
      reasoning: "Analysis failed."
    };
  }
};

export const extractJobDetailsFromEmail = async (emailText: string, subject: string): Promise<ExtractedJobDetails> => {
  // If no API Key, use regex fallback
  if (!process.env.API_KEY) {
    console.log("No API Key - Using Regex Fallback for extraction");
    return fallbackExtraction(emailText, subject);
  }

  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Extract job application details from this email.
        Subject: ${subject}
        Body: ${emailText}

        Extract:
        1. Company Name
        2. Role/Job Title (Infer if not explicit)
        3. Job/Career Link (if found in text)
        4. Next Interview Date (ISO 8601 format if found, e.g. YYYY-MM-DDTHH:MM:SS)
        5. Current Status based on context (default to 'Recruiter Screen' if unsure).
           Valid Statuses: ['Application Submitted', 'Recruiter Screen', 'Technical Phone Screen', 'Hiring Manager', 'Onsite', 'Offer', 'Rejected', 'Withdrawn']
        
        Return JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            roleTitle: { type: Type.STRING },
            jobLink: { type: Type.STRING, nullable: true },
            nextInterviewDate: { type: Type.STRING, nullable: true },
            status: { type: Type.STRING },
          },
          required: ["companyName", "roleTitle", "status"],
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    const result = JSON.parse(text);
    
    // Validate Status
    let status = ApplicationStatus.RECRUITER_SCREEN;
    if (Object.values(ApplicationStatus).includes(result.status as ApplicationStatus)) {
        status = result.status as ApplicationStatus;
    }

    return {
        companyName: result.companyName || "Unknown Company",
        roleTitle: result.roleTitle || "Unknown Role",
        jobLink: result.jobLink || "",
        nextInterviewDate: result.nextInterviewDate || undefined,
        status: status
    };

  } catch (error) {
    console.error("Gemini Extraction Failed:", error);
    // On API error, fallback to regex
    return fallbackExtraction(emailText, subject);
  }
}