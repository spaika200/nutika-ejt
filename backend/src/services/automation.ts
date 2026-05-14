import { PrismaClient } from '@prisma/client';
import { NordPoolService } from './nordpool';
import { logger } from '../utils/logger';
import { GlobalState } from './globalState';
import { sendTelegramNotification } from './notifications';

const prisma = new PrismaClient();

// In a real app, this would make an HTTP or MQTT request to the actual device.
async function toggleDevicePhysical(device: any, turnOn: boolean) {
  logger.info(`Sending physical command to device ${device.id} (${device.name})`, {
    command: turnOn ? 'ON' : 'OFF',
    connection: device.connectionType
  });
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return true; 
}

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
          await toggleDevicePhysical(device, false);
          await prisma.device.update({ where: { id: device.id }, data: { status: false } });
          await prisma.deviceLog.create({ data: { deviceId: device.id, command: 'OFF' } });
        }
        continue; // Skip threshold evaluation during holiday mode
      }

      const threshold = device.thresholdPrice!;
      const shouldBeOn = currentPrice <= threshold;

      if (shouldBeOn && !device.status) {
        const success = await toggleDevicePhysical(device, true);
        if (success) {
          await prisma.device.update({ where: { id: device.id }, data: { status: true } });
          await prisma.deviceLog.create({ data: { deviceId: device.id, command: 'ON' } });
          sendTelegramNotification(`⚡ Price dropped! Turned ON ${device.name} (Price: ${currentPrice}€)`);
        }
      } else if (!shouldBeOn && device.status) {
        const success = await toggleDevicePhysical(device, false);
        if (success) {
          await prisma.device.update({ where: { id: device.id }, data: { status: false } });
          await prisma.deviceLog.create({ data: { deviceId: device.id, command: 'OFF' } });
          sendTelegramNotification(`🔴 Price exceeded threshold! Turned OFF ${device.name} (Price: ${currentPrice}€)`);
        }
      }
    }
    
    logger.info('Automation cycle completed');

  } catch (error) {
    logger.error('Error during automation cycle', { error: error instanceof Error ? error.message : String(error) });
  }
}
