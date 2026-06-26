/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatCurrency(amount: number, currency: 'IDR' | 'USD' | 'SGD'): string {
  if (currency === 'USD') {
    const usdAmount = amount / 16000;
    return `$ ${usdAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (currency === 'SGD') {
    const sgdAmount = amount / 12000;
    return `S$ ${sgdAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  // Default to IDR
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}
