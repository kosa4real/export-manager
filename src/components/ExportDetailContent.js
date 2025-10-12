"use client";

export default function ExportDetailContent({ exportData, isAdmin }) {
  const formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    return !isNaN(num) ? num.toLocaleString() : "0";
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
            <span className="text-slate-400 text-sm">Export Date</span>
            <span className="text-white font-medium">
              {new Date(exportData.exportDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
            <span className="text-slate-400 text-sm">Total Bags</span>
            <span className="text-emerald-400 font-bold text-lg">
              {exportData.quantityBags.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
            <span className="text-slate-400 text-sm">Status</span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                exportData.status === "DELIVERED"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : exportData.status === "IN_TRANSIT"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : exportData.status === "PENDING"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {exportData.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Destination & Buyer */}
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
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Destination
        </h3>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/30">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-sm">City</span>
            <span className="text-white font-medium text-right">
              {exportData.destinationCity}
            </span>
          </div>
          <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
            <span className="text-slate-400 text-sm">Country</span>
            <span className="text-white font-medium text-right">
              {exportData.destinationCountry}
            </span>
          </div>
          <div className="border-t border-slate-700/30 pt-3 flex justify-between items-start">
            <span className="text-slate-400 text-sm">Buyer</span>
            <span className="text-white font-medium text-right">
              {exportData.buyer || (
                <span className="text-slate-500 italic">Not specified</span>
              )}
            </span>
          </div>
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
                  Amount Received
                </span>
                <span className="text-white font-bold text-xl">
                  {exportData.amountReceived ? (
                    `₦${formatCurrency(exportData.amountReceived)}`
                  ) : (
                    <span className="text-slate-500 text-base">
                      Not specified
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-sm block mb-1">
                  Net Profit
                </span>
                <span
                  className={`font-bold text-xl ${
                    exportData.netProfit && exportData.netProfit > 0
                      ? "text-green-400"
                      : "text-slate-500"
                  }`}
                >
                  {exportData.netProfit ? (
                    `₦${formatCurrency(exportData.netProfit)}`
                  ) : (
                    <span className="text-slate-500 text-base">
                      Not specified
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-sm block mb-1">
                  Profit Margin
                </span>
                <span className="text-cyan-400 font-bold text-xl">
                  {exportData.netProfit && exportData.amountReceived ? (
                    `${(
                      (exportData.netProfit / exportData.amountReceived) *
                      100
                    ).toFixed(1)}%`
                  ) : (
                    <span className="text-slate-500 text-base">—</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {exportData.notes && (
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
              {exportData.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
