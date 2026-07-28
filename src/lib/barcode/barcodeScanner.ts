import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

/**
 * Restricted to actual retail product barcode formats - narrowing the
 * format list (instead of using ZXing's full multi-format default)
 * improves both decode accuracy and speed, and this app has no use for
 * QR/Code128/other general-purpose formats.
 */
const RETAIL_BARCODE_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_8,
];

export function isCameraAvailable(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';
}

/**
 * Starts the camera and continuously decodes video frames until
 * stopScanning() is called. onDetect fires once per successfully-decoded
 * barcode (the caller is responsible for checksum-validating it via
 * barcodeValidate.ts before treating it as real). onError fires only for a
 * genuine startup failure (camera permission denied, no camera device) -
 * ZXing's per-frame "no barcode in this frame" outcome is the normal,
 * continuous "still looking" state and is not surfaced as an error.
 *
 * Returns the scanner controls so the caller can stop scanning on unmount;
 * a caller that never calls stopScanning() leaves the camera light on,
 * which is a real, testable failure mode, not a hypothetical one.
 */
export async function startScanning(
  videoElement: HTMLVideoElement,
  onDetect: (barcode: string) => void,
  onError: (error: unknown) => void
): Promise<IScannerControls | null> {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, RETAIL_BARCODE_FORMATS);
  const reader = new BrowserMultiFormatReader(hints);

  try {
    return await reader.decodeFromVideoDevice(undefined, videoElement, (result) => {
      if (result) onDetect(result.getText());
    });
  } catch (error) {
    onError(error);
    return null;
  }
}

export function stopScanning(controls: IScannerControls | null): void {
  controls?.stop();
}
