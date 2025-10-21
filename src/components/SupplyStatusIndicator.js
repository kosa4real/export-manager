"use client";

import { useState, useEffect } from "react";
import { Package, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function SupplyStatusIndicator({
  supplyId,
  showDetails = false,
}) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supplyId) {
      fetchStatus();
    }
  }, [supplyId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `/api/supply-exports/status?supplyId=${supplyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch supply status:", error);
    } finally {
      setLoading(false);
    }
  };

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
      case "FULLY_ALLOCATED":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "text-emerald-400",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
          label: "Fully Allocated",
        };
      case "PARTIALLY_ALLOCATED":
        return {
          icon: <Clock className="w-4 h-4" />,
          color: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          label: "Partially Allocated",
        };
      case "UNALLOCATED":
      default:
        return {
          icon: <Package className="w-4 h-4" />,
          color: "text-slate-400",
          bgColor: "bg-slate-500/10",
          borderColor: "border-slate-500/30",
          label: "Unallocated",
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
          <span className="text-slate-400">Total Quantity:</span>
          <span className="text-white">
            {status.totalQuantity?.toLocaleString()} bags
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Allocated:</span>
          <span className="text-emerald-400">
            {status.allocatedQuantity?.toLocaleString()} bags
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Available:</span>
          <span className="text-amber-400">
            {status.availableQuantity?.toLocaleString()} bags
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Utilization:</span>
          <span className="text-white">{status.utilizationPercentage}%</span>
        </div>
      </div>

      {status.allocations && status.allocations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-slate-400 text-xs mb-2">Allocated to:</p>
          <div className="space-y-1">
            {status.allocations.slice(0, 3).map((allocation, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-slate-300">
                  Export #{allocation.exportId}
                </span>
                <span className="text-emerald-400">
                  {allocation.quantity} bags
                </span>
              </div>
            ))}
            {status.allocations.length > 3 && (
              <p className="text-slate-500 text-xs">
                +{status.allocations.length - 3} more...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
