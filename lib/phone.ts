export function digits(raw?: string) {
  const d = (raw ?? '').replace(/\D/g, '');
  // If 11 digits and starts with 1, drop the 1 (US)
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
}
