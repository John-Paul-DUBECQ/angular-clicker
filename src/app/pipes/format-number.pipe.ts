import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formate un nombre : k, m, b, t, puis A (10^15), B (10^18), C (10^21), ...
 * Ex. 1200 → 1.2k, 1.5e6 → 1.5M, 2e15 → 2A, 3e18 → 3B
 */
export function formatNumberValue(value: number, decimals = 2): string {
  if (value < 0 || !Number.isFinite(value)) return '0';
  if (value < 1000) return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const exp = Math.floor(Math.log10(value));
  const tier = Math.floor(exp / 3);
  const mantissa = value / Math.pow(1000, tier);
  const suffix = getSuffix(tier);
  const decimalsToShow = mantissa >= 100 ? 0 : mantissa >= 10 ? 1 : mantissa >= 1 ? 2 : Math.min(decimals, 2);
  return mantissa.toFixed(decimalsToShow) + suffix;
}

function getSuffix(tier: number): string {
  const short = ['k', 'm', 'b', 't']; // tier 1→1e3, 2→1e6, 3→1e9, 4→1e12
  if (tier <= short.length) return short[tier - 1];
  // tier 5→1e15=A, 6→1e18=B, 7→1e21=C...
  const letterIndex = tier - 5;
  return getLetterSuffix(letterIndex);
}

function getLetterSuffix(letterIndex: number): string {
  let n = letterIndex + 1;
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

@Pipe({ name: 'formatNumber' })
export class FormatNumberPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals?: number): string {
    if (value == null || !Number.isFinite(value)) return '0';
    return formatNumberValue(value, decimals ?? 2);
  }
}
