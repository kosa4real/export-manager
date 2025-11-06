"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Activity,
  TrendingUp,
} from "lucide-react";

const UserProfile = ({ userId, onClose }) => {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const [userResponse, statsResponse] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/stats`).catch(() => ({ ok: false })), // Graceful fallback
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      } else {
        setError("Failed to fetch user profile");
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      setError("Failed to fetch user profile");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "STAFF":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "INVESTOR":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Loading user profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || "User not found"}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-slate-700/50 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {user.username}
                </h2>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Basic Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Created</p>
                    <p className="text-white">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Last Updated</p>
                    <p className="text-white">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Statistics
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Account Age</p>
                    <p className="text-white font-semibold">
                      {stats.accountAge} days
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Data Requests</p>
                    <p className="text-white font-semibold">
                      {stats.totalDataRequests || 0}
                    </p>
                  </div>

                  {stats.assignedExports !== undefined && (
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400">Assigned Exports</p>
                      <p className="text-white font-semibold">
                        {stats.assignedExports}
                      </p>
                    </div>
                  )}

                  {stats.totalInvestment && (
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400">Total Investment</p>
                      <p className="text-white font-semibold">
                        ${stats.totalInvestment.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Investor Information */}
            {user.investor && (
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Investor Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Name</p>
                    <p className="text-white font-semibold">
                      {user.investor.name}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <p className="text-white font-semibold">
                      {user.investor.status}
                    </p>
                  </div>

                  {user.investor.email && (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">
                        Investor Email
                      </p>
                      <p className="text-white font-semibold">
                        {user.investor.email}
                      </p>
                    </div>
                  )}

                  {user.investor.contactInfo && (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">
                        Contact Info
                      </p>
                      <p className="text-white font-semibold">
                        {user.investor.contactInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
