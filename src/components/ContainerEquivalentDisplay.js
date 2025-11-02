"use client";

import { useState, useEffect } from "react";
import { Container, Calculator, Info } from "lucide-react";

export default function ContainerEquivalentDisplay({
  amountInvested,
  containerEquivalent,
  containerCostNaira = 10000,
  showCalculation = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-8 bg-slate-700 rounded mb-2"></div>
          <div className="h-4 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }
  const formatCurrency = (amount) => {
    if (!amount) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Ensure containerEquivalent is a valid number
  const validContainerEquivalent =
    typeof containerEquivalent === "number" && !isNaN(containerEquivalent)
      ? containerEquivalent
      : 0;

  const fullContainers = Math.floor(validContainerEquivalent);
  const partialContainer = validContainerEquivalent - fullContainers;
  const partialPercentage = Math.round(partialContainer * 100);

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Container className="w-5 h-5 text-purple-400" />
        <h3 className="font-medium text-white">Container Equivalent</h3>
      </div>

      <div className="space-y-3">
        {/* Main Display */}
        <div className="text-center p-4 bg-slate-700/50 rounded-lg">
          <p className="text-purple-400 text-2xl font-bold">
            {validContainerEquivalent.toFixed(2)}
          </p>
          <p className="text-slate-400 text-sm">Container Equivalents</p>
        </div>

        {/* Breakdown */}
        {validContainerEquivalent > 0 && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-700/30 p-3 rounded">
              <p className="text-slate-400">Full Containers</p>
              <p className="text-white font-semibold">{fullContainers}</p>
            </div>
            <div className="bg-slate-700/30 p-3 rounded">
              <p className="text-slate-400">Partial</p>
              <p className="text-white font-semibold">{partialPercentage}%</p>
            </div>
          </div>
        )}

        {/* Calculation Details */}
        {showCalculation && amountInvested && (
          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">
                Calculation
              </span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Investment: {formatCurrency(amountInvested)}</p>
              <p>Cost per container: {formatCurrency(containerCostNaira)}</p>
              <p className="text-slate-300">
                {formatCurrency(amountInvested)} ÷{" "}
                {formatCurrency(containerCostNaira)} ={" "}
                {validContainerEquivalent.toFixed(2)} containers
              </p>
            </div>
          </div>
        )}

        {/* Explanation */}
        {validContainerEquivalent > 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">What this means:</p>
              <p>
                Your investment of {formatCurrency(amountInvested)} is
                equivalent to{" "}
                {fullContainers > 0
                  ? `${fullContainers} full container${
                      fullContainers > 1 ? "s" : ""
                    }${
                      partialPercentage > 0
                        ? ` plus ${partialPercentage}% of another container`
                        : ""
                    }`
                  : `${partialPercentage}% of one container`}
                . This determines your share in export profits.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
