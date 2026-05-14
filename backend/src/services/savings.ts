import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SavingsCalculator {
  /**
   * Calculates the savings of a device by comparing its actual automated cost
   * versus a fixed electricity package cost over a specified period.
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
    endDate: Date
  ) {
    // 1. Fetch all ON/OFF logs for the device in the given period
    const logs = await prisma.deviceLog.findMany({
      where: {
        deviceId,
        timestamp: { gte: startDate, lte: endDate },
        command: { in: ['ON', 'OFF'] }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (logs.length === 0) {
      return { automatedCost: 0, fixedCost: 0, savingsEur: 0, savingsPercentage: 0 };
    }

    // 2. Fetch historical Nord Pool prices for the same period
    // In a real implementation, these would be stored in the DB to avoid relying on the API for old data.
    // Assuming a DB table `HistoricalPrice` exists:
    // const prices = await prisma.historicalPrice.findMany({ ... });
    
    // For this example, we calculate total active hours based on logs
    let totalActiveHours = 0;
    let lastOnTime: Date | null = null;

    for (const log of logs) {
      if (log.command === 'ON') {
        lastOnTime = log.timestamp;
      } else if (log.command === 'OFF' && lastOnTime) {
        const diffMs = log.timestamp.getTime() - lastOnTime.getTime();
        totalActiveHours += diffMs / (1000 * 60 * 60);
        lastOnTime = null;
      }
    }

    // If it was turned ON and never turned OFF by the end of the period
    if (lastOnTime) {
      const diffMs = endDate.getTime() - lastOnTime.getTime();
      totalActiveHours += diffMs / (1000 * 60 * 60);
    }

    // Note: To accurately calculate "Automated Cost", we would multiply each active segment
    // by the exact Nord Pool price during that hour. 
    // This is a simplified estimation for the prototype.
    const averageNordPoolPriceKwh = 0.05; // Dummy average (5 cents/kWh)
    
    const totalConsumptionKwh = totalActiveHours * powerConsumptionKw;
    
    const automatedCost = totalConsumptionKwh * averageNordPoolPriceKwh;
    const fixedCost = totalConsumptionKwh * fixedRateKwh;

    const savingsEur = fixedCost - automatedCost;
    const savingsPercentage = fixedCost > 0 ? (savingsEur / fixedCost) * 100 : 0;

    return {
      automatedCost: Number(automatedCost.toFixed(2)),
      fixedCost: Number(fixedCost.toFixed(2)),
      savingsEur: Number(savingsEur.toFixed(2)),
      savingsPercentage: Number(savingsPercentage.toFixed(2)),
      totalActiveHours: Number(totalActiveHours.toFixed(2))
    };
  }
}
