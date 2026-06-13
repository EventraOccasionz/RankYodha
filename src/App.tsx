import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import LandingPage from "./screens/LandingPage";
import StudentDashboard from "./screens/StudentDashboard";
import MockTestScreen from "./screens/MockTestScreen";
import ResultAnalyticsScreen from "./screens/ResultAnalyticsScreen";
import PricingScreen from "./screens/PricingScreen";
import AdminDashboard from "./screens/AdminDashboard";
import { UserAttempt } from "./types";

export function StandardMain() {
  const { domainError, setDomainError } = useAuth();
  const [screen, setScreen] = useState<"landing" | "dashboard" | "mock-test" | "results" | "pricing" | "admin">("landing");
  const [selectedTestId, setSelectedTestId] = useState<string>("upsc_mock_1");
  const [selectedAttempt, setSelectedAttempt] = useState<UserAttempt | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);

  const renderActiveScreen = () => {
    switch (screen) {
      case "landing":
        return <LandingPage setScreen={setScreen} setSelectedTestId={setSelectedTestId} onOpenAuth={() => setAuthModalOpen(true)} />;
      case "dashboard":
        return (
          <StudentDashboard 
            setScreen={setScreen} 
            setSelectedTestId={setSelectedTestId} 
            setSelectedAttempt={(att) => {
              setSelectedAttempt(att);
              setScreen("results");
            }} 
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        );
      case "mock-test":
        return (
          <MockTestScreen 
            testId={selectedTestId} 
            setScreen={setScreen} 
            setSelectedAttempt={(att) => {
              setSelectedAttempt(att);
              setScreen("results");
            }} 
          />
        );
      case "results":
        return selectedAttempt ? (
          <ResultAnalyticsScreen attempt={selectedAttempt} setScreen={setScreen} />
        ) : (
          <StudentDashboard 
            setScreen={setScreen} 
            setSelectedTestId={setSelectedTestId} 
            setSelectedAttempt={setSelectedAttempt} 
            onOpenAuth={() => setAuthModalOpen(true)} 
          />
        );
      case "pricing":
        return <PricingScreen setScreen={setScreen} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <LandingPage setScreen={setScreen} setSelectedTestId={setSelectedTestId} onOpenAuth={() => setAuthModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-[#F5F5F5] antialiased flex flex-col justify-between selection:bg-[#FF3B3F] selection:text-white">
      <div className="flex-1 flex flex-col">
        <Header currentScreen={screen} setScreen={setScreen} onOpenAuth={() => setAuthModalOpen(true)} />
        
        {domainError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full animate-fadeIn" id="domain-authorization-alert">
            <div className="bg-[#111111] border-l-4 border-[#FF3B3F] border-t border-r border-b border-[#222222] p-6 text-slate-200 shadow-xl relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222222] pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#FF3B3F] inline-block animate-pulse"></span>
                    Firebase Environment Integration Note
                  </h3>
                  <p className="text-xs text-[#999] mt-1">
                    Your custom Firebase web config <span className="font-mono text-white bg-[#222] px-1.5 py-0.5 font-bold text-[11px]">examforge-a295f</span> requires additional setup to authenticate live sessions.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.hostname);
                      setCopiedHost(true);
                      setTimeout(() => setCopiedHost(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#2C2C2C] border border-[#333] text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all min-w-[110px] text-center"
                  >
                    {copiedHost ? "Copied!" : "Copy Domain"}
                  </button>
                  <button 
                    onClick={() => setDomainError(false)}
                    className="px-3 py-1.5 bg-[#FF3B3F] hover:bg-[#D62E32] text-white text-[10px] uppercase font-bold tracking-wider transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  ⚡ <strong className="text-white font-extrabold">Sandbox Mode Engaged Automatically:</strong> Since the auth popup was blocked, the domain is unauthorized, or the Firestore database is offline/not initialized, we have securely booted a local sandbox session. You can try all mock tests, detailed analytics, and diagnostic trackers immediately!
                </p>
                <div className="bg-[#181818] border border-[#222] p-4 text-slate-300">
                  <p className="font-bold text-white uppercase tracking-wider text-[10px] mb-2 font-mono">To sync with your live Firebase credentials:</p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-400">
                    <li>
                      <strong className="text-white">Popup Blocked:</strong> If you saw a popup alert or Google button did not load, please allow popups for this domain in your browser address bar.
                    </li>
                    <li>
                      <strong className="text-white">Unauthorized Domain:</strong> Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#FF3B3F] hover:underline font-bold">Firebase Console</a> &rarr; <strong className="text-white">Authentication</strong> &rarr; <strong className="text-white">Settings</strong> &rarr; <strong className="text-white">Authorized domains</strong>. Click <strong className="text-white">Add domain</strong> and save: <code className="text-white font-mono bg-[#2C2C2C] px-1.5 py-0.5 border border-[#444] rounded select-all font-bold">{window.location.hostname}</code>
                    </li>
                    <li>
                      <strong className="text-white">Offline/Unreachable DB:</strong> Make sure you have created a <strong className="text-white">Firestore Database</strong> in your Firebase project (<strong className="text-white">examforge-a295f</strong>), and the security rules allow read/writes!
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 pb-12">
          {renderActiveScreen()}
        </main>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {/* Modernist Marquee Ticker Footer */}
      <footer className="h-12 bg-[#FF3B3F] flex items-center overflow-hidden border-t border-[#2A2A2A] select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-[#0A0A0A] text-[9px] font-black uppercase tracking-[0.2em]">
          <span className="flex items-center gap-3 italic">Modernist Principles Applied <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Minimalism as a Weapon <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Digital Architecture <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Structure First <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Aesthetic Last <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          
          <span className="flex items-center gap-3 italic">Modernist Principles Applied <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Minimalism as a Weapon <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Digital Architecture <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Structure First <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
          <span className="flex items-center gap-3 italic">Aesthetic Last <div className="w-2 h-2 bg-[#0A0A0A]" /></span>
        </div>
      </footer>
    </div>
  );

}

export default function App() {
  return (
    <AuthProvider>
      <StandardMain />
    </AuthProvider>
  );
}
