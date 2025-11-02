import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// POST /api/investors/container-calculator - Calculate container equivalent for investment
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { amountInvested, containerCostNaira } = await request.json();

    if (!amountInvested || !containerCostNaira) {
      return NextResponse.json(
        { error: "Amount invested and container cost are required" },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountInvested);
    const containerCost = parseFloat(containerCostNaira);

    if (amount <= 0 || containerCost <= 0) {
      return NextResponse.json(
        { error: "Amount and container cost must be positive numbers" },
        { status: 400 }
      );
    }

    // Calculate container equivalent
    const containerEquivalent = amount / containerCost;
    const fullContainers = Math.floor(containerEquivalent);
    const partialContainer = containerEquivalent - fullContainers;
    const partialPercentage = Math.round(partialContainer * 100);

    return NextResponse.json({
      amountInvested: amount,
      containerCostNaira: containerCost,
      containerEquivalent: Math.round(containerEquivalent * 100) / 100, // Round to 2 decimal places
      fullContainers,
      partialContainer: partialPercentage,
      explanation: {
        calculation: `₦${amount.toLocaleString()} ÷ ₦${containerCost.toLocaleString()} = ${containerEquivalent.toFixed(
          2
        )} containers`,
        breakdown:
          fullContainers > 0
            ? `${fullContainers} full container${
                fullContainers > 1 ? "s" : ""
              }${
                partialPercentage > 0
                  ? ` + ${partialPercentage}% of another container`
                  : ""
              }`
            : `${partialPercentage}% of one container`,
      },
    });
  } catch (error) {
    console.error("Error calculating container equivalent:", error);
    return NextResponse.json(
      { error: "Failed to calculate container equivalent" },
      { status: 500 }
    );
  }
}

// GET /api/investors/container-calculator - Get default container cost
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Default container cost in Naira (this could be stored in database or config)
  const defaultContainerCost = 10000; // ₦10,000 per container equivalent

  return NextResponse.json({
    defaultContainerCostNaira: defaultContainerCost,
    note: "This is the default cost per container equivalent. Admin can adjust this value.",
  });
}
