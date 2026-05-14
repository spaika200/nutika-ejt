import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { SavingsCalculator } from '../services/savings';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    
    // Default fixed rate package for comparison: 0.15 EUR/kWh (15 cents)
    const fixedRateKwh = req.query.rate ? parseFloat(req.query.rate as string) : 0.15;

    // We'll calculate savings for all devices the user owns
    const devices = await prisma.device.findMany({
      where: role === 'MASTER' ? {} : { userId }
    });

    let totalAutomatedCost = 0;
    let totalFixedCost = 0;
    let totalSavingsEur = 0;

    // Default period: Last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    for (const device of devices) {
      // Assuming a dummy average consumption of 2kW for calculation if not specified in connectionParams
      let powerConsumptionKw = 2.0; 
      try {
        const params = JSON.parse(device.connectionParams);
        if (params.powerKw) powerConsumptionKw = parseFloat(params.powerKw);
      } catch (e) {}

      const savings = await SavingsCalculator.calculateSavings(
        device.id,
        fixedRateKwh,
        powerConsumptionKw,
        startDate,
        endDate
      );

      totalAutomatedCost += savings.automatedCost;
      totalFixedCost += savings.fixedCost;
      totalSavingsEur += savings.savingsEur;
    }

    const totalSavingsPercentage = totalFixedCost > 0 ? (totalSavingsEur / totalFixedCost) * 100 : 0;

    res.json({
      period: 'last_7_days',
      fixedRateKwh,
      totalAutomatedCost: Number(totalAutomatedCost.toFixed(2)),
      totalFixedCost: Number(totalFixedCost.toFixed(2)),
      totalSavingsEur: Number(totalSavingsEur.toFixed(2)),
      totalSavingsPercentage: Number(totalSavingsPercentage.toFixed(2))
    });

  } catch (error) {
    logger.error('Failed to calculate savings', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
