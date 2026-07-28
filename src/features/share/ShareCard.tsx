import { useEffect, useRef, useState } from 'react';
import { buildShareCardContent, drawShareCard } from '../../lib/share/buildShareImage';
import type { Product } from '../../lib/openfoodfacts/offTypes';

interface ShareCardProps {
  product: Product;
  shareUrl: string;
  onClose: () => void;
}

/**
 * Renders the canvas share-image and wires up sharing. Primary path is the
 * Web Share API (real native share sheet on mobile); desktop/unsupported
 * browsers fall back to a download link + copy-link button. Known,
 * accepted V1 limitation: a static host can't generate per-product Open
 * Graph previews, so the shared *image* carries the per-product payoff,
 * the shared *URL* just makes the destination re-openable (see
 * docs/architecture.md).
 */
export function ShareCard({ product, shareUrl, onClose }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = 1080;
    canvas.height = 1080;
    drawShareCard(ctx, buildShareCardContent(product));
  }, [product]);

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'scanbite-result.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: product.name ?? undefined, url: shareUrl });
          return;
        } catch {
          // user cancelled the share sheet, or it failed - fall through to the manual download below rather than leaving them stuck.
        }
      }
      downloadBlob(blob);
    }, 'image/png');
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scanbite-result.png';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-[fadeIn_0.15s_ease-out] motion-reduce:animate-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-4 rounded-xl bg-surface p-4 shadow-lg animate-[popIn_0.18s_ease-out] motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <canvas ref={canvasRef} className="w-full rounded-lg border border-hairline" />
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#256b29]"
          >
            Share
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <button onClick={onClose} className="w-full text-sm text-ink-faint underline underline-offset-2">
          Close
        </button>
      </div>
    </div>
  );
}
