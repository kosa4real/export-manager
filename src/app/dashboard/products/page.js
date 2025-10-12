"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import DetailModal from "@/components/DetailModal";
import SupplyDetailContent from "@/components/SupplyDetailContent";

// Helper: Safely format currency
const formatCurrency = (value) => {
  const num = typeof value === "number" ? value : parseFloat(value);
  return !isNaN(num) ? num.toFixed(2) : "0.00";
};

// Helper: Render grades summary for table (only non-zero)
const renderGradesSummary = (supply) => {
  const parts = [
    `A: ${supply.gradeA}`,
    `B: ${supply.gradeB}`,
    `R: ${supply.rejectedBags}`,
  ];
  if (supply.dustBags > 0) parts.push(`Dust: ${supply.dustBags}`);
  if (supply.woodBags > 0) parts.push(`Wood: ${supply.woodBags}`);
  return parts.join(", ");
};

// Helper: Get grade detail items for modal
const getGradeDetails = (supply) => {
  return [
    { label: "Grade A", value: supply.gradeA, color: "text-emerald-400" },
    { label: "Grade B", value: supply.gradeB, color: "text-blue-400" },
    { label: "Rejected", value: supply.rejectedBags, color: "text-red-400" },
    ...(supply.dustBags > 0
      ? [
          {
            label: "Dust Bags",
            value: supply.dustBags,
            color: "text-amber-400",
          },
        ]
      : []),
    ...(supply.woodBags > 0
      ? [
          {
            label: "Wood Contamination",
            value: supply.woodBags,
            color: "text-orange-400",
          },
        ]
      : []),
  ];
};

export default function SuppliesPage() {
  const { data: session, status } = useSession();
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({
    totalSupplies: 0,
    suppliesLast30Days: 0,
    totalQuantityBags: 0,
    totalGradeA: 0,
    totalAmountPaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filterSupplier, setFilterSupplier] = useState("");
  const [selectedSupply, setSelectedSupply] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSupplies(1, "");
      fetchStats();
      fetchSuppliers();
    }
  }, [status, fetchSupplies, fetchStats, fetchSuppliers]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/supplies/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.warn("Could not load stats:", err.message);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers?limit=1000");
      if (!res.ok) throw new Error("Failed to load suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.warn("Could not load suppliers:", err.message);
    }
  };

  const fetchSupplies = async (page = 1, supplierFilter = "") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", pagination.limit);
      if (supplierFilter) params.append("supplierId", supplierFilter);

      const res = await fetch(`/api/supplies?${params}`);
      if (!res.ok) throw new Error("Failed to load supplies");
      const data = await res.json();

      setSupplies(data.supplies || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || 10,
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / (data.limit || 10)),
      });
    } catch (err) {
      setError(err.message || "Unable to load supplies");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchSupplies(page, filterSupplier);
    }
  };

  const handleFilterChange = (e) => {
    const supplier = e.target.value;
    setFilterSupplier(supplier);
    fetchSupplies(1, supplier);
  };

  const handleDelete = async (id, supplierName) => {
    if (
      !confirm(
        `Are you sure you want to delete this supply from "${supplierName}"?`
      )
    )
      return;
    try {
      const res = await fetch(`/api/supplies/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      fetchSupplies(pagination.page, filterSupplier);
      fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete supply");
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
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const canEdit = ["ADMIN", "STAFF"].includes(session.user.role);
  const canDelete = session.user.role === "ADMIN";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Supplies Management
              </h1>
              <p className="text-slate-400 text-sm">
                Track and manage coal supply deliveries
              </p>
            </div>
            {canEdit && (
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105"
              >
                <span className="mr-2">+</span> Add New Supply
              </Link>
            )}
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Supplies"
              value={stats.totalSupplies}
              colorClass="text-emerald-400"
            />
            <MetricCard
              title="Last 30 Days"
              value={stats.suppliesLast30Days}
              colorClass="text-blue-400"
            />
            <MetricCard
              title="Total Bags"
              value={stats.totalQuantityBags}
              colorClass="text-purple-400"
            />
            {isAdmin ? (
              <MetricCard
                title="Total Paid"
                value={`NGN ${formatCurrency(stats.totalAmountPaid)}`}
                colorClass="text-green-400"
              />
            ) : (
              <MetricCard
                title="Grade A Bags"
                value={stats.totalGradeA}
                colorClass="text-green-400"
              />
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="supplier-filter"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Filter by Supplier
              </label>
              <select
                id="supplier-filter"
                value={filterSupplier}
                onChange={handleFilterChange}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
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
                    {supplies.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-emerald-400">
                    {pagination.total}
                  </span>{" "}
                  supplies
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

        {/* Supplies Table */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading supplies...</p>
            </div>
          ) : supplies.length === 0 ? (
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No supplies found</p>
              <p className="text-sm">
                Try adjusting your filters or add a new supply
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
                        Supplier
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Supply Date
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Quantity (Bags)
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Grades
                      </th>
                      {canEdit && (
                        <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {supplies.map((supply) => (
                      <tr
                        key={supply.id}
                        className="hover:bg-slate-800/50 transition-colors duration-150"
                      >
                        <td className="p-4 text-slate-400 font-mono text-sm">
                          #{supply.id}
                        </td>
                        <td className="p-4 font-medium text-white">
                          {supply.supplier.name}
                        </td>
                        <td className="p-4 text-slate-300 text-sm">
                          {new Date(supply.supplyDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-medium text-emerald-400">
                          {supply.quantityBags.toLocaleString()}
                        </td>
                        <td className="p-4 text-sm text-slate-300">
                          {renderGradesSummary(supply)}
                        </td>
                        {canEdit && (
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setSelectedSupply(supply)}
                                className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors duration-150"
                              >
                                View
                              </button>
                              <Link
                                href={`/dashboard/products/edit/${supply.id}`}
                                className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors duration-150"
                              >
                                Edit
                              </Link>
                              {canDelete && (
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      supply.id,
                                      supply.supplier.name
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

      {/* Supply Detail Modal */}
      <DetailModal
        isOpen={!!selectedSupply}
        onClose={() => setSelectedSupply(null)}
        title="Supply Details"
        subtitle={selectedSupply ? `Supply #${selectedSupply.id}` : ""}
        editLink={
          selectedSupply ? `/dashboard/products/edit/${selectedSupply.id}` : ""
        }
        canEdit={canEdit}
      >
        {selectedSupply && (
          <SupplyDetailContent supplyData={selectedSupply} isAdmin={isAdmin} />
        )}
      </DetailModal>
    </>
  );
}
