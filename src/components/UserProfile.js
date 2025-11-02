"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";

const UserProfile = ({ userId, onClose }) => {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isOwnProfile = userId === parseInt(session?.user?.id);
  const canEdit = isOwnProfile || session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setFormData({
          username: data.username,
          email: data.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setError("");
      } else {
        setError(data.error || "Failed to fetch user");
      }
    } catch (err) {
      setError("Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    // Validation
    if (isOwnProfile && formData.newPassword && !formData.currentPassword) {
      setError("Current password is required to change password");
      setSaving(false);
      return;
    }

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      setError("New passwords do not match");
      setSaving(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      setSaving(false);
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
        if (isOwnProfile) {
          updateData.currentPassword = formData.currentPassword;
        }
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setIsEditing(false);
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(data.error || "Failed to update user");
      }
    } catch (err) {
      setError("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700/50">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-white">Loading user profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700/50 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-slate-700/50 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white">
                  {isOwnProfile ? "My Profile" : `${user.username}'s Profile`}
                </h2>
                <p className="text-slate-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors duration-200 p-1 hover:bg-slate-700/50 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Basic Information
            </h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Username
                  </label>
                  <p className="text-white font-medium">{user.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Email
                  </label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Role
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : user.role === "STAFF"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Member Since
                  </label>
                  <p className="text-white font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Password Change (only when editing) */}
          {isEditing && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Change Password
              </h3>
              <div className="space-y-4">
                {isOwnProfile && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 pr-12 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Linked Investor */}
          {user.investor && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Linked Investment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Investor Name
                  </label>
                  <p className="text-white font-medium">{user.investor.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      user.investor.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : user.investor.status === "RETURNED"
                        ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {user.investor.status}
                  </span>
                </div>
                {user.investor.email && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Contact Email
                    </label>
                    <p className="text-white font-medium">
                      {user.investor.email}
                    </p>
                  </div>
                )}
                {user.investor.contactInfo && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Contact Info
                    </label>
                    <p className="text-white font-medium">
                      {user.investor.contactInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Statistics */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Account Activity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Last Updated
                </label>
                <p className="text-white font-medium">
                  {new Date(user.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Account ID
                </label>
                <p className="text-white font-medium font-mono">#{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {canEdit && (
          <div className="border-t border-slate-700/50 p-6 bg-slate-900/50">
            <div className="flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: user.username,
                        email: user.email,
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setError("");
                    }}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium flex items-center"
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
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all duration-200 font-medium flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
