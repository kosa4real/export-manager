import { prisma } from "@/lib/prisma";

/**
 * Comprehensive validation for supply-export mappings
 */
export class SupplyExportValidator {
  /**
   * Validate a supply-export mapping before creation
   */
  static async validateMapping(supplyId, exportId, quantityBags) {
    const [
      supply,
      exportShipment,
      existingSupplyMappings,
      existingExportMappings,
    ] = await Promise.all([
      prisma.coalSupply.findUnique({
        where: { id: parseInt(supplyId) },
        include: { supplier: { select: { name: true } } },
      }),
      prisma.exportShipment.findUnique({
        where: { id: parseInt(exportId) },
      }),
      prisma.supplyExport.aggregate({
        where: { supplyId: parseInt(supplyId) },
        _sum: { quantityBags: true },
      }),
      prisma.supplyExport.aggregate({
        where: { exportId: parseInt(exportId) },
        _sum: { quantityBags: true },
      }),
    ]);

    // Check if supply and export exist
    if (!supply) {
      throw new Error(`Supply with ID ${supplyId} not found`);
    }
    if (!exportShipment) {
      throw new Error(`Export with ID ${exportId} not found`);
    }

    // Validate supply availability
    const supplyUsed = existingSupplyMappings._sum.quantityBags || 0;
    const supplyAvailable = supply.quantityBags - supplyUsed;

    if (quantityBags > supplyAvailable) {
      throw new Error(
        `Supply #${supplyId} only has ${supplyAvailable} bags available (${supplyUsed} already allocated from ${supply.quantityBags} total)`
      );
    }

    // Validate export capacity
    const exportUsed = existingExportMappings._sum.quantityBags || 0;
    const exportAvailable = exportShipment.quantityBags - exportUsed;

    if (quantityBags > exportAvailable) {
      throw new Error(
        `Export #${exportId} only needs ${exportAvailable} more bags (${exportUsed} already sourced from ${exportShipment.quantityBags} total)`
      );
    }

    // Check for existing mapping
    const existingMapping = await prisma.supplyExport.findUnique({
      where: {
        supplyId_exportId: {
          supplyId: parseInt(supplyId),
          exportId: parseInt(exportId),
        },
      },
    });

    if (existingMapping) {
      throw new Error(
        `Mapping between Supply #${supplyId} and Export #${exportId} already exists with ${existingMapping.quantityBags} bags`
      );
    }

    return {
      valid: true,
      supply: {
        id: supply.id,
        supplierName: supply.supplier.name,
        totalQuantity: supply.quantityBags,
        usedQuantity: supplyUsed,
        availableQuantity: supplyAvailable,
      },
      export: {
        id: exportShipment.id,
        destination: `${exportShipment.destinationCity}, ${exportShipment.destinationCountry}`,
        totalQuantity: exportShipment.quantityBags,
        sourcedQuantity: exportUsed,
        neededQuantity: exportAvailable,
      },
      allocation: {
        requestedQuantity: quantityBags,
        canAllocate: true,
      },
    };
  }

  /**
   * Get supply utilization status
   */
  static async getSupplyStatus(supplyId) {
    const [supply, mappings] = await Promise.all([
      prisma.coalSupply.findUnique({ where: { id: parseInt(supplyId) } }),
      prisma.supplyExport.findMany({
        where: { supplyId: parseInt(supplyId) },
        include: {
          export: {
            select: {
              id: true,
              destinationCountry: true,
              destinationCity: true,
              status: true,
            },
          },
        },
      }),
    ]);

    if (!supply) return null;

    const totalAllocated = mappings.reduce(
      (sum, mapping) => sum + mapping.quantityBags,
      0
    );
    const availableQuantity = supply.quantityBags - totalAllocated;
    const utilizationPercentage = (totalAllocated / supply.quantityBags) * 100;

    let status = "UNALLOCATED";
    if (totalAllocated === 0) status = "UNALLOCATED";
    else if (availableQuantity === 0) status = "FULLY_ALLOCATED";
    else status = "PARTIALLY_ALLOCATED";

    return {
      supplyId: supply.id,
      totalQuantity: supply.quantityBags,
      allocatedQuantity: totalAllocated,
      availableQuantity,
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      status,
      allocations: mappings.map((mapping) => ({
        exportId: mapping.exportId,
        destination: `${mapping.export.destinationCity}, ${mapping.export.destinationCountry}`,
        quantity: mapping.quantityBags,
        exportStatus: mapping.export.status,
        allocatedAt: mapping.allocatedAt,
      })),
    };
  }

  /**
   * Get export fulfillment status
   */
  static async getExportStatus(exportId) {
    const [exportShipment, mappings] = await Promise.all([
      prisma.exportShipment.findUnique({ where: { id: parseInt(exportId) } }),
      prisma.supplyExport.findMany({
        where: { exportId: parseInt(exportId) },
        include: {
          supply: {
            select: {
              id: true,
              supplyDate: true,
              gradeA: true,
              gradeB: true,
              supplier: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    if (!exportShipment) return null;

    const totalSourced = mappings.reduce(
      (sum, mapping) => sum + mapping.quantityBags,
      0
    );
    const neededQuantity = exportShipment.quantityBags - totalSourced;
    const fulfillmentPercentage =
      (totalSourced / exportShipment.quantityBags) * 100;

    let status = "UNSOURCED";
    if (totalSourced === 0) status = "UNSOURCED";
    else if (neededQuantity === 0) status = "FULLY_SOURCED";
    else status = "PARTIALLY_SOURCED";

    return {
      exportId: exportShipment.id,
      destination: `${exportShipment.destinationCity}, ${exportShipment.destinationCountry}`,
      totalQuantity: exportShipment.quantityBags,
      sourcedQuantity: totalSourced,
      neededQuantity,
      fulfillmentPercentage: Math.round(fulfillmentPercentage * 100) / 100,
      status,
      sources: mappings.map((mapping) => ({
        supplyId: mapping.supplyId,
        supplierName: mapping.supply.supplier.name,
        quantity: mapping.quantityBags,
        supplyDate: mapping.supply.supplyDate,
        quality: `A:${mapping.supply.gradeA}, B:${mapping.supply.gradeB}`,
        allocatedAt: mapping.allocatedAt,
      })),
    };
  }

  /**
   * Validate bulk allocation
   */
  static async validateBulkAllocation(allocations) {
    const results = [];
    const errors = [];

    for (const allocation of allocations) {
      try {
        const validation = await this.validateMapping(
          allocation.supplyId,
          allocation.exportId,
          allocation.quantityBags
        );
        results.push({ ...allocation, validation, valid: true });
      } catch (error) {
        results.push({ ...allocation, error: error.message, valid: false });
        errors.push(
          `Supply ${allocation.supplyId} → Export ${allocation.exportId}: ${error.message}`
        );
      }
    }

    return {
      results,
      valid: errors.length === 0,
      errors,
      summary: {
        total: allocations.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      },
    };
  }
}
