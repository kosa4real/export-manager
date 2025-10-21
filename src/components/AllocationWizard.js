"use client";

import { useState, useEffect } from "react";
import {
  Wand2,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Package,
  Ship,
  Target,
  Zap,
} from "lucide-react";

export default function AllocationWizard({
  isOpen,
  onClose,
  exportId,
  onAllocationComplete,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedAllocations, setSelectedAllocations] = useState([]);
  const [strategy, setStrategy] = useState("OPTIMAL");
  const [error, setError] = useState("");

  const strategies = [
    {
      value: "OPTIMAL",
      label: "Optimal",
      description: "Balance quality and age for best results",
      icon: <Target className="w-4 h-4" />,
    },
    {
      value: "FIFO",
      label: "First In, First Out",
      description: "Use oldest supplies first",
      icon: <Package className="w-4 h-4" />,
    },
    {
      value: "QUALITY_FIRST",
      label: "Quality First",
      description: "Prioritize highest quality supplies",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      value: "LIFO",
      label: "Last In, First Out",
      description: "Use newest supplies first",
      icon: <Ship className="w-4 h-4" />,
    },
  ];

  useEffect(() => {
    if (isOpen && exportId) {
      fetchSuggestions();
    }
  }, [isOpen, exportId, strategy]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/supply-exports/suggestions?exportId=${exportId}&strategy=${strategy}&maxSuggestions=10`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      setExportData({
        id: data.suggestions.exportId,
        destination: data.suggestions.destination,
        totalNeeded: data.suggestions.totalNeeded,
        alreadySourced: data.suggestions.alreadySourced,
        stillNeeded: data.suggestions.stillNeeded,
        fullySourced: data.suggestions.fullySourced,
      });

      // Auto-select all suggestions initially
      setSelectedAllocations(
        data.suggestions.suggestions.map((s) => ({
          supplyId: s.supplyId,
          quantityBags: s.suggestedQuantity,
          selected: true,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationToggle = (supplyId, checked) => {
    setSelectedAllocations((prev) =>
      prev.map((alloc) =>
        alloc.supplyId === supplyId ? { ...alloc, selected: checked } : alloc
      )
    );
  };

  const handleQuantityChange = (supplyId, quantity) => {
    setSelectedAllocations((prev) =>
      prev.map((alloc) =>
        alloc.supplyId === supplyId
          ? { ...alloc, quantityBags: parseInt(quantity) || 0 }
          : alloc
      )
    );
  };

  const executeAllocations = async () => {
    setLoading(true);
    setError("");

    const allocationsToCreate = selectedAllocations
      .filter((alloc) => alloc.selected && alloc.quantityBags > 0)
      .map((alloc) => ({
        supplyId: alloc.supplyId,
        exportId: exportId,
        quantityBags: alloc.quantityBags,
        notes: `Allocated via wizard using ${strategy} strategy`,
      }));

    if (allocationsToCreate.length === 0) {
      setError("No allocations selected");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/supply-exports/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations: allocationsToCreate,
          validateFirst: true, // Re-enable validation now that schema is fixed
        }),
      });

      const data = await response.json();
      console.log("Bulk allocation response:", data);

      if (!response.ok) {
        console.error("Bulk allocation failed:", data);
        throw new Error(
          data.details || data.error || "Failed to create allocations"
        );
      }

      if (data.success) {
        onAllocationComplete?.(data);
        onClose();
      } else {
        setError(
          `Created ${data.summary.created} allocations with ${data.summary.failed} errors`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedAllocations.filter((a) => a.selected).length;
  const selectedQuantity = selectedAllocations
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.quantityBags, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Allocation Wizard
                </h2>
                <p className="text-slate-400 text-sm">
                  {exportData
                    ? `Export to ${exportData.destination}`
                    : "Loading..."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-6">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-slate-700 border border-slate-600"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Strategy</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-slate-700 border border-slate-600"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <div
              className={`flex items-center gap-2 ${
                step >= 3 ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-slate-700 border border-slate-600"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Execute</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Strategy Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Choose Allocation Strategy
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Select how you want to allocate supplies to this export
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategies.map((strat) => (
                  <button
                    key={strat.value}
                    onClick={() => setStrategy(strat.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      strategy === strat.value
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {strat.icon}
                      <span className="font-medium text-white">
                        {strat.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {strat.description}
                    </p>
                  </button>
                ))}
              </div>

              {exportData && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">
                    Export Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Total Needed</p>
                      <p className="text-white font-medium">
                        {exportData.totalNeeded?.toLocaleString()} bags
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Already Sourced</p>
                      <p className="text-emerald-400 font-medium">
                        {exportData.alreadySourced?.toLocaleString()} bags
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Still Needed</p>
                      <p className="text-amber-400 font-medium">
                        {exportData.stillNeeded?.toLocaleString()} bags
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review Suggestions */}
          {step === 2 && suggestions && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Review Suggestions
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {suggestions.suggestions?.length || 0} supplies found using{" "}
                    {strategy} strategy
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    Selected: {selectedCount} supplies
                  </p>
                  <p className="text-sm text-emerald-400 font-medium">
                    {selectedQuantity.toLocaleString()} bags
                  </p>
                </div>
              </div>

              {suggestions.suggestions?.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.suggestions.map((suggestion, index) => {
                    const allocation = selectedAllocations.find(
                      (a) => a.supplyId === suggestion.supplyId
                    );
                    return (
                      <div
                        key={suggestion.supplyId}
                        className={`p-4 rounded-lg border transition-all ${
                          allocation?.selected
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-slate-700 bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={allocation?.selected || false}
                            onChange={(e) =>
                              handleAllocationToggle(
                                suggestion.supplyId,
                                e.target.checked
                              )
                            }
                            className="mt-1 w-4 h-4 text-emerald-500 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                          />

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-white font-medium">
                                Supply #{suggestion.supplyId}
                              </p>
                              <p className="text-slate-400 text-sm">
                                {suggestion.supplierName}
                              </p>
                              <p className="text-slate-400 text-xs">
                                {new Date(
                                  suggestion.supplyDate
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-400 text-sm">
                                Available
                              </p>
                              <p className="text-white">
                                {suggestion.availableQuantity.toLocaleString()}{" "}
                                bags
                              </p>
                              <p className="text-slate-400 text-xs">
                                {typeof suggestion.quality === "object"
                                  ? `A:${suggestion.quality.gradeA}, B:${suggestion.quality.gradeB}, R:${suggestion.quality.rejected}`
                                  : suggestion.quality}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-400 text-sm">
                                Suggested
                              </p>
                              <input
                                type="number"
                                value={allocation?.quantityBags || 0}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    suggestion.supplyId,
                                    e.target.value
                                  )
                                }
                                max={suggestion.availableQuantity}
                                min={0}
                                className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                disabled={!allocation?.selected}
                              />
                            </div>

                            <div>
                              <p className="text-slate-400 text-sm">Reason</p>
                              <p className="text-emerald-400 text-xs">
                                {suggestion.recommendation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Info className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>No suitable supplies found for allocation</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 2 ? (
              <button
                onClick={() => setStep(2)}
                disabled={loading || !suggestions}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={executeAllocations}
                disabled={loading || selectedCount === 0}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create {selectedCount} Allocations
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
