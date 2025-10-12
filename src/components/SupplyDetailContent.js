"use client";

export default function SupplyDetailContent({ supplyData, isAdmin }) {
  const formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    return !isNaN(num) ? num.toFixed(2) : "0.00";
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

  return (
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
            <span className="text-slate-400 text-sm">Supplier</span>
            <span className="text-white font-medium text-right">
              {supplyData.supplier.name}
            </span>
          </div>
          <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
            <span className="text-slate-400 text-sm">Supply Date</span>
            <span className="text-white font-medium">
              {new Date(supplyData.supplyDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
            <span className="text-slate-400 text-sm">Total Bags</span>
            <span className="text-emerald-400 font-bold text-lg">
              {supplyData.quantityBags.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grade Breakdown */}
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Grade Breakdown
        </h3>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/30">
          {getGradeDetails(supplyData).map((item, idx) => (
            <div
              key={idx}
              className={idx > 0 ? "border-t border-slate-700/30 pt-3" : ""}
            >
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className={`font-bold text-lg ${item.color}`}>
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
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
                  Unit Price
                </span>
                <span className="text-white font-bold text-xl">
                  ₦{formatCurrency(supplyData.unitPrice)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-sm block mb-1">
                  Amount Paid
                </span>
                <span className="text-green-400 font-bold text-xl">
                  ₦{formatCurrency(supplyData.amountPaid)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-sm block mb-1">
                  Balance
                </span>
                <span
                  className={`font-bold text-xl ${
                    parseFloat(supplyData.balanceAmount) > 0
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  ₦{formatCurrency(supplyData.balanceAmount)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Payment Status</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    parseFloat(supplyData.balanceAmount) > 0
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}
                >
                  {supplyData.paymentStatus.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {supplyData.notes && (
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
              {supplyData.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
