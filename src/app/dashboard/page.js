"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardOverview from "@/components/DashboardOverview";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // This shouldn't happen due to useEffect, but safe guard
  if (!session) {
    return null;
  }

  const { user } = session;

  // Define role-specific config
  const roleConfig = {
    ADMIN: {
      title: "Admin Dashboard",
      description: "Manage all records in the system.",
      color: "from-emerald-500/20 to-teal-500/20",
      hover: "hover:from-emerald-500/30 hover:to-teal-500/30",
      borderColor: "border-emerald-500/30",
      links: [
        {
          href: "/dashboard/suppliers",
          title: "Suppliers",
          desc: "View and manage coal suppliers.",
        },
        {
          href: "/dashboard/products",
          title: "Products",
          desc: "Manage coal supply records.",
        },
        {
          href: "/dashboard/exports",
          title: "Exports",
          desc: "Track export shipments.",
        },
        {
          href: "/dashboard/investors",
          title: "Investors",
          desc: "Manage investor records.",
        },
        {
          href: "/dashboard/users",
          title: "Users",
          desc: "Manage system users.",
        },
      ],
    },
    STAFF: {
      title: "Staff Dashboard",
      description: "Manage supplies and exports (non-sensitive data).",
      color: "from-blue-500/20 to-cyan-500/20",
      hover: "hover:from-blue-500/30 hover:to-cyan-500/30",
      borderColor: "border-blue-500/30",
      links: [
        {
          href: "/dashboard/suppliers",
          title: "Suppliers",
          desc: "View coal suppliers.",
        },
        {
          href: "/dashboard/products",
          title: "Products",
          desc: "Manage coal supply records.",
        },
        {
          href: "/dashboard/exports",
          title: "Exports",
          desc: "Track export shipments.",
        },
      ],
    },
    INVESTOR: {
      title: "Investor Dashboard",
      description: "View your investments and related shipments.",
      color: "from-amber-500/20 to-yellow-500/20",
      hover: "hover:from-amber-500/30 hover:to-yellow-500/30",
      borderColor: "border-amber-500/30",

      links: [
        {
          href: "/dashboard/investments",
          title: "My Investments",
          desc: "View your investment details.",
        },
        {
          href: "/dashboard/exports",
          title: "Exports",
          desc: "Track related export shipments.",
        },
      ],
    },
  };

  const config = roleConfig[user.role] || roleConfig.STAFF;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Dashboard Content */}
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">{config.title}</h2>
          <p className="text-slate-400">{config.description}</p>
        </div>

        {/* Dashboard Overview Stats */}
        <DashboardOverview />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className={`
                group relative p-6 rounded-2xl border ${config.borderColor}
                bg-gradient-to-br ${config.color}
                backdrop-blur-sm transition-all duration-300
                hover:shadow-xl hover:shadow-emerald-500/10
                ${config.hover}
              `}
            >
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-300 transition-colors text-white">
                  {link.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed flex-grow">
                  {link.desc}
                </p>
                <span className="mt-4 inline-block w-8 h-0.5 bg-emerald-400 rounded-full group-hover:w-12 transition-all"></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
