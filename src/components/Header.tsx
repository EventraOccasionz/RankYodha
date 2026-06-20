import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  BookOpen, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Crown, 
  ChevronDown, 
  LayoutDashboard,
  Sparkles,
  BarChart2,
  Settings,
  Menu,
  X
} from "lucide-react";

interface HeaderProps {
  currentScreen: string;
  setScreen: (screen: any) => void;
  onOpenAuth: () => void;
}

export default function Header({ currentScreen, setScreen, onOpenAuth }: HeaderProps) {
  const { user, profile, privateInfo, signInWithGoogle, logout, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine if user has premium status
  const isPremium = privateInfo?.tier === "premium";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0A0A] border-b border-[#2A2A2A] text-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo and Brand */}
        <div 
          onClick={() => setScreen("landing")} 
          className="flex items-center gap-3.5 cursor-pointer select-none group"
          id="brand-logo"
        >
          <div className="p-1 px-2.5 bg-white text-black font-extrabold text-sm tracking-tighter border border-white rounded-none transition-all duration-200 group-hover:bg-[#FF3B3F] group-hover:border-[#FF3B3F] group-hover:text-white">
            EP
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold tracking-tight text-lg text-white uppercase">
                ElitePrep
              </span>
              {isPremium && (
                <span className="bg-[#FF3B3F] text-white text-[9px] px-1.5 py-0.5 rounded-none font-mono font-bold tracking-wider">
                  PRO
                </span>
              )}
            </div>
            <p className="font-mono text-[9px] text-[#666] uppercase tracking-[0.25em] mt-px">Precision Mentor</p>
          </div>
        </div>

        {/* Global Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-widest font-bold">
          <button 
            onClick={() => setScreen("landing")}
            className={`hover:text-white transition-colors py-1 relative ${currentScreen === "landing" ? "text-white" : "text-[#666]"}`}
          >
            Home
            {currentScreen === "landing" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF3B3F]" />
            )}
          </button>
          {user && (
            <button 
              onClick={() => setScreen("dashboard")}
              className={`hover:text-white transition-colors py-1 relative ${currentScreen === "dashboard" ? "text-white" : "text-[#666]"}`}
            >
              Dashboard
              {currentScreen === "dashboard" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF3B3F]" />
              )}
            </button>
          )}
          <button 
            onClick={() => setScreen("pricing")}
            className={`hover:text-white transition-colors py-1 relative ${currentScreen === "pricing" ? "text-white" : "text-[#666]"}`}
          >
            Premium Plans
            {currentScreen === "pricing" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF3B3F]" />
            )}
          </button>
        </nav>

        {/* User login / status area */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-none transition-colors text-left text-xs text-slate-200 uppercase font-mono tracking-wider"
                id="user-profile-dropdown-btn"
              >
                <img 
                  src={profile?.avatarUrl || user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
                  alt="Avatar" 
                  className="w-5 h-5 rounded-none border border-[#2A2A2A]"
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold max-w-[100px] truncate">{profile?.name || user.displayName || "Aspirant"}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Simple elegant dropdown */}
              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-[#0A0A0A] border-t-2 border-t-[#FF3B3F] border border-[#2A2A2A] rounded-none shadow-2xl py-2 z-50 text-slate-100 font-sans"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-[#2A2A2A]">
                    <p className="text-[9px] text-[#666] font-mono uppercase tracking-widest">Exam Focus</p>
                    <p className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">{profile?.examCategory || "UPSC"} Aspirant</p>
                  </div>
                  
                  <button 
                    onClick={() => { setScreen("dashboard"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest font-bold text-[#999] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#FF3B3F]" />
                    My Dashboard
                  </button>

                  <button 
                    onClick={() => { setScreen("pricing"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest font-bold text-[#999] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    <Crown className="w-4 h-4 text-[#FF3B3F]" />
                    Upgrade System
                  </button>

                  <button 
                    onClick={() => { setScreen("settings"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest font-bold text-[#999] hover:bg-[#1A1A1A] hover:text-white transition-colors border-t border-[#2A2A2A]"
                  >
                    <Settings className="w-4 h-4 text-[#FF3B3F]" />
                    Personal Settings
                  </button>

                  {/* Admin panel access */}
                  {isAdmin && (
                    <button 
                      onClick={() => { setScreen("admin"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest font-bold text-[#999] hover:bg-[#1A1A1A] hover:text-white transition-colors border-t border-[#2A2A2A]"
                    >
                      <Shield className="w-4 h-4 text-[#FF3B3F]" />
                      Admin Board
                    </button>
                  )}

                  <button 
                    onClick={() => { logout(); setDropdownOpen(false); setScreen("landing"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest font-bold text-[#FF3B3F] hover:bg-[#FF3B3F]/10 transition-colors border-t border-[#2A2A2A] mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-white hover:bg-[#FF3B3F] hover:border-[#FF3B3F] border border-white text-black hover:text-white text-[10px] uppercase font-bold tracking-widest px-6 py-2.5 rounded-none transition-all duration-200 cursor-pointer"
                id="google-login-btn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sign In
              </button>
            </div>
          )}

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden p-2 text-[#999] hover:text-white border border-transparent hover:border-[#2A2A2A] bg-transparent hover:bg-[#1A1A1A] transition-all focus:outline-none ml-1"
            aria-label="Toggle navigation menu"
            id="mobile-nav-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav className="md:hidden flex flex-col bg-[#0A0A0A] border-t border-[#1C1C1C] px-6 py-4 space-y-3.5 text-[10px] font-mono font-bold tracking-widest uppercase">
          <button 
            onClick={() => { setScreen("landing"); setMobileMenuOpen(false); }}
            className={`text-left hover:text-white transition-colors py-2 border-b border-[#1A1A1A] ${currentScreen === "landing" ? "text-[#FF3B3F]" : "text-[#999]"}`}
            id="mobile-nav-home-btn"
          >
            Home
          </button>
          {user && (
            <button 
              onClick={() => { setScreen("dashboard"); setMobileMenuOpen(false); }}
              className={`text-left hover:text-white transition-colors py-2 border-b border-[#1A1A1A] ${currentScreen === "dashboard" ? "text-[#FF3B3F]" : "text-[#999]"}`}
              id="mobile-nav-dashboard-btn"
            >
              Dashboard
            </button>
          )}
          <button 
            onClick={() => { setScreen("pricing"); setMobileMenuOpen(false); }}
            className={`text-left hover:text-white transition-colors py-2 border-b border-[#1A1A1A] ${currentScreen === "pricing" ? "text-[#FF3B3F]" : "text-[#999]"}`}
            id="mobile-nav-pricing-btn"
          >
            Premium Plans
          </button>
        </nav>
      )}
    </header>
  );
}
