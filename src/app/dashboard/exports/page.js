"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import DetailModal from "@/components/DetailModal";
import ExportDetailContent from "@/components/ExportDetailContent";

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
  }, [status, fetchExports]);

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
      <DetailModal
        isOpen={!!selectedExport}
        onClose={() => setSelectedExport(null)}
        title="Export Details"
        subtitle={selectedExport ? `Shipment #${selectedExport.id}` : ""}
        editLink={
          selectedExport ? `/dashboard/exports/edit/${selectedExport.id}` : ""
        }
        canEdit={canEdit}
      >
        {selectedExport && (
          <ExportDetailContent exportData={selectedExport} isAdmin={isAdmin} />
        )}
      </DetailModal>
    </>
  );
}
