import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EleringPrice {
  timestamp: number;
  price: number;
}

export class NordPoolService {
  private static cachedPrices: EleringPrice[] = [];
  private static lastFetchTime: number = 0;

  // Fetch prices from public Elering API (ee area)
  static async fetchPrices(): Promise<EleringPrice[]> {
    const now = Date.now();
    // Cache for 1 hour
    if (this.cachedPrices.length > 0 && now - this.lastFetchTime < 3600000) {
      return this.cachedPrices;
    }

    let url = '';
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 2); // get today and tomorrow

      const startIso = start.toISOString();
      const endIso = end.toISOString();

      url = `https://dashboard.elering.ee/api/nps/price?start=${startIso}&end=${endIso}`;
      
      logger.info('Fetching prices from Elering API', { url });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Elering API responded with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.ee) {
        throw new Error('Invalid data format from Elering API');
      }

      this.cachedPrices = data.data.ee;
      this.lastFetchTime = now;
      
      // Store prices in database for historical calculations
      await this.storeHistoricalPrices(this.cachedPrices);
      
      return this.cachedPrices;

    } catch (error) {
      logger.error('Failed to fetch Nord Pool prices', { 
        url,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback to cached prices if API fails (graceful degradation)
      if (this.cachedPrices.length > 0) {
        logger.warn('Using cached Nord Pool prices due to API failure');
        return this.cachedPrices;
      }
      
      return [];
    }
  }

  // Store prices in database for historical records
  private static async storeHistoricalPrices(prices: EleringPrice[]) {
    try {
      for (const price of prices) {
        await prisma.historicalPrice.upsert({
          where: {
            timestamp_region: {
              timestamp: price.timestamp,
              region: 'ee'
            }
          },
          update: { priceEur: price.price },
          create: {
            timestamp: price.timestamp,
            priceEur: price.price,
            region: 'ee'
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to store historical prices', { error });
      // Don't fail the entire operation if storage fails
    }
  }

  static async getCurrentPrice(): Promise<number | null> {
    const prices = await this.fetchPrices();
    if (prices.length === 0) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    
    // Find the current hour's price
    const currentPrice = prices.find(p => {
      const pTime = p.timestamp;
      return nowSeconds >= pTime && nowSeconds < pTime + 3600;
    });

    return currentPrice ? currentPrice.price : null;
  }
}
