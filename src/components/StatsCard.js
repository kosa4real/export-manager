"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const StatsCard = ({
  title,
  value,
  icon,
  color = "emerald",
  subtitle,
  trend,
  percentage,
  className = "",
}) => {
  const colorClasses = {
    emerald:
      "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    purple:
      "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    amber:
      "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
    cyan: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400",
    indigo:
      "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-400",
    rose: "from-rose-500/20 to-rose-600/20 border-rose-500/30 text-rose-400",
    slate:
      "from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-400",
    orange:
      "from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400",
  };

  const iconColorClass =
    colorClasses[color]?.split(" ")[3] || "text-emerald-400";

  const isCompact = className && className.includes("p-3");
  const isSmall = className && className.includes("p-4");

  return (
    <div
      className={`bg-gradient-to-br ${
        colorClasses[color]
      } backdrop-blur-sm border rounded-xl hover:shadow-lg hover:shadow-${color}-500/10 transition-all duration-300 ${
        className || "p-6"
      } min-w-0`}
    >
      <div
        className={`flex items-start justify-between ${
          isCompact ? "mb-2" : isSmall ? "mb-3" : "mb-4"
        }`}
      >
        <div
          className={`${
            isCompact ? "p-1" : isSmall ? "p-1.5" : "p-2"
          } rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 ${iconColorClass} flex-shrink-0`}
        >
          {icon}
        </div>
        {percentage && (
          <span className="text-xs font-medium px-1.5 py-0.5 bg-slate-800/60 rounded-full text-slate-300 flex-shrink-0">
            {percentage}
          </span>
        )}
      </div>

      <div className="space-y-1 min-w-0">
        <p
          className={`text-slate-400 ${
            isCompact ? "text-xs" : isSmall ? "text-xs" : "text-sm"
          } font-medium truncate`}
        >
          {title}
        </p>
        <p
          className={`${
            isCompact ? "text-sm" : isSmall ? "text-lg" : "text-2xl"
          } font-bold text-white truncate`}
          title={value}
        >
          {value}
        </p>
        <div className="flex items-center justify-between min-w-0">
          <p className="text-xs text-slate-500 truncate flex-1 mr-1">
            {subtitle}
          </p>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs ${
                trend.positive ? "text-green-400" : "text-red-400"
              } flex-shrink-0`}
            >
              {trend.positive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span className="truncate">
                {trend.value} {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
