import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import { isCameraAvailable, startScanning, stopScanning } from '../../lib/barcode/barcodeScanner';
import { isValidBarcode } from '../../lib/barcode/barcodeValidate';
import { CameraPermissionNotice } from '../../components/CameraPermissionNotice';

interface ScannerViewProps {
  onDetect: (barcode: string) => void;
  onEnterManually: () => void;
}

/**
 * Camera view + live decode loop. Every raw ZXing decode is checksum
 * -validated locally before being treated as a real barcode (see
 * barcodeValidate.ts) - camera misreads on 1D barcodes are common enough
 * that this matters. The "Enter manually" link is always visible, not just
 * after a failure, per the plan's manual-fallback requirement.
 */
export function ScannerView({ onDetect, onEnterManually }: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  // Computed once, synchronously, via a lazy initializer rather than an
  // effect - isCameraAvailable() is a pure feature-detection check, not
  // something that needs to "run after commit."
  const [cameraIssue, setCameraIssue] = useState<'no-camera' | 'denied' | 'error' | null>(() =>
    isCameraAvailable() ? null : 'no-camera'
  );

  useEffect(() => {
    if (cameraIssue === 'no-camera') return; // already known synchronously at init; nothing to start.

    let cancelled = false;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    startScanning(
      videoEl,
      (barcode) => {
        if (isValidBarcode(barcode)) onDetect(barcode);
      },
      (error) => {
        if (cancelled) return;
        const name = error instanceof Error ? error.name : '';
        setCameraIssue(name === 'NotAllowedError' ? 'denied' : 'error');
      }
    ).then((controls) => {
      if (cancelled) {
        stopScanning(controls);
      } else {
        controlsRef.current = controls;
      }
    });

    return () => {
      cancelled = true;
      stopScanning(controlsRef.current);
      controlsRef.current = null;
    };
    // Deliberately runs once: onDetect is expected to be stable, and
    // cameraIssue is read only to bail out early - reacting to it here
    // would restart the camera stream every time a "denied"/"error" is set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {cameraIssue ? (
        <CameraPermissionNotice reason={cameraIssue} />
      ) : (
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black shadow-sm">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
          {/* Viewfinder guide - decorative only, ZXing decodes the full frame regardless of where the barcode sits in it. */}
          <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/70" aria-hidden>
            <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-white" />
            <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-white" />
            <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-white" />
          </div>
        </div>
      )}
      <p className="text-center text-sm text-ink-muted">
        Point the camera at a barcode, or{' '}
        <button
          onClick={onEnterManually}
          className="font-medium text-accent underline underline-offset-2"
        >
          enter it manually
        </button>
        .
      </p>
    </div>
  );
}
