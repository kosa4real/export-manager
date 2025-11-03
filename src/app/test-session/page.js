"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Clock, User, Shield } from "lucide-react";
import SessionSettings from "@/components/SessionSettings";

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">
          Please log in to test session functionality.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Session Test Page
          </h1>
          <p className="text-slate-400">
            Test the auto logout functionality - you&apos;ll be logged out after
            1 hour of inactivity
          </p>
        </div>

        {/* Current Session Info */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">
              Current Session
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                User
              </label>
              <p className="text-white font-medium">{session.user.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Email
              </label>
              <p className="text-white font-medium">{session.user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Role
              </label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  session.user.role === "ADMIN"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : session.user.role === "STAFF"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                <Shield className="w-3 h-3 mr-1" />
                {session.user.role}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Current Time
              </label>
              <p className="text-white font-medium font-mono">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Auto Logout Info */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">
              Auto Logout Information
            </h2>
          </div>

          <div className="space-y-3 text-slate-300">
            <p>
              • You will be automatically logged out after{" "}
              <strong className="text-white">1 hour</strong> of inactivity
            </p>
            <p>
              • A warning will appear{" "}
              <strong className="text-white">5 minutes</strong> before logout
            </p>
            <p>
              • Activity is tracked through mouse movements, clicks, keyboard
              input, and scrolling
            </p>
            <p>• The session timer resets with any user activity</p>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Test Instructions
          </h2>
          <div className="space-y-2 text-slate-300">
            <p>1. Leave this page open without any interaction</p>
            <p>2. After 55 minutes, you should see a warning modal</p>
            <p>
              3. If you don&apos;t interact with the warning, you&apos;ll be
              logged out after 5 more minutes
            </p>
            <p>
              4. Any activity (mouse move, click, etc.) will reset the timer
            </p>
          </div>
        </div>

        {/* Session Settings (Admin Only) */}
        {session.user.role === "ADMIN" && <SessionSettings />}

        {/* Activity Test Area */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Activity Test Area
          </h2>
          <p className="text-slate-300 mb-4">
            Interact with the elements below to test activity detection:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
              Click Me
            </button>
            <input
              type="text"
              placeholder="Type here..."
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <div className="px-4 py-2 bg-slate-700 rounded-lg text-slate-300 text-center">
              Move mouse over me
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
