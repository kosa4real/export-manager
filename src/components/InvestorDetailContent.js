"use client";

import { useState, useEffect } from "react";
import ContainerEquivalentDisplay from "./ContainerEquivalentDisplay";

export default function InvestorDetailContent({ investorData, isAdmin }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-700 rounded mb-2"></div>
        <div className="h-4 bg-slate-700 rounded mb-2"></div>
        <div className="h-4 bg-slate-700 rounded"></div>
      </div>
    );
  }
  const formatCurrency = (amount, currency = "NGN") => {
    if (!amount) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      // Use a more consistent format to avoid hydration issues
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
      case "RETURNED":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "PARTIAL":
        return "text-amber-400 bg-amber-500/20 border-amber-500/30";
      default:
        return "text-slate-400 bg-slate-500/20 border-slate-500/30";
    }
  };

  const daysSinceInvestment = Math.floor(
    (new Date() - new Date(investorData.investmentDate)) / (1000 * 60 * 60 * 24)
  );

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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Basic Information
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">Investor ID</span>
            <span className="text-white font-mono">#{investorData.id}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">Full Name</span>
            <span className="text-white font-medium">{investorData.name}</span>
          </div>

          {investorData.email && (
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm">Email</span>
              <span className="text-white">{investorData.email}</span>
            </div>
          )}

          {investorData.contactInfo && (
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm">Contact</span>
              <span className="text-white">{investorData.contactInfo}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">Investment Date</span>
            <span className="text-white">
              {formatDate(investorData.investmentDate)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">Days Invested</span>
            <span className="text-cyan-400 font-medium">
              {daysSinceInvestment} days
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400 text-sm">Status</span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                investorData.status
              )}`}
            >
              {investorData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      {isAdmin && (
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Financial Details
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm">Amount Invested</span>
              <span className="text-green-400 font-semibold">
                {formatCurrency(investorData.amountInvested)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm">
                Current Exchange Rate in SAR
              </span>
              <span className="text-blue-400 font-medium">
                ₦{investorData.exchangeRate}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm">Profit Share</span>
              <span className="text-cyan-400 font-medium">
                {investorData.profitShare}
              </span>
            </div>

            {investorData.containerEquivalent && (
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">
                  Container Equivalent
                </span>
                <span className="text-purple-400 font-medium">
                  {investorData.containerEquivalent}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-sm">Bank</span>
              <span className="text-white">{investorData.bankName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Container Equivalent Display */}
      {investorData.containerEquivalent && (
        <div className="md:col-span-2 mt-6">
          <ContainerEquivalentDisplay
            amountInvested={investorData.amountInvested}
            containerEquivalent={investorData.containerEquivalent}
            showCalculation={isAdmin}
          />
        </div>
      )}

      {/* Investment Summary */}
      <div className="md:col-span-2 mt-6">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Investment Summary
        </h3>

        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
          {isAdmin && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-sm">Total Investment</p>
                  <p className="text-green-400 font-bold text-lg">
                    {formatCurrency(investorData.amountInvested)}
                  </p>
                </div>
              </div>
            </>
          )}

          {investorData.notes && (
            <div className="mt-4">
              <h4 className="text-slate-300 font-medium mb-2">Notes</h4>
              <p className="text-slate-400 text-sm bg-slate-700/30 p-3 rounded-lg">
                {investorData.notes}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <span className="text-slate-400 text-sm">Record Created</span>
            <span className="text-slate-300 text-sm">
              {formatDate(investorData.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
