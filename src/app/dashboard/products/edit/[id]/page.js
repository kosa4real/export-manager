"use client";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, use } from "react";

export default function EditSupplyPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const supplyId = use(params).id;

  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    supplierId: "",
    supplyDate: "",
    quantityBags: "",
    unitPrice: "",
    amountPaid: "",
    balanceAmount: "",
    paymentStatus: "BALANCED",
    gradeA: "",
    gradeB: "",
    rejectedBags: "",
    dustBags: "",
    woodBags: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSuppliers();
      fetchSupply();
    }
  }, [status, fetchSupply]);

  // Auto-calculate balance for admin
  useEffect(() => {
    const isAdmin = session?.user?.role === "ADMIN";
    if (!isAdmin || !formData.quantityBags || !formData.unitPrice) return;

    const qty = parseFloat(formData.quantityBags);
    const price = parseFloat(formData.unitPrice);
    const paid = parseFloat(formData.amountPaid) || 0;

    if (!isNaN(qty) && !isNaN(price)) {
      const total = qty * price;
      const balance = total - paid;
      setFormData((prev) => ({
        ...prev,
        balanceAmount: balance.toFixed(2),
      }));

      if (balance > 0.01) {
        setFormData((prev) => ({ ...prev, paymentStatus: "UNDERPAID" }));
      } else if (balance < -0.01) {
        setFormData((prev) => ({ ...prev, paymentStatus: "OVERPAID" }));
      } else {
        setFormData((prev) => ({ ...prev, paymentStatus: "BALANCED" }));
      }
    }
  }, [
    formData.quantityBags,
    formData.unitPrice,
    formData.amountPaid,
    session?.user?.role,
  ]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      const data = await response.json();
      setSuppliers(data.suppliers || data);
    } catch (err) {
      setError("Error fetching suppliers");
    }
  };

  const fetchSupply = useCallback(async () => {
    try {
      const response = await fetch(`/api/supplies/${supplyId}`);
      if (!response.ok) throw new Error("Failed to fetch supply");
      const supply = await response.json();

      setFormData({
        supplierId: supply.supplierId?.toString() || "",
        supplyDate: supply.supplyDate
          ? new Date(supply.supplyDate).toISOString().split("T")[0]
          : "",
        quantityBags: supply.quantityBags?.toString() || "",
        unitPrice: supply.unitPrice?.toString() || "",
        amountPaid: supply.amountPaid?.toString() || "",
        balanceAmount: supply.balanceAmount?.toString() || "",
        paymentStatus: supply.paymentStatus || "BALANCED",
        gradeA: supply.gradeA?.toString() || "0",
        gradeB: supply.gradeB?.toString() || "0",
        rejectedBags: supply.rejectedBags?.toString() || "0",
        dustBags: supply.dustBags?.toString() || "0",
        woodBags: supply.woodBags?.toString() || "0",
        notes: supply.notes || "",
      });
    } catch (err) {
      setError("Error loading supply data");
    } finally {
      setLoading(false);
    }
  }, [supplyId]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role))
    redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const totalGraded =
      (parseInt(formData.gradeA) || 0) +
      (parseInt(formData.gradeB) || 0) +
      (parseInt(formData.rejectedBags) || 0) +
      (parseInt(formData.dustBags) || 0) +
      (parseInt(formData.woodBags) || 0);

    const totalBags = parseInt(formData.quantityBags);

    if (totalGraded > totalBags) {
      setError("Sum of graded bags cannot exceed total quantity");
      return;
    }

    try {
      const payload = {
        supplierId: parseInt(formData.supplierId),
        supplyDate: formData.supplyDate,
        quantityBags: totalBags,
        gradeA: parseInt(formData.gradeA) || 0,
        gradeB: parseInt(formData.gradeB) || 0,
        rejectedBags: parseInt(formData.rejectedBags) || 0,
        dustBags: parseInt(formData.dustBags) || 0,
        woodBags: parseInt(formData.woodBags) || 0,
        notes: formData.notes || undefined,
      };

      if (isAdmin) {
        payload.unitPrice = parseFloat(formData.unitPrice);
        payload.amountPaid = parseFloat(formData.amountPaid) || 0;
        payload.balanceAmount = parseFloat(formData.balanceAmount) || 0;
        payload.paymentStatus = formData.paymentStatus;
      }

      const response = await fetch(`/api/supplies/${supplyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update supply");
      }

      router.push("/dashboard/products");
    } catch (err) {
      setError(err.message || "Error updating supply");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading supply...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Edit Supply
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Supplier & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-300 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">
                Supply Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="supplyDate"
                value={formData.supplyDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-slate-300 mb-2">
              Total Quantity (Bags) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantityBags"
              value={formData.quantityBags}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>

          {/* Admin Financial Fields */}
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-300 mb-2">
                  Unit Price (NGN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">
                  Amount Paid (NGN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amountPaid"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">
                  Balance Amount (NGN)
                </label>
                <input
                  type="number"
                  name="balanceAmount"
                  step="0.01"
                  value={formData.balanceAmount}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-amber-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="BALANCED">Balanced</option>
                  <option value="UNDERPAID">Underpaid</option>
                  <option value="OVERPAID">Overpaid</option>
                </select>
              </div>
            </div>
          )}

          {/* Grade Breakdown */}
          <div className="border-t border-slate-800 pt-5">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Grade Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Grade A", name: "gradeA" },
                { label: "Grade B", name: "gradeB" },
                { label: "Rejected", name: "rejectedBags" },
                { label: "Dust", name: "dustBags" },
                { label: "Wood", name: "woodBags" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-slate-300 mb-2">
                    {field.label} (Bags)
                  </label>
                  <input
                    type="number"
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                "Update Supply"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/supplies")}
              className="px-6 py-3 bg-slate-700 rounded-lg font-medium text-white hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
