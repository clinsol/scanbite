import { describe, expect, it } from 'vitest';
import { isValidBarcode } from './barcodeValidate';

describe('isValidBarcode', () => {
  it('accepts a real, checksum-valid EAN-13', () => {
    expect(isValidBarcode('4006381333931')).toBe(true);
  });

  it('accepts a real, checksum-valid UPC-A', () => {
    expect(isValidBarcode('036000291452')).toBe(true);
  });

  it('accepts a real, checksum-valid EAN-8', () => {
    expect(isValidBarcode('40170725')).toBe(true);
  });

  it('rejects an EAN-13 with a wrong check digit', () => {
    expect(isValidBarcode('4006381333930')).toBe(false);
  });

  it('rejects a UPC-A with a wrong check digit', () => {
    expect(isValidBarcode('036000291451')).toBe(false);
  });

  it('rejects a wrong length', () => {
    expect(isValidBarcode('123456789')).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(isValidBarcode('4006381abc931')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidBarcode('')).toBe(false);
  });
});
