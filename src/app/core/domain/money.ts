const DECIMAL_PATTERN = /^(\d*)(?:[.,](\d*))?$/;

export function parseAmountToMinor(input: string | number): number | null {
  if (typeof input === 'number' && !Number.isFinite(input)) {
    return null;
  }
  // Numbers like 1e-7 stringify with an exponent; use a fixed form instead.
  const text = (typeof input === 'number' ? input.toFixed(10) : input).trim();
  const match = DECIMAL_PATTERN.exec(text);
  if (!match) {
    return null;
  }
  const whole = match[1] ?? '';
  const fraction = match[2] ?? '';
  if (!whole && !fraction) {
    return null;
  }
  const padded = (fraction + '00').slice(0, 2);
  let minor = Number(whole || '0') * 100 + Number(padded);
  if (fraction.length > 2 && Number(fraction[2]) >= 5) {
    minor += 1;
  }
  return minor;
}

export function formatMinorAmount(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, '0');
  return `${sign}${whole},${fraction}`;
}

export function formatWholeZloty(minor: number): string {
  return String(Math.round(minor / 100));
}
