"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Clock, Settings, Save } from "lucide-react";

const SessionSettings = () => {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    inactivityTimeout: 60, // minutes
    warningTime: 5, // minutes
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Only show to admins
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Here you would typically save to your backend/database
      // For now, we'll just simulate a save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage("Session settings updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">Session Settings</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Inactivity Timeout (minutes)
          </label>
          <input
            type="number"
            value={settings.inactivityTimeout}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                inactivityTimeout: parseInt(e.target.value) || 60,
              }))
            }
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            min="5"
            max="480"
          />
          <p className="text-xs text-slate-400 mt-1">
            Users will be logged out after this period of inactivity (5-480
            minutes)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Warning Time (minutes)
          </label>
          <input
            type="number"
            value={settings.warningTime}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                warningTime: parseInt(e.target.value) || 5,
              }))
            }
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            min="1"
            max="30"
          />
          <p className="text-xs text-slate-400 mt-1">
            Show warning this many minutes before logout (1-30 minutes)
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes("success")
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SessionSettings;
