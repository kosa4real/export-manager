"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditExportPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    exportDate: "",
    quantityBags: "",
    departureDate: "",
    arrivalDate: "",
    destinationCountry: "",
    destinationCity: "",
    clearingAgent: "",
    buyer: "",
    containerNumber: "",
    status: "PENDING",
    notes: "",
    amountReceived: "",
    clearingFee: "",
    netProfit: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && id) {
      fetchExport();
    }
  }, [status, id]);

  const fetchExport = async () => {
    try {
      const res = await fetch(`/api/exports/${id}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch export (${res.status})`
        );
      }
      const exportData = await res.json();

      setFormData({
        exportDate: exportData.exportDate
          ? new Date(exportData.exportDate).toISOString().split("T")[0]
          : "",
        quantityBags: exportData.quantityBags?.toString() || "",
        departureDate: exportData.departureDate
          ? new Date(exportData.departureDate).toISOString().split("T")[0]
          : "",
        arrivalDate: exportData.arrivalDate
          ? new Date(exportData.arrivalDate).toISOString().split("T")[0]
          : "",
        destinationCountry: exportData.destinationCountry || "",
        destinationCity: exportData.destinationCity || "",
        clearingAgent: exportData.clearingAgent || "",
        buyer: exportData.buyer || "",
        containerNumber: exportData.containerNumber || "",
        status: exportData.status || "PENDING",
        notes: exportData.notes || "",
        amountReceived: exportData.amountReceived?.toString() || "",
        clearingFee: exportData.clearingFee?.toString() || "",
        netProfit: exportData.netProfit?.toString() || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load export");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading export data...</p>
        </div>
      </div>
    );
  }

  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 flex items-start gap-3">
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
            <span>
              Access denied. You don&apos;t have permission to edit exports.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = session.user.role === "ADMIN";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const submitData = {
        ...formData,
        quantityBags: parseInt(formData.quantityBags) || 0,
      };

      // Only include admin fields if user is admin
      if (!isAdmin) {
        delete submitData.amountReceived;
        delete submitData.clearingFee;
        delete submitData.netProfit;
      }

      const res = await fetch(`/api/exports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update export");
      }

      router.push("/dashboard/exports");
    } catch (err) {
      setError(err.message || "Failed to update export");
    } finally {
      setSaving(false);
    }
  };

  if (error && !formData.exportDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
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
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-800 rounded-lg font-medium text-white hover:bg-slate-700 transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Edit Export
              </h1>
              <p className="text-slate-400 text-sm">
                Update export shipment record #{id}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Export Date *
                </label>
                <input
                  type="date"
                  name="exportDate"
                  value={formData.exportDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity (Bags) *
                </label>
                <input
                  type="number"
                  name="quantityBags"
                  value={formData.quantityBags}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Departure Date *
                </label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Arrival Date
                </label>
                <input
                  type="date"
                  name="arrivalDate"
                  value={formData.arrivalDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">
              Destination & Logistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Destination Country
                </label>
                <input
                  type="text"
                  name="destinationCountry"
                  value={formData.destinationCountry}
                  onChange={handleInputChange}
                  placeholder="e.g. China"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Destination City
                </label>
                <input
                  type="text"
                  name="destinationCity"
                  value={formData.destinationCity}
                  onChange={handleInputChange}
                  placeholder="e.g. Shanghai"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Clearing Agent
                </label>
                <input
                  type="text"
                  name="clearingAgent"
                  value={formData.clearingAgent}
                  onChange={handleInputChange}
                  placeholder="Agent name"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Buyer
                </label>
                <input
                  type="text"
                  name="buyer"
                  value={formData.buyer}
                  onChange={handleInputChange}
                  placeholder="Buyer name"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Container Number
                </label>
                <input
                  type="text"
                  name="containerNumber"
                  value={formData.containerNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. MSKU1234567"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-emerald-400">
                Financial Information (Admin Only)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount Received (₦)
                  </label>
                  <input
                    type="number"
                    name="amountReceived"
                    value={formData.amountReceived}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Clearing Fee (₦)
                  </label>
                  <input
                    type="number"
                    name="clearingFee"
                    value={formData.clearingFee}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Net Profit (₦)
                  </label>
                  <input
                    type="number"
                    name="netProfit"
                    value={formData.netProfit}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">
              Additional Notes
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any additional notes about this export..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-800 rounded-lg font-medium text-white hover:bg-slate-700 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
