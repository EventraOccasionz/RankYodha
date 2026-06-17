import { GoogleGenAI, Type } from "@google/genai";

interface QuestionSchema {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subject: string;
}

function getGeminiClient(keyString: string): GoogleGenAI {
  if (keyString.startsWith("AIzaSy")) {
    return new GoogleGenAI({
      apiKey: keyString,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    // If it's an OAuth access token, pass it securely in the Authorization Header
    return new GoogleGenAI({
      apiKey: "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
          "Authorization": `Bearer ${keyString}`,
        },
      },
    });
  }
}

export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Only POST is allowed." }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY is not configured in Netlify's Environment Variables.\n\n" +
                 "To set this securely:\n" +
                 "1. Go to your Netlify Dashboard for this site.\n" +
                 "2. Navigate to 'Site configuration' > 'Environment variables'.\n" +
                 "3. Add a new variable named 'GEMINI_API_KEY'.\n" +
                 "4. Ensure it is marked as 'Secret' so it won't be exposed in logs or UI."
        }),
      };
    }

    const ai = getGeminiClient(apiKey);

    const body = JSON.parse(event.body || "{}");
    const { rawText, category } = body;

    if (!rawText || !rawText.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Syllabus/Test raw content is required for extraction." }),
      };
    }

    const streamCategory = category || "UPSC";

    const systemPrompt = `You are an expert EdTech exam papers extractor.
Extract a list of realistic multiple choice questions from the provided textbook notes, syllabus, or exam transcript text.
Ensure each question has exactly 4 options, a correct choice index (0 for Option A, 1 for B, 2 for C, 3 for D), an explanation, and a subject matching study streams.
The target exam category stream is ${streamCategory}.`;

    const userPrompt = `Parse the following text and extract realistic mock questions.
Output must follow the specified JSON schema.
If the text does not contain explicit options, generate high-quality options, correct indices, and clear conceptual explanations from your knowledge base based on the topics discussed in the text.

Text to parse:
"""
${rawText}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of extracted questions",
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "The single-choice multiple choice question statement." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly four multiple choice options."
              },
              correctOptionIndex: { type: Type.INTEGER, description: "Index of the correct option (0, 1, 2, or 3)." },
              explanation: { type: Type.STRING, description: "Complete educational solution or reference explanation." },
              subject: { type: Type.STRING, description: "Subject topic label, e.g. 'Polity', 'Physics', 'History'." }
            },
            required: ["questionText", "options", "correctOptionIndex", "explanation", "subject"]
          }
        }
      }
    });

    const parsedResult: QuestionSchema[] = JSON.parse(response.text || "[]");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, questions: parsedResult }),
    };

  } catch (error: any) {
    console.error("Netlify Function Gemini Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error?.message || "Internal server error during question extraction.",
        success: false,
      }),
    };
  }
};
