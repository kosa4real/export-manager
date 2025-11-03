"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Clock } from "lucide-react";

const SessionStatus = () => {
  const { data: session, status } = useSession();
  const [sessionTime, setSessionTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const updateSessionTime = () => {
      const now = new Date();
      const sessionStart = new Date(session.expires);
      const sessionDuration = 60 * 60 * 1000; // 1 hour
      const sessionExpiry = new Date(sessionStart.getTime() - sessionDuration);
      const timeLeft = sessionExpiry.getTime() - now.getTime();

      if (timeLeft <= 0) {
        setSessionTime("Expired");
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setSessionTime(`${hours}h ${minutes}m`);
      } else {
        setSessionTime(`${minutes}m`);
      }
    };

    updateSessionTime();
    const interval = setInterval(updateSessionTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session, status]);

  if (!mounted || status !== "authenticated" || !sessionTime) {
    return null;
  }

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg text-xs text-slate-400">
      <Clock className="w-3 h-3" />
      <span>Session: {sessionTime}</span>
    </div>
  );
};

export default SessionStatus;
