import React from "react";
import { ToastMessage } from "../hooks/useAdminNotificationToasts";
import { X, UserCheck, CreditCard } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface AdminToastNotificationStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function AdminToastNotificationStack({ toasts, onDismiss }: AdminToastNotificationStackProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none" id="admin-toast-stack">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isRegistration = toast.type === "registration";
          
          return (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, y: 40, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 50, transition: { duration: 0.25 } }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="pointer-events-auto w-full bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl p-4 flex gap-3 items-start overflow-hidden relative group"
              id={toast.id}
            >
              {/* Left visual accent bar */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isRegistration 
                    ? "bg-gradient-to-b from-blue-500 to-indigo-600" 
                    : "bg-gradient-to-b from-emerald-400 to-teal-500"
                }`}
              />
              
              {/* Type Icon */}
              <div className={`p-2.5 rounded-xl ${
                isRegistration 
                  ? "bg-blue-500/10 text-blue-400" 
                  : "bg-emerald-500/10 text-emerald-400"
              } shrink-0`}>
                {isRegistration ? (
                  <UserCheck className="w-5 h-5 animate-bounce" />
                ) : (
                  <CreditCard className="w-5 h-5 animate-pulse" />
                )}
              </div>

              {/* Context Text Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="text-xs font-bold text-white tracking-tight leading-none uppercase">
                    {toast.title}
                  </h4>
                  <span className="text-[8px] font-mono text-slate-500 shrink-0 uppercase">
                    {toast.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {toast.description}
                </p>
                
                {/* Specific details panel */}
                {!isRegistration && typeof toast.amount === "number" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[9px] font-mono px-2 py-0.5 rounded-md font-bold">
                      + ₹{toast.amount.toLocaleString()}
                    </span>
                    {toast.plan && (
                      <span className="bg-slate-800 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded-md truncate max-w-[150px]">
                        {toast.plan}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Explicit Dismiss Cross Button */}
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-500 hover:text-slate-200 transition-colors shrink-0 p-1 hover:bg-slate-800/80 rounded-lg"
                id={`dismiss-${toast.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
