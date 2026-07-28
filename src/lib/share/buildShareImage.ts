import type { Product } from '../openfoodfacts/offTypes';
import { presentNutriscoreGrade } from '../health/labelPresentation';
import { sugarGramsToTeaspoons } from '../health/nutrientBands';

/**
 * Pure derivation of what the share card says - separated from the actual
 * canvas drawing (drawShareCard, below) specifically so this part is
 * unit-testable without a real browser canvas. Never fabricates a figure:
 * headlineStat is null when OFF has no sugar figure for this product, and
 * ShareCard.tsx must handle that (omit the stat line) rather than this
 * function inventing a placeholder number.
 */
export interface ShareCardContent {
  productName: string;
  brands: string | null;
  gradeLetter: string | null;
  gradeColor: string | null;
  gradeLabel: string | null;
  headlineStat: string | null;
  source: Product['source'];
}

export function buildShareCardContent(product: Product): ShareCardContent {
  const presentation = presentNutriscoreGrade(product.nutriscoreGrade);
  const sugar = product.nutrients.sugars100g;

  return {
    productName: product.name ?? 'This product',
    brands: product.brands,
    gradeLetter: product.nutriscoreGrade ? product.nutriscoreGrade.toUpperCase() : null,
    gradeColor: presentation?.color ?? null,
    gradeLabel: presentation?.label ?? null,
    headlineStat:
      sugar !== null
        ? `${sugar}g sugar per 100g - about ${sugarGramsToTeaspoons(sugar).toFixed(1)} tsp`
        : null,
    source: product.source,
  };
}

const CARD_SIZE = 1080;

/**
 * Draws the share card to an offscreen canvas. Not unit-tested (jsdom has
 * no real Canvas 2D implementation) - verified manually per
 * docs/qa-strategy.md by actually triggering the share flow on a real
 * device.
 */
export function drawShareCard(ctx: CanvasRenderingContext2D, content: ShareCardContent): void {
  const size = CARD_SIZE;
  const padding = 72;

  ctx.fillStyle = '#f6f8f4';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = content.gradeColor ?? '#63705d';
  ctx.beginPath();
  ctx.arc(size / 2, 320, 140, 0, Math.PI * 2);
  ctx.fill();

  if (content.gradeLetter) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 160px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(content.gradeLetter, size / 2, 335);
  }

  ctx.fillStyle = '#1b2318';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, content.productName, size / 2, 540, size - padding * 2, 64);

  if (content.brands) {
    ctx.fillStyle = '#63705d';
    ctx.font = '36px sans-serif';
    ctx.fillText(content.brands, size / 2, 610);
  }

  if (content.gradeLabel) {
    ctx.fillStyle = '#4a5645';
    ctx.font = '32px sans-serif';
    ctx.fillText(content.gradeLabel, size / 2, 700);
  }

  if (content.headlineStat) {
    ctx.fillStyle = '#1b2318';
    ctx.font = 'bold 40px sans-serif';
    wrapText(ctx, content.headlineStat, size / 2, 800, size - padding * 2, 48);
  }

  ctx.fillStyle = '#63705d';
  ctx.font = '24px sans-serif';
  const attribution =
    content.source === 'usda' ? 'Scanbite - data via USDA FoodData Central' : 'Scanbite - data via Open Food Facts (ODbL)';
  ctx.fillText(attribution, size / 2, size - 48);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
