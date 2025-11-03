"use client";

import { useState, useEffect, useCallback } from "react";
import { Ship, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function ExportStatusIndicator({
  exportId,
  showDetails = false,
}) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/supply-exports/status?exportId=${exportId}`
      );
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch export status:", error);
    } finally {
      setLoading(false);
    }
  }, [exportId]);

  useEffect(() => {
    if (exportId) {
      fetchStatus();
    }
  }, [exportId, fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-red-400 text-sm">Error</span>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (status.status) {
      case "FULLY_SOURCED":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "text-emerald-400",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
          label: "Fully Sourced",
        };
      case "PARTIALLY_SOURCED":
        return {
          icon: <Clock className="w-4 h-4" />,
          color: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          label: "Partially Sourced",
        };
      case "UNSOURCED":
      default:
        return {
          icon: <Ship className="w-4 h-4" />,
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          label: "Unsourced",
        };
    }
  };

  const config = getStatusConfig();

  if (!showDetails) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor} border ${config.borderColor}`}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {config.icon}
        <span className={`font-medium ${config.color}`}>{config.label}</span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Total Needed:</span>
          <span className="text-white">
            {status.totalQuantity?.toLocaleString()} bags
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Sourced:</span>
          <span className="text-emerald-400">
            {status.sourcedQuantity?.toLocaleString()} bags
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Still Needed:</span>
          <span className="text-amber-400">
            {status.neededQuantity?.toLocaleString()} bags
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Fulfillment:</span>
          <span className="text-white">{status.fulfillmentPercentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(status.fulfillmentPercentage, 100)}%` }}
          />
        </div>
      </div>

      {status.sources && status.sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-slate-400 text-xs mb-2">Sourced from:</p>
          <div className="space-y-1">
            {status.sources.slice(0, 3).map((source, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-slate-300">{source.supplierName}</span>
                <span className="text-emerald-400">{source.quantity} bags</span>
              </div>
            ))}
            {status.sources.length > 3 && (
              <p className="text-slate-500 text-xs">
                +{status.sources.length - 3} more...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
