import JsBarcode from 'jsbarcode';

/**
 * Generates a scannable barcode based on product ID
 * Uses Code128 format which is widely supported
 */
export function generateBarcode(productId: string): string {
  // Use the product ID as the barcode value
  // Format: BB-{first 8 chars of UUID} (removing hyphens)
  const cleanId = productId.replace(/-/g, '').substring(0, 12);
  return `BB${cleanId}`.toUpperCase();
}

/** 203 DPI: pixels per mm ≈ 8 (203/25.4) */
const DPI_203_PX_PER_MM = 203 / 25.4;

/** 300 DPI for sharp print/PDF (no upscale blur) */
const DPI_300_PX_PER_MM = 300 / 25.4;

/**
 * Generates a barcode image data URL
 */
export function generateBarcodeImage(barcodeValue: string): string {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, barcodeValue, {
    format: 'CODE128',
    width: 2,
    height: 80,
    displayValue: true,
    fontSize: 14,
    margin: 10,
  });
  return canvas.toDataURL('image/png');
}

/**
 * Generates a high-resolution barcode image for HD export (e.g. bulk download).
 * Uses thicker bars, larger height, and bigger font for crisp output.
 */
export function generateBarcodeImageHD(barcodeValue: string): string {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, barcodeValue, {
    format: 'CODE128',
    width: 4,
    height: 160,
    displayValue: true,
    fontSize: 28,
    margin: 20,
  });
  return canvas.toDataURL('image/png');
}

/**
 * Generates a barcode image for label print at 300 DPI.
 * 40mm × 12mm at 300 DPI keeps barcode sharp when saving as PDF or printing.
 */
export function generateBarcodeImageForPrint(barcodeValue: string): string {
  const widthPx = Math.round(40 * DPI_300_PX_PER_MM);   // 40mm @ 300 DPI → ~472px
  const heightPx = Math.round(12 * DPI_300_PX_PER_MM);  // 12mm @ 300 DPI → ~142px
  const temp = document.createElement('canvas');
  JsBarcode(temp, barcodeValue, {
    format: 'CODE128',
    width: 1.5,
    height: 72,
    displayValue: true,
    fontSize: 8,
    margin: 2,
  });
  const out = document.createElement('canvas');
  out.width = widthPx;
  out.height = heightPx;
  const ctx = out.getContext('2d');
  if (!ctx) return temp.toDataURL('image/png');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, widthPx, heightPx);
  ctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, widthPx, heightPx);
  return out.toDataURL('image/png');
}





