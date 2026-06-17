import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_MOCK_TESTS } from "../data/mockTestData";
import { MockTest } from "../types";
import { 
  Crown, 
  Check, 
  ArrowLeft, 
  CreditCard, 
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Gift,
  AlertTriangle,
  Award,
  BookOpen
} from "lucide-react";

interface PricingScreenProps {
  setScreen: (screen: string) => void;
  allMockTests?: MockTest[];
  initialSelectedTestId?: string;
  setSelectedTestId?: (testId: string) => void;
}

export default function PricingScreen({ setScreen, allMockTests, initialSelectedTestId, setSelectedTestId }: PricingScreenProps) {
  const { user, privateInfo, purchaseMockTest, signInWithGoogle } = useAuth();
  
  // Coupon state
  const [coupon, setCoupon] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");

  const originalTestPrice = 299;
  const currentTestPrice = 149;

  // Selected payment item state
  const [selectedItem, setSelectedItem] = useState<{
    type: "mock";
    id: string;
    name: string;
    originalPrice: number;
    price: number;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbank">("upi");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "processing" | "success">("idle");

  const testsList = allMockTests || DEFAULT_MOCK_TESTS;
  const purchasedTestIds = privateInfo?.purchasedTestIds || [];
  const isPremiumUser = privateInfo?.tier === "premium";

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === "TOPPER50") {
      setDiscountApplied(true);
      setDiscountError("");
      // Dynamically adjust current checkout item if open
      if (selectedItem) {
        setSelectedItem(prev => prev ? {
          ...prev,
          price: Math.round(currentTestPrice * 0.5)
        } : null);
      }
    } else {
      setDiscountError("Invalid coupon code! Try TOPPER50 for 50% discount.");
    }
  };

  const handleMockTestCheckout = (test: MockTest) => {
    if (!user) {
      if (setSelectedTestId) setSelectedTestId(test.testId);
      setScreen("landing");
      return;
    }
    setSelectedItem({
      type: "mock",
      id: test.testId,
      name: test.title,
      originalPrice: originalTestPrice,
      price: discountApplied ? Math.round(currentTestPrice * 0.5) : currentTestPrice
    });
    setCheckoutStatus("idle");
  };

  const processMockPayment = async () => {
    if (!selectedItem) return;
    setCheckoutStatus("processing");
    
    // Simulate Razorpay secure payment gateways
    setTimeout(async () => {
      try {
        await purchaseMockTest(selectedItem.id);
        setCheckoutStatus("success");
      } catch (err) {
        console.error("Razorpay simulated payment verification failure: ", err);
        setCheckoutStatus("idle");
      }
    }, 1800);
  };

  // Auto-open checkout modal if initialSelectedTestId is given and not yet purchased
  useEffect(() => {
    if (initialSelectedTestId) {
      const alreadyPurchased = isPremiumUser || purchasedTestIds.includes(initialSelectedTestId);
      if (!alreadyPurchased) {
        const matchingTest = testsList.find(t => t.testId === initialSelectedTestId);
        if (matchingTest) {
          setSelectedItem({
            type: "mock",
            id: matchingTest.testId,
            name: matchingTest.title,
            originalPrice: originalTestPrice,
            price: discountApplied ? Math.round(currentTestPrice * 0.5) : currentTestPrice
          });
          setCheckoutStatus("idle");
        }
      }
    }
  }, [initialSelectedTestId, testsList, purchasedTestIds, isPremiumUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-slate-100 min-h-screen" id="pricing-screen">
      
      {/* Return Navigation */}
      <button 
        onClick={() => {
          if (setSelectedTestId) setSelectedTestId("");
          setScreen("landing");
        }}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors uppercase font-mono tracking-widest mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </button>

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-none text-[10px] text-red-400 font-mono mb-4 uppercase tracking-widest font-bold">
          <Crown className="w-3.5 h-3.5 fill-red-400/20" /> Pay-Per-Test Hub
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase mb-4">
          Individual Mock Exam Store
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
          We have removed subscription plans and package deals. Now, buy only the individual CBT mock tests you wish to practice, with a lifetime validity! Price per test is ₹149.
        </p>
      </div>

      {isPremiumUser && (
        <div className="max-w-xl mx-auto bg-[#111] border border-red-500/30 rounded-none p-8 text-center mb-12">
          <Crown className="w-10 h-10 text-red-500 fill-red-500/20 mx-auto mb-4 animate-pulse" />
          <h3 className="text-md font-sans font-bold uppercase tracking-tight text-white mb-2">Unlimited Access Active!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
            All mock series papers, detailed stats, timing reports and performance blueprints are fully unlocked for your student profile.
          </p>
          <button
            onClick={() => setScreen("dashboard")}
            className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-[#FF3B3F] text-black hover:text-white font-mono font-black text-xs uppercase tracking-widest rounded-none transition-all duration-200"
          >
            Launch Prep Dashboard
          </button>
        </div>
      )}

      {/* Coupon Application Box */}
      {!isPremiumUser && (
        <div className="max-w-md mx-auto bg-[#111] border border-[#222] rounded-none p-6 mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-4 h-4 text-red-500" />
            <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300">Have a Promotional Coupon?</h4>
          </div>

          <div className="flex gap-2.5">
            <input 
              type="text" 
              placeholder="e.g. TOPPER50"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              disabled={discountApplied}
              className="flex-1 bg-black border border-[#222] focus:border-red-500 rounded-none px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none uppercase"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={discountApplied}
              className="px-6 py-3 bg-white hover:bg-[#FF3B3F] disabled:bg-[#222] text-black disabled:text-slate-500 font-mono font-black text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer"
            >
              Apply
            </button>
          </div>

          {discountApplied && (
            <p className="text-xs font-mono text-emerald-400 mt-3.5">Coupon applied! 50% discount reflected on checkout prices.</p>
          )}
          {discountError && (
            <p className="text-xs font-mono text-red-400 mt-3.5">{discountError}</p>
          )}
        </div>
      )}

      {/* Individual CBT Papers Selection */}
      <div className="mb-20">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#666] font-mono mb-8 border-b border-[#2A2A2A] pb-4">
          All Available Mock Exam Papers
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testsList.map((test) => {
            const hasPurchased = isPremiumUser || purchasedTestIds.includes(test.testId);
            const finalPrice = discountApplied ? Math.round(currentTestPrice * 0.5) : currentTestPrice;

            return (
              <div 
                key={test.testId} 
                className={`bg-[#111111] border ${
                  test.testId === initialSelectedTestId ? "border-red-500" : "border-[#222222]"
                } hover:border-[#FF3B3F] rounded-none p-6 flex flex-col justify-between transition-colors duration-250 relative overflow-hidden group`}
              >
                {hasPurchased && (
                  <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
                    UNLOCKED / PLAYABLE
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-black border border-[#222] text-red-500 px-3 py-1 text-[9px] font-mono uppercase tracking-widest inline-block">
                      {test.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {test.questionsCount} Questions
                    </span>
                  </div>
                  
                  <h3 className="text-base font-black text-white uppercase tracking-tight mb-2 group-hover:text-red-500 transition-colors">
                    {test.title}
                  </h3>
                  
                  <p className="text-xs text-[#999] leading-relaxed mb-6 h-12 overflow-hidden line-clamp-2">
                    Comprehensive full length {test.category} syllabus series designed for real-time exam-simulation setup.
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-6 border-y border-[#222] py-4">
                    {discountApplied && (
                      <span className="text-xs line-through text-[#666]">₹{currentTestPrice}</span>
                    )}
                    <span className="text-2xl font-mono font-black text-white">
                      {hasPurchased ? "FREE / OWNED" : `₹${finalPrice}`}
                    </span>
                    {!hasPurchased && (
                      <span className="text-[10px] font-mono text-slate-500 uppercase">/ Life Validity</span>
                    )}
                  </div>

                  {/* Bullet features */}
                  <ul className="space-y-2.5 mb-8">
                    <li className="flex items-start gap-2 text-xs">
                      <Check className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Millisecond accuracy stats reports</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Check className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Comprehensive score model solutions keys</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Check className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">All India predicted ranks comparator</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      if (hasPurchased) {
                        if (setSelectedTestId) setSelectedTestId(test.testId);
                        setScreen("mock-test");
                      } else {
                        handleMockTestCheckout(test);
                      }
                    }}
                    className={`w-full py-3 font-mono font-black text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer ${
                      hasPurchased
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                        : "bg-white text-black hover:bg-red-500 hover:text-white"
                    }`}
                  >
                    {hasPurchased ? "Solve Practice Paper" : "Unlock Mock Test"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Razorpay Mock Checkout Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans text-slate-100 animate-fadeIn">
          <div className="bg-[#111111] border-2 border-red-500 rounded-none max-w-sm w-full shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-black border-b border-[#222] relative">
              <span className="text-[9px] font-mono uppercase bg-red-500/10 text-red-400 px-2 py-0.5 rounded-none border border-red-500/20 tracking-widest font-bold">SECURE CBT CHECKOUT</span>
              <h3 className="text-base font-black text-white mt-3 leading-none uppercase tracking-tight">Razorpay Online Gateway</h3>
              <p className="text-[9px] text-[#666] font-mono mt-1 uppercase tracking-widest">Processing order for ElitePrep INC.</p>

              <button 
                onClick={() => {
                  setSelectedItem(null);
                  if (setSelectedTestId) setSelectedTestId("");
                }}
                disabled={checkoutStatus === "processing"}
                className="absolute top-4 right-4 text-[#666] hover:text-white font-mono text-xs uppercase hover:underline"
              >
                Cancel
              </button>
            </div>

            {checkoutStatus === "processing" ? (
              <div className="p-8 text-center bg-black/50">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-2">Authenticating Gateway...</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto font-mono">WAITING FOR SECURE SYSTEM CLEARANCE BLUEPRINT...</p>
              </div>
            ) : checkoutStatus === "success" ? (
              <div className="p-8 text-center bg-black/50">
                <Check className="w-12 h-12 text-emerald-400 mx-auto mb-4 bg-emerald-500/10 p-2.5 rounded-none border border-emerald-500/30" />
                <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Transaction Standard OK!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Payment of ₹{selectedItem.price} verified by Razorpay API. This CBT exam is fully unlocked in your account!
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { 
                      setSelectedItem(null); 
                      if (setSelectedTestId) setSelectedTestId(selectedItem.id); 
                      setScreen("mock-test"); 
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs uppercase tracking-widest rounded-none cursor-pointer"
                  >
                    Start practicing now
                  </button>
                  <button
                    onClick={() => { 
                      setSelectedItem(null); 
                      if (setSelectedTestId) setSelectedTestId(""); 
                      setScreen("dashboard"); 
                    }}
                    className="w-full py-3 bg-[#1F1F1F] hover:bg-[#2F2F2F] text-slate-200 font-mono font-black text-xs uppercase tracking-widest rounded-none cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-black/30">
                
                {/* stats summary */}
                <div className="bg-black border border-[#222] rounded-none p-4 mb-6">
                  <p className="text-[9px] text-[#666] font-mono uppercase leading-none mb-1 tracking-wider text-left font-bold">EXAM ITEM SELECT</p>
                  <p className="text-xs font-black text-white uppercase tracking-tight text-left leading-normal">{selectedItem.name}</p>
                  <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-[#222]">
                    <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">TOTAL PRICING</span>
                    <span className="text-xl font-mono font-black text-white">₹{selectedItem.price}</span>
                  </div>
                </div>

                {/* Simulated payment options */}
                <h4 className="text-[9px] font-bold uppercase font-mono text-slate-400 mb-2.5 tracking-widest text-left">SELECT PAY CHANNEL</h4>
                <div className="space-y-2 mb-6 text-xs text-left">
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={`w-full p-3.5 rounded-none border flex items-center justify-between text-left transition-colors ${
                      paymentMethod === "upi" ? "bg-red-500/5 border-red-500 text-white font-bold" : "bg-black hover:bg-[#111] border-[#222] text-slate-400"
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider">Unified UPI (GPay/PhonePe)</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full p-3.5 rounded-none border flex items-center justify-between text-left transition-colors ${
                      paymentMethod === "card" ? "bg-red-500/5 border-red-500 text-white font-bold" : "bg-black hover:bg-[#111] border-[#222] text-slate-400"
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider">Credit or Debit Cards</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("netbank")}
                    className={`w-full p-3.5 rounded-none border flex items-center justify-between text-left transition-colors ${
                      paymentMethod === "netbank" ? "bg-red-500/5 border-red-500 text-white font-bold" : "bg-black hover:bg-[#111] border-[#222] text-slate-400"
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider">Direct Net Banking (SBI, HDFC)</span>
                  </button>
                </div>

                {/* Checkout Trigger */}
                <button
                  onClick={processMockPayment}
                  className="w-full py-4 bg-red-500 hover:bg-white text-white hover:text-black font-mono font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-red-200" />
                  <span>Authenticate Pay ₹{selectedItem.price}</span>
                </button>
              </div>
            )}

            <div className="bg-black border-t border-[#222] p-3 text-[9px] font-mono text-center text-slate-500 uppercase tracking-widest leading-none">
              Secured AES 256 transaction tunnel.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
