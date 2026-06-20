import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics";
import { DEFAULT_MOCK_TESTS } from "../data/mockTestData";
import { useAdminNotificationToasts } from "../hooks/useAdminNotificationToasts";
import { AdminToastNotificationStack } from "../components/AdminToastNotificationStack";
import { MockTest, Question, PrepVideo } from "../types";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  LineChart, 
  Users, 
  Layers, 
  Activity, 
  DollarSign, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Video,
  Play,
  FileVideo,
  FileText
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

function cleanClientGeminiError(errMsg: string): string {
  if (!errMsg) return "Unknown verification error.";
  try {
    const jsonMatch = errMsg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        const msg = parsed.error.message;
        if (msg.includes("limit: 0")) {
          return "Quota limit 0 exceeded: This model requires standard pay-as-you-go billing or a higher tier key.";
        }
        if (msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED")) {
          return "Rate limit / Quota exceeded on free tier. Please wait a minute before retrying.";
        }
        return msg;
      }
    }
  } catch (e) {
    // ignore parsing error
  }

  if (errMsg.includes("503") || errMsg.includes("Service Unavailable")) {
    return "Service temporarily unavailable (503): High-demand spike in progress. Please retry.";
  }
  if (errMsg.includes("API key not valid") || errMsg.includes("INVALID_ARGUMENT") || errMsg.includes("API key")) {
    return "Invalid API Key: Please verify that you have entered your key correctly.";
  }
  if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("caller does not have permission")) {
    return "Permission Denied: Your API key lacks access or authorized permission scopes.";
  }
  if (errMsg.includes("Quota exceeded") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit")) {
    return "API Quota limit reached. Please wait or check your AI Studio quota allotments.";
  }

  if (errMsg.length > 150) {
    return errMsg.substring(0, 150) + "...";
  }
  return errMsg;
}

async function executeDirectClientParse(rawText: string, pdfBase64: string, category: string, apiKey: string) {
  const streamCategory = category || "UPSC";
  const systemPrompt = `You are an expert EdTech exam papers extractor.
Extract a list of realistic multiple choice questions from the provided textbook notes, syllabus, exam papers, or raw notes.
Ensure each question has exactly 4 options, a correct choice index (0 for Option A, 1 for B, 2 for C, 3 for D), an explanation, and a subject matching study streams.
The target exam category stream is ${streamCategory}.`;

  const userPrompt = `Parse the provided material and extract realistic mock questions.
Output must follow the specified JSON schema.
If the content does not contain explicit options, generate high-quality options, correct indices, and clear conceptual explanations from your knowledge base based on the topics discussed in the material.`;

  const contentsParts: any[] = [];
  if (pdfBase64) {
    contentsParts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64
      }
    });
    contentsParts.push({ text: `${userPrompt}\n\nPlease parse this attached PDF document to generate questions.` });
  } else {
    contentsParts.push({ text: `${userPrompt}\n\nText to parse:\n"""\n${rawText}\n"""` });
  }

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        parts: contentsParts
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        description: "List of extracted questions",
        items: {
          type: "OBJECT",
          properties: {
            questionText: { type: "STRING", description: "The single-choice multiple choice question statement." },
            options: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Exactly four multiple choice options."
            },
            correctOptionIndex: { type: "INTEGER", description: "Index of the correct option (0, 1, 2, or 3)." },
            explanation: { type: "STRING", description: "Complete educational solution or reference explanation." },
            subject: { type: "STRING", description: "Subject topic label, e.g. 'Polity', 'Physics', 'History'." }
          },
          required: ["questionText", "options", "correctOptionIndex", "explanation", "subject"]
        }
      }
    }
  };

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError: any = null;
  let questionsParsed: any[] = [];

  for (const m of modelsToTry) {
    try {
      console.log(`[AdminDashboard] Attempting client fallback generation with model: ${m}`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const textContent = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(textContent);
        if (Array.isArray(parsed)) {
          questionsParsed = parsed;
          return { success: true, questions: questionsParsed };
        }
      } else if (data && data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      } else {
        throw new Error(`HTTP network error: status ${res.status}`);
      }
    } catch (err: any) {
      console.warn(`[AdminDashboard] Client fallback generation with model ${m} failed:`, err?.message || err);
      lastError = err;
    }
  }
  
  const cleanMsg = cleanClientGeminiError(lastError?.message || String(lastError || ""));
  throw new Error(cleanMsg || "All client fallback models failed to extract valid questions.");
}

export default function AdminDashboard({ allPrepVideos, allMockTests, setScreen }: { allPrepVideos?: PrepVideo[], allMockTests?: MockTest[], setScreen?: (screen: any) => void }) {
  const { user, profile, isAdmin } = useAuth();
  
  // Custom uploaded mock tests
  const [customTests, setCustomTests] = useState<MockTest[]>([]);
  const [loadingTests, setLoadingTests] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Live real-time collections and metrics hook
  const {
    totalUsers,
    totalSales,
    todaySales,
    livePapers,
    gatewayHealth,
    gatewayLatency,
    activityLogs,
    revenueDataArray,
    loading: loadingMetrics
  } = useDashboardMetrics();

  // Real-time toast notifications system
  const { toasts, dismissToast } = useAdminNotificationToasts();

  // User BYOK API key state
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [loadingUserKey, setLoadingUserKey] = useState(true);

  // Load user private API key from Firestore or LocalStorage for Sandbox
  useEffect(() => {
    async function fetchUserKey() {
      if (!user) {
        setUserApiKey(null);
        setLoadingUserKey(false);
        return;
      }

      const isSandbox = user.uid.startsWith("virtual_sandbox_");
      if (isSandbox) {
        const storedKey = localStorage.getItem("eliteprep_sandbox_geminiKey") || null;
        setUserApiKey(storedKey);
        setLoadingUserKey(false);
        return;
      }

      try {
        const colName = isAdmin ? "admins" : "users";
        const keyRef = doc(db, colName, user.uid, "private", "geminiKey");
        const snap = await getDoc(keyRef);
        if (snap.exists() && snap.data().apiKey) {
          setUserApiKey(snap.data().apiKey);
        } else {
          setUserApiKey(null);
        }
      } catch (err) {
        console.warn("Could not retrieve user key on Admin mount:", err);
        setUserApiKey(null);
      } finally {
        setLoadingUserKey(false);
      }
    }
    fetchUserKey();
  }, [user, isAdmin]);

  // Form states for new test
  const [testTitle, setTestTitle] = useState("");
  const [testCategory, setTestCategory] = useState("UPSC");
  const [testDuration, setTestDuration] = useState(10);
  const [testDifficulty, setTestDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  
  // Dynamic questions lists inside wizard
  const [formQuestions, setFormQuestions] = useState<Omit<Question, "id">[]>([
    {
      questionText: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      explanation: "",
      subject: "Polity"
    }
  ]);

  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Gemini AI Extraction states
  const [rawPasteText, setRawPasteText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState<string | null>(null);
  const [showConfigHelper, setShowConfigHelper] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState<"text" | "pdf">("text");
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      setFormError("Invalid file type. Please select a valid PDF file.");
      setSelectedPdfFile(null);
      setPdfBase64(null);
      return;
    }
    
    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      setFormError("PDF file size exceeds the 15MB limit. Please upload a smaller document.");
      setSelectedPdfFile(null);
      setPdfBase64(null);
      return;
    }

    setFormError("");
    setExtractionSuccess(null);
    setSelectedPdfFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const resultString = reader.result as string;
      const splitBase64 = resultString.split(",")[1] || resultString;
      setPdfBase64(splitBase64);
    };
    reader.onerror = () => {
      setFormError("Failed to read the PDF file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(true);
  };

  const handleDragLeave = () => {
    setIsDraggingPdf(false);
  };

  const handleDropPdf = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setFormError("Required PDF document format. Please drop a valid PDF file.");
      setSelectedPdfFile(null);
      setPdfBase64(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFormError("PDF size limits exceed 15MB. Please upload a smaller document.");
      setSelectedPdfFile(null);
      setPdfBase64(null);
      return;
    }

    setFormError("");
    setExtractionSuccess(null);
    setSelectedPdfFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const resultString = reader.result as string;
      const splitBase64 = resultString.split(",")[1] || resultString;
      setPdfBase64(splitBase64);
    };
    reader.onerror = () => {
      setFormError("Failed to parse dropped PDF.");
    };
    reader.readAsDataURL(file);
  };

  // Form states for new video
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCategory, setVideoCategory] = useState("UPSC");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("15 mins");
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoSuccess, setVideoSuccess] = useState("");

  // Load custom tests from Firestore /mockTests
  useEffect(() => {
    const path = "mockTests";
    try {
      const unsub = onSnapshot(collection(db, "mockTests"), (snap) => {
        const tests: MockTest[] = [];
        snap.forEach(d => {
          tests.push(d.data() as MockTest);
        });
        setCustomTests(tests);
        setLoadingTests(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });
      return () => unsub();
    } catch (err) {
      console.error("Failed to load custom tests: ", err);
      setLoadingTests(false);
    }
  }, []);

  const handleAddQuestionToForm = () => {
    setFormQuestions(prev => [
      ...prev,
      {
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: "",
        subject: "Polity"
      }
    ]);
  };

  const handleRemoveQuestionFromForm = (index: number) => {
    if (formQuestions.length > 1) {
      setFormQuestions(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const updateQuestionText = (index: number, val: string) => {
    setFormQuestions(prev => {
      const updated = [...prev];
      updated[index].questionText = val;
      return updated;
    });
  };

  const updateOptionText = (qIndex: number, oIndex: number, val: string) => {
    setFormQuestions(prev => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[oIndex] = val;
      updated[qIndex].options = opts;
      return updated;
    });
  };

  const updateCorrectIdx = (qIndex: number, val: number) => {
    setFormQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].correctOptionIndex = val;
      return updated;
    });
  };

  const updateSubjectText = (qIndex: number, val: string) => {
    setFormQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].subject = val;
      return updated;
    });
  };

  const updateExplanationText = (qIndex: number, val: string) => {
    setFormQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].explanation = val;
      return updated;
    });
  };

  const handleSaveMockTest = async () => {
    // Basic validation
    if (!testTitle.trim()) {
      setFormError("Test Title is required!");
      return;
    }

    for (let i = 0; i < formQuestions.length; i++) {
      const q = formQuestions[i];
      if (!q.questionText.trim()) {
        setFormError(`Question #${i + 1} is empty!`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setFormError(`Option ${String.fromCharCode(65 + j)} for Question #${i + 1} is empty!`);
          return;
        }
      }
    }

    setFormError("");
    setIsSaving(true);

    try {
      const compiledQuestions: Question[] = formQuestions.map((q, idx) => ({
        id: `custom_q_${Date.now()}_${idx}`,
        ...q
      }));

      const newTestId = `custom_test_${Date.now()}`;
      const mockTestPayload: MockTest = {
        testId: newTestId,
        title: testTitle,
        category: testCategory,
        questionsCount: compiledQuestions.length,
        durationMinutes: testDuration,
        difficulty: testDifficulty,
        questions: compiledQuestions,
        createdAt: new Date().toISOString()
      };

      const path = `mockTests/${newTestId}`;
      await setDoc(doc(db, "mockTests", newTestId), mockTestPayload);

      // Reset modal state
      setIsUploadModalOpen(false);
      setTestTitle("");
      setTestCategory("UPSC");
      setTestDuration(10);
      setTestDifficulty("Medium");
      setFormQuestions([
        {
          questionText: "",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
          explanation: "",
          subject: "Polity"
        }
      ]);

    } catch (err) {
      console.error("Error saving mock test: ", err);
      setFormError("Unauthorized! Only verified Firestore Administrators can write test assets.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIExtractQuestions = async () => {
    if (extractionMethod === "text" && !rawPasteText.trim()) {
      setFormError("Please enter some text, book transcripts, syllabus details, or raw questions to analyze.");
      return;
    }
    if (extractionMethod === "pdf" && !pdfBase64) {
      setFormError("Please select or drop a valid PDF file to analyze.");
      return;
    }

    setFormError("");
    setExtractionSuccess(null);
    setIsExtracting(true);
    try {
      if (!user) {
        throw new Error("You must be authenticated to use Gemini AI extraction.");
      }

      // Fetch the user's private Gemini API key with dynamic collection support & Sandbox fallback
      let customApiKey = "";
      const isSandbox = user.uid.startsWith("virtual_sandbox_");
      if (isSandbox) {
        customApiKey = localStorage.getItem("eliteprep_sandbox_geminiKey") || "";
      } else {
        const colName = isAdmin ? "admins" : "users";
        const keyRef = doc(db, colName, user.uid, "private", "geminiKey");
        const snap = await getDoc(keyRef);
        if (snap.exists() && snap.data().apiKey) {
          customApiKey = snap.data().apiKey;
        }
      }

      if (!customApiKey) {
        throw new Error("Please add your Gemini API key in Settings before using this feature.");
      }

      let data: any = null;
      let usedClientFallback = false;

      try {
        const payload = extractionMethod === "pdf" 
          ? { pdfBase64, category: testCategory, userApiKey: customApiKey }
          : { rawText: rawPasteText, category: testCategory, userApiKey: customApiKey };

        const response = await fetch("/api/gemini/parse-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        if (response.status === 404) {
          console.warn("[AdminDashboard] Backend proxy returned 404 (static hosting). Triggering client-side fallback...");
          usedClientFallback = true;
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            data = await response.json();
          } else {
            const errorText = await response.text();
            throw new Error(errorText || "Server-side JSON parsing failure. Check your backend console logs.");
          }
        }
      } catch (fetchErr) {
        console.warn("[AdminDashboard] Server endpoint inaccessible, attempting direct browser fallback parsing...", fetchErr);
        usedClientFallback = true;
      }

      if (usedClientFallback) {
        data = await executeDirectClientParse(rawPasteText || "", pdfBase64 || "", testCategory, customApiKey);
      }

      if (data && data.success && data.questions && data.questions.length > 0) {
        setFormQuestions(data.questions);
        setExtractionSuccess(`Successfully parsed ${data.questions.length} questions using Gemini AI! Check them below.`);
      } else {
        setFormError(data?.error || "Failed to extract valid questions from raw text.");
      }
    } catch (err: any) {
      console.error("AI Extraction Error:", err);
      let errorMsg = err.message || "Network or server connection error during AI parsing.";
      if (
        errorMsg.includes("UNAUTHENTICATED") || 
        errorMsg.includes("authentication") || 
        errorMsg.includes("401") || 
        errorMsg.includes("access token")
      ) {
        errorMsg = "Authentication failed! The token or API Key provided is either invalid or expired.\n\n" +
                   "💡 TO RESOLVE THIS SEOMLESSLY:\n" +
                   "1. Go to Google AI Studio (aistudio.google.com)\n" +
                   "2. Click 'Get API Key' and create a free key starting with 'AIzaSy'.\n" +
                   "3. Set it as your 'GEMINI_API_KEY' in your Environment Settings.";
      }
      setFormError(errorMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteMockTest = async (targetTestId: string) => {
    const isCustom = targetTestId.startsWith("custom_test_");
    const label = isCustom ? "custom exam" : "default system exam";
    if (window.confirm(`Are you sure you want to delete this ${label}?`)) {
      try {
        if (isCustom) {
          await deleteDoc(doc(db, "mockTests", targetTestId));
        } else {
          await setDoc(doc(db, "deletedAssets", targetTestId), {
            deleted: true,
            deletedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to delete mock asset: ", err);
        alert("Unauthorized! Only verified Firestore Administrators have truncate privileges.");
      }
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const handleUploadPrepVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoError("");
    setVideoSuccess("");

    if (!videoTitle.trim()) {
      setVideoError("Video title is required.");
      return;
    }
    if (!videoUrl.trim()) {
      setVideoError("Video URL is required.");
      return;
    }

    const finalUrl = getEmbedUrl(videoUrl.trim());
    const videoId = "custom_video_" + Date.now();

    setVideoSaving(true);
    const path = "prepVideos";
    try {
      const payload: PrepVideo = {
        videoId,
        title: videoTitle.trim(),
        description: videoDescription.trim() || "Free video lecture for exam prep.",
        category: videoCategory,
        videoUrl: finalUrl,
        durationText: videoDuration.trim() || "15 mins",
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "prepVideos", videoId), payload);
      setVideoSuccess("Prep video successfully published to Firestore and active on Home tab!");
      setVideoTitle("");
      setVideoDescription("");
      setVideoUrl("");
      setVideoDuration("15 mins");
    } catch (err: any) {
      console.warn("Firestore Error uploading prep video: ", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `${path}/${videoId}`);
      } catch (innerErr: any) {
        setVideoError(innerErr.message || "Failed to save video.");
      }
    } finally {
      setVideoSaving(false);
    }
  };

  const handleDeletePrepVideo = async (targetVideoId: string) => {
    const isCustom = targetVideoId.startsWith("custom_video_");
    const label = isCustom ? "custom study video" : "default system video";
    if (window.confirm(`Are you sure you want to delete this ${label}?`)) {
      try {
        if (isCustom) {
          await deleteDoc(doc(db, "prepVideos", targetVideoId));
        } else {
          await setDoc(doc(db, "deletedAssets", targetVideoId), {
            deleted: true,
            deletedAt: new Date().toISOString()
          });
        }
      } catch (err: any) {
        console.warn("Failed to delete prep video: ", err);
        try {
          handleFirestoreError(err, OperationType.DELETE, `prepVideos/${targetVideoId}`);
        } catch (innerErr: any) {
          alert("Error: " + innerErr.message);
        }
      }
    }
  };

  const handleAutofillVideo = () => {
    const choices = [
      {
        title: "UPSC Indian Polity Crash Course: Fundamental Rights",
        desc: "High yield visual breakdown of Article 14 to Article 32 including supreme court case references.",
        url: "https://www.youtube.com/watch?v=a9rZ9qQvC9o",
        duration: "45 mins"
      },
      {
        title: "IIT JEE Advanced Physics: Rotational Mechanics Essentials",
        desc: "Learn critical rolling motion, angular momentum equations, and moment of inertia rules.",
        url: "https://www.youtube.com/watch?v=5-97wX1rT6I",
        duration: "58 mins"
      },
      {
        title: "NCERT Cell Biology Complete Crash Course for NEET Aspirants",
        desc: "Review crucial organelles, cell division cycles, and mitosis/meiosis diagrammatic questions.",
        url: "https://www.youtube.com/watch?v=D3_qXb7GIdU",
        duration: "35 mins"
      }
    ];
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    setVideoTitle(randomChoice.title);
    setVideoDescription(randomChoice.desc);
    setVideoUrl(randomChoice.url);
    setVideoDuration(randomChoice.duration);
  };

  // Dynamically compile real-time revenue array from the metrics hook
  const revenueData = revenueDataArray;

  // Merge pre-loaded local mocks with custom uploaded Firestore mocks (using filtered list from props)
  const allAvailableMocks = allMockTests || [...DEFAULT_MOCK_TESTS, ...customTests];

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center font-sans" id="admin-access-denied">
        <div className="p-8 bg-[#161616] border border-[#2A2A2A] rounded-2xl shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-[#2A1415] text-[#FF4D4F] rounded-full flex items-center justify-center mb-6 border border-[#FF4D4F]/20">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Access Denied</h2>
          <p className="text-slate-400 text-xs mb-8 leading-relaxed">
            Unauthorized access. Only verified ElitePrep system administrators have clearance to view this configuration console.
          </p>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-t border-[#2A2A2A] pt-4 w-full">
            Security Clearance Code: 403_UNAUTHORIZED
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-slate-100 min-h-screen" id="admin-dashboard-screen">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-none">
              ElitePrep Admin Panel
            </h1>
            <span className="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> SYSTEM OPERATOR
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Configure examination syllabus banks, monitor active subscriptions revenue, and manage system assets.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-sans font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Upload Mock Test</span>
        </button>
      </div>

      {/* Admin stats widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 transition-all hover:border-slate-700">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none mb-1">TOTAL USERS</p>
            <p className="text-xl font-extrabold text-white">{totalUsers.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tight mt-0.5">Profiles count</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 transition-all hover:border-slate-700">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none mb-1">TOTAL REVENUE</p>
            <p className="text-xl font-extrabold text-emerald-400">₹{totalSales.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tight mt-0.5">Razorpay checkouts</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 transition-all hover:border-slate-700">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none mb-1">TODAY'S REVENUE</p>
            <p className="text-xl font-extrabold text-teal-400">₹{todaySales.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tight mt-0.5">Succeeded today</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 transition-all hover:border-slate-700">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none mb-1">LIVE PAPERS</p>
            <p className="text-xl font-extrabold text-white">{livePapers}</p>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tight mt-0.5">{DEFAULT_MOCK_TESTS.length} Seeded &middot; {customTests.length} Custom</p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 transition-all hover:border-slate-700">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none mb-1">GATEWAY HEALTH</p>
            <p className="text-xl font-extrabold text-emerald-400">{gatewayHealth}</p>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tight mt-0.5">Latency: {gatewayLatency}ms</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Left Column: Revenue trends line charts */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100">
          <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-400" /> Platform Revenue trends (Weekly)
          </h3>
          <div className="w-full h-64 relative" style={{ width: "100%", height: "256px" }}>
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px", fontSize: "12px" }}
                  itemStyle={{ color: "#10b981" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Live activities */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Administration Log
          </h3>

          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {(() => {
              const displayLogs = activityLogs.length > 0 ? activityLogs : [
                {
                  logId: "static_1",
                  userName: "Rahul",
                  type: "profile_created",
                  detail: "Aspirant Rahul signed-in under UPSC",
                  value: 0,
                  timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
                },
                {
                  logId: "static_2",
                  userName: "Suresh",
                  type: "mock_submitted",
                  detail: "Attempt #custom_log registered",
                  value: 0,
                  timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
                },
                {
                  logId: "static_3",
                  userName: "Karan",
                  type: "premium_activated",
                  detail: "UPI checkout success: ₹2999 confirmed",
                  value: 2999,
                  timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString()
                }
              ];

              return displayLogs.slice(0, 15).map((log) => {
                let titleColor = "text-white";
                let titleLabel = "System Interaction";
                
                if (log.type === "profile_created") {
                  titleLabel = "**Profile Created**";
                  titleColor = "text-white";
                } else if (log.type === "mock_submitted") {
                  titleLabel = "**Mock Submitted**";
                  titleColor = "text-yellow-400";
                } else if (log.type === "premium_activated") {
                  titleLabel = "**Premium Activated**";
                  titleColor = "text-purple-400 font-extrabold";
                }

                const getAgoText = (isoStr: string) => {
                  try {
                    const diffMs = Date.now() - new Date(isoStr).getTime();
                    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                    if (diffMins === 0) return "just now";
                    if (diffMins === 1) return "1 minute ago";
                    if (diffMins < 60) return `${diffMins} minutes ago`;
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours === 1) return "1 hour ago";
                    if (diffHours < 24) return `${diffHours} hours ago`;
                    return new Date(isoStr).toLocaleDateString();
                  } catch {
                    return "some time ago";
                  }
                };

                return (
                  <div key={log.logId} className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 hover:bg-slate-900/60 transition-all duration-200">
                    <p className={`text-xs ${titleColor} leading-tight font-sans`}>{titleLabel}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{log.detail}</p>
                    <span className="text-[9px] font-mono text-slate-550 uppercase">{getAgoText(log.timestamp)}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

      </div>

      {/* CRUD Test Syllabus list */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 font-sans">
        <h3 className="text-lg font-bold text-white mb-1">Syllabus Test Assets (CRUD)</h3>
        <p className="text-xs text-slate-500 mb-6 font-mono uppercase tracking-tight">Add or truncate mock exams dynamically on Firestore</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Exam ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Source Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {allAvailableMocks.map((mock) => {
                const isCustom = mock.testId.startsWith("custom_test");
                return (
                  <tr key={mock.testId} className="hover:bg-slate-950/10">
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">{mock.testId.substring(0, 15)}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-950 text-teal-400 px-2 py-0.5 rounded border border-teal-500/10 font-mono text-[10px]">
                        {mock.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">{mock.title}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono font-bold">{mock.questionsCount} items</td>
                    <td className="py-3.5 px-4 text-slate-400">{mock.difficulty}</td>
                    <td className="py-3.5 px-4">
                      {isCustom ? (
                        <span className="text-emerald-400 text-[10px] font-mono leading-none">&bull; FIRESTORE LIVE</span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-mono leading-none">&bull; SYSTEM LOCAL</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteMockTest(mock.testId)}
                        className="p-1 px-2.2 bg-red-950/20 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-red-500/10 rounded font-mono text-[10px] uppercase flex items-center gap-1.5 ml-auto cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Truncate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exam Prep videos publisher & management */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 font-sans mt-8" id="admin-prep-videos-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-800 pb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-400" /> Exam Prep Videocasts Publisher (Real-time)
            </h3>
            <p className="text-xs text-slate-400">Add instructional videos and crash courses directly to the home page tab.</p>
          </div>
          <button
            type="button"
            onClick={handleAutofillVideo}
            className="px-4 py-2 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl transition duration-150 uppercase tracking-wider"
          >
            ⚡ Autofill High-res Sample Video
          </button>
        </div>

        {/* Video Upload Form */}
        <form onSubmit={handleUploadPrepVideo} className="bg-slate-950/40 p-5 border border-slate-850/80 rounded-2xl mb-8 space-y-4 text-left">
          {videoError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
              <span>{videoError}</span>
            </div>
          )}
          {videoSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{videoSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Lecture Title *</label>
              <input
                type="text"
                placeholder="e.g. UPSC Prelims Indian Polity - High Yield Topics"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 focus:border-red-500 rounded-xl p-3 text-xs text-white focus:outline-none placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">YouTube Video Link / URL *</label>
              <input
                type="text"
                placeholder="e.g. https://www.youtube.com/watch?v=gU9H6XkGqGg"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 focus:border-red-500 rounded-xl p-3 text-xs text-white focus:outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Exam Category</label>
              <select
                value={videoCategory}
                onChange={(e) => setVideoCategory(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 focus:border-red-500 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
              >
                <option value="UPSC">UPSC (Civil Services)</option>
                <option value="JEE">IIT JEE (Engineering)</option>
                <option value="NEET">NEET (Medical)</option>
                <option value="SSC">SSC (Staff Selection)</option>
                <option value="Banking">Banking (IBPS/SBI)</option>
                <option value="Railways">Railways (RRB)</option>
                <option value="General">General Strategy</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Duration (annotated)</label>
              <input
                type="text"
                placeholder="e.g. 15 mins, 1 hour, 42:15"
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 focus:border-red-500 rounded-xl p-3 text-xs text-white focus:outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Brief description / syllabus outline</label>
            <textarea
              rows={2}
              placeholder="Provide a summary of concepts discussed in the lecture..."
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-red-500 rounded-xl p-3 text-xs text-white focus:outline-none placeholder-slate-600 resize-y"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={videoSaving}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50 transition-all"
            >
              <FileVideo className="w-4 h-4 text-slate-950" />
              <span>{videoSaving ? "Uploading to Firestore..." : "Publish Video Lecture"}</span>
            </button>
          </div>
        </form>

        {/* Existing / active list of videos */}
        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 text-left flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Published Videocast Catalog ({allPrepVideos?.length || 0} active video sessions)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Video ID</th>
                <th className="py-3 px-4">Exam / Category</th>
                <th className="py-3 px-4">Session Title</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Platform Origin</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-left">
              {allPrepVideos?.map((video) => {
                const isCustom = video.videoId.startsWith("custom_video_");
                return (
                  <tr key={video.videoId} className="hover:bg-slate-950/10">
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">{video.videoId.substring(0, 15)}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10 font-mono text-[10px]">
                        {video.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-white font-medium">{video.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-[250px]">{video.description}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{video.durationText}</td>
                    <td className="py-3.5 px-4">
                      {isCustom ? (
                        <span className="text-emerald-400 text-[10px] font-mono leading-none">&bull; FIRESTORE LIVE</span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-mono leading-none">&bull; SYSTEM LOCAL</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePrepVideo(video.videoId)}
                        className="p-1 px-2.2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-red-500/10 rounded font-mono text-[10px] uppercase flex items-center gap-1 ml-auto cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Truncate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Test Wizard Modal Form */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-slate-100">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Syllabus Uploader Wizard
                </h3>
                <p className="text-xs text-slate-400">Publish standard examination papers securely to Firestore.</p>
              </div>

              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {formError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col gap-3 text-rose-400 text-xs text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line leading-relaxed flex-1">{formError}</span>
                  </div>
                  <div className="mt-1 pt-2 border-t border-rose-550/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowConfigHelper(!showConfigHelper)}
                      className="text-[10px] font-mono uppercase bg-rose-950/35 hover:bg-rose-950/60 text-rose-300 border border-rose-500/20 rounded px-2.5 py-1 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      {showConfigHelper ? "Hide Setup Handbook" : "Show Setup Handbook"}
                    </button>
                  </div>
                </div>
              )}
              {/* Collapsible Personal Settings / Gemini key configuration handbook */}
              {(showConfigHelper || !formError) && (
                <div className="p-5 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#FF3B3F]" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Personal API Key Setup Guide</h4>
                    </div>
                    {formError && (
                      <button
                        type="button"
                        onClick={() => setShowConfigHelper(false)}
                        className="text-[10px] font-mono uppercase text-slate-400 hover:text-white"
                      >
                        [ Dismiss ]
                      </button>
                    )}
                  </div>
                  
                  <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                    ElitePrep operates on a Bring-Your-Own-Key model. Your API keys are kept entirely private to you, saved directly to your private profile in cloud storage. No one else has access to them, and they are only invoked directly on demand.
                  </p>

                  <div className="space-y-3 font-sans text-[11px] text-slate-300">
                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-slate-800 text-[#FF3B3F] font-mono font-bold rounded flex items-center justify-center flex-shrink-0">1</span>
                      <p className="leading-relaxed">
                        <strong className="text-white">Get a Standard Developer Key:</strong> Go to Google AI Studio at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#FF3B3F] font-medium hover:underline inline-flex items-center gap-0.5">aistudio.google.com</a>, request a free key, and ensure it starts with <code className="bg-slate-950 px-1 py-0.5 rounded text-white font-mono text-[10px]">AIzaSy...</code>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-slate-800 text-[#FF3B3F] font-mono font-bold rounded flex items-center justify-center flex-shrink-0">2</span>
                      <p className="leading-relaxed">
                        <strong className="text-white">Open Personal Settings:</strong> Click on your profile in the top header and select <strong className="text-slate-100">Personal Settings</strong> to navigate to your credentials console.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-slate-800 text-[#FF3B3F] font-mono font-bold rounded flex items-center justify-center flex-shrink-0">3</span>
                      <p className="leading-relaxed">
                        <strong className="text-white">Verify and Save:</strong> Paste your key, click <strong className="text-slate-100">Test Key Connection</strong> to verify alignment, and click <strong className="text-slate-100">Save Key</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {extractionSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs text-left">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>{extractionSuccess}</span>
                </div>
              )}

              {/* AI PDF / RAW Text to CBT Converter Section */}
              <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl text-left space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    PDF / Raw Syllabus to CBT Converter (Gemini Core)
                  </h4>
                </div>
                
                <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wide">
                  Select a method to upload syllabus notes, exam questions, or textbooks to convert directly into standard CBT format.
                </p>

                {/* Mode Selector Tabs */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExtractionMethod("text")}
                    className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider rounded-lg transition-all font-mono font-bold cursor-pointer ${
                      extractionMethod === "text"
                        ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📝 Raw Text Paste
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtractionMethod("pdf")}
                    className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider rounded-lg transition-all font-mono font-bold cursor-pointer ${
                      extractionMethod === "pdf"
                        ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📂 PDF File Upload
                  </button>
                </div>

                {extractionMethod === "text" ? (
                  <textarea
                    rows={4}
                    placeholder="e.g. Paste questions or textbook paragraph page here. Gemini will organize four options and correct keys."
                    value={rawPasteText}
                    onChange={(e) => setRawPasteText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-red-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-650 focus:outline-none transition-all resize-y font-mono"
                  />
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropPdf}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      isDraggingPdf
                        ? "border-emerald-500 bg-emerald-500/5 animate-pulse"
                        : selectedPdfFile
                        ? "border-emerald-500/40 bg-slate-950/40"
                        : "border-slate-800 bg-slate-950/20 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="file"
                      id="pdf-upload-input"
                      accept=".pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                    />
                    <label htmlFor="pdf-upload-input" className="cursor-pointer block space-y-2">
                      <div className="flex justify-center flex-col items-center">
                        <FileText className={`w-8 h-8 mb-2 ${selectedPdfFile ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                        {selectedPdfFile ? (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-white">{selectedPdfFile.name}</p>
                            <p className="text-[10px] text-emerald-400 font-mono">
                              {(selectedPdfFile.size / 1024 / 1024).toFixed(2)} MB &bull; READY TO EXTRACT
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-300">
                              Click to upload or drag & drop past paper/syllabus PDF
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono text-center block">
                              PDF FORMAT (MAX 15MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                    {selectedPdfFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedPdfFile(null);
                          setPdfBase64(null);
                        }}
                        className="mt-3 text-[10px] font-mono text-rose-400 hover:text-rose-300 uppercase underline decoration-rose-500/30 font-bold block mx-auto cursor-pointer"
                      >
                        [ Remove File ]
                      </button>
                    )}
                  </div>
                )}

                {!userApiKey && !loadingUserKey && (
                  <div className="bg-red-950/20 border border-red-900/40 p-4 mt-4 text-xs font-sans text-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Gemini API Key Required</p>
                        <p className="text-slate-400 text-[11px]">Please add your Gemini API key in Settings before using this premium extraction feature.</p>
                      </div>
                    </div>
                    {setScreen && (
                      <button
                        type="button"
                        onClick={() => setScreen("settings")}
                        className="px-3.5 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-200 transition-colors cursor-pointer text-[10px] font-mono uppercase tracking-wider font-bold h-fit w-fit select-none"
                      >
                        Go to Settings
                      </button>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-3">
                  <button
                    disabled={isExtracting || !userApiKey}
                    onClick={handleAIExtractQuestions}
                    className="px-4 py-2 bg-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500 disabled:border-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors"
                  >
                    {isExtracting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span className="font-mono text-[10px] uppercase">
                          {extractionMethod === "pdf" ? "Parsing Multimodal PDF..." : "Parsing Text..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-[10px] uppercase">Extract with Gemini AI</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* General Test Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5">Mock Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. UPSC GS Paper I - Focus Section"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-850/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5">Category Stream</label>
                  <select 
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-semibold focus:outline-none"
                  >
                    <option value="UPSC">UPSC Civil Services</option>
                    <option value="SSC">SSC CGL</option>
                    <option value="Banking">Banking (IBPS PO)</option>
                    <option value="Railways">Railways (RRB NTPC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5">Timer Allocation (Minutes)</label>
                  <input 
                    type="number" 
                    value={testDuration}
                    onChange={(e) => setTestDuration(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-850/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5">Difficulty Profile</label>
                  <select 
                    value={testDifficulty}
                    onChange={(e) => setTestDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Questions Builder Panel */}
              <div className="border-t border-slate-850 pt-5">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Questions Pool: ({formQuestions.length})</h4>
                    <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Define choice arrays and model descriptions</p>
                  </div>
                  <button
                    onClick={handleAddQuestionToForm}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Next Question Item
                  </button>
                </div>

                {/* Question items array */}
                <div className="space-y-6">
                  {formQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="p-5 bg-slate-950/40 border border-slate-850/80 rounded-2xl relative">
                      {formQuestions.length > 1 && (
                        <button
                          onClick={() => handleRemoveQuestionFromForm(qIdx)}
                          className="absolute top-4 right-4 text-rose-400 hover:text-rose-300 text-xs font-mono uppercase tracking-wider bg-rose-950/20 border border-rose-500/10 p-1 rounded"
                        >
                          Remove
                        </button>
                      )}

                      <span className="font-mono text-xs font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-500 w-fit block mb-4">QUESTION #{qIdx + 1}</span>

                      {/* Question Content */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Question Description</label>
                          <textarea 
                            rows={2}
                            placeholder="e.g. Which of the following is correct regarding the President of India's executive powers?"
                            value={q.questionText}
                            onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        {/* Subject Badge */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Subject Field</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Polity, History, Science"
                              value={q.subject}
                              onChange={(e) => updateSubjectText(qIdx, e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none text-emerald-400 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Correct Choice Index</label>
                            <select 
                              value={q.correctOptionIndex}
                              onChange={(e) => updateCorrectIdx(qIdx, parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
                            >
                              <option value={0}>Option A</option>
                              <option value={1}>Option B</option>
                              <option value={2}>Option C</option>
                              <option value={3}>Option D</option>
                            </select>
                          </div>
                        </div>

                        {/* Four Options Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx}>
                              <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">Option {String.fromCharCode(65 + oIdx)}</label>
                              <input 
                                type="text" 
                                placeholder={`Enter option text for ${String.fromCharCode(65 + oIdx)}`}
                                value={opt}
                                onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Solution references explanation */}
                        <div>
                          <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Technical Explanation Model</label>
                          <textarea 
                            rows={2}
                            placeholder="Provide deep technical referencing model..."
                            value={q.explanation}
                            onChange={(e) => updateExplanationText(qIdx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMockTest}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 px-5"
              >
                <Check className="w-4 h-4 text-slate-950" />
                {isSaving ? "Publishing..." : "Publish Syllabus Mock"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Real-time floating overlay toast stack */}
      <AdminToastNotificationStack toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
