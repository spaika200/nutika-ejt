import { NordPoolService } from '../services/nordpool';

// Mock fetch globally
global.fetch = jest.fn();

describe('NordPoolService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cache internally via reflection (for testing purposes)
    (NordPoolService as any).cachedPrices = [];
    (NordPoolService as any).lastFetchTime = 0;
  });

  it('should fetch prices successfully and cache them', async () => {
    const mockData = {
      success: true,
      data: {
        ee: [
          { timestamp: 1704067200, price: 10.5 },
          { timestamp: 1704070800, price: 15.2 }
        ]
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    const prices = await NordPoolService.fetchPrices();
    expect(prices).toHaveLength(2);
    expect(prices[0].price).toBe(10.5);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Call again to verify caching
    const cachedPrices = await NordPoolService.fetchPrices();
    expect(cachedPrices).toEqual(prices);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1 fetch!
  });

  it('should gracefully degrade to cached prices if API fails', async () => {
    // 1. Initial success populates cache
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { ee: [{ timestamp: 123, price: 50 }] } })
    });
    
    await NordPoolService.fetchPrices();

    // Force cache invalidation by setting lastFetchTime to old
    (NordPoolService as any).lastFetchTime = 0;

    // 2. Subsequent failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Should return cached data rather than throwing
    const fallbackPrices = await NordPoolService.fetchPrices();
    expect(fallbackPrices).toHaveLength(1);
    expect(fallbackPrices[0].price).toBe(50);
  });
});
