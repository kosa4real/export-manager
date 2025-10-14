"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Container,
  Clock,
  Eye,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import DetailModal from "@/components/DetailModal";
import InvestorDetailContent from "@/components/InvestorDetailContent";

export default function InvestorsPage() {
  const { data: session, status } = useSession();
  const [investors, setInvestors] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchInvestors();
      fetchStats();
    }
  }, [status]);

  const fetchInvestors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/investors?page=1&limit=10");
      if (!response.ok) throw new Error("Failed to fetch investors");
      const data = await response.json();

      setInvestors(data.investors || []);
    } catch (err) {
      setError("Error fetching investors");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/investors/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this investor?")) return;

    try {
      const response = await fetch(`/api/investors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete investor");

      fetchInvestors(); // Refresh the list
    } catch (err) {
      setError("Error deleting investor");
      console.error("Error:", err);
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

  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const isInvestor = session.user.role === "INVESTOR";
  const canEdit = isAdmin;

  const formatCurrency = (amount, currency = "NGN") => {
    if (!amount) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    return new Intl.NumberFormat("en-US").format(num);
  };

  const renderStatsCards = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-3"
            >
              <div className="animate-pulse">
                <div className="w-4 h-4 bg-slate-700 rounded-lg mb-2"></div>
                <div className="h-3 bg-slate-700 rounded mb-1"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!stats) return null;

    // For investor users, show personal stats
    if (isInvestor && stats.personalInvestment) {
      const personal = stats.personalInvestment;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatsCard
            title="Investment"
            value={formatCurrency(personal.amountInvested)}
            icon={<DollarSign className="w-4 h-4" />}
            color="emerald"
            subtitle="Amount"
            className="p-3"
          />
          <StatsCard
            title="Status"
            value={personal.status}
            icon={<Activity className="w-4 h-4" />}
            color={
              personal.status === "ACTIVE"
                ? "green"
                : personal.status === "RETURNED"
                ? "blue"
                : "amber"
            }
            subtitle="Current"
            className="p-3"
          />
          <StatsCard
            title="Days"
            value={personal.daysSinceInvestment}
            icon={<Clock className="w-4 h-4" />}
            color="purple"
            subtitle="Invested"
            className="p-3"
          />
        </div>
      );
    }

    // For admin/staff users, show comprehensive stats
    return (
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatsCard
            title="Investors"
            value={formatNumber(stats.totalInvestors)}
            icon={<Users className="w-4 h-4" />}
            color="emerald"
            subtitle={`${stats.activeInvestors} Active`}
            trend={
              stats.newInvestorsLast30Days > 0
                ? {
                    value: `+${stats.newInvestorsLast30Days}`,
                    label: "new",
                    positive: true,
                  }
                : null
            }
            className="p-3"
          />
          <StatsCard
            title="Active"
            value={formatNumber(stats.activeInvestors)}
            icon={<Activity className="w-4 h-4" />}
            color="blue"
            subtitle="Investments"
            percentage={
              stats.totalInvestors > 0
                ? `${(
                    (stats.activeInvestors / stats.totalInvestors) *
                    100
                  ).toFixed(0)}%`
                : "0%"
            }
            className="p-3"
          />
          {isAdmin && (
            <StatsCard
              title="Total Invested"
              value={formatCurrency(stats.totalAmountInvested)}
              icon={<DollarSign className="w-4 h-4" />}
              color="green"
              subtitle="Naira"
              trend={
                stats.recentInvestmentAmount > 0
                  ? {
                      value: formatCurrency(stats.recentInvestmentAmount),
                      label: "recent",
                      positive: true,
                    }
                  : null
              }
              className="p-3"
            />
          )}
          {isAdmin && (
            <StatsCard
              title="Average"
              value={formatCurrency(stats.averageInvestment)}
              icon={<TrendingUp className="w-4 h-4" />}
              color="amber"
              subtitle="Per Investor"
              className="p-3"
            />
          )}
          {isAdmin && (
            <StatsCard
              title="Containers"
              value={formatNumber(stats.totalContainerEquivalent)}
              icon={<Container className="w-4 h-4" />}
              color="cyan"
              subtitle="Equivalent"
              className="p-3"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {isInvestor ? "My Investment" : "Investors Management"}
              </h1>
              <p className="text-slate-400 text-sm">
                {isInvestor
                  ? "View your investment details"
                  : "Manage investor accounts and investments"}
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/dashboard/investors/new"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105"
              >
                <span className="mr-2">+</span> Add New Investor
              </Link>
            )}
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Investors Table */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading investors...</p>
            </div>
          ) : investors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg
                className="w-16 h-16 mb-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No investors found</p>
              <p className="text-sm">
                {isAdmin
                  ? "Add a new investor to get started"
                  : "No investment records available"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/80 border-b border-slate-700">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Investment Date
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Status
                    </th>
                    {isAdmin && (
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Amount Invested (₦)
                      </th>
                    )}

                    {isAdmin && (
                      <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                        Profit Share
                      </th>
                    )}
                    <th className="text-left p-4 font-semibold text-slate-200 text-sm uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {investors.map((investor) => (
                    <tr
                      key={investor.id}
                      className="hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      <td className="p-4 text-slate-400 font-mono text-sm">
                        #{investor.id}
                      </td>
                      <td className="p-4 font-medium text-white">
                        {investor.name}
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {new Date(investor.investmentDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            investor.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : investor.status === "RETURNED"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {investor.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-green-400">
                          {investor.amountInvested
                            ? formatCurrency(investor.amountInvested)
                            : "-"}
                        </td>
                      )}

                      {isAdmin && (
                        <td className="p-4 text-cyan-400">
                          {investor.profitShare || "-"}
                        </td>
                      )}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedInvestor(investor)}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors duration-150 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {canEdit && (
                            <>
                              <Link
                                href={`/dashboard/investors/edit/${investor.id}`}
                                className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors duration-150"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(investor.id)}
                                className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors duration-150"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Investor Detail Modal */}
        <DetailModal
          isOpen={!!selectedInvestor}
          onClose={() => setSelectedInvestor(null)}
          title={selectedInvestor?.name || "Investor Details"}
          subtitle={`Investment ID: #${selectedInvestor?.id}`}
          editLink={
            canEdit ? `/dashboard/investors/edit/${selectedInvestor?.id}` : null
          }
          canEdit={canEdit}
        >
          {selectedInvestor && (
            <InvestorDetailContent
              investorData={selectedInvestor}
              isAdmin={isAdmin}
            />
          )}
        </DetailModal>
      </div>
    </div>
  );
}
