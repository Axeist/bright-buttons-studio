export interface CSVProductRow {
  name: string;
  category: string;
  description?: string;
  fabric?: string;
  technique?: string;
  tagline?: string;
  price: string;
  cost_price?: string;
  stock?: string;
  sku?: string;
  low_stock_threshold?: string;
  image_url?: string;
}

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVImportResult {
  valid: CSVProductRow[];
  errors: CSVValidationError[];
}

/**
 * Validates CSV data before import
 */
export function validateCSVData(rows: any[]): CSVImportResult {
  const valid: CSVProductRow[] = [];
  const errors: CSVValidationError[] = [];

  const requiredFields = ['name', 'category', 'price'];
  const validCategories = [
    'Kurthas & Co-ords',
    'Sarees',
    'Shawls',
    "Men's Shirts",
    'T-Shirts',
    'Kidswear'
  ];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is header, and arrays are 0-indexed
    const rowErrors: CSVValidationError[] = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push({
          row: rowNum,
          field,
          message: `${field} is required`,
        });
      }
    }

    // Validate category
    if (row.category && !validCategories.includes(row.category.trim())) {
      rowErrors.push({
        row: rowNum,
        field: 'category',
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    // Validate price
    if (row.price) {
      const price = parseFloat(row.price.toString().replace(/[₹,]/g, ''));
      if (isNaN(price) || price <= 0) {
        rowErrors.push({
          row: rowNum,
          field: 'price',
          message: 'Price must be a valid positive number',
        });
      }
    }

    // Validate cost_price if provided
    if (row.cost_price && row.cost_price.toString().trim() !== '') {
      const costPrice = parseFloat(row.cost_price.toString().replace(/[₹,]/g, ''));
      if (isNaN(costPrice) || costPrice < 0) {
        rowErrors.push({
          row: rowNum,
          field: 'cost_price',
          message: 'Cost price must be a valid non-negative number',
        });
      }
    }

    // Validate stock if provided
    if (row.stock && row.stock.toString().trim() !== '') {
      const stock = parseInt(row.stock.toString());
      if (isNaN(stock) || stock < 0) {
        rowErrors.push({
          row: rowNum,
          field: 'stock',
          message: 'Stock must be a valid non-negative integer',
        });
      }
    }

    // Validate low_stock_threshold if provided
    if (row.low_stock_threshold && row.low_stock_threshold.toString().trim() !== '') {
      const threshold = parseInt(row.low_stock_threshold.toString());
      if (isNaN(threshold) || threshold < 0) {
        rowErrors.push({
          row: rowNum,
          field: 'low_stock_threshold',
          message: 'Low stock threshold must be a valid non-negative integer',
        });
      }
    }

    // Validate image_url if provided
    if (row.image_url && row.image_url.toString().trim() !== '') {
      try {
        new URL(row.image_url.toString().trim());
      } catch {
        rowErrors.push({
          row: rowNum,
          field: 'image_url',
          message: 'Image URL must be a valid URL',
        });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      valid.push({
        name: row.name.toString().trim(),
        category: row.category.toString().trim(),
        description: row.description?.toString().trim() || undefined,
        fabric: row.fabric?.toString().trim() || undefined,
        technique: row.technique?.toString().trim() || undefined,
        tagline: row.tagline?.toString().trim() || undefined,
        price: row.price.toString().trim(),
        cost_price: row.cost_price?.toString().trim() || undefined,
        stock: row.stock?.toString().trim() || undefined,
        sku: row.sku?.toString().trim() || undefined,
        low_stock_threshold: row.low_stock_threshold?.toString().trim() || undefined,
        image_url: row.image_url?.toString().trim() || undefined,
      });
    }
  });

  return { valid, errors };
}

/**
 * Parses CSV file content with proper handling of quoted fields
 */
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Helper function to parse CSV line handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    result.push(current.trim());
    return result;
  };

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/^"|"$/g, ''));
  
  // Parse data rows
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Generates sample CSV content
 */
export function generateSampleCSV(): string {
  const headers = [
    'name',
    'category',
    'description',
    'fabric',
    'technique',
    'tagline',
    'price',
    'cost_price',
    'stock',
    'sku',
    'low_stock_threshold',
    'image_url'
  ];

  const sampleRows = [
    [
      'Eco Printed Cotton Kurta',
      'Kurthas & Co-ords',
      'Beautiful handcrafted kurta with eco printing technique',
      'Cotton',
      'Eco printing',
      'Sustainable Fashion',
      '2500',
      '1500',
      '10',
      'KUR-ECO-001',
      '5',
      'https://example.com/images/kurta-eco-001.jpg'
    ],
    [
      'Silk Saree with Kalamkari',
      'Sarees',
      'Traditional silk saree with intricate Kalamkari work',
      'Silk',
      'Kalamkari',
      'Traditional Elegance',
      '15000',
      '8000',
      '5',
      'SAR-KAL-001',
      '3',
      'https://example.com/images/saree-kal-001.jpg'
    ],
    [
      'Tie & Dye T-Shirt',
      'T-Shirts',
      'Vibrant tie and dye t-shirt',
      'Cotton',
      'Tie & Dye',
      'Colorful Comfort',
      '800',
      '400',
      '20',
      'TSH-TD-001',
      '10',
      'https://example.com/images/tshirt-td-001.jpg'
    ]
  ];

  const csvLines = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ];

  return csvLines.join('\n');
}

