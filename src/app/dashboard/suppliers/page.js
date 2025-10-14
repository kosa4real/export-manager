"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function SuppliersPage() {
  const { data: session, status } = useSession();
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    newLast30Days: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filterStatus, setFilterStatus] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/suppliers/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.warn("Could not load stats:", err.message);
    }
  };

  const fetchSuppliers = useCallback(
    async (page = 1, statusFilter = "") => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", pagination.limit);
        if (statusFilter) params.append("status", statusFilter);

        const res = await fetch(`/api/suppliers?${params}`);
        if (!res.ok) throw new Error("Failed to load suppliers");
        const data = await res.json();

        setSuppliers(data.suppliers || []);
        setPagination({
          page: data.page || page,
          limit: data.limit || 10,
          total: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / (data.limit || 10)),
        });
      } catch (err) {
        setError(err.message || "Unable to load suppliers");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSuppliers(1, "");
      fetchStats();
    }
  }, [status, fetchSuppliers]);

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

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchSuppliers(page, filterStatus);
    }
  };

  const handleFilterChange = (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    fetchSuppliers(1, status);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      fetchSuppliers(pagination.page, filterStatus);
      fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete supplier");
    }
  };

  const MetricCard = ({ title, value, colorClass }) => (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">
        {title}
      </p>
      <p className={`text-3xl font-bold ${colorClass}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Suppliers Management
              </h1>
              <p className="text-slate-400 text-sm">
                Manage and monitor your supplier relationships
              </p>
            </div>
            {canEdit && (
              <Link
                href="/dashboard/suppliers/new"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105"
              >
                <span className="mr-2">+</span> Add New Supplier
              </Link>
            )}
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Total Suppliers"
              value={stats.total}
              colorClass="text-emerald-400"
            />
            <MetricCard
              title="Active"
              value={stats.active}
              colorClass="text-green-400"
            />
            <MetricCard
              title="Inactive"
              value={stats.inactive}
              colorClass="text-slate-400"
            />
            <MetricCard
              title="Suspended"
              value={stats.suspended}
              colorClass="text-amber-400"
            />
            <MetricCard
              title="New (30 Days)"
              value={stats.newLast30Days}
              colorClass="text-blue-400"
            />
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
                onChange={handleFilterChange}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
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
                    {suppliers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-emerald-400">
                    {pagination.total}
                  </span>{" "}
                  suppliers
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

        {/* Suppliers Table */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading suppliers...</p>
            </div>
          ) : suppliers.length === 0 ? (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No suppliers found</p>
              <p className="text-sm">
                Try adjusting your filters or add a new supplier
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
                        Supplier Name
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Contact Information
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
                    {suppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-slate-800/50 transition-colors duration-150"
                      >
                        <td className="p-4 text-slate-400 font-mono text-sm">
                          #{supplier.id}
                        </td>
                        <td className="p-4 font-medium text-white">
                          {supplier.name}
                        </td>
                        <td className="p-4 text-slate-300 text-sm">
                          {supplier.contactInfo || (
                            <span className="text-slate-500 italic">
                              No contact info
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              supplier.status === "ACTIVE"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : supplier.status === "INACTIVE"
                                ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/dashboard/suppliers/edit/${supplier.id}`}
                                className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors duration-150"
                              >
                                Edit
                              </Link>
                              {canDelete && (
                                <button
                                  onClick={() =>
                                    handleDelete(supplier.id, supplier.name)
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
    </div>
  );
}
