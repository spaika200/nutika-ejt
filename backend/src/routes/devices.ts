import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { GlobalState } from '../services/globalState';

const router = Router();
const prisma = new PrismaClient();

// Get devices (Master sees all, Standard sees own)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const devices = await prisma.device.findMany({
      where: role === 'MASTER' ? {} : { userId },
      include: { logs: { take: 5, orderBy: { timestamp: 'desc' } } }
    });

    res.json(devices);
  } catch (error) {
    logger.error('Failed to fetch devices', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Holiday Mode status
router.get('/holiday', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ isHolidayMode: GlobalState.isHolidayMode });
});

// Toggle Holiday Mode
router.post('/holiday', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { enable } = req.body;
    GlobalState.isHolidayMode = enable;
    
    if (enable) {
      // Turn off all non-critical devices
      await prisma.device.updateMany({
        where: { isCritical: false },
        data: { status: false }
      });
      // In a real app we'd physically toggle them here too
    }

    res.json({ isHolidayMode: GlobalState.isHolidayMode });
  } catch (error) {
    logger.error('Failed to toggle holiday mode', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add device
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description, connectionType, connectionParams, thresholdPrice, isCritical } = req.body;

    // Minimal validation
    if (!name || !connectionType || !connectionParams) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const device = await prisma.device.create({
      data: {
        name,
        description,
        connectionType,
        connectionParams: JSON.stringify(connectionParams),
        thresholdPrice: thresholdPrice ? parseFloat(thresholdPrice) : null,
        isCritical: isCritical || false,
        userId
      }
    });

    res.status(201).json(device);
  } catch (error) {
    logger.error('Failed to add device', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update manual override or status directly
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const deviceId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { manualOverride, status, thresholdPrice } = req.body;

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    if (role !== 'MASTER' && device.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: { 
        manualOverride: manualOverride !== undefined ? manualOverride : undefined,
        status: status !== undefined ? status : undefined,
        thresholdPrice: thresholdPrice !== undefined ? thresholdPrice : undefined
      }
    });

    // Log the toggle action if status changed
    if (status !== undefined) {
      await prisma.deviceLog.create({
        data: { deviceId, command: status ? 'ON' : 'OFF' }
      });
    }

    res.json(updated);
  } catch (error) {
    logger.error('Failed to update device', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete device
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const deviceId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    if (role !== 'MASTER' && device.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.device.delete({ where: { id: deviceId } });

    res.json({ message: 'Device deleted' });
  } catch (error) {
    logger.error('Failed to delete device', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
