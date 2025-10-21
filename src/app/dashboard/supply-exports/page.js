"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";
import {
  Link as LinkIcon,
  Package,
  Ship,
  TrendingUp,
  Target,
  Activity,
  Wand2,
  Zap,
  Eye,
  Plus,
} from "lucide-react";
import AllocationWizard from "@/components/AllocationWizard";
import SupplyStatusIndicator from "@/components/SupplyStatusIndicator";
import ExportStatusIndicator from "@/components/ExportStatusIndicator";

export default function SupplyExportsPage() {
  const { data: session, status } = useSession();
  const [supplyExports, setSupplyExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedExportId, setSelectedExportId] = useState(null);
  const [availableExports, setAvailableExports] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (status === "authenticated") {
      fetchSupplyExports();
      fetchStats();
      fetchAvailableExports();
    }
  }, [status]);

  const fetchSupplyExports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/supply-exports?page=1&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch supply-exports");
      const data = await response.json();
      setSupplyExports(data.supplyExports || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 10,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      });
    } catch (err) {
      setError("Error fetching supply-exports");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/supply-exports/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvailableExports = async () => {
    try {
      const response = await fetch("/api/exports?limit=100");
      if (response.ok) {
        const data = await response.json();
        setAvailableExports(data.exports || []);
      }
    } catch (err) {
      console.error("Error fetching available exports:", err);
    }
  };

  const handleWizardComplete = (result) => {
    fetchSupplyExports();
    fetchStats();
    setError("");
  };

  const openWizardForExport = (exportId) => {
    setSelectedExportId(exportId);
    setShowWizard(true);
  };

  const handleDelete = async (supplyId, exportId) => {
    if (!confirm("Are you sure you want to delete this supply-export mapping?"))
      return;

    try {
      const response = await fetch(
        `/api/supply-exports/${supplyId}-${exportId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete supply-export");
      fetchSupplyExports();
    } catch (err) {
      setError("Error deleting supply-export");
      console.error("Error:", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const canEdit = ["ADMIN", "STAFF"].includes(session.user.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Supply-Exports Management
              </h1>
              <p className="text-slate-400 text-sm">
                Manage mappings between supplies and export shipments
              </p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        openWizardForExport(parseInt(e.target.value));
                        e.target.value = "";
                      }
                    }}
                    className="appearance-none bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/30 hover:scale-105 pr-10"
                  >
                    <option value="">🪄 Allocation Wizard</option>
                    {availableExports.map((exp) => (
                      <option
                        key={exp.id}
                        value={exp.id}
                        className="bg-slate-800 text-white"
                      >
                        Export #{exp.id} - {exp.destinationCity},{" "}
                        {exp.destinationCountry}
                      </option>
                    ))}
                  </select>
                  <Wand2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
                </div>

                <Link
                  href="/dashboard/supply-exports/new"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Manual Mapping
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-3"
              >
                <div className="animate-pulse">
                  <div className="w-4 h-4 bg-slate-700 rounded-lg mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-1"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatsCard
              title="Total Mappings"
              value={stats.totalMappings?.toLocaleString() || "0"}
              icon={<LinkIcon className="w-4 h-4" />}
              color="emerald"
              subtitle="Active"
              trend={
                stats.mappingsLast30Days > 0
                  ? {
                      value: `+${stats.mappingsLast30Days}`,
                      label: "recent",
                      positive: true,
                    }
                  : null
              }
              className="p-3"
            />
            <StatsCard
              title="Mapped Quantity"
              value={`${
                stats.totalMappedQuantity?.toLocaleString() || "0"
              } Bags`}
              icon={<Package className="w-4 h-4" />}
              color="blue"
              subtitle="Total"
              className="p-3"
            />
            <StatsCard
              title="Supply Coverage"
              value={`${stats.supplyMappingEfficiency || 0}%`}
              icon={<Target className="w-4 h-4" />}
              color="purple"
              subtitle={`${stats.suppliesWithMappings || 0}/${
                stats.totalSupplies || 0
              } Supplies`}
              className="p-3"
            />
            <StatsCard
              title="Export Coverage"
              value={`${stats.exportMappingEfficiency || 0}%`}
              icon={<Ship className="w-4 h-4" />}
              color="amber"
              subtitle={`${stats.exportsWithMappings || 0}/${
                stats.totalExports || 0
              } Exports`}
              className="p-3"
            />
          </div>
        ) : null}

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
              <p>Loading supply-exports...</p>
            </div>
          ) : supplyExports.length === 0 ? (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-lg font-medium mb-1">
                No supply-export mappings found
              </p>
              <p className="text-sm">Add a new mapping to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/80 border-b border-slate-700">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Supply
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Export
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Quantity (Bags)
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {supplyExports.map((se) => (
                    <tr
                      key={`${se.supplyId}-${se.exportId}`}
                      className="hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="text-slate-300 text-sm">
                            <span className="font-medium">
                              {se.supply.supplier.name}
                            </span>
                            <span className="text-slate-500 ml-2">
                              #{se.supply.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(
                              se.supply.supplyDate
                            ).toLocaleDateString()}
                          </div>
                          <SupplyStatusIndicator supplyId={se.supplyId} />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="text-slate-300 text-sm">
                            <span className="font-medium">
                              {se.export.destinationCity},{" "}
                              {se.export.destinationCountry}
                            </span>
                            <span className="text-slate-500 ml-2">
                              #{se.export.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(
                              se.export.exportDate
                            ).toLocaleDateString()}
                          </div>
                          <ExportStatusIndicator exportId={se.exportId} />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-emerald-400">
                            {se.quantityBags.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400">bags</div>
                          {se.notes && (
                            <div className="text-xs text-slate-500 mt-1 max-w-32 truncate">
                              {se.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              /* View details */
                            }}
                            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all duration-150"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/dashboard/supply-exports/edit/${se.supplyId}-${se.exportId}`}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-all duration-150"
                            title="Edit Mapping"
                          >
                            <Package className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(se.supplyId, se.exportId)
                            }
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-150"
                            title="Delete Mapping"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Destinations */}
        {stats && stats.topDestinations && stats.topDestinations.length > 0 && (
          <div className="mt-6 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Top Export Destinations by Mapped Quantity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topDestinations.map((dest, index) => (
                <div
                  key={index}
                  className="bg-slate-800/60 p-4 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 font-medium">
                        {dest.destination}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {dest.quantity?.toLocaleString() || 0} bags mapped
                      </p>
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Allocation Wizard */}
      <AllocationWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          setSelectedExportId(null);
        }}
        exportId={selectedExportId}
        onAllocationComplete={handleWizardComplete}
      />
    </div>
  );
}
