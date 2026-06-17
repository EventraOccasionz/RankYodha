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
    // If it's a token (e.g. starting with AQ. or ya29.), pass it securely as a Bearer Token
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

// Initialize GoogleGenAI securely on the server-side only
const apiKeyEnv = process.env.GEMINI_API_KEY;
const ai = apiKeyEnv ? getGeminiClient(apiKeyEnv) : null;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Admin API: Parse questions using Gemini AI (PDF to CBT Converter)
app.post("/api/gemini/parse-test", async (req, res) => {
  try {
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: "GEMINI_API_KEY is not configured in the system environment.",
        mockData: [
          {
            questionText: "Sample Extracted Question: Which layer of the atmosphere contains the ozone layer?",
            options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"],
            correctOptionIndex: 1,
            explanation: "The ozone layer is a region of Earth's stratosphere that absorbs most of the Sun's ultraviolet radiation.",
            subject: "Geography / Environment"
          }
        ]
      });
    }

    const { rawText, category } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Syllabus/Test raw content is required for extraction." });
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
