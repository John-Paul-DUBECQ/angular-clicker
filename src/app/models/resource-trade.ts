import { UnlockMethod } from './unlocks/unlock-method';

export type ResourceTradeQuantity = 1 | 10 | 100 | 1000 | 'max';

export interface ResourceTrade {
  id: string;
  name: string;
  inputResourceId: string;
  inputAmount: number;
  outputResourceId: string;
  outputAmount: number;
  priceCoefficient: number;
  unlockMethod?: UnlockMethod;
}

export interface ResourceTradeView extends Omit<ResourceTrade, 'unlockMethod'> {
  tradedCount: number;
  unlocked: boolean;
}

export function getResourceTradeCost(
  trade: ResourceTrade,
  quantity: number,
  tradedCount: number
): number {
  if (
    !Number.isSafeInteger(quantity)
    || quantity < 0
    || !Number.isFinite(trade.inputAmount)
    || trade.inputAmount <= 0
    || !Number.isFinite(trade.priceCoefficient)
    || trade.priceCoefficient <= 0
  ) {
    return Infinity;
  }
  if (quantity === 0) {
    return 0;
  }

  const firstUnitCost = trade.inputAmount * Math.pow(trade.priceCoefficient, tradedCount);
  if (quantity === 1) {
    return Math.ceil(firstUnitCost);
  }
  const total = trade.priceCoefficient === 1
    ? firstUnitCost * quantity
    : firstUnitCost * (Math.pow(trade.priceCoefficient, quantity) - 1)
      / (trade.priceCoefficient - 1);
  return Number.isFinite(total) ? Math.ceil(total) : Infinity;
}

export function getMaxResourceTradeQuantity(
  trade: ResourceTrade,
  availableAmount: number,
  tradedCount: number
): number {
  if (
    !Number.isFinite(availableAmount)
    || availableAmount <= 0
    || !Number.isFinite(trade.inputAmount)
    || trade.inputAmount <= 0
    || !Number.isFinite(trade.priceCoefficient)
    || trade.priceCoefficient <= 0
  ) {
    return 0;
  }

  const ratio = trade.priceCoefficient;
  const firstUnitCost = trade.inputAmount * Math.pow(ratio, tradedCount);
  let quantity: number;
  if (ratio === 1) {
    quantity = Math.floor(availableAmount / firstUnitCost);
  } else if (ratio > 1) {
    quantity = Math.floor(
      Math.log1p(availableAmount * (ratio - 1) / firstUnitCost) / Math.log(ratio)
    );
  } else {
    const maximumTotalCost = firstUnitCost / (1 - ratio);
    if (availableAmount >= maximumTotalCost) {
      return Number.MAX_SAFE_INTEGER;
    }
    quantity = Math.floor(
      Math.log1p(-availableAmount * (1 - ratio) / firstUnitCost) / Math.log(ratio)
    );
  }

  quantity = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, quantity));
  while (quantity > 0 && getResourceTradeCost(trade, quantity, tradedCount) > availableAmount) {
    quantity -= 1;
  }
  while (
    quantity < Number.MAX_SAFE_INTEGER
    && getResourceTradeCost(trade, quantity + 1, tradedCount) <= availableAmount
  ) {
    quantity += 1;
  }
  return quantity;
}
