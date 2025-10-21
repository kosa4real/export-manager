"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import StatsCard from "./StatsCard";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Package,
  Ship,
  Building2,
  Calendar,
  Link,
} from "lucide-react";

const DashboardOverview = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchAllStats();
    }
  }, [session]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const [investorStats, suppliesStats, exportsStats, supplyExportsStats] =
        await Promise.all([
          fetch("/api/investors/stats").then((res) =>
            res.ok ? res.json() : {}
          ),
          fetch("/api/supplies/stats").then((res) =>
            res.ok ? res.json() : {}
          ),
          fetch("/api/exports/stats").then((res) => (res.ok ? res.json() : {})),
          fetch("/api/supply-exports/stats").then((res) =>
            res.ok ? res.json() : {}
          ),
        ]);

      setStats({
        investors: investorStats,
        supplies: suppliesStats,
        exports: exportsStats,
        supplyExports: supplyExportsStats,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
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

  const isAdmin = session?.user?.role === "ADMIN";
  const isInvestor = session?.user?.role === "INVESTOR";

  // For investor users, show personal stats
  if (isInvestor && stats.investors?.personalInvestment) {
    const personal = stats.investors.personalInvestment;
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
          icon={<Calendar className="w-4 h-4" />}
          color="purple"
          subtitle="Invested"
          className="p-3"
        />
        <StatsCard
          title="Linked Exports"
          value={formatNumber(stats.exports?.totalExports || 0)}
          icon={<Ship className="w-4 h-4" />}
          color="blue"
          subtitle="Total"
          className="p-3"
        />
      </div>
    );
  }

  // For admin/staff users, show comprehensive overview
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Investors Overview */}
        <StatsCard
          title="Investors"
          value={formatNumber(stats.investors?.totalInvestors)}
          icon={<Users className="w-4 h-4" />}
          color="emerald"
          subtitle={`${stats.investors?.activeInvestors || 0} Active`}
          trend={
            stats.investors?.newInvestorsLast30Days > 0
              ? {
                  value: `+${stats.investors.newInvestorsLast30Days}`,
                  label: "new",
                  positive: true,
                }
              : null
          }
          className="p-3"
        />

        {/* Supplies Overview */}
        <StatsCard
          title="Supplies"
          value={formatNumber(stats.supplies?.totalSupplies)}
          icon={<Package className="w-4 h-4" />}
          color="blue"
          subtitle={`${formatNumber(stats.supplies?.totalQuantityBags)} Bags`}
          trend={
            stats.supplies?.suppliesLast30Days > 0
              ? {
                  value: `+${stats.supplies.suppliesLast30Days}`,
                  label: "recent",
                  positive: true,
                }
              : null
          }
          className="p-3"
        />

        {/* Exports Overview */}
        <StatsCard
          title="Exports"
          value={formatNumber(stats.exports?.totalExports)}
          icon={<Ship className="w-4 h-4" />}
          color="purple"
          subtitle={`${formatNumber(stats.exports?.totalQuantityBags)} Bags`}
          trend={
            stats.exports?.exportsLast30Days > 0
              ? {
                  value: `+${stats.exports.exportsLast30Days}`,
                  label: "recent",
                  positive: true,
                }
              : null
          }
          className="p-3"
        />

        {/* Supply-Exports Overview */}
        <StatsCard
          title="Supply-Export Mappings"
          value={formatNumber(stats.supplyExports?.totalMappings)}
          icon={<Link className="w-4 h-4" />}
          color="amber"
          subtitle={`${formatNumber(
            stats.supplyExports?.totalMappedQuantity
          )} Bags`}
          trend={
            stats.supplyExports?.mappingsLast30Days > 0
              ? {
                  value: `+${stats.supplyExports.mappingsLast30Days}`,
                  label: "recent",
                  positive: true,
                }
              : null
          }
          className="p-3"
        />

        {/* Financial Overview - Admin Only */}
        {isAdmin && (
          <StatsCard
            title="Investment"
            value={formatCurrency(stats.investors?.totalAmountInvested || 0)}
            icon={<DollarSign className="w-4 h-4" />}
            color="green"
            subtitle="Total"
            percentage={
              stats.investors?.conversionEfficiency
                ? `${stats.investors.conversionEfficiency}%`
                : null
            }
            className="p-3"
          />
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
