import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export interface ToastMessage {
  id: string;
  type: "registration" | "payment";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  userName?: string;
  plan?: string;
}

export function useAdminNotificationToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Refs to track initial snapshot loads so we skip pre-existing objects on mount
  const isInitialUsersRef = useRef<boolean>(true);
  const isInitialPaymentsRef = useRef<boolean>(true);

  // Helper to add toast messages safely ensuring we don't exceed a max queue size
  const addToast = (type: "registration" | "payment", payload: any) => {
    const id = `${type}_toast_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    let title = "";
    let description = "";
    
    if (type === "registration") {
      const name = payload.name || "A new aspirant";
      title = "New Student Joined! 🎉";
      description = `${name} registered on ElitePrep and started practicing.`;
    } else {
      const payer = payload.userName || "An anonymous user";
      const plan = payload.plan || "Ultimate Prep Pack";
      const amount = payload.amount || 0;
      title = "Successful Payment Capture 💰";
      description = `${payer} purchased "${plan}" for ₹${amount.toLocaleString()}.`;
    }

    const newToast: ToastMessage = {
      id,
      type,
      title,
      description,
      timestamp: new Date().toLocaleTimeString(),
      amount: payload.amount,
      userName: payload.userName || payload.name,
      plan: payload.plan
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // cap to maximum 5 concurrent toasts

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    let unsubUsers: () => void = () => {};
    let unsubPayments: () => void = () => {};

    try {
      // 1. Listen for new student registrations
      const usersCol = collection(db, "users");
      unsubUsers = onSnapshot(
        usersCol,
        (snapshot) => {
          if (isInitialUsersRef.current) {
            isInitialUsersRef.current = false;
            return; // Ignore existing documents loaded on first trigger
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              addToast("registration", data);
            }
          });
        },
        (err) => {
          console.warn("[useAdminNotificationToasts] Error listening to users collection changes:", err);
        }
      );

      // 2. Listen for payments processed on Firestore
      const paymentsCol = collection(db, "payments");
      unsubPayments = onSnapshot(
        paymentsCol,
        (snapshot) => {
          if (isInitialPaymentsRef.current) {
            isInitialPaymentsRef.current = false;
            return; // Ignore existing documents loaded on first trigger
          }

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            // Fire if the newly added transaction is captured
            if (change.type === "added" && data.status === "captured") {
              addToast("payment", data);
            } else if (change.type === "modified") {
              // Also support transactions whose state was dynamically transitioned
              if (data.status === "captured") {
                addToast("payment", data);
              }
            }
          });
        },
        (err) => {
          console.warn("[useAdminNotificationToasts] Error listening to payments collection changes:", err);
        }
      );
    } catch (e) {
      console.error("[useAdminNotificationToasts] Realtime Firestore hook initializer crash:", e);
    }

    return () => {
      unsubUsers();
      unsubPayments();
    };
  }, []);

  return {
    toasts,
    dismissToast
  };
}
