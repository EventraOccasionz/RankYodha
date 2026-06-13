import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Crown, 
  Check, 
  ArrowLeft, 
  Activity, 
  ShieldCheck, 
  CreditCard, 
  PhoneCall, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Gift
} from "lucide-react";

interface PricingScreenProps {
  setScreen: (screen: string) => void;
}

export default function PricingScreen({ setScreen }: PricingScreenProps) {
  const { user, privateInfo, upgradeToPremium, signInWithGoogle } = useAuth();
  
  // Coupon state
  const [coupon, setCoupon] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");

  // Payment popup checkout states
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; originalPrice: number; price: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbank">("upi");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "processing" | "success">("idle");

  const plans = [
    {
      id: "monthly",
      name: "Aspirant Tier",
      originalPrice: 799,
      price: 499,
      duration: "Month",
      desc: "Perfect for brief revisions and evaluation testing sprints.",
      features: [
        "Access to basic mock test pools",
        "AIR Predictor algorithms",
        "Recent attempt logs history",
        "Standard subject-level accuracy tags"
      ]
    },
    {
      id: "yearly",
      name: "Elite Topper Pro",
      originalPrice: 5999,
      price: 2999,
      duration: "Year",
      desc: "Optimized yearly roadmap aligning full commission mock reviews.",
      features: [
        "Unrestricted mock test papers databases",
        "Millisecond speed-timers tracking",
        "All India topper comparative charts",
        "Complete deep-dive technical explanations",
        "Custom weak concept AI study habits tracker",
        "Priority premium customer support lines"
      ],
      popular: true
    },
    {
      id: "quarterly",
      name: "Achiever Bundle",
      originalPrice: 2399,
      price: 1299,
      duration: "3 Months",
      desc: "Robust choice for serious revisions and exam-period practice sheets.",
      features: [
        "Access to extended practice pools",
        "AIR Predictor algorithms",
        "Timing and Speed per section metrics",
        "Standard subject-level accuracy tags"
      ]
    }
  ];

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === "TOPPER50") {
      setDiscountApplied(true);
      setDiscountError("");
    } else {
      setDiscountError("Invalid coupon code! Try TOPPER50 for 50% discount.");
    }
  };

  const handleCheckoutClick = (plan: typeof plans[0]) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    // Set active checkout plan
    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      originalPrice: plan.originalPrice,
      price: discountApplied ? Math.round(plan.price * 0.5) : plan.price
    });
    setCheckoutStatus("idle");
  };

  const processMockPayment = async () => {
    setCheckoutStatus("processing");
    
    // Simulate Razorpay secure payment gateways
    setTimeout(async () => {
      try {
        await upgradeToPremium();
        setCheckoutStatus("success");
      } catch (err) {
        console.error("Payment error: ", err);
        setCheckoutStatus("idle");
      }
    }, 2000);
  };

  const isPremiumUser = privateInfo?.tier === "premium";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-slate-100 min-h-screen" id="pricing-screen">
      
      {/* Return Navigation */}
      <button 
        onClick={() => setScreen("landing")}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors uppercase font-mono tracking-widest mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Welcome Page
      </button>

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 font-mono mb-4 uppercase">
          <Crown className="w-3.5 h-3.5 fill-amber-400" /> Unlock Unlimited System Access
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Empower Your Prep Journey
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Unlock premium mock banks, millisecond speed profiling, and comprehensive topper comparisons. All plans are backed by secure, flexible upgrade triggers.
        </p>
      </div>

      {isPremiumUser && (
        <div className="max-w-2xl mx-auto bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 rounded-3xl p-6 text-center mb-12">
          <Crown className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-white mb-2">You have unlocked premium status!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
            All unlimited questions archives, speed timers reports, and AIR estimations maps are fully deployed to your student profile dashboard.
          </p>
          <button
            onClick={() => setScreen("dashboard")}
            className="px-5 py-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl"
          >
            Launch Premium Dashboard
          </button>
        </div>
      )}

      {/* Coupon Application Box */}
      {!isPremiumUser && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-14">
          <div className="flex items-center gap-2 mb-3.5">
            <Gift className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wide text-slate-300">Have a Promotional Coupon?</h4>
          </div>

          <div className="flex gap-2.5">
            <input 
              type="text" 
              placeholder="e.g. TOPPER50"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              disabled={discountApplied}
              className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-650 focus:outline-none uppercase"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={discountApplied}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs rounded-xl transition-all"
            >
              Apply
            </button>
          </div>

          {discountApplied && (
            <p className="text-xs font-mono text-emerald-400 mt-2">Coupon applied successfully! 50% discount adjusted on all listed checkouts.</p>
          )}
          {discountError && (
            <p className="text-xs font-mono text-rose-400 mt-2">{discountError}</p>
          )}
        </div>
      )}

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
        {plans.map((p) => {
          const finalPrice = discountApplied ? Math.round(p.price * 0.5) : p.price;
          
          return (
            <div 
              key={p.id}
              className={`flex flex-col justify-between p-8 rounded-3xl relative transition-all ${
                p.popular 
                  ? "bg-slate-900 border-2 border-emerald-500 shadow-xl shadow-emerald-500/5 md:scale-[1.03]" 
                  : "bg-slate-900/60 border border-slate-800"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-bold font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow">
                  MOST POPULAR PLAN
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-2">{p.name}</h3>
                <p className="text-xs text-slate-400 mb-6 min-h-[32px]">{p.desc}</p>
                
                {/* Price Display */}
                <div className="flex items-baseline gap-1 mb-8">
                  {discountApplied && (
                    <span className="text-sm line-through text-slate-500 mr-1.5">₹{p.price}</span>
                  )}
                  <span className="text-4xl font-extrabold text-white">₹{finalPrice}</span>
                  <span className="text-xs font-mono text-slate-500">/ {p.duration}</span>
                </div>

                {/* Features list */}
                <div className="space-y-4 mb-8">
                  {p.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleCheckoutClick(p)}
                disabled={isPremiumUser}
                className={`w-full py-3.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:scale-[1.01] active:scale-98 transition-all ${
                  p.popular 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-910 font-extrabold shadow-md shadow-emerald-500/10" 
                    : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                } disabled:opacity-30`}
              >
                <span>Upgrade Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Razorpay Mock Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-slate-100">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 border-b border-indigo-800/20 relative">
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2.2 py-0.5 rounded border border-blue-500/25">SECURE CHEKOUT PORTAL</span>
              <h3 className="text-lg font-extrabold text-white mt-1.5 leading-none">Razorpay Mockup</h3>
              <p className="text-[9px] text-indigo-300 font-mono mt-1">PROCESING FOR ELITEPREP INC.</p>

              <button 
                onClick={() => setSelectedPlan(null)}
                disabled={checkoutStatus === "processing"}
                className="absolute top-4 right-4 text-indigo-200 hover:text-white"
              >
                Close
              </button>
            </div>

            {checkoutStatus === "processing" ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <h4 className="text-sm font-extrabold text-white mb-2">Processing Secure Gateway...</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto font-mono">Verifying authorization protocols from your financial partner.</p>
              </div>
            ) : checkoutStatus === "success" ? (
              <div className="p-8 text-center">
                <Check className="w-12 h-12 text-emerald-400 mx-auto mb-4 bg-emerald-500/10 p-2.5 rounded-full border border-emerald-55" />
                <h4 className="text-lg font-extrabold text-white mb-2">Upgrade Confirmed!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
                  Payment of ₹{selectedPlan.price} received. All advanced India government mock paper pools have been deployed.
                </p>
                <button
                  onClick={() => { setSelectedPlan(null); setScreen("dashboard"); }}
                  className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="p-6">
                
                {/* Plan stats summary */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 mb-6">
                  <p className="text-[10px] text-slate-500 font-mono uppercase leading-none mb-1">upgrade selection</p>
                  <p className="text-sm font-bold text-white">{selectedPlan.name}</p>
                  <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-slate-850">
                    <span className="text-xs text-slate-400">Total charge:</span>
                    <span className="text-lg font-extrabold text-emerald-400 font-mono">₹{selectedPlan.price}</span>
                  </div>
                </div>

                {/* Simulated payment options */}
                <h4 className="text-xs font-bold uppercase font-mono text-slate-400 mb-2.5">Select Payment Protocol</h4>
                <div className="space-y-2 mb-6 text-xs">
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left ${
                      paymentMethod === "upi" ? "bg-blue-500/10 border-blue-500/60" : "bg-slate-950/30 border-slate-850"
                    }`}
                  >
                    <span>Instant UPI (GPay / PhonePe)</span>
                    <span className="text-[10px] font-mono text-blue-400">Autopay</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left ${
                      paymentMethod === "card" ? "bg-blue-500/10 border-blue-500/60" : "bg-slate-950/30 border-slate-850"
                    }`}
                  >
                    <span>Credit / Debit Cards</span>
                    <span className="text-[10px] font-mono text-slate-500">256-bit</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("netbank")}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left ${
                      paymentMethod === "netbank" ? "bg-blue-500/10 border-blue-500/60" : "bg-slate-950/30 border-slate-850"
                    }`}
                  >
                    <span>Netbanking (SBI, HDFC, ICICI)</span>
                    <span className="text-[10px] font-mono text-slate-500">Direct</span>
                  </button>
                </div>

                {/* Checkout Trigger */}
                <button
                  onClick={processMockPayment}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-200" />
                  <span>Execute Payment ₹{selectedPlan.price}</span>
                </button>
              </div>
            )}

            <div className="bg-slate-950 border-t border-slate-850 p-3 text-[9px] font-mono text-center text-slate-500 uppercase tracking-widest leading-none">
              Razorpay Secured Gateway. 128-bit encryption standard.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
