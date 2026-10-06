import { formatMinorAmount, formatWholeZloty, parseAmountToMinor } from './money';

describe('parseAmountToMinor', () => {
  it('parses decimals without float drift', () => {
    expect(parseAmountToMinor(0.29)).toBe(29);
    expect(parseAmountToMinor('0.29')).toBe(29);
    expect(parseAmountToMinor(28.5)).toBe(2850);
  });

  it('accepts comma and dot separators and whole numbers', () => {
    expect(parseAmountToMinor('19,99')).toBe(1999);
    expect(parseAmountToMinor('28.50')).toBe(2850);
    expect(parseAmountToMinor('28')).toBe(2800);
  });

  it('rounds half away from zero on the decimal string', () => {
    expect(parseAmountToMinor('1.005')).toBe(101);
    expect(parseAmountToMinor('1.004')).toBe(100);
  });

  it('returns null for invalid input', () => {
    expect(parseAmountToMinor('abc')).toBeNull();
    expect(parseAmountToMinor('')).toBeNull();
    expect(parseAmountToMinor('1,2,3')).toBeNull();
    expect(parseAmountToMinor('1.2,3')).toBeNull();
    expect(parseAmountToMinor(Number.NaN)).toBeNull();
  });
});

describe('money formatters', () => {
  it('formats minor units with a comma separator', () => {
    expect(formatMinorAmount(2850)).toBe('28,50');
    expect(formatMinorAmount(123400)).toBe('1234,00');
    expect(formatMinorAmount(-510)).toBe('-5,10');
    expect(formatMinorAmount(5)).toBe('0,05');
  });

  it('formats whole zloty', () => {
    expect(formatWholeZloty(60000)).toBe('600');
    expect(formatWholeZloty(12550)).toBe('126');
    expect(formatWholeZloty(-60000)).toBe('-600');
  });
});
