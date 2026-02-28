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
 * Generates a barcode image for 203 DPI thermal label print (e.g. TSC TE244).
 * Renders at 40mm × 12mm in 203 DPI pixels so it fits inside 50mm × 25mm labels.
 */
export function generateBarcodeImageForPrint(barcodeValue: string): string {
  const widthPx = Math.round(40 * DPI_203_PX_PER_MM);  // 40mm
  const heightPx = Math.round(12 * DPI_203_PX_PER_MM); // 12mm
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  JsBarcode(canvas, barcodeValue, {
    format: 'CODE128',
    width: 1.2,
    height: 70,
    displayValue: true,
    fontSize: 8,
    margin: 2,
  });
  return canvas.toDataURL('image/png');
}





