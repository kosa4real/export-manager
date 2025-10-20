"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SupplyExportsPage() {
  const { data: session, status } = useSession();
  const [supplyExports, setSupplyExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
              <Link
                href="/dashboard/supply-exports/new"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105"
              >
                <span className="mr-2">+</span> Add New Mapping
              </Link>
            )}
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
                      <td className="p-4 text-slate-300 text-sm">
                        {se.supply.supplier.name} (ID: {se.supply.id},{" "}
                        {new Date(se.supply.supplyDate).toLocaleDateString()})
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {se.export.destinationCountry},{" "}
                        {se.export.destinationCity} (ID: {se.export.id},{" "}
                        {new Date(se.export.exportDate).toLocaleDateString()})
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {se.quantityBags}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/supply-exports/edit/${se.supplyId}-${se.exportId}`}
                            className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors duration-150"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(se.supplyId, se.exportId)
                            }
                            className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors duration-150"
                          >
                            Delete
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
      </div>
    </div>
  );
}
