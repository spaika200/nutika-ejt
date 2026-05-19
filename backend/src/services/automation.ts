import { PrismaClient } from '@prisma/client';
import { NordPoolService } from './nordpool';
import { logger } from '../utils/logger';
import { GlobalState } from './globalState';
import { sendTelegramNotification } from './notifications';
import { DeviceConnectionService } from './deviceConnection';

const prisma = new PrismaClient();

export async function runAutomationCycle() {
  try {
    logger.info('Starting automation evaluation cycle');
    
    const currentPrice = await NordPoolService.getCurrentPrice();
    
    if (currentPrice === null) {
      logger.warn('Skipping automation cycle: Current electricity price is unavailable');
      return;
    }

    logger.info(`Current Nord Pool price: ${currentPrice} EUR/MWh`);

    // Fetch all devices that have thresholds and are not manually overridden
    const devices = await prisma.device.findMany({
      where: {
        thresholdPrice: { not: null },
        manualOverride: false
      }
    });

    for (const device of devices) {
      // Holiday mode check
      if (GlobalState.isHolidayMode && !device.isCritical) {
        if (device.status) {
          const result = await DeviceConnectionService.sendCommand(device.connectionType, device.connectionParams, 'OFF');
          if (result.success) {
            await prisma.device.update({ where: { id: device.id }, data: { status: false } });
            await prisma.deviceLog.create({ data: { deviceId: device.id, command: 'OFF' } });
          }
        }
        continue; // Skip threshold evaluation during holiday mode
      }

      const threshold = device.thresholdPrice!;
      const shouldBeOn = currentPrice <= threshold;

      if (shouldBeOn && !device.status) {
        const result = await DeviceConnectionService.sendCommand(device.connectionType, device.connectionParams, 'ON');
        if (result.success) {
          await prisma.device.update({ where: { id: device.id }, data: { status: true } });
          await prisma.deviceLog.create({ data: { deviceId: device.id, command: 'ON' } });
          sendTelegramNotification(`⚡ Price dropped! Turned ON ${device.name} (Price: ${currentPrice}€/MWh)`);
        }
      } else if (!shouldBeOn && device.status) {
        const result = await DeviceConnectionService.sendCommand(device.connectionType, device.connectionParams, 'OFF');
        if (result.success) {
          await prisma.device.update({ where: { id: device.id }, data: { status: false } });
          await prisma.deviceLog.create({ data: { deviceId: device.id, command: 'OFF' } });
          sendTelegramNotification(`🔴 Price exceeded threshold! Turned OFF ${device.name} (Price: ${currentPrice}€/MWh)`);
        }
      }
    }
    
    logger.info('Automation cycle completed');

  } catch (error) {
    logger.error('Error during automation cycle', { error: error instanceof Error ? error.message : String(error) });
  }
}
