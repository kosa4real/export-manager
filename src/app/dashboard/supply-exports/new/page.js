"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewSupplyExportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [supplies, setSupplies] = useState([]);
  const [exports, setExports] = useState([]);
  const [formData, setFormData] = useState({
    supplyId: "",
    exportId: "",
    quantityBags: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      status === "authenticated" &&
      ["ADMIN", "STAFF"].includes(session.user.role)
    ) {
      fetchSupplies();
      fetchExports();
    }
  }, [status]);

  const fetchSupplies = async () => {
    try {
      const response = await fetch("/api/supplies?page=1&limit=100");
      if (!response.ok) throw new Error("Failed to fetch supplies");
      const data = await response.json();
      setSupplies(data.supplies || []);
    } catch (err) {
      setError("Error fetching supplies");
    }
  };

  const fetchExports = async () => {
    try {
      const response = await fetch("/api/exports?page=1&limit=100");
      if (!response.ok) throw new Error("Failed to fetch exports");
      const data = await response.json();
      setExports(data.exports || []);
    } catch (err) {
      setError("Error fetching exports");
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

  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/login");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/supply-exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplyId: formData.supplyId,
          exportId: formData.exportId,
          quantityBags: parseInt(formData.quantityBags),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create supply-export");
      }

      router.push("/dashboard/supply-exports");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Add New Supply-Export Mapping
          </h1>
          <p className="text-slate-400 text-sm">
            Create a mapping between a supply and export shipment
          </p>
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

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-8"
        >
          <div>
            <label className="block mb-2 text-slate-200 font-medium">
              Supply
            </label>
            <select
              value={formData.supplyId}
              onChange={(e) =>
                setFormData({ ...formData, supplyId: e.target.value })
              }
              className="w-full border border-slate-700 bg-slate-800 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="">Select a Supply</option>
              {supplies.map((supply) => (
                <option key={supply.id} value={supply.id}>
                  {supply.supplier.name} -{" "}
                  {new Date(supply.supplyDate).toLocaleDateString()} (
                  {supply.quantityBags} bags)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-slate-200 font-medium">
              Export
            </label>
            <select
              value={formData.exportId}
              onChange={(e) =>
                setFormData({ ...formData, exportId: e.target.value })
              }
              className="w-full border border-slate-700 bg-slate-800 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="">Select an Export</option>
              {exports.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.destinationCountry}, {exp.destinationCity} -{" "}
                  {new Date(exp.exportDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-slate-200 font-medium">
              Quantity (Bags)
            </label>
            <input
              type="number"
              value={formData.quantityBags}
              onChange={(e) =>
                setFormData({ ...formData, quantityBags: e.target.value })
              }
              className="w-full border border-slate-700 bg-slate-800 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter quantity in bags"
              required
              min="1"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Save Mapping"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
