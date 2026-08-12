/**
 * Computes line totals + document totals for invoices and quotes.
 * `items` = [{ quantity, unit_price, tax_rate (percent number) }]
 * `discount` = { type: 'fixed'|'percent', value: number }
 */
function calculateTotals(items, discount = { type: 'fixed', value: 0 }) {
  let subtotal = 0;
  let taxTotal = 0;

  const computedItems = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const lineBase = qty * price;
    const taxRate = Number(it.tax_rate) || 0;
    const lineTax = +(lineBase * (taxRate / 100)).toFixed(4);
    const lineTotal = +(lineBase + lineTax).toFixed(4);

    subtotal += lineBase;
    taxTotal += lineTax;

    return { ...it, tax_amount: lineTax, total: lineTotal };
  });

  subtotal = +subtotal.toFixed(4);
  taxTotal = +taxTotal.toFixed(4);

  let discountTotal = 0;
  if (discount.type === 'percent') {
    discountTotal = +(subtotal * ((Number(discount.value) || 0) / 100)).toFixed(4);
  } else {
    discountTotal = +(Number(discount.value) || 0).toFixed(4);
  }

  const total = +(subtotal - discountTotal + taxTotal).toFixed(4);

  return { items: computedItems, subtotal, taxTotal, discountTotal, total };
}

module.exports = { calculateTotals };
