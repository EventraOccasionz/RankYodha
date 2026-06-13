import React, { useMemo } from "react";
import { UserAttempt, Question } from "../types";
import { DEFAULT_MOCK_TESTS } from "../data/mockTestData";
import { 
  Trophy, 
  Target, 
  Clock, 
  Award, 
  ArrowLeft, 
  BrainCircuit, 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Sparkles,
  Zap,
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface ResultAnalyticsScreenProps {
  attempt: UserAttempt;
  setScreen: (screen: string) => void;
}

export default function ResultAnalyticsScreen({ attempt, setScreen }: ResultAnalyticsScreenProps) {
  const { testTitle, category, scoreSecured, maxScorePossible, accuracyPercent, percentileSecured, timeSpentSeconds, answers, testId } = attempt;

  // Retrieve original test questions
  const correspondingTest = useMemo(() => {
    return DEFAULT_MOCK_TESTS.find(t => t.testId === testId) || DEFAULT_MOCK_TESTS[0];
  }, [testId]);

  const questionsList = correspondingTest.questions;

  // 1. Calculate question breakdown counters
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    answers.forEach(ans => {
      if (ans.selectedOptionIndex === null) skipped++;
      else if (ans.isCorrect) correct++;
      else incorrect++;
    });

    return { correct, incorrect, skipped };
  }, [answers]);

  // Data for Recharts Pie Chart
  const pieData = [
    { name: "Correct", value: stats.correct, color: "#10b981" },
    { name: "Incorrect", value: stats.incorrect, color: "#f43f5e" },
    { name: "Skipped", value: stats.skipped, color: "#64748b" }
  ].filter(d => d.value > 0);

  // 2. Section/Subject time spent calculation
  const barData = useMemo(() => {
    const subjectTimes: Record<string, number> = {};
    answers.forEach(ans => {
      const q = questionsList.find(ql => ql.id === ans.questionId);
      if (q) {
        const subj = q.subject;
        subjectTimes[subj] = (subjectTimes[subj] || 0) + ans.timeSpentSeconds;
      }
    });

    return Object.entries(subjectTimes).map(([subject, time]) => ({
      subject,
      "Speed (seconds)": time
    }));
  }, [answers, questionsList]);

  // Accuracy level assessment text
  const accuracyText = useMemo(() => {
    if (accuracyPercent >= 80) return { title: "Outstanding", desc: "You have scaled standard central exam benchmarks!", color: "text-emerald-400" };
    if (accuracyPercent >= 60) return { title: "Above Average", desc: "Good grasp! Adjust weak concepts to secure rank gaps.", color: "text-teal-400" };
    return { title: "Focus Needed", desc: "Polish syllabus. Target focus subject lists below.", color: "text-rose-400" };
  }, [accuracyPercent]);

  // AI-simulated profiling insights based on performance
  const aiInsights = useMemo(() => {
    const insightsList = [];
    let weakestSubject = "General Practice";
    let weakestAccuracy = 100;

    // Find subject score averages
    const subjectMetrics: Record<string, { total: number; correct: number }> = {};
    answers.forEach(ans => {
      const q = questionsList.find(ql => ql.id === ans.questionId);
      if (q) {
        const subj = q.subject;
        if (!subjectMetrics[subj]) subjectMetrics[subj] = { total: 0, correct: 0 };
        subjectMetrics[subj].total++;
        if (ans.isCorrect) subjectMetrics[subj].correct++;
      }
    });

    Object.entries(subjectMetrics).forEach(([subj, metrics]) => {
      const acc = (metrics.correct / metrics.total) * 100;
      if (acc < weakestAccuracy) {
        weakestAccuracy = acc;
        weakestSubject = subj;
      }
    });

    if (stats.incorrect > 0) {
      insightsList.push(`Your performance metrics indicate solid grasp in sections, but you had slips under **${weakestSubject || "General Sections"}** with ${weakestAccuracy.toFixed(0)}% accuracy.`);
    }

    // Time speed profiling
    const slowAttempts = answers.filter(a => a.timeSpentSeconds > 90);
    if (slowAttempts.length > 0) {
      insightsList.push("Timer Overrun detected: Spent over 90 seconds on multiple question blocks. Try practicing with active side-timers to boost decision pacing.");
    } else {
      insightsList.push("Excellent speed profiles: Your average active decision speed was fast across all items.");
    }

    insightsList.push("Recommendation: Target the suggested Mock Sprints list in your dashboard to iron out these errors.");

    return insightsList;
  }, [answers, questionsList, stats.incorrect]);

  // Format time display helper
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-slate-100" id="result-analytics-screen">
      
      {/* Return Navigation */}
      <button 
        onClick={() => setScreen("dashboard")}
        className="inline-flex items-center gap-2 p-3 bg-[#1A1A1A] hover:bg-[#FF3B3F] hover:text-white border border-[#2A2A2A] text-xs text-slate-350 transition-colors uppercase font-mono tracking-widest mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Go back to Dashboard
      </button>

      {/* Header Banner */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 mb-8 relative overflow-hidden">
        <span className="bg-[#0A0A0A] border border-[#2A2A2A] text-[#FF3B3F] font-mono text-[9px] px-3 py-1 rounded-none uppercase tracking-widest font-bold">{category} Mock Completed</span>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-3 leading-tight uppercase tracking-tight">{testTitle}</h1>
        <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-widest">Results Sync status: Saved to cloud database</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        
        {/* Card 1: Predicted Rank */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-5 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold">All India Rank</span>
          <div>
            <p className="text-2xl font-black text-white">#{percentileSecured > 90 ? "Top 120" : "1,250"}</p>
            <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Percentile: {percentileSecured}%</p>
          </div>
        </div>

        {/* Card 2: Score */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-5 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold">Total Marks</span>
          <div>
            <p className="text-3xl font-black text-white">{scoreSecured} <span className="text-xs text-[#666]">/ {maxScorePossible}</span></p>
            <p className="text-[9px] text-[#FF3B3F] font-mono uppercase mt-1">2 marks per question</p>
          </div>
        </div>

        {/* Card 3: Accuracy */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-5 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold">Accuracy Ratio</span>
          <div>
            <p className="text-3xl font-black text-white">{accuracyPercent}%</p>
            <p className={`text-[9px] font-mono uppercase mt-1 font-bold ${accuracyText.color}`}>{accuracyText.title}</p>
          </div>
        </div>

        {/* Card 4: Timing */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-5 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold">Time Expended</span>
          <div>
            <p className="text-2xl font-black text-white">{formatTime(timeSpentSeconds)}</p>
            <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Allocation: {correspondingTest.durationMinutes}m</p>
          </div>
        </div>

        {/* Card 5: Speed Rate */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-5 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest font-bold">Decision Pace</span>
          <div>
            <p className="text-2xl font-black text-white">{Math.round(timeSpentSeconds / questionsList.length)}s</p>
            <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Avg per question</p>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 text-slate-100">
        
        {/* Recharts Pie Chart: Question Breakdown */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#FF3B3F]" /> Question Breakdown
          </h3>
          <div className="h-60 flex items-center justify-between">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => {
                      let color = "#FFFFFF";
                      if (entry.name === "Incorrect") color = "#FF3B3F";
                      if (entry.name === "Skipped") color = "#333333";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0A0A0A", borderColor: "#2A2A2A", borderRadius: "0px", fontSize: "11px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Labels Side Column */}
            <div className="w-1/2 space-y-4 text-nowrap font-sans">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 bg-white" />
                <div>
                   <p className="text-xs font-bold text-white uppercase tracking-wider">Correct: {stats.correct}</p>
                   <p className="text-[10px] text-slate-500 font-mono uppercase">+{stats.correct * 2} Marks Secured</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 bg-[#FF3B3F]" />
                <div>
                   <p className="text-xs font-bold text-white uppercase tracking-wider">Incorrect: {stats.incorrect}</p>
                   <p className="text-[10px] text-slate-500 font-mono uppercase">0 Negative applied</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 bg-[#333333]" />
                <div>
                   <p className="text-xs font-bold text-white uppercase tracking-wider">Skipped: {stats.skipped}</p>
                   <p className="text-[10px] text-slate-500 font-mono uppercase">No action calculated</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart: Section speed comparison */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF3B3F]" /> Time Spent per Section
          </h3>
          <div className="h-60">
            {barData.length === 0 ? (
              <p className="text-xs text-[#666] pt-20 text-center font-mono uppercase tracking-widest">No Section metrics registered</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" stroke="#666" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis dataKey="subject" type="category" stroke="#666" width={80} style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0A0A0A", borderColor: "#2A2A2A", borderRadius: "0px", fontSize: "11px" }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#FF3B3F" }}
                  />
                  <Bar dataKey="Speed (seconds)" fill="#FF3B3F" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* AI Simulated Insights area */}
      <div className="bg-[#1A1A1A] border border-[#FF3B3F] rounded-none p-6 mb-8 relative overflow-hidden">
        <div className="p-3 bg-[#FF3B3F]/10 text-[#FF3B3F] rounded-none w-12 h-12 flex items-center justify-center mb-4 border border-[#FF3B3F]/20">
          <BrainCircuit className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5 mb-2">
          Precision AI Insights <Sparkles className="w-4 h-4 text-white" />
        </h3>
        <p className="text-slate-400 text-xs lines-relaxed mb-4 leading-6 max-w-4xl uppercase tracking-wider font-mono">
          We scanned your decision sequences and comparative metrics against standard central commission selectees.
        </p>

        <ul className="space-y-3 ps-1">
          {aiInsights.map((ins, index) => (
            <li key={index} className="flex items-start gap-3.5 text-xs text-slate-300">
              <Zap className="w-4.5 h-4.5 text-[#FF3B3F] flex-shrink-0 mt-0.5" />
              <span dangerouslySetInnerHTML={{ __html: ins }} />
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed Question Review List */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6">
        <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">Detailed Paper Analysis</h3>
        <p className="text-xs text-slate-500 mb-6 font-mono uppercase tracking-widest">Review correct answers alongside direct explanations</p>

        <div className="space-y-6">
          {questionsList.map((q, idx) => {
            const userAnswer = answers.find(ans => ans.questionId === q.id);
            const userChoiceIdx = userAnswer?.selectedOptionIndex ?? null;
            const isCorrect = userAnswer?.isCorrect ?? false;
            const timeSpent = userAnswer?.timeSpentSeconds ?? 0;

            let statusIcon = <MinusCircle className="w-5 h-5 text-slate-500" />;
            let borderClass = "border-[#2A2A2A] bg-[#0A0A0A]";
            let resultLabel = "Skipped / Unsolved";
            let labelClass = "text-slate-400";

            if (userChoiceIdx !== null) {
              if (isCorrect) {
                statusIcon = <CheckCircle className="w-5 h-5 text-white" />;
                borderClass = "border-white bg-[#1A1A1A]";
                resultLabel = "Correct Response";
                labelClass = "text-white font-bold";
              } else {
                statusIcon = <XCircle className="w-5 h-5 text-[#FF3B3F]" />;
                borderClass = "border-[#FF3B3F] bg-[#1A1A1A]";
                resultLabel = "Incorrect Response";
                labelClass = "text-[#FF3B3F] font-bold";
              }
            }

            return (
              <div key={q.id} className={`p-5 rounded-none border ${borderClass} font-sans`}>
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#0A0A0A] text-slate-400 px-2 py-0.5 rounded-none border border-[#2A2A2A]">Q{idx + 1}</span>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{q.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500 uppercase">SPEED: {timeSpent}s</span>
                    <span className={`font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider ${labelClass}`}>
                      {statusIcon} {resultLabel}
                    </span>
                  </div>
                </div>

                <p className="text-white text-sm font-medium mb-6 whitespace-pre-line">{q.questionText}</p>

                {/* Option list choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs font-mono uppercase tracking-wider">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = userChoiceIdx === oIdx;
                    const isCorrectAnswer = q.correctOptionIndex === oIdx;

                    let optionClass = "bg-[#0A0A0A] border-[#2A2A2A] text-[#666]";
                    if (isSelected) {
                      optionClass = isCorrect ? "bg-white border-white text-black font-bold" : "bg-[#FF3B3F]/10 border-[#FF3B3F] text-[#FF3B3F] font-bold";
                    } else if (isCorrectAnswer) {
                      optionClass = "bg-white/10 border-white text-white font-bold";
                    }

                    return (
                      <div key={oIdx} className={`p-4 rounded-none border flex items-start gap-2.5 ${optionClass}`}>
                        <span className="font-mono text-xs font-black text-slate-450 mt-px">{String.fromCharCode(65 + oIdx)}.</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Technical explanation */}
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-none p-4 text-xs font-mono uppercase tracking-widest text-slate-400">
                  <p className="font-black text-white mb-2 flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                    <HelpCircle className="w-3.5 h-3.5 text-[#FF3B3F]" /> Explanation Reference
                  </p>
                  <p className="text-[#999] leading-relaxed mb-1 font-sans lowercase first-letter:uppercase">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
