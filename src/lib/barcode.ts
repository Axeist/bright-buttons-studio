import bwipjs from 'bwip-js';

/**
 * Generates a scannable barcode value from product ID.
 * Format: BB + first 12 chars of UUID (no hyphens). Code128.
 */
export function generateBarcode(productId: string): string {
  const cleanId = productId.replace(/-/g, '').substring(0, 12);
  return `BB${cleanId}`.toUpperCase();
}

export interface BarcodeSvgOptions {
  scale?: number;
  height?: number; // bar height in mm
  includetext?: boolean;
  textxalign?: 'left' | 'center' | 'right';
  /** Gap in points between barcode bars and human-readable barcode ID text */
  textgaps?: number;
}

const defaultOptions: BarcodeSvgOptions = {
  scale: 3,
  height: 10,
  includetext: true,
  textxalign: 'center',
  textgaps: 3,
};

/**
 * Generates a Code128 barcode as an SVG string (for saving as .svg or use in img src).
 */
export function generateBarcodeSvg(barcodeValue: string, opts: BarcodeSvgOptions = {}): string {
  const options = { ...defaultOptions, ...opts };
  return bwipjs.toSVG({
    bcid: 'code128',
    text: barcodeValue,
    scale: options.scale ?? 3,
    height: options.height ?? 10,
    includetext: options.includetext ?? true,
    textxalign: options.textxalign ?? 'center',
    textgaps: options.textgaps ?? 3,
  });
}

/** SVG string to data URL for use in <img src={...}> */
function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * On-screen preview: high-quality barcode as SVG data URL.
 */
export function generateBarcodeImage(barcodeValue: string): string {
  const svg = generateBarcodeSvg(barcodeValue, { scale: 3, height: 12 });
  return svgToDataUrl(svg);
}

/**
 * Print label: barcode as SVG data URL (scaled for 40mm × 12mm label area).
 */
export function generateBarcodeImageForPrint(barcodeValue: string): string {
  const svg = generateBarcodeSvg(barcodeValue, { scale: 3, height: 8, includetext: true });
  return svgToDataUrl(svg);
}

/**
 * Barcode SVG at larger scale/height for export. Returns SVG data URL for <img>.
 */
export function generateBarcodeImageAtSize(barcodeValue: string, _widthPx: number, heightPx: number): string {
  // heightPx ~110 → ~12mm at 72dpi; scale 3 for crisp bars
  const heightMm = (heightPx / 72) * 25.4;
  const svg = generateBarcodeSvg(barcodeValue, { scale: 3, height: Math.max(8, heightMm), includetext: true });
  return svgToDataUrl(svg);
}

/**
 * Legacy HD export. Returns SVG data URL.
 */
export function generateBarcodeImageHD(barcodeValue: string): string {
  const svg = generateBarcodeSvg(barcodeValue, { scale: 4, height: 14 });
  return svgToDataUrl(svg);
}
