import { GoogleGenAI, Type } from "@google/genai";

interface QuestionSchema {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subject: string;
}

function getGeminiClient(keyString: string): GoogleGenAI {
  if (keyString.startsWith("AIza") || keyString.startsWith("AQ.")) {
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

// Resilient wrapper to handle temporary model availability issues (503), spikes, or 429 quota exhaustion
async function generateContentWithFallback(aiClient: GoogleGenAI, options: {
  contents: any[];
  config: any;
}) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini Engine] Netlify function attempting generation with model: ${model}`);
      const response = await aiClient.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`[Gemini Engine] Netlify model ${model} failed:`, err?.status || err?.code || err?.message || err);
      lastError = err;
      
      const isTemporary = 
        err?.status === "UNAVAILABLE" || 
        err?.code === 503 ||
        err?.message?.includes("503") || 
        err?.message?.includes("UNAVAILABLE") || 
        err?.message?.includes("high demand") ||
        err?.status === "RESOURCE_EXHAUSTED" || 
        err?.code === 429 || 
        err?.message?.includes("429") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("quota");

      if (isTemporary) {
        console.warn(`[Gemini Engine] Temporary serverless function error or high-demand spike. Falling back to next resilient model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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
    const body = JSON.parse(event.body || "{}");
    const { rawText, pdfBase64, category, userApiKey } = body;

    if (!userApiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Custom Gemini API Key not supplied. Please add your Gemini API Key in Settings to enable this AI feature."
        }),
      };
    }

    const ai = getGeminiClient(userApiKey);

    if ((!rawText || !rawText.trim()) && !pdfBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Syllabus/Test raw content or a PDF file is required for extraction." }),
      };
    }

    const streamCategory = category || "UPSC";

    const systemPrompt = `You are an expert EdTech exam papers extractor.
Extract a list of realistic multiple choice questions from the provided textbook notes, syllabus, exam papers, or raw notes.
Ensure each question has exactly 4 options, a correct choice index (0 for Option A, 1 for B, 2 for C, 3 for D), an explanation, and a subject matching study streams.
The target exam category stream is ${streamCategory}.`;

    const userPrompt = `Parse the provided material and extract realistic mock questions.
Output must follow the specified JSON schema.
If the content does not contain explicit options, generate high-quality options, correct indices, and clear conceptual explanations from your knowledge base based on the topics discussed in the material.`;

    const contents: any[] = [];
    if (pdfBase64) {
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      });
      contents.push(`${userPrompt}\n\nPlease parse this attached PDF document to generate questions.`);
    } else {
      contents.push(`${userPrompt}\n\nText to parse:\n"""\n${rawText}\n"""`);
    }

    const response = await generateContentWithFallback(ai, {
      contents: contents,
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
