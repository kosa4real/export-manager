import { prisma } from "@/lib/prisma";

/**
 * Smart allocation engine for optimal supply-export matching
 */
export class SupplyAllocationEngine {
  /**
   * Generate optimal allocation suggestions for an export
   */
  static async suggestAllocations(exportId, options = {}) {
    const {
      strategy = "OPTIMAL", // OPTIMAL, FIFO, LIFO, QUALITY_FIRST
      maxSuggestions = 10,
      preferredSuppliers = [],
      minQuality = "ANY", // ANY, GRADE_A_ONLY, MIXED
    } = options;

    const exportShipment = await prisma.exportShipment.findUnique({
      where: { id: parseInt(exportId) },
    });

    if (!exportShipment) {
      throw new Error(`Export #${exportId} not found`);
    }

    // Get current sourced quantity
    const currentMappings = await prisma.supplyExport.aggregate({
      where: { exportId: parseInt(exportId) },
      _sum: { quantityBags: true },
    });

    const alreadySourced = currentMappings._sum.quantityBags || 0;
    const stillNeeded = exportShipment.quantityBags - alreadySourced;

    if (stillNeeded <= 0) {
      return {
        exportId,
        destination: `${exportShipment.destinationCity}, ${exportShipment.destinationCountry}`,
        totalNeeded: exportShipment.quantityBags,
        alreadySourced,
        stillNeeded: 0,
        fullySourced: true,
        suggestions: [],
      };
    }

    // Find available supplies
    const availableSupplies = await this.getAvailableSupplies({
      preferredSuppliers,
      minQuality,
      strategy,
    });

    // Generate suggestions based on strategy
    const suggestions = this.generateSuggestions(
      availableSupplies,
      stillNeeded,
      strategy,
      maxSuggestions
    );

    return {
      exportId,
      destination: `${exportShipment.destinationCity}, ${exportShipment.destinationCountry}`,
      totalNeeded: exportShipment.quantityBags,
      alreadySourced,
      stillNeeded,
      fullySourced: false,
      strategy,
      suggestions: suggestions.slice(0, maxSuggestions),
    };
  }

  /**
   * Get available supplies with remaining capacity
   */
  static async getAvailableSupplies(options = {}) {
    const {
      preferredSuppliers = [],
      minQuality = "ANY",
      strategy = "OPTIMAL",
    } = options;

    // Build where clause
    const whereClause = {};
    if (preferredSuppliers.length > 0) {
      whereClause.supplierId = { in: preferredSuppliers };
    }

    // Quality filtering
    if (minQuality === "GRADE_A_ONLY") {
      whereClause.gradeA = { gt: 0 };
    }

    const supplies = await prisma.coalSupply.findMany({
      where: whereClause,
      include: {
        supplier: { select: { id: true, name: true } },
        exports: { select: { quantityBags: true } },
      },
      orderBy: this.getOrderByClause(strategy),
    });

    // Calculate available quantities and filter out fully allocated supplies
    return supplies
      .map((supply) => {
        const allocatedQuantity = supply.exports.reduce(
          (sum, exp) => sum + exp.quantityBags,
          0
        );
        const availableQuantity = supply.quantityBags - allocatedQuantity;

        return {
          ...supply,
          allocatedQuantity,
          availableQuantity,
          utilizationPercentage:
            (allocatedQuantity / supply.quantityBags) * 100,
          qualityScore: this.calculateQualityScore(supply),
          ageInDays: Math.floor(
            (new Date() - new Date(supply.supplyDate)) / (1000 * 60 * 60 * 24)
          ),
        };
      })
      .filter((supply) => supply.availableQuantity > 0)
      .sort((a, b) => this.compareSupplies(a, b, strategy));
  }

  /**
   * Generate allocation suggestions
   */
  static generateSuggestions(
    availableSupplies,
    neededQuantity,
    strategy,
    maxSuggestions
  ) {
    const suggestions = [];
    let remainingNeeded = neededQuantity;

    for (const supply of availableSupplies) {
      if (remainingNeeded <= 0 || suggestions.length >= maxSuggestions) break;

      const suggestedQuantity = Math.min(
        supply.availableQuantity,
        remainingNeeded
      );

      suggestions.push({
        supplyId: supply.id,
        supplierName: supply.supplier.name,
        supplyDate: supply.supplyDate,
        totalQuantity: supply.quantityBags,
        availableQuantity: supply.availableQuantity,
        suggestedQuantity,
        quality: {
          gradeA: supply.gradeA,
          gradeB: supply.gradeB,
          rejected: supply.rejectedBags,
          score: supply.qualityScore,
        },
        metrics: {
          ageInDays: supply.ageInDays,
          utilizationPercentage: supply.utilizationPercentage,
          priority: this.calculatePriority(supply, strategy),
        },
        recommendation: this.getRecommendationReason(supply, strategy),
      });

      remainingNeeded -= suggestedQuantity;
    }

    return suggestions;
  }

  /**
   * Auto-allocate supplies to an export using optimal strategy
   */
  static async autoAllocate(exportId, options = {}) {
    const { strategy = "OPTIMAL", dryRun = false } = options;

    const suggestions = await this.suggestAllocations(exportId, { strategy });

    if (suggestions.fullySourced) {
      return {
        success: false,
        message: "Export is already fully sourced",
        allocations: [],
      };
    }

    const allocations = [];
    const errors = [];

    for (const suggestion of suggestions.suggestions) {
      try {
        if (!dryRun) {
          const allocation = await prisma.supplyExport.create({
            data: {
              supplyId: suggestion.supplyId,
              exportId: parseInt(exportId),
              quantityBags: suggestion.suggestedQuantity,
              priority: suggestion.metrics.priority,
              notes: `Auto-allocated using ${strategy} strategy: ${suggestion.recommendation}`,
            },
            include: {
              supply: {
                select: {
                  id: true,
                  supplier: { select: { name: true } },
                },
              },
              export: {
                select: {
                  id: true,
                  destinationCity: true,
                  destinationCountry: true,
                },
              },
            },
          });
          allocations.push(allocation);
        } else {
          allocations.push({
            supplyId: suggestion.supplyId,
            exportId: parseInt(exportId),
            quantityBags: suggestion.suggestedQuantity,
            dryRun: true,
          });
        }
      } catch (error) {
        errors.push({
          supplyId: suggestion.supplyId,
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      strategy,
      dryRun,
      allocations,
      errors,
      summary: {
        totalAllocations: allocations.length,
        totalQuantity: allocations.reduce(
          (sum, alloc) => sum + alloc.quantityBags,
          0
        ),
        errors: errors.length,
      },
    };
  }

  /**
   * Get order by clause based on strategy
   */
  static getOrderByClause(strategy) {
    switch (strategy) {
      case "FIFO":
        return [{ supplyDate: "asc" }];
      case "LIFO":
        return [{ supplyDate: "desc" }];
      case "QUALITY_FIRST":
        return [{ gradeA: "desc" }, { gradeB: "desc" }, { supplyDate: "asc" }];
      case "OPTIMAL":
      default:
        return [{ gradeA: "desc" }, { supplyDate: "asc" }];
    }
  }

  /**
   * Calculate quality score for a supply
   */
  static calculateQualityScore(supply) {
    const total = supply.quantityBags;
    if (total === 0) return 0;

    const gradeAWeight = 3;
    const gradeBWeight = 2;
    const rejectedPenalty = -1;

    return (
      ((supply.gradeA * gradeAWeight +
        supply.gradeB * gradeBWeight +
        supply.rejectedBags * rejectedPenalty) /
        total) *
      100
    );
  }

  /**
   * Compare supplies based on strategy
   */
  static compareSupplies(a, b, strategy) {
    switch (strategy) {
      case "FIFO":
        return new Date(a.supplyDate) - new Date(b.supplyDate);
      case "LIFO":
        return new Date(b.supplyDate) - new Date(a.supplyDate);
      case "QUALITY_FIRST":
        return b.qualityScore - a.qualityScore;
      case "OPTIMAL":
      default:
        // Optimal: Balance quality and age
        const qualityDiff = b.qualityScore - a.qualityScore;
        if (Math.abs(qualityDiff) > 10) return qualityDiff;
        return new Date(a.supplyDate) - new Date(b.supplyDate);
    }
  }

  /**
   * Calculate priority score
   */
  static calculatePriority(supply, strategy) {
    let priority = 0;

    // Quality bonus
    priority += supply.qualityScore;

    // Age factor (older supplies get higher priority for FIFO)
    if (strategy === "FIFO" || strategy === "OPTIMAL") {
      priority += Math.max(0, 100 - supply.ageInDays);
    }

    // Utilization factor (prefer supplies that can be fully utilized)
    if (supply.utilizationPercentage < 50) {
      priority += 20;
    }

    return Math.round(priority);
  }

  /**
   * Get recommendation reason
   */
  static getRecommendationReason(supply, strategy) {
    const reasons = [];

    if (supply.qualityScore > 80) {
      reasons.push("High quality");
    }

    if (supply.ageInDays > 30) {
      reasons.push("Older stock (FIFO)");
    }

    if (supply.utilizationPercentage < 50) {
      reasons.push("Low utilization");
    }

    if (reasons.length === 0) {
      reasons.push("Available capacity");
    }

    return reasons.join(", ");
  }
}
