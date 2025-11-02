"use client";

import { useState, useEffect } from "react";
import { Users, Package, DollarSign, X, Check } from "lucide-react";

export default function InvestorAssignmentModal({
  isOpen,
  onClose,
  exportData,
  onAssignmentComplete,
}) {
  const [mounted, setMounted] = useState(false);
  const [investors, setInvestors] = useState([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      fetchInvestors();
      if (exportData?.assignedInvestorId) {
        setSelectedInvestorId(exportData.assignedInvestorId.toString());
      } else {
        setSelectedInvestorId("");
      }
    }
  }, [isOpen, exportData, mounted]);

  const fetchInvestors = async () => {
    try {
      const response = await fetch("/api/investors?limit=100");
      if (!response.ok) throw new Error("Failed to fetch investors");
      const data = await response.json();
      setInvestors(data.investors || []);
    } catch (err) {
      setError("Failed to load investors");
      console.error("Error:", err);
    }
  };

  const handleAssign = async () => {
    if (!selectedInvestorId) {
      setError("Please select an investor");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/exports/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportId: exportData.id,
          investorId: parseInt(selectedInvestorId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign export");
      }

      const result = await response.json();
      onAssignmentComplete?.(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/exports/assign?exportId=${exportData.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove assignment");
      }

      const result = await response.json();
      onAssignmentComplete?.(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen || !mounted) return null;

  const selectedInvestor = investors.find(
    (inv) => inv.id.toString() === selectedInvestorId
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-emerald-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Assign Export to Investor
                </h2>
                <p className="text-slate-400 text-sm">
                  Export #{exportData?.id} - {exportData?.destinationCity},{" "}
                  {exportData?.destinationCountry}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
              <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Export Summary */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Export Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Quantity</p>
                <p className="text-white font-medium">
                  {exportData?.quantityBags?.toLocaleString()} bags
                </p>
              </div>
              <div>
                <p className="text-slate-400">Export Date</p>
                <p className="text-white font-medium">
                  {exportData?.exportDate
                    ? new Date(exportData.exportDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    exportData?.status === "DELIVERED"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : exportData?.status === "IN_TRANSIT"
                      ? "bg-blue-500/20 text-blue-400"
                      : exportData?.status === "PENDING"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {exportData?.status}
                </span>
              </div>
              <div>
                <p className="text-slate-400">Current Assignment</p>
                <p className="text-white font-medium">
                  {exportData?.assignedInvestor?.name || "Unassigned"}
                </p>
              </div>
            </div>
          </div>

          {/* Investor Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Investor
              </label>
              <select
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                disabled={loading}
              >
                <option value="">Select an investor...</option>
                {investors.map((investor) => (
                  <option key={investor.id} value={investor.id}>
                    {investor.name} - {formatCurrency(investor.amountInvested)}{" "}
                    ({investor.containerEquivalent || 0} containers)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Investor Details */}
            {selectedInvestor && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Investor Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Investment Amount</p>
                    <p className="text-green-400 font-medium">
                      {formatCurrency(selectedInvestor.amountInvested)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Container Equivalent</p>
                    <p className="text-purple-400 font-medium">
                      {selectedInvestor.containerEquivalent || 0} containers
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Profit Share</p>
                    <p className="text-cyan-400 font-medium">
                      {selectedInvestor.profitShare || "50/50"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedInvestor.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : selectedInvestor.status === "RETURNED"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {selectedInvestor.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 flex items-center justify-between">
          <div>
            {exportData?.assignedInvestorId && (
              <button
                onClick={handleRemoveAssignment}
                disabled={loading}
                className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Remove Assignment
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedInvestorId}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Assign Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
