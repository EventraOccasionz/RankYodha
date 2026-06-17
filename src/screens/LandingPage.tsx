import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_MOCK_TESTS } from "../data/mockTestData";
import { PYQ_QUESTIONS, PYQQuestion } from "../data/pyqsData";
import { TESTIMONIALS, Testimonial } from "../data/testimonialsData";
import { MockTest, PrepVideo } from "../types";
import { 
  Sparkles, 
  Search, 
  TrendingUp, 
  Award, 
  Clock, 
  ArrowRight, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Target,
  BrainCircuit,
  MessageSquareCode,
  BookOpen,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Flame,
  ChevronLeft,
  ChevronRight,
  Play,
  Video,
  FileVideo
} from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  setScreen: (screen: string) => void;
  setSelectedTestId: (testId: string) => void;
  onOpenAuth: () => void;
  allMockTests?: MockTest[];
  allPrepVideos?: PrepVideo[];
}

export default function LandingPage({ setScreen, setSelectedTestId, onOpenAuth, allMockTests, allPrepVideos }: LandingPageProps) {
  const { user, privateInfo } = useAuth();

  // Active PYQ selection states
  const [activePyqCategory, setActivePyqCategory] = useState<"UPSC" | "JEE" | "NEET">("UPSC");
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [answeredPyqs, setAnsweredPyqs] = useState<Record<string, number>>({}); // maps pyqId to selectedOptionIndex

  // Testimonials sliding index
  const [testimonialIdx, setTestimonialIdx] = useState<number>(0);
  const [activeVideoEmbed, setActiveVideoEmbed] = useState<string | null>(null);

  // Prep Video States
  const [videoSearch, setVideoSearch] = useState("");
  const [videoFilterCategory, setVideoFilterCategory] = useState("ALL");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // General Categories metadata
  const categories = [
    { 
      id: "UPSC", 
      title: "UPSC Civil Services", 
      desc: "IAS, IPS, IRS, IFS Practice syllabus", 
      stats: "5,400+ Active Students this week", 
      difficulty: "Very Hard"
    },
    { 
      id: "JEE", 
      title: "IIT JEE Advanced", 
      desc: "Full syllabus Physics, Chemistry, Math", 
      stats: "21,400+ Mock Papers solved", 
      difficulty: "Very Hard"
    },
    { 
      id: "NEET", 
      title: "NEET Professional", 
      desc: "NCERT Chapter drills and Biology logs", 
      stats: "15,200+ Aspirants active now", 
      difficulty: "Hard"
    },
    { 
      id: "SSC", 
      title: "SSC CGL / CHSL", 
      desc: "Income Tax, Excise inspector tracks", 
      stats: "24,800+ Solved Mocks yesterday", 
      difficulty: "Medium-Hard"
    }
  ];

  // Derive subjects list dynamically based on selected PYQ category
  const filteredPyqs = PYQ_QUESTIONS.filter(q => q.category.toUpperCase() === activePyqCategory.toUpperCase());
  const subjectsAvailable = Array.from(new Set(filteredPyqs.map(q => q.subject)));

  // Auto-set first subject when category changes
  React.useEffect(() => {
    if (subjectsAvailable.length > 0) {
      setActiveSubject(subjectsAvailable[0]);
    } else {
      setActiveSubject("");
    }
  }, [activePyqCategory]);

  const activeSubjectPyqs = filteredPyqs.filter(q => q.subject === activeSubject);

  const handleStartExam = (testId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const hasAccess = privateInfo?.tier === "premium" || (privateInfo?.purchasedTestIds || []).includes(testId);
    setSelectedTestId(testId);
    if (hasAccess) {
      setScreen("mock-test");
    } else {
      setScreen("pricing");
    }
  };

  const handlePyqOptionClick = (pyq: PYQQuestion, optionIdx: number) => {
    // If premium locked, prompt upgrade
    if (pyq.isPremiumLocked && privateInfo?.tier !== "premium" && !privateInfo?.purchasedSeries?.includes(pyq.category.toLowerCase())) {
      setScreen("pricing");
      return;
    }
    // Record selected response
    setAnsweredPyqs(prev => ({
      ...prev,
      [pyq.id]: optionIdx
    }));
  };

  const handleNextTestimonial = () => {
    setTestimonialIdx(prev => (prev + 1) % TESTIMONIALS.length);
    setActiveVideoEmbed(null);
  };

  const handlePrevTestimonial = () => {
    setTestimonialIdx(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    setActiveVideoEmbed(null);
  };

  const currentTestimonial = TESTIMONIALS[testimonialIdx];

  // Derived filtered videos list for dynamic UI catalog
  const filteredVideos = (allPrepVideos || []).filter(vid => {
    const matchesCategory = videoFilterCategory === "ALL" || vid.category === videoFilterCategory;
    const matchesSearch = !videoSearch.trim() || 
      vid.title.toLowerCase().includes(videoSearch.toLowerCase()) || 
      vid.description.toLowerCase().includes(videoSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeVideo = filteredVideos.find(v => v.videoId === selectedVideoId) || filteredVideos[0] || allPrepVideos?.[0] || null;

  const hasAccessToPyq = (pyq: PYQQuestion) => {
    if (!pyq.isPremiumLocked) return true;
    if (privateInfo?.tier === "premium") return true;
    if (privateInfo?.purchasedSeries?.includes(pyq.category.toLowerCase())) return true;
    return false;
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen relative overflow-hidden selection:bg-[#FF3B3F] selection:text-white font-sans text-left" id="landing-page-screen">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative text-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-none text-[10px] text-white font-mono uppercase tracking-widest mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF3B3F]" />
          <span>IND-CENTRIC SMART TESTING CORE V2.5 ONLINE</span>
        </motion.div>
  
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter text-white font-sans max-w-5xl mx-auto leading-none uppercase mb-8"
        >
          India's Smartest Government Exam{" "}
          <span className="text-[#FF3B3F] block mt-2">
            Test & Analytics Platform
          </span>
        </motion.h1>
  
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 text-sm sm:text-base max-w-3xl mx-auto font-sans leading-relaxed mb-12"
        >
          Master the JEE, NEET, UPSC, SSC, Banking, and Railway exams. Get millisecond accuracy trackers, detailed section-by-section scoring comparisons, and actual predicted ranks generated by our high-fidelity student performance engine.
        </motion.p>
  
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
        >
          {user ? (
            <button 
              onClick={() => setScreen("dashboard")}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#FF3B3F] hover:border-[#FF3B3F] text-black hover:text-white font-bold text-xs uppercase tracking-widest border border-white rounded-none transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#FF3B3F] hover:border-[#FF3B3F] text-black hover:text-white font-bold text-xs uppercase tracking-widest border border-white rounded-none transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setScreen("pricing")}
            className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white text-white hover:text-black font-bold text-xs uppercase tracking-widest border border-[#2A2A2A] hover:border-white rounded-none transition-all duration-200 flex items-center justify-center gap-2"
          >
            Explore Mock Plans
          </button>
        </motion.div>
      </section>
  
      {/* Trust & Stats Section */}
      <section className="bg-[#1A1A1A] border-y border-[#2A2A2A] py-14 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="border-r border-[#2A2A2A] last:border-none">
              <p className="text-4xl sm:text-5xl font-black text-white font-sans uppercase tracking-tight">1.2M+</p>
              <p className="text-[10px] font-mono text-[#666] mt-2 uppercase tracking-[0.2em]">Active Aspirants</p>
            </div>
            <div className="border-r border-[#2A2A2A] last:border-[#2A2A2A] md:last:border-none">
              <p className="text-4xl sm:text-5xl font-black text-white font-sans uppercase tracking-tight">48M+</p>
              <p className="text-[10px] font-mono text-[#666] mt-2 uppercase tracking-[0.2em]">Practice Mocks Taken</p>
            </div>
            <div className="border-r border-[#2A2A2A] last:border-none">
              <p className="text-4xl sm:text-5xl font-black text-white font-sans uppercase tracking-tight">98.4%</p>
              <p className="text-[10px] font-mono text-[#666] mt-2 uppercase tracking-[0.2em]">Accuracy Uplift</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black text-white font-sans uppercase tracking-tight">500+</p>
              <p className="text-[10px] font-mono text-[#666] mt-2 uppercase tracking-[0.2em]">Selections This Year</p>
            </div>
          </div>
        </div>
      </section>
  
      {/* Target Exams Selection Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-left">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-sans font-black text-white uppercase tracking-tight mb-4 text-center">
            Select Your Exam Stream
          </h2>
          <div className="h-[2px] w-20 bg-[#FF3B3F] mx-auto mb-5" />
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto text-center">
            Configure your testing environment dynamically. We have aligned direct question pools matching current recruitment standards of central commissions.
          </p>
        </div>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-[#111] border border-[#222222] rounded-none p-6 transition-colors duration-200 hover:border-[#FF3B3F] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-5">
                  <span className="bg-[#0A0A0A] border border-[#222] text-white px-3 py-1 rounded-none text-[10px] font-mono tracking-widest uppercase">{cat.id}</span>
                  <span className="text-[#FF3B3F] font-mono text-[10px] font-bold uppercase tracking-wider">{cat.difficulty}</span>
                </div>
                <h3 className="text-base font-bold text-white uppercase mb-2">{cat.title}</h3>
                <p className="text-xs text-[#999] mb-6 h-10 overflow-hidden line-clamp-2 leading-relaxed">{cat.desc}</p>
              </div>
              <div className="pt-4 border-t border-[#222]">
                <span className="text-[9px] text-[#666] font-mono uppercase tracking-wider">{cat.stats}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW SECTION: FREE Chapter-Wise & Subject-Wise PYQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-left font-sans">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-[#111] border border-[#222] text-red-500 px-3.5 py-1.5 rounded-none font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
            Solved Previous Year Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans font-black text-white uppercase tracking-tight mt-4">
            Previous Year chapter Solved Papers
          </h2>
          <div className="h-[2px] w-20 bg-[#FF3B3F] mx-auto mt-4 mb-5" />
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed text-center max-w-2xl mx-auto">
            Review detailed solutions for past exams structured chapter-wise. Try free items immediately or get locked segments by acquiring candidate packs.
          </p>
        </div>

        {/* Category switcher */}
        <div className="flex justify-center border-b border-[#222] mb-8 overflow-x-auto pb-px">
          {["UPSC", "JEE", "NEET"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActivePyqCategory(cat as any)}
              className={`px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest border-b-[2px] transition-all whitespace-nowrap ${
                activePyqCategory === cat 
                  ? "border-red-500 text-white" 
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {cat} PYQs
            </button>
          ))}
        </div>

        {/* Subject badges switcher */}
        {subjectsAvailable.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {subjectsAvailable.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubject(sub)}
                className={`px-4 py-2 border font-mono text-[10px] uppercase tracking-widest transition-all rounded-none ${
                  activeSubject === sub
                    ? "bg-white text-black border-white font-black"
                    : "bg-black text-slate-405 border-[#222] hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 font-mono uppercase tracking-wider py-8">No subjects currently populated.</p>
        )}

        {/* Question display list */}
        {activeSubjectPyqs.length > 0 ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {activeSubjectPyqs.map((q) => {
              const userSelectedIdx = answeredPyqs[q.id];
              const isAnswered = userSelectedIdx !== undefined;
              const hasKeyAccess = hasAccessToPyq(q);

              return (
                <div 
                  key={q.id}
                  className={`border rounded-none p-6 transition-all ${
                    isAnswered 
                      ? "bg-black border-[#222222]" 
                      : hasKeyAccess 
                        ? "bg-[#111] border-[#222222] hover:border-[#333]" 
                        : "bg-[#111111]/40 border-[#222222] opacity-85"
                  }`}
                >
                  
                  {/* Meta tag details */}
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#222] pb-3.5 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[9px] uppercase hover:underline text-slate-450 tracking-wider">
                        {q.chapter}
                      </span>
                      <span className="text-[#444] text-xs font-mono">&#8226;</span>
                      <span className="bg-black/80 text-amber-500 border border-amber-500/20 px-2 py-0.5 font-mono text-[9px] font-bold">
                        YEAR {q.year}
                      </span>
                    </div>

                    {!hasKeyAccess && (
                      <span className="flex items-center gap-1.5 text-red-500 font-mono text-[9px] font-bold uppercase tracking-widest">
                        <Lock className="w-3 h-3" /> PREMIUM PACK LOCKED
                      </span>
                    )}
                  </div>

                  {/* Question Statement */}
                  <p className="text-white text-sm leading-relaxed mb-6 font-medium whitespace-pre-line select-text">
                    {q.questionText}
                  </p>

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = userSelectedIdx === oIdx;
                      const isCorrectChoice = oIdx === q.correctOptionIndex;
                      
                      let optBtnClass = "bg-[#0A0A0A] border-[#222] text-slate-350 hover:border-slate-500";
                      
                      if (isAnswered) {
                        if (isSelected) {
                          optBtnClass = isCorrectChoice 
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                            : "bg-red-500/10 border-red-500 text-red-400 font-bold";
                        } else if (isCorrectChoice) {
                          optBtnClass = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold";
                        } else {
                          optBtnClass = "bg-[#0A0A0A] border-[#222] text-slate-500 cursor-not-allowed";
                        }
                      } else if (!hasKeyAccess) {
                        optBtnClass = "bg-[#0A0A0A]/40 border-slate-900/40 text-slate-600 cursor-not-allowed";
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={isAnswered || !hasKeyAccess}
                          onClick={() => handlePyqOptionClick(q, oIdx)}
                          className={`p-3 text-left rounded-none border text-xs uppercase tracking-wider transition-all flex items-start gap-3 ${optBtnClass}`}
                        >
                          <div className={`w-5 h-5 rounded-none flex items-center justify-center font-mono text-[10px] font-black border ${
                            isAnswered && isCorrectChoice 
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : isAnswered && isSelected && !isCorrectChoice
                                ? "bg-red-500 border-red-500 text-white"
                                : "border-[#333] text-slate-550"
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className="flex-1 leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Locked Upgrade Action Prompt */}
                  {!hasKeyAccess && (
                    <div className="bg-black/40 border border-slate-900 p-4 rounded-none text-center">
                      <p className="text-xs text-slate-400 mb-4 font-mono uppercase tracking-wide">
                        Solve all ancient papers concepts with high-yield analytics.
                      </p>
                      <button
                        onClick={() => setScreen("pricing")}
                        className="px-6 py-2.5 bg-red-500 hover:bg-white text-white hover:text-black font-mono font-black text-[10px] uppercase tracking-widest rounded-none transition-all flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Unlock {q.category} Mock Series Pack</span>
                      </button>
                    </div>
                  )}

                  {/* Solution Explanation Panel */}
                  {isAnswered && (
                    <div className="bg-[#0A0A0A] border-l-4 border-emerald-500 border-t border-r border-b border-[#222] p-4 font-sans text-xs animate-fadeIn text-left">
                      <div className="flex items-center gap-2 mb-2 text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-widest">
                        <CheckCircle className="w-4 h-4" /> Comprehensive Solver Key
                      </div>
                      <p className="text-slate-350 leading-relaxed max-w-3xl select-text">
                        {q.explanation}
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-xs text-[#666] font-mono py-12 uppercase tracking-widest">Questions list loading...</p>
        )}

      </section>

      {/* Bento Showcase Details */}
      <section className="bg-[#1A1A1A] py-24 border-t border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-white uppercase tracking-tight mb-4">
              Pristine Technical Capabilities
            </h2>
            <div className="h-[2px] w-20 bg-[#FF3B3F] mx-auto mb-5" />
            <p className="text-slate-400 text-xs sm:text-sm">
              Precision metrics designed to target and eliminate learning errors on the spot.
            </p>
          </div>
  
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            
            {/* Bento Card 1 */}
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-none p-8 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-none w-12 h-12 flex items-center justify-center mb-6">
                  <BrainCircuit className="w-5 h-5 text-[#FF3B3F]" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3">Real-time AI Rank Prediction</h3>
                <p className="text-slate-400 text-xs mb-8 leading-relaxed">
                  Our smart profiling script calculates cumulative mock test metrics with peer data, estimating your nationwide All India Rank (AIR) on the spot. Receive instant targets on accuracy percentages needed to bridge selection holes.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-[#1A1A1A] p-4 border border-[#2A2A2A] rounded-none text-[10px] font-mono uppercase">
                <Activity className="w-4 h-4 text-[#FF3B3F] animate-pulse" />
                <span className="text-[#64748b]">Live Prediction Tracker:</span>
                <span className="text-[#FF3B3F] font-bold ml-auto">AIR #1,250 (91.4% percentile)</span>
              </div>
            </div>
  
            {/* Bento Card 2 */}
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-none p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-none w-12 h-12 flex items-center justify-center mb-6">
                  <Target className="w-5 h-5 text-[#FF3B3F]" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-3">Subject-Level Accuracy</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Isolate weaknesses. Spot if Quant time overruns, or English grammar accuracy slips. Monitor metrics on subject accuracy mapping.
                </p>
              </div>
              <ul className="space-y-2.5 text-[10px] font-mono uppercase tracking-wider">
                <li className="flex justify-between items-center bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-2.5 rounded-none">
                  <span className="text-slate-400">Polity & Constitution</span>
                  <span className="text-white font-bold">84% Acc</span>
                </li>
                <li className="flex justify-between items-center bg-[#1A1A1A] border border-[#FF3B3F] px-4 py-2.5 rounded-none">
                  <span className="text-slate-400">Quantitative Aptitude</span>
                  <span className="text-[#FF3B3F] font-bold">51% Acc (Weak Choice)</span>
                </li>
              </ul>
            </div>
  
          </div>
        </div>
      </section>
  
      {/* Active Mock Papers Listing for Practice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 font-sans text-left">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-sans font-black text-white uppercase tracking-tight">
              Featured Challenge Papers
            </h2>
            <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-wider">
              Select any live standard mock papers. Real time simulation with evaluation.
            </p>
          </div>
          <button 
            onClick={() => {
              if (user) setScreen("dashboard");
              else onOpenAuth();
            }}
            className="flex items-center gap-1.5 text-xs text-[#FF3B3F] font-bold uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
          >
            <span>View all practice pools</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {(allMockTests || DEFAULT_MOCK_TESTS).map((test) => {
            const hasAccess = privateInfo?.tier === "premium" || (privateInfo?.purchasedTestIds || []).includes(test.testId);
            return (
              <div 
                key={test.testId}
                className="bg-[#111] border border-[#222222] rounded-none p-6 flex flex-col justify-between hover:border-[#FF3B3F] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 text-[10px] font-mono uppercase">
                    <span className="bg-[#0A0A0A] border border-[#222] text-[#FF3B3F] px-3 py-1 font-bold tracking-wider">{test.category}</span>
                    <span className="text-[#666] flex items-center gap-1 tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      {test.durationMinutes} minutes
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 leading-snug uppercase tracking-tight">{test.title}</h3>
                  <p className="text-xs text-[#666] line-clamp-2 mb-6 leading-relaxed">
                    Practice standard {test.category} test syllabus containing exactly {test.questionsCount} high-yield multiple choice questions. Includes full reviews, timing statistics, and model references.
                  </p>
                </div>
    
                <div className="flex items-center justify-between pt-4 border-t border-[#222] mt-2">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-mono uppercase text-[#666]">Difficulty: <span className="text-white font-bold">{test.difficulty}</span></span>
                    {user && (
                      <span className="text-[9px] font-mono uppercase mt-1 flex items-center gap-1">
                        {hasAccess ? (
                          <span className="text-emerald-400">● Prep Ready</span>
                        ) : (
                          <span className="text-amber-500">🔒 Premium (₹149)</span>
                        )}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleStartExam(test.testId)}
                    className={`px-5 py-2.5 ${hasAccess ? "bg-white hover:bg-[#FF3B3F] text-black hover:text-white border-white hover:border-[#FF3B3F]" : "bg-transparent hover:bg-[#FF3B3F] text-[#FF3B3F] hover:text-white border border-[#FF3B3F]"} font-bold text-[10px] uppercase tracking-widest rounded-none border transition-all duration-200 flex items-center gap-1.5 shadow-none cursor-pointer`}
                  >
                    <span>{hasAccess ? "Start Mock" : "Buy Mock (₹149)"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic Exam Prep Video Masterclasses (Real-time synced) */}
      <section className="bg-[#0D0D0D] border-t border-[#1F1F1F] py-24 text-left relative" id="prep-videos-portal-home">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="bg-[#1C1112] border border-[#FF3B3F]/20 text-[#FF3B3F] font-mono text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-none">
                VIRTUAL MASTERCLASSES
              </span>
              <h2 className="text-3xl font-sans font-black text-white uppercase tracking-tight mt-4">
                Exam Prep Lecture videocasts
              </h2>
              <p className="text-slate-400 text-xs mt-1 max-w-2xl">
                High-yield conceptual reviews and dynamic strategies published by system administrators. Filter by exam stream to start watching.
              </p>
            </div>

            {/* Search Input bar */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search lectures, topics..."
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] text-white focus:border-[#FF3B3F] text-xs px-4 py-3 pb-3 pr-10 focus:outline-none rounded-none placeholder-slate-650 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
            </div>
          </div>

          {/* Category Filter Pills bar */}
          <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2">
            {["ALL", "UPSC", "JEE", "NEET", "SSC", "Banking", "Railways", "General"].map((cat) => {
              const isActive = videoFilterCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setVideoFilterCategory(cat);
                    setSelectedVideoId(null); // Reset playing video on category change
                  }}
                  className={`px-4 py-2 border font-mono text-[10px] font-bold uppercase transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#FF3B3F] border-[#FF3B3F] text-white"
                      : "bg-[#111111] border-[#222222] text-slate-400 hover:text-white"
                  }`}
                >
                  {cat === "ALL" ? "All Streams" : cat}
                </button>
              );
            })}
          </div>

          {/* Main Visual Dual Panel (Stage & Sidebar deck) */}
          {activeVideo ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Side: Active Play Stage Console */}
              <div className="lg:col-span-2 bg-[#111111] border border-[#222222] p-5">
                <div className="aspect-video w-full bg-[#050505] relative mb-5 group border border-[#1A1A1A]">
                  <iframe
                    title={activeVideo.title}
                    src={activeVideo.videoUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-[#1C1112] border border-[#FF3B3F]/20 text-[#FF3B3F] px-2.5 py-0.5 font-mono font-bold text-[9px] uppercase tracking-wider">
                    {activeVideo.category}
                  </span>
                  <span className="text-[#64748b] flex items-center gap-1 font-mono text-[10px]">
                    <Clock className="w-3 h-3" />
                    {activeVideo.durationText}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2 leading-snug">
                  {activeVideo.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-4xl">
                  {activeVideo.description}
                </p>

                <div className="mt-6 pt-4 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase">
                  <span>Class ID: {activeVideo.videoId}</span>
                  <span className="text-emerald-500 font-bold tracking-wider animate-fadeIn flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse" /> Live Broadcast Core
                  </span>
                </div>
              </div>

              {/* Right Side: Scrollable Lecture Deck */}
              <div className="bg-[#111111] border border-[#222222] p-5 flex flex-col h-full max-h-[580px] overflow-hidden">
                <div className="pb-3 border-b border-[#222] mb-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Syllabus Lectures Catalog ({filteredVideos.length})
                  </h4>
                </div>

                {filteredVideos.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <p className="text-sm">No other matches in target pool.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {filteredVideos.map((vid) => {
                      const isCurrent = activeVideo.videoId === vid.videoId;
                      return (
                        <div
                          key={vid.videoId}
                          onClick={() => setSelectedVideoId(vid.videoId)}
                          className={`p-4 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                            isCurrent
                              ? "bg-[#1C1112] border-l-2 border-[#FF3B3F] text-white"
                              : "bg-[#090909] border border-transparent hover:border-[#222] text-slate-300 hover:text-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 ${
                                isCurrent 
                                  ? "bg-[#FF3B3F] text-white" 
                                  : "bg-[#141414] text-[#FF3B3F] border border-[#222]"
                              }`}>
                                {vid.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {vid.durationText}
                              </span>
                            </div>

                            <p className="text-xs font-bold font-sans tracking-tight mb-1 font-semibold line-clamp-2">
                              {vid.title}
                            </p>
                            <p className="text-[10px] text-slate-550 line-clamp-1">
                              {vid.description}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-end text-[9px] font-mono uppercase tracking-wider font-semibold text-[#FF3B3F]">
                            {isCurrent ? (
                              <span className="flex items-center gap-1 text-[8px] tracking-widest text-[#FF3B3F]">
                                NOW PLAYING
                              </span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                SELECT LECTURE &rarr;
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#111111] border border-[#222222] p-16 text-center">
              <Video className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-white uppercase tracking-tight mb-2">No videos match selection</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No exam preparation videocasts could be settled matching search keyword "{videoSearch}" or stream selection. Clear search filters to load other videos.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVideoSearch("");
                  setVideoFilterCategory("ALL");
                  setSelectedVideoId(null);
                }}
                className="mt-6 px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider font-mono hover:bg-[#FF3B3F] hover:text-white transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* NEW SECTION: Video Testimonials & Carousel (Fully Integrated) */}
      <section className="bg-black py-24 border-t border-[#222222] relative text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-[#111] border border-[#222] text-red-500 px-3 py-1 text-[9px] font-mono font-black uppercase tracking-widest">
              PEER CONFLICT STORIES
            </span>
            <h2 className="text-3xl font-sans font-black text-white uppercase tracking-tight mt-4 text-center">
              Aspirants Words & Video Testimonials
            </h2>
            <div className="h-[2px] w-20 bg-red-400 mx-auto mt-4" />
          </div>

          <div className="max-w-4xl mx-auto bg-[#111111] border border-[#222222] p-8 md:p-12 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center lg:gap-12">
              
              {/* Photo & Video Playback */}
              <div className="relative aspect-video md:aspect-square bg-black border border-[#222] flex items-center justify-center overflow-hidden group">
                {currentTestimonial.videoUrl && activeVideoEmbed === currentTestimonial.id ? (
                  <iframe 
                    src={currentTestimonial.videoUrl} 
                    title="Video Testimonial Speaker"
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img 
                      src={currentTestimonial.photoUrl} 
                      alt={currentTestimonial.name} 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-300"
                    />
                    
                    {currentTestimonial.videoUrl && (
                      <button 
                        onClick={() => setActiveVideoEmbed(currentTestimonial.id)}
                        className="w-16 h-16 bg-red-500 hover:bg-white text-white hover:text-black rounded-none flex items-center justify-center transition-all border border-red-500 hover:border-white z-10"
                      >
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </button>
                    )}
                  </>
                )}
                
                {/* Score Absolute Badge */}
                <span className="absolute bottom-4 left-4 bg-black border border-[#222] text-white font-mono font-bold text-[10px] px-3 py-1 uppercase tracking-wide">
                  {currentTestimonial.scoreAchieved}
                </span>
              </div>

              {/* Review Text */}
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <span className="text-xs text-red-500 font-mono uppercase tracking-widest font-black">
                    {currentTestimonial.examName} SUCCESS
                  </span>
                  
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mt-2.5">
                    {currentTestimonial.name}
                  </h3>
                  
                  <p className="text-slate-400 text-xs sm:text-sm mt-4 leading-relaxed italic select-all">
                    "{currentTestimonial.feedback}"
                  </p>
                </div>

                {/* Sliding Controls */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#222] mt-4">
                  <button 
                    onClick={handlePrevTestimonial}
                    className="p-2.5 bg-black hover:bg-[#111] border border-[#222] text-slate-400 hover:text-white rounded-none transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs text-slate-500">
                    {testimonialIdx + 1} / {TESTIMONIALS.length}
                  </span>
                  <button 
                    onClick={handleNextTestimonial}
                    className="p-2.5 bg-black hover:bg-[#111] border border-[#222] text-slate-400 hover:text-white rounded-none transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
  
      {/* Footer Branding Area */}
      <footer className="bg-[#111] border-t border-[#222222] py-16 text-center text-slate-500 text-[10px] font-mono tracking-wider uppercase leading-6 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-4 text-white font-sans font-bold text-xs uppercase tracking-widest text-center">ElitePrep Smart Platform</p>
          <div className="h-[1px] w-24 bg-[#2A2A2A] mx-auto mb-6" />
          <p className="mb-1 text-center">Platform ID: <span className="text-white">ab6f9a64-4258-450a-8646-6f98abe02d0f</span></p>
          <p className="text-center">Protected by Attribute-Based Access Control and Zero-Trust Firestore Security Policies.</p>
          <p className="text-[9px] text-[#444] mt-6 font-mono text-center">&copy; {new Date().getFullYear()} ElitePrep INC. All India Rights Reserved.</p>
        </div>
      </footer>
  
    </div>
  );
}
