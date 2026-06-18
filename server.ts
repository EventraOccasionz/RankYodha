import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Helper to initialize GoogleGenAI with either standard API Key or Bearer token
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
    // If it's a token (e.g. starting with ya29.), pass it securely as a Bearer Token
    // We pass apiKey: "" to prevent the SDK from appending key query parameter
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
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini Engine] Server attempting generation with model: ${model}`);
      const response = await aiClient.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`[Gemini Engine] Server model ${model} failed:`, err?.status || err?.code || err?.message || err);
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
        console.warn(`[Gemini Engine] Temporary server error or high-demand spike. Falling back to next resilient model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Admin API: Parse questions using Gemini AI (PDF to CBT Converter)
app.post("/api/gemini/parse-test", async (req, res) => {
  try {
    const { rawText, pdfBase64, category, userApiKey } = req.body;

    if (!userApiKey) {
      return res.status(200).json({
        success: false,
        error: "Custom Gemini API Key not supplied. Please add your Gemini API Key in Settings to enable this AI feature."
      });
    }

    const userAi = getGeminiClient(userApiKey);

    if ((!rawText || !rawText.trim()) && !pdfBase64) {
      return res.status(400).json({ error: "Syllabus/Test raw content or a PDF file is required for extraction." });
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

    const response = await generateContentWithFallback(userAi, {
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

    const parsedResult = JSON.parse(response.text || "[]");
    return res.json({ success: true, questions: parsedResult });

  } catch (error: any) {
    console.error("Gemini paper extraction server error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error during question extraction.",
      success: false
    });
  }
});

// Setup Vite Dev server or Production serving
async function setupRouting() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite middleware engaging in DEVELOPMENT mode...");
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteInstance.middlewares);
  } else {
    console.log("Static asset mapping serving in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rank Yodha platform running at http://0.0.0.0:${PORT}`);
  });
}

setupRouting();
