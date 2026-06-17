import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_MOCK_TESTS } from "../data/mockTestData";
import { getUserAttempts } from "../lib/attempts";
import { UserAttempt, MockTest } from "../types";
import { 
  Flame, 
  Trophy, 
  Target, 
  Activity, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  Sparkles,
  Award,
  Zap,
  RotateCcw,
  User,
  Crown
} from "lucide-react";
import { motion } from "motion/react";

interface StudentDashboardProps {
  setScreen: (screen: string) => void;
  setSelectedTestId: (testId: string) => void;
  setSelectedAttempt: (attempt: UserAttempt) => void;
  onOpenAuth: () => void;
  allMockTests?: MockTest[];
}

export default function StudentDashboard({ setScreen, setSelectedTestId, setSelectedAttempt, onOpenAuth, allMockTests }: StudentDashboardProps) {
  const { user, profile, privateInfo, updateUserChosenExam, upgradeToPremium } = useAuth();
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(true);
  const [editingExam, setEditingExam] = useState<boolean>(false);

  const testsToUse = allMockTests || DEFAULT_MOCK_TESTS;

  // Load user attempts from Firestore
  useEffect(() => {
    async function loadLogs() {
      if (user) {
        try {
          const logs = await getUserAttempts(user.uid);
          setAttempts(logs);
        } catch (error) {
          console.error("Error loading mock test logs: ", error);
        } finally {
          setLoadingAttempts(false);
        }
      }
    }
    loadLogs();
  }, [user, profile]);

  if (!user || !profile) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-100 font-sans" id="dashboard-logged-out-state">
        <BookOpen className="w-16 h-16 text-[#FF3B3F] mb-6 animate-pulse" />
        <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Access Portal is Locked</h2>
        <p className="text-slate-400 text-xs max-w-sm text-center mb-8 leading-relaxed font-mono uppercase tracking-wide">
          Please authenticate your identity session to configure and access your personal student prep panel.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-4 bg-white hover:bg-[#FF3B3F] border border-white hover:border-[#FF3B3F] text-black hover:text-white font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          <span>Authenticate Session</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Get recommended mock test based on target exam
  const currentExamStream = profile?.examCategory || "UPSC";
  const recommendedTest = testsToUse.find(t => t.category === currentExamStream) || testsToUse[0];

  // Simulated leaderboard competitors
  const seedCompetitors = [
    { name: "Priya Sharma (AIR 12)", score: 98.4, rank: 12, category: "UPSC", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"},
    { name: "Ankit Verma (AIR 84)", score: 94.1, rank: 84, category: "UPSC", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"},
    { name: "Vikram Malhotra (AIR 520)", score: 89.5, rank: 520, category: "UPSC", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"},
    { name: profile.name + " (You)", score: profile.averageAccuracy, rank: profile.predictedRank, category: profile.examCategory, avatarUrl: profile.avatarUrl, isSelf: true },
    { name: "Simran Kaur (AIR 1540)", score: 72.8, rank: 1540, category: "UPSC", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100"}
  ].sort((a, b) => a.rank - b.rank);

  // Weak Subject Analysis (Dynamic calculation based on user mock attempts)
  const getWeakSubject = () => {
    if (attempts.length === 0) {
      return { subject: "Quantitative Aptitude", accuracy: 51, severity: "High" };
    }

    const subjectScores: Record<string, { total: number; correct: number }> = {};
    attempts.forEach(att => {
      att.answers.forEach(ans => {
        // Find subject from mock list
        const correspondingMock = testsToUse.find(t => t.testId === att.testId);
        const correctQ = correspondingMock?.questions.find(q => q.id === ans.questionId);
        if (correctQ) {
          const subj = correctQ.subject;
          if (!subjectScores[subj]) subjectScores[subj] = { total: 0, correct: 0 };
          subjectScores[subj].total += 1;
          if (ans.isCorrect) subjectScores[subj].correct += 1;
        }
      });
    });

    const subjectsList = Object.entries(subjectScores).map(([sub, data]) => ({
      subject: sub,
      accuracy: Math.round((data.correct / data.total) * 100),
      severity: Math.round((data.correct / data.total) * 100) < 60 ? "High" : "Medium"
    }));

    if (subjectsList.length === 0) {
      return { subject: "None Detected", accuracy: 100, severity: "Balanced" };
    }

    // Sort to find the lowest accuracy subject
    const sorted = subjectsList.sort((a, b) => a.accuracy - b.accuracy);
    return sorted[0];
  };

  const weakSubject = getWeakSubject();

  // Calendar study heatmap (Last 7 days mock indicators)
  const getLast7Days = () => {
    const days = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isTestTaken = attempts.some(a => {
        const testD = new Date(a.takenAt);
        return testD.getDate() === d.getDate() && testD.getMonth() === d.getMonth();
      });
      days.push({
        name: weekdays[d.getDay()],
        date: d.getDate(),
        studied: isTestTaken
      });
    }
    return days;
  };

  const heatmapDays = getLast7Days();

  const handleStartExam = (testId: string) => {
    const hasAccess = privateInfo?.tier === "premium" || (privateInfo?.purchasedTestIds || []).includes(testId);
    setSelectedTestId(testId);
    if (hasAccess) {
      setScreen("mock-test");
    } else {
      setScreen("pricing");
    }
  };

  const viewAttemptResult = (attempt: UserAttempt) => {
    setSelectedAttempt(attempt);
    setScreen("results");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-[#F5F5F5]" id="student-dashboard-screen">
      
      {/* Welcome & Stream selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 uppercase">
              Welcome, {profile.name}!
            </h1>
            {privateInfo?.tier === "premium" && (
              <span className="bg-[#FF3B3F]/10 text-[#FF3B3F] text-[10px] px-2.5 py-1 rounded-none font-bold tracking-wider border border-[#FF3B3F]/30 uppercase mb-2">
                PREMIUM PLAYER
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs font-sans uppercase tracking-wider">
            Track All India rankings, target weaknesses, and practice live mock exams.
          </p>
        </div>

        {/* Change Exam Focus Widget */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-3.5 flex items-center gap-3">
          <div>
            <p className="text-[10px] text-[#666] uppercase font-mono tracking-widest leading-none mb-1.5">Exam Focus</p>
            {editingExam ? (
              <select 
                value={profile.examCategory}
                onChange={async (e) => {
                  await updateUserChosenExam(e.target.value);
                  setEditingExam(false);
                }}
                className="bg-[#0A0A0A] border border-[#2A2A2A] text-[#FF3B3F] text-xs font-semibold rounded px-2 py-1 focus:outline-none focus:border-[#FF3B3F] font-mono"
              >
                <option value="UPSC">UPSC Civil Services</option>
                <option value="SSC">SSC CGL</option>
                <option value="Banking">Banking (IBPS PO)</option>
                <option value="Railways">Railways (RRB NTPC)</option>
              </select>
            ) : (
              <span className="text-xs font-bold text-[#FF3B3F] uppercase tracking-widest">{profile.examCategory || "UPSC"} Syllabus</span>
            )}
          </div>
          <button 
            onClick={() => setEditingExam(!editingExam)}
            className="text-[9px] uppercase font-mono px-2.5 py-1.5 bg-[#0A0A0A] hover:bg-[#FF3B3F] hover:text-white border border-[#2A2A2A] rounded-none text-slate-300 font-bold transition-colors"
          >
            {editingExam ? "Cancel" : "Change"}
          </button>
        </div>
      </div>

      {/* Main Stats Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 text-slate-100">
        
        {/* Card 1: Streak */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666] font-bold">Daily Streak</span>
            <div className="p-2 bg-[#FF3B3F]/10 text-[#FF3B3F]">
              <Flame className="w-5 h-5 fill-[#FF3B3F]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-white font-sans">{profile.streakDays}</span>
              <span className="text-xs font-bold text-[#FF3B3F] uppercase tracking-widest">Days Active</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-widest">Hold current activity logs</p>
          </div>
        </div>

        {/* Card 2: AI Rank Prediction */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666] font-bold">AI Rank Prediction</span>
            <div className="p-2 bg-[#FF3B3F]/10 text-[#FF3B3F]">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest mr-1">AIR</span>
              <span className="text-3xl font-black text-[#FF3B3F]">#{profile.predictedRank <= 45 ? "Under 50" : profile.predictedRank}</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-widest">Estimated from accuracy metrics</p>
          </div>
        </div>

        {/* Card 3: Accuracy Card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666] font-bold">Average Accuracy</span>
            <div className="p-2 bg-[#FF3B3F]/10 text-[#FF3B3F]">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">{profile.averageAccuracy}%</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-widest">Across {profile.totalTests} papers solved</p>
          </div>
        </div>

        {/* Card 4: Weak Subject Analysis */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666] font-bold">Subject Focus Alert</span>
            <div className="p-2 bg-[#FF3B3F]/10 text-[#FF3B3F]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase truncate">{weakSubject.subject}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Accuracy rate: <span className="text-[#FF3B3F] font-bold">{weakSubject.accuracy}%</span></p>
            <div className="mt-2 text-[9px] text-slate-500 font-mono flex items-center gap-1.5 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-[#FF3B3F] animate-pulse" /> Severity: {weakSubject.severity}
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Study Progress Calendar Heatmap */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF3B3F]" /> Study Heatmap
                </h3>
                <p className="text-xs text-[#666] uppercase tracking-wider">Daily mock practice log calendar (Last 7 Days)</p>
              </div>
              <span className="text-[9px] font-mono uppercase bg-[#0A0A0A] text-slate-400 px-3 py-1 rounded-none border border-[#2A2A2A] tracking-wider">Sync Active</span>
            </div>

            <div className="grid grid-cols-7 gap-3 max-w-sm mx-auto sm:max-w-md pt-2">
              {heatmapDays.map((day, ix) => (
                <div key={ix} className="text-center">
                  <p className="text-[10px] text-slate-500 mb-2 uppercase font-mono tracking-wider">{day.name}</p>
                  <div 
                    className={`aspect-square w-full rounded-none flex flex-col items-center justify-center border transition-all ${
                      day.studied 
                        ? "bg-[#FF3B3F] border-[#FF3B3F] text-black font-extrabold"
                        : "bg-[#0A0A0A] border-[#2A2A2A] text-slate-400 hover:border-[#FF3B3F]"
                    }`}
                  >
                    <span className="text-xs font-mono font-bold">{day.date}</span>
                    {day.studied && <span className="text-[7px] uppercase font-mono font-black tracking-tighter text-black mt-0.5">OK</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Mock Card */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[10px] text-[#FF3B3F] font-mono uppercase tracking-widest font-black mb-3.5">
                <Sparkles className="w-4 h-4 text-[#FF3B3F]" /> RECOMMENDED STUDY TARGET
              </div>
              <h3 className="text-lg font-black text-white mb-2 leading-snug uppercase tracking-tight">{recommendedTest.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Based on your chosen focus stream <span className="text-[#FF3B3F] font-mono uppercase font-bold tracking-widest">{profile.examCategory}</span>, complete this practice mock to optimize your forecasted rank.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-slate-500 tracking-wider">
                <span>QUESTIONS: <span className="text-slate-300 font-bold">{recommendedTest.questionsCount}</span></span>
                <span>DURATION: <span className="text-slate-300 font-bold">{recommendedTest.durationMinutes} MINS</span></span>
                <span className="bg-[#0A0A0A] px-2 py-0.5 border border-[#2A2A2A]">DIFFICULTY: {recommendedTest.difficulty.toUpperCase()}</span>
              </div>
            </div>
            {(() => {
              const hasAccess = privateInfo?.tier === "premium" || (privateInfo?.purchasedTestIds || []).includes(recommendedTest.testId);
              return (
                <button
                  onClick={() => handleStartExam(recommendedTest.testId)}
                  className={`px-6 py-4 w-full sm:w-auto text-nowrap font-bold text-xs uppercase tracking-widest rounded-none border transition-all flex items-center justify-center gap-1.5 ${
                    hasAccess 
                      ? "bg-[#FF3B3F] hover:bg-white text-white hover:text-black border-[#FF3B3F] hover:border-white" 
                      : "bg-transparent hover:bg-[#FF3B3F] text-[#FF3B3F] hover:text-white border-[#FF3B3F]"
                  }`}
                >
                  <span>{hasAccess ? "Launch Mock Test" : "Buy Mock (₹149)"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              );
            })()}
          </div>

          {/* Recent attempts log */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6 font-sans">
            <h3 className="text-base font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF3B3F]" /> Recent Practice History
            </h3>

            {loadingAttempts ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono animate-pulse">Loading mock attempts history logs...</p>
            ) : attempts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#2A2A2A] rounded-none bg-[#0A0A0A]">
                <p className="text-xs text-slate-400 mb-1.5 uppercase font-mono tracking-wider">No Practice Mocks Completed</p>
                <p className="text-[10px] text-slate-600 mb-4 uppercase tracking-wider font-mono">Completed papers appear here synchronously with score breakdown graphs</p>
                <button 
                  onClick={() => handleStartExam(recommendedTest.testId)}
                  className="px-4 py-2 bg-white text-black hover:bg-[#FF3B3F] hover:text-white border border-white hover:border-[#FF3B3F] rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Solve First Mock Page
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {attempts.map((att, index) => (
                  <div 
                    key={att.attemptId}
                    onClick={() => viewAttemptResult(att)}
                    className="p-4 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF3B3F] rounded-none flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-[9px] text-[#FF3B3F] uppercase font-mono font-bold tracking-widest">{att.category}</span>
                      <h4 className="text-xs font-black text-white mb-1 uppercase tracking-tight truncate max-w-[280px] sm:max-w-md">{att.testTitle}</h4>
                      <p className="text-[9px] text-[#666] font-mono uppercase tracking-wider">Taken on {new Date(att.takenAt).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right flex items-center gap-4 text-nowrap">
                      <div>
                        <p className="text-base font-extrabold text-[#FF3B3F] font-mono">{att.scoreSecured}/{att.maxScorePossible}</p>
                        <p className="text-[9px] text-[#666] font-mono uppercase tracking-wider">{att.accuracyPercent}% ACCURACY</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#666]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Admin/Leaderboard Side Column */}
        <div className="space-y-8 font-sans">
          
          {/* Pro Upgrade Promotion Banner */}
          {privateInfo?.tier !== "premium" && (
            <div className="bg-[#1A1A1A] border border-[#FF3B3F] rounded-none p-6 relative overflow-hidden">
              <Crown className="w-8 h-8 text-[#FF3B3F] mb-4" />
              <h3 className="text-base font-black text-white uppercase tracking-tight mb-2 flex items-center gap-1.5">
                Lock in ElitePrep PRO <Zap className="w-4 h-4 text-[#FF3B3F]" />
              </h3>
              <p className="text-xs text-[#999] leading-relaxed mb-6 font-sans">
                Unlock full unlimited questions databases, Section-wise Timing reports, and All India topper comparative blueprints.
              </p>
              <button 
                onClick={() => setScreen("pricing")}
                className="w-full py-3 bg-white hover:bg-[#FF3B3F] hover:border-[#FF3B3F] text-black hover:text-white font-bold text-xs uppercase tracking-widest border border-white rounded-none transition-all duration-200"
              >
                Upgrade to PRO
              </button>
            </div>
          )}

          {/* All India Leaderboard Panel */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-none p-6">
            <h3 className="text-base font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FF3B3F]" /> Leaderboard
            </h3>
            <p className="text-[10px] text-[#666] mb-6 font-mono uppercase tracking-wider">Active stream competitors ranking</p>

            <div className="space-y-3.5">
              {seedCompetitors.map((comp, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3.5 rounded-none transition-colors border ${
                    comp.isSelf 
                      ? "bg-[#FF3B3F]/10 border-[#FF3B3F]" 
                      : "bg-[#0A0A0A] border-[#2A2A2A]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#666] font-bold w-5">#{comp.rank}</span>
                    {comp.avatarUrl ? (
                      <img src={comp.avatarUrl} alt={comp.name} className="w-6 h-6 rounded-none border border-[#2A2A2A]" />
                    ) : (
                      <div className="w-6 h-6 bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-slate-300 text-[10px] font-mono font-bold">
                        {comp.name[0]}
                      </div>
                    )}
                    <div>
                      <p className={`text-xs font-bold leading-tight ${comp.isSelf ? "text-[#FF3B3F]" : "text-white"}`}>{comp.name.split(" (")[0]}</p>
                      <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">{comp.category || "UPSC"} STREAM</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-white font-mono">{comp.score?.toFixed(1) || "0.0"}%</p>
                    <p className="text-[8px] text-[#666] font-mono uppercase">ACC</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
