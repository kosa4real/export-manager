import { NextResponse } from "next/server";
import { withDb, prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isInvestor = session.user.role === "INVESTOR";

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return await withDb(async (prisma) => {
      // Base stats available to all users
      const baseStats = await Promise.all([
        // Total investors count
        prisma.investor.count(),

        // Active investors
        prisma.investor.count({
          where: { status: "ACTIVE" },
        }),

        // New investors in last 30 days
        prisma.investor.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
        }),

        // Investors by status
        prisma.investor.count({ where: { status: "RETURNED" } }),
        prisma.investor.count({ where: { status: "PARTIAL" } }),

        // Recent investment activity (last 6 months)
        prisma.investor.count({
          where: {
            investmentDate: { gte: sixMonthsAgo },
          },
        }),
      ]);

      const [
        totalInvestors,
        activeInvestors,
        newInvestorsLast30Days,
        returnedInvestors,
        partialInvestors,
        recentInvestments,
      ] = baseStats;

      const stats = {
        totalInvestors,
        activeInvestors,
        newInvestorsLast30Days,
        returnedInvestors,
        partialInvestors,
        recentInvestments,
        statusDistribution: {
          active: activeInvestors,
          returned: returnedInvestors,
          partial: partialInvestors,
        },
      };

      // Add financial stats only for admin users
      if (isAdmin) {
        const financialStats = await Promise.all([
          // Total amount invested
          prisma.investor.aggregate({
            _sum: { amountInvested: true },
          }),

          // Total amount received (in local currency)
          prisma.investor.aggregate({
            _sum: { amountReceived: true },
          }),

          // Average investment amount
          prisma.investor.aggregate({
            _avg: { amountInvested: true },
          }),

          // Average exchange rate
          prisma.investor.aggregate({
            _avg: { exchangeRate: true },
          }),

          // Total container equivalent
          prisma.investor.aggregate({
            _sum: { containerEquivalent: true },
          }),

          // Investment by currency
          prisma.investor.groupBy({
            by: ["currency"],
            _sum: { amountInvested: true },
            _count: { currency: true },
          }),

          // Recent investments (last 30 days) financial data
          prisma.investor.aggregate({
            where: {
              createdAt: { gte: thirtyDaysAgo },
            },
            _sum: { amountInvested: true },
          }),
        ]);

        const [
          totalInvested,
          totalReceived,
          avgInvestment,
          avgExchangeRate,
          totalContainerEquivalent,
          investmentByCurrency,
          recentInvestmentAmount,
        ] = financialStats;

        // Store amounts as entered without conversion
        stats.totalAmountInvested = totalInvested._sum.amountInvested || 0;
        stats.totalAmountReceived = totalReceived._sum.amountReceived || 0;
        stats.averageInvestment = avgInvestment._avg.amountInvested || 0;
        stats.averageExchangeRate = avgExchangeRate._avg.exchangeRate || 0;
        stats.totalContainerEquivalent =
          totalContainerEquivalent._sum.containerEquivalent || 0;
        stats.recentInvestmentAmount =
          recentInvestmentAmount._sum.amountInvested || 0;
        stats.investmentByCurrency = investmentByCurrency;

        // Calculate investment metrics using original amounts
        const totalInvestedOriginal = parseFloat(stats.totalAmountInvested);
        const totalReceivedLocal = parseFloat(stats.totalAmountReceived);

        if (totalInvestedOriginal > 0) {
          stats.conversionEfficiency = (
            (totalReceivedLocal / totalInvestedOriginal) *
            100
          ).toFixed(2);
        }
      }

      // For investor users, only show their own stats
      if (isInvestor) {
        const investorRecord = await prisma.investor.findFirst({
          where: {
            user: { id: parseInt(session.user.id) },
          },
          select: {
            id: true,
            amountInvested: true,
            amountReceived: true,
            exchangeRate: true,
            profitShare: true,
            containerEquivalent: true,
            currency: true,
            status: true,
            investmentDate: true,
          },
        });

        if (investorRecord) {
          const personalStats = {
            personalInvestment: {
              amountInvested: investorRecord.amountInvested,
              amountReceived: investorRecord.amountReceived,
              exchangeRate: investorRecord.exchangeRate,
              profitShare: investorRecord.profitShare,
              containerEquivalent: investorRecord.containerEquivalent,
              currency: investorRecord.currency,
              status: investorRecord.status,
              investmentDate: investorRecord.investmentDate,
            },
          };

          // Calculate days since investment
          const daysSinceInvestment = Math.floor(
            (new Date() - new Date(investorRecord.investmentDate)) /
              (1000 * 60 * 60 * 24)
          );
          personalStats.personalInvestment.daysSinceInvestment =
            daysSinceInvestment;

          return NextResponse.json(personalStats);
        }
      }

      return NextResponse.json(stats);
    });
  } catch (error) {
    console.error("Investor stats error:", error);
    return NextResponse.json(
      { error: "Failed to load investor statistics" },
      { status: 500 }
    );
  }
}
