/**
 * Local checksum validation for the three retail barcode formats this app
 * scans (EAN-13, UPC-A, EAN-8). Camera misreads on 1D barcodes are common
 * (a smudge or glare can flip one digit), so every raw decode is checked
 * here, for free and instantly, before it's ever sent to the Open Food
 * Facts API - rejecting a garbage read locally is better than it silently
 * producing a false "not found" against a barcode that was never real.
 */
export function isValidBarcode(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;

  switch (code.length) {
    case 13:
      return checkDigitMatches(code, (i) => (i % 2 === 0 ? 1 : 3));
    case 12:
      return checkDigitMatches(code, (i) => (i % 2 === 0 ? 3 : 1));
    case 8:
      return checkDigitMatches(code, (i) => (i % 2 === 0 ? 3 : 1));
    default:
      return false;
  }
}

function checkDigitMatches(code: string, weightForIndex: (index: number) => number): boolean {
  const digits = code.split('').map(Number);
  const checkDigit = digits[digits.length - 1];
  const dataDigits = digits.slice(0, -1);

  const sum = dataDigits.reduce((total, digit, i) => total + digit * weightForIndex(i), 0);
  const expectedCheckDigit = (10 - (sum % 10)) % 10;

  return expectedCheckDigit === checkDigit;
}
