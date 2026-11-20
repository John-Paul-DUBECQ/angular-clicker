import {
  getMaxResourceTradeQuantity,
  getResourceTradeCost,
  ResourceTrade,
} from './resource-trade';

describe('resource trade pricing', () => {
  const trade: ResourceTrade = {
    id: 'tickets-for-bait',
    name: 'Appât',
    inputResourceId: 'ticket',
    inputAmount: 3,
    outputResourceId: 'bait',
    outputAmount: 1,
    priceCoefficient: 1.1,
  };

  it('raises the total cost geometrically as more units are traded', () => {
    expect(getResourceTradeCost(trade, 1, 0)).toBe(3);
    expect(getResourceTradeCost(trade, 10, 0)).toBe(48);
    expect(getResourceTradeCost(trade, 1, 10)).toBe(8);
  });

  it('finds the largest affordable quantity', () => {
    expect(getMaxResourceTradeQuantity(trade, 48, 0)).toBe(10);
    expect(getMaxResourceTradeQuantity(trade, 47, 0)).toBe(9);
  });
});
