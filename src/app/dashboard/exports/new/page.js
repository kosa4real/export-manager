"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewExportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    exportDate: "",
    quantityBags: "",
    departureDate: "",
    arrivalDate: "",
    destinationCountry: "",
    destinationCity: "",
    departureClearingAgent: "",
    departureClearingFee: "",
    arrivalClearingAgent: "",
    arrivalClearingFee: "",
    buyer: "",
    containerNumber: "",
    status: "PENDING",
    amountReceived: "",
    netProfit: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";
  const canEdit = ["ADMIN", "STAFF"].includes(session.user.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        exportDate: formData.exportDate,
        quantityBags: parseInt(formData.quantityBags),
        departureDate: formData.departureDate,
        arrivalDate: formData.arrivalDate || null,
        destinationCountry: formData.destinationCountry,
        destinationCity: formData.destinationCity,
        departureClearingAgent: formData.departureClearingAgent || null,
        departureClearingFee: parseFloat(formData.departureClearingFee) || null,
        arrivalClearingAgent: formData.arrivalClearingAgent || null,
        arrivalClearingFee: parseFloat(formData.arrivalClearingFee) || null,
        buyer: formData.buyer,
        containerNumber: formData.containerNumber || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (isAdmin) {
        payload.amountReceived = parseFloat(formData.amountReceived) || 0;
        payload.netProfit = parseFloat(formData.netProfit) || 0;
      }

      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create export");
      }

      router.push("/dashboard/exports");
    } catch (err) {
      setError(err.message || "Error creating export");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard/exports"
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
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Add New Export
              </h1>
              <p className="text-slate-400 text-sm">
                Create a new export shipment record
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6 space-y-6">
            {/* Export Information */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Export Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Export Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.exportDate}
                    onChange={(e) => handleChange("exportDate", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quantity (Bags) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantityBags}
                    onChange={(e) =>
                      handleChange("quantityBags", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Departure Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) =>
                      handleChange("departureDate", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) =>
                      handleChange("arrivalDate", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Container Number
                  </label>
                  <input
                    type="text"
                    value={formData.containerNumber}
                    onChange={(e) =>
                      handleChange("containerNumber", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="e.g., ABCD1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    required
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Destination & Partners */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Destination & Partners
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Destination Country <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.destinationCountry}
                    onChange={(e) =>
                      handleChange("destinationCountry", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="e.g., United States"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Destination City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.destinationCity}
                    onChange={(e) =>
                      handleChange("destinationCity", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="e.g., New York"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Buyer <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.buyer}
                    onChange={(e) => handleChange("buyer", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Buyer name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Clearing Agents & Fees - Admin/Staff Only */}
            {canEdit && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Clearing Agents & Fees
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Departure Clearing */}
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-lg font-medium text-blue-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Departure
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Clearing Agent
                        </label>
                        <input
                          type="text"
                          value={formData.departureClearingAgent}
                          onChange={(e) =>
                            handleChange(
                              "departureClearingAgent",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          placeholder="Departure agent name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Clearing Fee (₦)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.departureClearingFee}
                          onChange={(e) =>
                            handleChange("departureClearingFee", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrival Clearing */}
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-lg font-medium text-green-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Arrival
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Clearing Agent
                        </label>
                        <input
                          type="text"
                          value={formData.arrivalClearingAgent}
                          onChange={(e) =>
                            handleChange("arrivalClearingAgent", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          placeholder="Arrival agent name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Clearing Fee (₦)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.arrivalClearingFee}
                          onChange={(e) =>
                            handleChange("arrivalClearingFee", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Information (Admin Only) */}
            {isAdmin && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Financial Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount Received ($){" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amountReceived}
                      onChange={(e) =>
                        handleChange("amountReceived", e.target.value)
                      }
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Net Profit ($) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.netProfit}
                      onChange={(e) =>
                        handleChange("netProfit", e.target.value)
                      }
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                placeholder="Additional notes or comments..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Export"
                )}
              </button>
              <Link
                href="/dashboard/exports"
                className="px-6 py-3 bg-slate-800 rounded-lg font-medium text-white hover:bg-slate-700 transition-all duration-300 text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
