"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ExportsPage() {
  const { data: session, status } = useSession();
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [selectedExport, setSelectedExport] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchExports(1, "");
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

  if (!session) return null;

  const canEdit = ["ADMIN", "STAFF"].includes(session.user.role);
  const canDelete = session.user.role === "ADMIN";
  const isAdmin = session.user.role === "ADMIN";

  const fetchExports = async (
    page = 1,
    statusFilter = "",
    countryFilter = ""
  ) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", pagination.limit);
      if (statusFilter) params.append("status", statusFilter);
      if (countryFilter) params.append("destinationCountry", countryFilter);

      const res = await fetch(`/api/exports?${params}`);
      if (!res.ok) throw new Error("Failed to load exports");
      const data = await res.json();

      setExports(data.exports || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || 10,
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / (data.limit || 10)),
      });
    } catch (err) {
      setError(err.message || "Unable to load exports");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchExports(page, filterStatus, filterCountry);
    }
  };

  const handleStatusFilterChange = (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    fetchExports(1, status, filterCountry);
  };

  const handleCountryFilterChange = (e) => {
    const country = e.target.value;
    setFilterCountry(country);
    fetchExports(1, filterStatus, country);
  };

  const handleDelete = async (id, destination) => {
    if (!confirm(`Are you sure you want to delete export to "${destination}"?`))
      return;
    try {
      const res = await fetch(`/api/exports/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      fetchExports(pagination.page, filterStatus, filterCountry);
    } catch (err) {
      setError(err.message || "Failed to delete export");
    }
  };

  const formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    return !isNaN(num) ? num.toLocaleString() : "0";
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Export Shipments
              </h1>
              <p className="text-slate-400 text-sm">
                Track and manage international coal exports
              </p>
            </div>
            {canEdit && (
              <Link
                href="/dashboard/exports/new"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105"
              >
                <span className="mr-2">+</span> Add New Export
              </Link>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={handleStatusFilterChange}
                className="w-full sm:w-48 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="country-filter"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Filter by Country
              </label>
              <input
                id="country-filter"
                type="text"
                value={filterCountry}
                onChange={handleCountryFilterChange}
                placeholder="e.g. China, India"
                className="w-full sm:w-48 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="text-slate-400 text-sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                <span>
                  Showing{" "}
                  <span className="font-semibold text-emerald-400">
                    {exports.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-emerald-400">
                    {pagination.total}
                  </span>{" "}
                  exports
                </span>
              )}
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

        {/* Exports Table */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading exports...</p>
            </div>
          ) : exports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg
                className="w-16 h-16 mb-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No exports found</p>
              <p className="text-sm">
                Try adjusting your filters or add a new export
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/80 border-b border-slate-700">
                    <tr>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        ID
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Export Date
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Quantity (Bags)
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Status
                      </th>
                      {canEdit && (
                        <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {exports.map((exportItem) => (
                      <tr
                        key={exportItem.id}
                        className="hover:bg-slate-800/50 transition-colors duration-150"
                      >
                        <td className="p-4 text-slate-400 font-mono text-sm">
                          #{exportItem.id}
                        </td>
                        <td className="p-4 text-slate-300 text-sm">
                          {new Date(exportItem.exportDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-medium text-emerald-400">
                          {exportItem.quantityBags.toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-300 text-sm">
                          {exportItem.destinationCity},{" "}
                          {exportItem.destinationCountry}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              exportItem.status === "DELIVERED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : exportItem.status === "IN_TRANSIT"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : exportItem.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {exportItem.status.replace("_", " ")}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setSelectedExport(exportItem)}
                                className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors duration-150"
                              >
                                View
                              </button>
                              <Link
                                href={`/dashboard/exports/edit/${exportItem.id}`}
                                className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors duration-150"
                              >
                                Edit
                              </Link>
                              {canDelete && (
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      exportItem.id,
                                      `${exportItem.destinationCity}, ${exportItem.destinationCountry}`
                                    )
                                  }
                                  className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors duration-150"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="border-t border-slate-800 bg-slate-900/60 px-6 py-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-slate-400 text-sm">
                      Page{" "}
                      <span className="font-semibold text-white">
                        {pagination.page}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-white">
                        {pagination.totalPages}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                          pagination.page <= 1
                            ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                            : "bg-slate-800 text-white hover:bg-slate-700 hover:shadow-lg"
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                          pagination.page >= pagination.totalPages
                            ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                            : "bg-slate-800 text-white hover:bg-slate-700 hover:shadow-lg"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Export Detail Modal */}
      {selectedExport && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedExport(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-700/50 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-slate-700/50 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Export Details
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Shipment #{selectedExport.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExport(null)}
                  className="text-slate-400 hover:text-white transition-colors duration-200 p-1 hover:bg-slate-700/50 rounded-lg"
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

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Basic Information
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/30">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">
                        Export Date
                      </span>
                      <span className="text-white font-medium">
                        {new Date(selectedExport.exportDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Total Bags</span>
                      <span className="text-emerald-400 font-bold text-lg">
                        {selectedExport.quantityBags.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Status</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          selectedExport.status === "DELIVERED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : selectedExport.status === "IN_TRANSIT"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : selectedExport.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {selectedExport.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Destination & Buyer */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Destination
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/30">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">City</span>
                      <span className="text-white font-medium text-right">
                        {selectedExport.destinationCity}
                      </span>
                    </div>
                    <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Country</span>
                      <span className="text-white font-medium text-right">
                        {selectedExport.destinationCountry}
                      </span>
                    </div>
                    <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Buyer</span>
                      <span className="text-white font-medium text-right">
                        {selectedExport.buyer || (
                          <span className="text-slate-500 italic">
                            Not specified
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Information (Admin Only) */}
                {isAdmin && (
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Financial Details
                    </h3>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-slate-400 text-sm block mb-1">
                            Amount Received
                          </span>
                          <span className="text-white font-bold text-xl">
                            {selectedExport.amountReceived ? (
                              `₦${formatCurrency(
                                selectedExport.amountReceived
                              )}`
                            ) : (
                              <span className="text-slate-500 text-base">
                                Not specified
                              </span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-sm block mb-1">
                            Net Profit
                          </span>
                          <span
                            className={`font-bold text-xl ${
                              selectedExport.netProfit &&
                              selectedExport.netProfit > 0
                                ? "text-green-400"
                                : "text-slate-500"
                            }`}
                          >
                            {selectedExport.netProfit ? (
                              `₦${formatCurrency(selectedExport.netProfit)}`
                            ) : (
                              <span className="text-slate-500 text-base">
                                Not specified
                              </span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-sm block mb-1">
                            Profit Margin
                          </span>
                          <span className="text-cyan-400 font-bold text-xl">
                            {selectedExport.netProfit &&
                            selectedExport.amountReceived ? (
                              `${(
                                (selectedExport.netProfit /
                                  selectedExport.amountReceived) *
                                100
                              ).toFixed(1)}%`
                            ) : (
                              <span className="text-slate-500 text-base">
                                —
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedExport.notes && (
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      Additional Notes
                    </h3>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {selectedExport.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-700/50 p-6 bg-slate-900/50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedExport(null)}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  Close
                </button>
                {canEdit && (
                  <Link
                    href={`/dashboard/exports/edit/${selectedExport.id}`}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-500/30"
                  >
                    Edit Export
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
