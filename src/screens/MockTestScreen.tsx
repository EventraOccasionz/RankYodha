import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_MOCK_TESTS } from "../data/mockTestData";
import { saveUserAttempt } from "../lib/attempts";
import { UserAttempt, UserAnswer } from "../types";
import { 
  Hourglass, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Flag, 
  X, 
  AlertTriangle, 
  ShieldCheck,
  Award
} from "lucide-react";

interface MockTestScreenProps {
  testId: string;
  setScreen: (screen: string) => void;
  setSelectedAttempt: (attempt: UserAttempt) => void;
}

export default function MockTestScreen({ testId, setScreen, setSelectedAttempt }: MockTestScreenProps) {
  const { user, profile } = useAuth();
  
  // Load current test paper
  const testPaper = DEFAULT_MOCK_TESTS.find(t => t.testId === testId) || DEFAULT_MOCK_TESTS[0];
  const { questions, durationMinutes, title, category } = testPaper;

  // Active question state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);

  // User responses states
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | null>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({ [questions[0].id]: true });

  // Timing states
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(durationMinutes * 60);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize individual question times tracking
  useEffect(() => {
    const qTimersObj: Record<string, number> = {};
    questions.forEach(q => {
      qTimersObj[q.id] = 0;
    });
    setQuestionTimers(qTimersObj);
  }, [questions]);

  // Global Countdown timer
  useEffect(() => {
    if (timeLeftSeconds <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => prev - 1);
      
      // Increment current question time spent
      const activeQId = questions[currentQuestionIdx].id;
      setQuestionTimers(prev => ({
        ...prev,
        [activeQId]: (prev[activeQId] || 0) + 1
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, currentQuestionIdx]);

  // Format countdown string
  const formatTime = () => {
    const m = Math.floor(timeLeftSeconds / 60);
    const s = timeLeftSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIdx: number) => {
    const qId = questions[currentQuestionIdx].id;
    setSelectedOptions(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleClearResponse = () => {
    const qId = questions[currentQuestionIdx].id;
    setSelectedOptions(prev => ({ ...prev, [qId]: null }));
  };

  const handleMarkForReview = () => {
    const qId = questions[currentQuestionIdx].id;
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
    
    // Auto-advance
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      const nextQId = questions[nextIdx].id;
      setVisitedQuestions(prev => ({ ...prev, [nextQId]: true }));
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      const prevIdx = currentQuestionIdx - 1;
      setCurrentQuestionIdx(prevIdx);
      const prevQId = questions[prevIdx].id;
      setVisitedQuestions(prev => ({ ...prev, [prevQId]: true }));
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setCurrentQuestionIdx(idx);
    const targetQId = questions[idx].id;
    setVisitedQuestions(prev => ({ ...prev, [targetQId]: true }));
  };

  // Get status of a question for side palette styling
  const getQuestionStatus = (idx: number) => {
    const qId = questions[idx].id;
    const answered = selectedOptions[qId] !== undefined && selectedOptions[qId] !== null;
    const isMarked = markedForReview[qId];
    const visited = visitedQuestions[qId];

    if (isMarked) return "reviewed"; // Purple
    if (answered) return "answered"; // Green
    if (visited && !answered) return "unanswered"; // Orange/Red
    return "not-visited"; // Gray
  };

  // Summarize exam selections
  const getAnswerCounts = () => {
    let answered = 0;
    let unanswered = 0;
    let reviewed = 0;
    let notVisited = 0;

    questions.forEach((q, i) => {
      const status = getQuestionStatus(i);
      if (status === "answered") answered++;
      else if (status === "unanswered") unanswered++;
      else if (status === "reviewed") reviewed++;
      else notVisited++;
    });

    return { answered, unanswered, reviewed, notVisited };
  };

  const counts = getAnswerCounts();

  // Score and submit logic
  const submitExam = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const userAnswers: UserAnswer[] = [];
      let correctAnswersCount = 0;

      questions.forEach(q => {
        const optionChosen = selectedOptions[q.id] ?? null;
        const isCorrectChoice = optionChosen === q.correctOptionIndex;
        if (isCorrectChoice) correctAnswersCount++;

        userAnswers.push({
          questionId: q.id,
          selectedOptionIndex: optionChosen,
          isCorrect: isCorrectChoice,
          timeSpentSeconds: questionTimers[q.id] || 0
        });
      });

      // Calculate standard scoring (UPSC has 2 marks per correct, -0.66 negative. Let's make it simple 2 marks correct, 0 negative)
      const scoreSecured = correctAnswersCount * 2;
      const maxScorePossible = questions.length * 2;
      const accuracyPercent = questions.length > 0 ? (correctAnswersCount / questions.length) * 100 : 0;
      
      const totalTimeSpent = (durationMinutes * 60) - timeLeftSeconds;

      const attemptPayload: Omit<UserAttempt, "takenAt"> = {
        attemptId: "attempt_" + Date.now().toString(),
        userId: user.uid,
        testId: testPaper.testId,
        testTitle: testPaper.title,
        category: testPaper.category,
        scoreSecured,
        maxScorePossible,
        accuracyPercent: parseFloat(accuracyPercent.toFixed(1)),
        percentileSecured: parseFloat((80 + (correctAnswersCount * 3.5)).toFixed(1)), // mock topper comparison logic
        timeSpentSeconds: totalTimeSpent,
        answers: userAnswers
      };

      await saveUserAttempt(user.uid, attemptPayload);

      // Save complete object forward to results screen
      const fullAttempt: UserAttempt = {
        ...attemptPayload,
        takenAt: new Date().toISOString()
      };
      
      setSelectedAttempt(fullAttempt);
      setScreen("results");

    } catch (err) {
      console.error("Critical submission error: ", err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
    }
  };

  const handleAutoSubmit = () => {
    submitExam();
  };

  const activeQuestion = questions[currentQuestionIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans text-slate-100 min-h-screen" id="mock-test-screen">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-none gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0A0A0A] text-[#FF3B3F] border border-[#FF3B3F]/20 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider">{category}</span>
            <span className="text-[#666] text-[10px] font-mono">CODE: {testPaper.testId.toUpperCase()}</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-2 leading-tight uppercase tracking-tight">{title}</h2>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-3 bg-[#FF3B3F]/10 px-5 py-2.5 rounded-none border border-[#FF3B3F]/30">
          <Hourglass className="w-5 h-5 text-[#FF3B3F] animate-pulse" />
          <div>
            <p className="text-[9px] text-[#FF3B3F] font-mono uppercase tracking-widest leading-none mb-1">Time Remaining</p>
            <p className="text-xl font-mono font-extrabold text-white leading-none">{formatTime()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Question Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 relative overflow-hidden min-h-[400px] flex flex-col justify-between">
            
            {/* Subject details and question absolute counter */}
            <div>
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4 mb-6">
                <span className="bg-[#0A0A0A] border border-[#2A2A2A] text-slate-300 px-3 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider">
                  Section: {activeQuestion.subject}
                </span>
                <span className="text-slate-400 text-xs font-mono font-bold">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-white text-base leading-relaxed mb-8 select-text whitespace-pre-line">
                {activeQuestion.questionText}
              </div>

              {/* Action Options list */}
              <div className="space-y-3">
                {activeQuestion.options.map((opt, oIdx) => {
                  const isSelected = selectedOptions[activeQuestion.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full flex items-start gap-4 p-4 rounded-none border text-left text-xs uppercase tracking-wider transition-colors ${
                        isSelected 
                          ? "bg-[#FF3B3F]/10 border-[#FF3B3F] font-bold text-white" 
                          : "bg-[#0A0A0A] hover:bg-[#1A1A1A] border-[#2A2A2A] hover:border-white text-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-none flex items-center justify-center font-mono text-xs text-[10px] uppercase border ${
                        isSelected ? "bg-[#FF3B3F] border-[#FF3B3F] text-white font-extrabold" : "border-[#2A2A2A] text-slate-500"
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question HUD Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2A2A2A] pt-6 mt-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearResponse}
                  disabled={selectedOptions[activeQuestion.id] === undefined || selectedOptions[activeQuestion.id] === null}
                  className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-slate-400 hover:text-white rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Clear Response
                </button>
                <button
                  onClick={handleMarkForReview}
                  className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#FF3B3F]/10 border border-[#2A2A2A] text-[#FF3B3F] hover:text-[#FF3B3F]/80 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors"
                >
                  {markedForReview[activeQuestion.id] ? "Unmark Review" : "Mark & Next"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIdx === 0}
                  className="p-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-[#FF3B3F] disabled:opacity-30 rounded-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIdx === questions.length - 1}
                  className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-[#FF3B3F] disabled:opacity-30 rounded-none font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Palette Column */}
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] mb-4 font-mono">Question Palette</h3>
            
            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2.5 mb-6">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(idx);
                const isActive = currentQuestionIdx === idx;

                let btnClass = "bg-[#0A0A0A] border-[#2A2A2A] text-slate-500 hover:border-white"; // not visited
                if (status === "answered") {
                  btnClass = "bg-white border-white text-black font-extrabold";
                } else if (status === "unanswered") {
                  btnClass = "bg-[#FF3B3F]/10 border-[#FF3B3F]/30 text-[#FF3B3F]";
                } else if (status === "reviewed") {
                  btnClass = "bg-white/10 border-white text-white font-bold";
                }

                if (isActive) {
                  btnClass += " ring-2 ring-[#FF3B3F] scale-102";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`aspect-square w-full font-mono text-xs rounded-none flex items-center justify-center border transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Labels and Legend */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#2A2A2A] text-[9px] font-mono uppercase tracking-wider text-[#666]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#0A0A0A] border border-[#2A2A2A]" />
                <span>Not Visited ({counts.notVisited})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#FF3B3F]/10 border border-[#FF3B3F]/30" />
                <span>Skipped ({counts.unanswered})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white" />
                <span>Answered ({counts.answered})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white/15 border border-white" />
                <span>Reviewed ({counts.reviewed})</span>
              </div>
            </div>

            {/* Submit Paper Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="w-full py-4 mt-6 bg-[#FF3B3F] hover:bg-white border border-[#FF3B3F] hover:border-white font-mono font-black text-white hover:text-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              <span>Submit Mock Paper</span>
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#1A1A1A] border border-[#FF3B3F] rounded-none max-w-md w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#FF3B3F]/10 text-[#FF3B3F] rounded-none flex items-center justify-center mx-auto mb-4 border border-[#FF3B3F]/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">Final Mock Submission</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Are you sure you want to lock in your answers? Once submitted, our evaluation script will calculate speed analytics, accuracy rates, and All India predictions.
              </p>
            </div>

            {/* Brief review lists */}
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-none p-4 space-y-2 mb-6 font-mono text-[10px] tracking-widest uppercase">
              <div className="flex justify-between">
                <span className="text-[#666]">TOTAL QUESTIONS</span>
                <span className="text-white font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">ANSWERED PAPERS</span>
                <span className="text-emerald-400 font-bold">{counts.answered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">UNDER REVIEW</span>
                <span className="text-white font-bold">{counts.reviewed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UNANSWERED / SKIPPED</span>
                <span className="text-rose-400 font-bold">{counts.unanswered + counts.notVisited}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
              >
                Continue Solving
              </button>
              <button
                onClick={submitExam}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? "Syncing..." : "Submit Answers"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
