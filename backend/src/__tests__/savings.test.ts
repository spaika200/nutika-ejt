import { SavingsCalculator } from '../services/savings';

const mockPrisma = {
  deviceLog: {
    findMany: jest.fn()
  }
} as any;

describe('SavingsCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return zero savings if no logs exist', async () => {
    mockPrisma.deviceLog.findMany.mockResolvedValue([]);
    
    const result = await SavingsCalculator.calculateSavings(1, 0.15, 2.0, new Date('2024-01-01'), new Date('2024-01-02'), mockPrisma);
    
    expect(result.totalActiveHours).toBe(0);
    expect(result.savingsEur).toBe(0);
  });

  it('should correctly calculate active hours based on ON/OFF logs', async () => {
    const start = new Date('2024-01-01T10:00:00Z');
    const end = new Date('2024-01-01T14:00:00Z');

    mockPrisma.deviceLog.findMany.mockResolvedValue([
      { command: 'ON', timestamp: new Date('2024-01-01T11:00:00Z') },
      { command: 'OFF', timestamp: new Date('2024-01-01T13:00:00Z') } // 2 hours active
    ]);
    
    const fixedRate = 0.15; // 15 cents/kWh
    const powerKw = 2.0;

    const result = await SavingsCalculator.calculateSavings(1, fixedRate, powerKw, start, end, mockPrisma);
    
    expect(result.totalActiveHours).toBe(2);
    // 2 hours * 2 kW = 4 kWh
    // Automated cost = 4 * 0.05 (dummy avg in code) = 0.20
    // Fixed cost = 4 * 0.15 = 0.60
    // Savings = 0.60 - 0.20 = 0.40
    expect(result.automatedCost).toBeCloseTo(0.20);
    expect(result.fixedCost).toBeCloseTo(0.60);
    expect(result.savingsEur).toBeCloseTo(0.40);
  });
});
