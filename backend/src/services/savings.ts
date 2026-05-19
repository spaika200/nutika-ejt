import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SavingsCalculator {
  /**
   * Calculates the savings of a device by comparing its actual automated cost
   * versus a fixed electricity package cost over a specified period.
   * 
   * Uses historical prices for accurate calculation instead of dummy average.
   * 
   * @param deviceId ID of the device
   * @param fixedRateKwh The user's alternative fixed rate in EUR/kWh
   * @param powerConsumptionKw The power consumption of the device in kW
   * @param startDate Start of the period to calculate
   * @param endDate End of the period to calculate
   */
  static async calculateSavings(
    deviceId: number,
    fixedRateKwh: number,
    powerConsumptionKw: number,
    startDate: Date,
    endDate: Date,
    prismaClient = prisma
  ) {
    // 1. Fetch all ON/OFF logs for the device in the given period
    const logs = await prismaClient.deviceLog.findMany({
      where: {
        deviceId,
        timestamp: { gte: startDate, lte: endDate },
        command: { in: ['ON', 'OFF'] }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (logs.length === 0) {
      return { automatedCost: 0, fixedCost: 0, savingsEur: 0, savingsPercentage: 0, totalActiveHours: 0 };
    }

    // 2. Build ON/OFF periods with associated timestamps
    const activePeriods: Array<{ start: Date; end: Date; hours: number }> = [];
    let lastOnTime: Date | null = null;

    for (const log of logs) {
      if (log.command === 'ON') {
        lastOnTime = log.timestamp;
      } else if (log.command === 'OFF' && lastOnTime) {
        const diffMs = log.timestamp.getTime() - lastOnTime.getTime();
        const hours = diffMs / (1000 * 60 * 60);
        activePeriods.push({ start: lastOnTime, end: log.timestamp, hours });
        lastOnTime = null;
      }
    }

    // If it was turned ON and never turned OFF by the end of the period
    if (lastOnTime) {
      const diffMs = endDate.getTime() - lastOnTime.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      activePeriods.push({ start: lastOnTime, end: endDate, hours });
    }

    // 3. Calculate total consumption
    let totalConsumptionKwh = 0;
    for (const period of activePeriods) {
      totalConsumptionKwh += period.hours * powerConsumptionKw;
    }

    // 4. Calculate automated cost using historical prices
    let automatedCost = 0;
    for (const period of activePeriods) {
      // Get average price during this ON period
      const periodPrices = await prismaClient.historicalPrice.findMany({
        where: {
          timestamp: {
            gte: Math.floor(period.start.getTime() / 1000),
            lte: Math.floor(period.end.getTime() / 1000)
          }
        }
      });

      if (periodPrices.length > 0) {
        const avgPrice = periodPrices.reduce((sum, p) => sum + p.priceEur, 0) / periodPrices.length;
        const pricePerKwh = avgPrice / 1000; // Convert EUR/MWh to EUR/kWh
        automatedCost += period.hours * powerConsumptionKw * pricePerKwh;
      }
    }

    // 5. Calculate fixed cost
    const fixedCost = totalConsumptionKwh * fixedRateKwh;

    // 6. Calculate savings
    const savingsEur = fixedCost - automatedCost;
    const savingsPercentage = fixedCost > 0 ? (savingsEur / fixedCost) * 100 : 0;

    return {
      automatedCost: Number(automatedCost.toFixed(2)),
      fixedCost: Number(fixedCost.toFixed(2)),
      savingsEur: Number(savingsEur.toFixed(2)),
      savingsPercentage: Number(savingsPercentage.toFixed(2)),
      totalActiveHours: Number(activePeriods.reduce((sum, p) => sum + p.hours, 0).toFixed(2))
    };
  }
}
