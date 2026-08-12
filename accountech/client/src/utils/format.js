export function formatMoney(value, symbol = '$') {
  const n = Number(value || 0);
  return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function titleCase(s) {
  if (!s) return '';
  return s.replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}
