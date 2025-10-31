"use client";

import { useState, useEffect } from "react";
import { validateUserData, sanitizeUserData } from "@/lib/user-validation";
import { Eye, EyeOff, User, Mail, Lock, Shield, Users } from "lucide-react";

const UserForm = ({ user, investors, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "STAFF",
    investorId: "",
  });
  const [errors, setErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        role: user.role || "STAFF",
        investorId: user.investorId || "",
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);

    const sanitizedData = sanitizeUserData(formData);
    const validation = validateUserData(sanitizedData, !!user);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(sanitizedData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const availableInvestors = investors.filter(
    (inv) => !inv.user || inv.id === parseInt(formData.investorId)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Username *
        </label>
        <input
          type="text"
          required
          value={formData.username}
          onChange={(e) => handleChange("username", e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          placeholder="Enter username"
        />
        <p className="text-xs text-slate-500 mt-1">
          3-50 characters, letters, numbers, hyphens, and underscores only
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Mail className="w-4 h-4 inline mr-2" />
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          placeholder="Enter email address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Lock className="w-4 h-4 inline mr-2" />
          Password {user && "(leave blank to keep current)"} *
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required={!user}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className="w-full px-4 py-2.5 pr-12 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            placeholder={user ? "Enter new password" : "Enter password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Shield className="w-4 h-4 inline mr-2" />
          Role *
        </label>
        <select
          value={formData.role}
          onChange={(e) => handleChange("role", e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
        >
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
          <option value="INVESTOR">Investor</option>
        </select>
        <div className="text-xs text-slate-500 mt-2 space-y-1 bg-slate-800/40 p-3 rounded-lg">
          <div>
            <span className="text-red-400 font-medium">Admin:</span> Full system
            access
          </div>
          <div>
            <span className="text-blue-400 font-medium">Staff:</span> Manage
            operations, no user management
          </div>
          <div>
            <span className="text-emerald-400 font-medium">Investor:</span> View
            own investment data only
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Users className="w-4 h-4 inline mr-2" />
          Link to Investor (Optional)
        </label>
        <select
          value={formData.investorId}
          onChange={(e) => handleChange("investorId", e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
        >
          <option value="">No investor</option>
          {availableInvestors.map((investor) => (
            <option key={investor.id} value={investor.id}>
              {investor.name} ({investor.status})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Link this user account to an investor record for investor role access
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 flex items-center"
        >
          {loading && (
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
          )}
          {user ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
