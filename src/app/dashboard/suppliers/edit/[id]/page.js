"use client";

import { useSession } from "next-auth/react";
import { redirect, notFound } from "next/navigation";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function EditSupplierPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const supplierId = use(params).id;

  const [formData, setFormData] = useState({
    name: "",
    contactInfo: "",
    email: "",
    fullAddress: "",
    status: "ACTIVE",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (
      status === "authenticated" &&
      !["ADMIN", "STAFF"].includes(session.user.role)
    ) {
      redirect("/dashboard");
    }
  }, [status, session]);

  // Fetch supplier on mount
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${supplierId}`);
        if (res.status === 404) {
          notFound();
        }
        if (!res.ok) throw new Error("Failed to load supplier");
        const supplier = await res.json();
        setFormData(supplier);
      } catch (err) {
        setError(err.message || "Unable to load supplier");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId, status]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  if (!session) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update supplier");
      }

      router.push("/dashboard/suppliers");
    } catch (err) {
      setError(err.message || "An error occurred while updating the supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-white">
        Loading supplier details...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Supplier</h1>
        <p className="text-slate-400 mt-2">
          Update supplier information below.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800"
      >
        {/* Name - Full Width */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Supplier Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="e.g. ABC Coal Ltd"
            required
          />
        </div>

        {/* Contact Info & Email - Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contactInfo"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Contact Information
            </label>
            <input
              id="contactInfo"
              name="contactInfo"
              type="text"
              value={formData.contactInfo || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="+234 801 234 5678"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="contact@supplier.com"
            />
          </div>
        </div>

        {/* Address - Full Width */}
        <div>
          <label
            htmlFor="fullAddress"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Full Address
          </label>
          <textarea
            id="fullAddress"
            name="fullAddress"
            value={formData.fullAddress || ""}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="123 Mining Road, Enugu, Nigeria"
          />
        </div>

        {/* Status - Half Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium flex items-center ${
              isSubmitting
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 shadow-md hover:shadow-emerald-500/30"
            }`}
          >
            {isSubmitting ? (
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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
