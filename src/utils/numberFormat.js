export function formatCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';

  const rounded = Math.round((number + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
