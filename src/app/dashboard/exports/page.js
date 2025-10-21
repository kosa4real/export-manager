"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import DetailModal from "@/components/DetailModal";
import ExportDetailContent from "@/components/ExportDetailContent";
import ExportStatusIndicator from "@/components/ExportStatusIndicator";
import AllocationWizard from "@/components/AllocationWizard";
import { Wand2 } from "lucide-react";

export default function ExportsPage() {
  const { data: session, status } = useSession();
  const [exports, setExports] = useState([]);
  const [stats, setStats] = useState({
    totalExports: 0,
    exportsLast30Days: 0,
    totalQuantityBags: 0,
    pendingExports: 0,
    inTransitExports: 0,
    deliveredExports: 0,
    totalAmountReceived: 0,
    totalClearingFee: 0,
    totalNetProfit: 0,
  });
  const [loading, setLoading] = useState(true); // Controls main content visibility
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedExport, setSelectedExport] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardExportId, setWizardExportId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  // ✅ Combined data fetcher
  const loadData = async (page = 1, statusFilter = "") => {
    setLoading(true);
    setError("");

    try {
      // Fetch exports
      const exportParams = new URLSearchParams();
      exportParams.append("page", page.toString());
      exportParams.append("limit", "10"); // ← Use literal "10" or constant, not stale state

      if (statusFilter) exportParams.append("status", statusFilter);

      const exportsRes = await fetch(`/api/exports?${exportParams}`);
      if (!exportsRes.ok) throw new Error("Failed to load exports");
      const exportsData = await exportsRes.json();

      // Fetch stats
      const statsRes = await fetch("/api/exports/stats");
      if (!statsRes.ok) throw new Error("Failed to load stats");
      const statsData = await statsRes.json();

      // Update state
      setExports(exportsData.exports || []);
      setStats(statsData);
      setPagination({
        page: exportsData.page || page,
        limit: exportsData.limit || 10,
        total: exportsData.total || 0,
        totalPages: Math.ceil(
          (exportsData.total || 0) / (exportsData.limit || 10)
        ),
      });
    } catch (err) {
      console.error("Load data error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false); // ✅ Only hide loader after BOTH requests finish
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadData(1, "");
    }
  }, [status]);

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadData(page, filterStatus);
    }
  };

  const handleFilterChange = (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    loadData(1, status);
  };

  const handleDelete = async (id, destination) => {
    if (
      !confirm(
        `Are you sure you want to delete this export to "${destination}"?`
      )
    )
      return;
    try {
      const res = await fetch(`/api/exports/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      loadData(pagination.page, filterStatus); // Refresh both exports and stats
    } catch (err) {
      setError(err.message || "Failed to delete export");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "IN_TRANSIT":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "DELIVERED":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const MetricCard = ({ title, value, colorClass }) => (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">
        {title}
      </p>
      <p className={`text-3xl font-bold ${colorClass}`}>
        {typeof value === "string" ? value : value.toLocaleString()}
      </p>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const canEdit = ["ADMIN", "STAFF"].includes(session.user.role);
  const canDelete = session.user.role === "ADMIN";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Exports Management
              </h1>
              <p className="text-slate-400 text-sm">
                Track and manage coal export shipments
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

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Exports"
              value={stats.totalExports}
              colorClass="text-emerald-400"
            />
            <MetricCard
              title="Last 30 Days"
              value={stats.exportsLast30Days}
              colorClass="text-blue-400"
            />
            <MetricCard
              title="Total Bags"
              value={stats.totalQuantityBags}
              colorClass="text-purple-400"
            />
            <MetricCard
              title="Pending"
              value={stats.pendingExports}
              colorClass="text-amber-400"
            />
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Total Revenue"
                value={`₦${(stats.totalAmountReceived ?? 0).toLocaleString()}`}
                colorClass="text-green-400"
              />
              <MetricCard
                title="Clearing Fees"
                value={`₦${(stats.totalClearingFee ?? 0).toLocaleString()}`}
                colorClass="text-amber-400"
              />
              <MetricCard
                title="Net Profit"
                value={`₦${(stats.totalNetProfit ?? 0).toLocaleString()}`}
                colorClass="text-emerald-400"
              />
            </div>
          )}
        </div>

        {/* Filters & Table (same as before) */}
        {/* ... rest of your JSX remains unchanged ... */}
        {/* (You can keep the rest exactly as is — filters, table, pagination) */}

        {/* Just replace the Filters Section onward with your existing code */}
        {/* I'm omitting it here for brevity, but keep it! */}
        {/* Make sure to use `loading` and `error` as before */}

        {/* Start from Filters Section */}
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
                onChange={handleFilterChange}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
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
                        Destination
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Quantity (Bags)
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Actions
                      </th>
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
                        <td className="p-4 font-medium text-white">
                          <div>{exportItem.destinationCity}</div>
                          <div className="text-xs text-slate-400">
                            {exportItem.destinationCountry}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-emerald-400">
                          {exportItem.quantityBags.toLocaleString()}
                        </td>

                        <td className="p-4">
                          <div className="space-y-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                exportItem.status
                              )}`}
                            >
                              {exportItem.status}
                            </span>
                            <ExportStatusIndicator exportId={exportItem.id} />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedExport(exportItem)}
                              className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors duration-150"
                            >
                              View
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setWizardExportId(exportItem.id);
                                  setShowWizard(true);
                                }}
                                className="text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors duration-150 flex items-center gap-1"
                              >
                                <Wand2 className="w-3 h-3" />
                                Allocate
                              </button>
                            )}
                            {canEdit && (
                              <Link
                                href={`/dashboard/exports/edit/${exportItem.id}`}
                                className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors duration-150"
                              >
                                Edit
                              </Link>
                            )}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
        subtitle={selectedExport ? `Export #${selectedExport.id}` : ""}
        editLink={
          selectedExport ? `/dashboard/exports/edit/${selectedExport.id}` : ""
        }
        canEdit={canEdit}
      >
        {selectedExport && (
          <ExportDetailContent exportData={selectedExport} isAdmin={isAdmin} />
        )}
      </DetailModal>

      {/* Allocation Wizard */}
      <AllocationWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          setWizardExportId(null);
        }}
        exportId={wizardExportId}
        onAllocationComplete={() => {
          loadData(pagination.page, filterStatus);
        }}
      />
    </div>
  );
}
