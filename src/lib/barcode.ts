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





