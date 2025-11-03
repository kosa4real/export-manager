"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Clock, AlertTriangle } from "lucide-react";

const SessionTimeoutWarning = ({
  onExtendSession,
  onLogout,
  timeRemaining,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Session Timeout Warning
            </h3>
            <p className="text-slate-400 text-sm">
              Your session will expire soon
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 text-sm">Time remaining:</span>
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-6">
          You will be automatically logged out due to inactivity. Would you like
          to extend your session?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onExtendSession}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
