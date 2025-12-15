import { parseCSV } from "./csvImport";

export interface CSVPincodeRow {
  pincode: string;
  city: string;
  state: string;
  is_active?: string;
}

export interface CSVPincodeValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVPincodeImportResult {
  valid: CSVPincodeRow[];
  errors: CSVPincodeValidationError[];
}

/**
 * Validates CSV data for pincodes before import
 */
export function validatePincodeCSVData(rows: any[]): CSVPincodeImportResult {
  const valid: CSVPincodeRow[] = [];
  const errors: CSVPincodeValidationError[] = [];

  const requiredFields = ['pincode', 'city', 'state'];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is header, and arrays are 0-indexed
    const rowErrors: CSVPincodeValidationError[] = [];

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

    // Validate pincode format (6 digits)
    if (row.pincode) {
      const pincode = row.pincode.toString().trim();
      if (!/^\d{6}$/.test(pincode)) {
        rowErrors.push({
          row: rowNum,
          field: 'pincode',
          message: 'Pincode must be exactly 6 digits',
        });
      }
    }

    // Validate is_active if provided (should be true/false or yes/no)
    if (row.is_active && row.is_active.toString().trim() !== '') {
      const isActive = row.is_active.toString().trim().toLowerCase();
      if (!['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(isActive)) {
        rowErrors.push({
          row: rowNum,
          field: 'is_active',
          message: 'is_active must be true/false, yes/no, 1/0, or y/n',
        });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      const isActiveValue = row.is_active?.toString().trim().toLowerCase() || 'true';
      const isActive = ['true', 'yes', '1', 'y'].includes(isActiveValue);
      
      valid.push({
        pincode: row.pincode.toString().trim(),
        city: row.city.toString().trim(),
        state: row.state.toString().trim(),
        is_active: isActive ? 'true' : 'false',
      });
    }
  });

  return { valid, errors };
}

/**
 * Generates sample CSV content for pincodes
 */
export function generateSamplePincodeCSV(): string {
  const headers = ['pincode', 'city', 'state', 'is_active'];
  const rows = [
    ['620001', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620002', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620003', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620004', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620005', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620006', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620007', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620008', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620009', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620010', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620011', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620012', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620013', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620014', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620015', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620016', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620017', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620018', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620019', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620020', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620021', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620022', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620023', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620024', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620025', 'Tiruchirappalli', 'Tamil Nadu', 'true'],
    ['620101', 'Srirangam', 'Tamil Nadu', 'true'],
    ['620102', 'Srirangam', 'Tamil Nadu', 'true'],
    ['620103', 'Srirangam', 'Tamil Nadu', 'true'],
    ['621001', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621002', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621003', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621004', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621005', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621006', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621007', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621008', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621009', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621010', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621011', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621012', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621013', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621014', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621015', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621016', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621017', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621018', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621019', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621020', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621021', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621022', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621023', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621024', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621025', 'Lalgudi', 'Tamil Nadu', 'true'],
    ['621101', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621102', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621103', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621104', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621105', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621106', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621107', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621108', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621109', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621110', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621111', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621112', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621113', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621114', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621115', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621116', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621117', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621118', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621119', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621120', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621121', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621122', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621123', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621124', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621125', 'Manachanallur', 'Tamil Nadu', 'true'],
    ['621201', 'Musiri', 'Tamil Nadu', 'true'],
    ['621202', 'Musiri', 'Tamil Nadu', 'true'],
    ['621203', 'Musiri', 'Tamil Nadu', 'true'],
    ['621204', 'Musiri', 'Tamil Nadu', 'true'],
    ['621205', 'Musiri', 'Tamil Nadu', 'true'],
    ['621206', 'Musiri', 'Tamil Nadu', 'true'],
    ['621207', 'Musiri', 'Tamil Nadu', 'true'],
    ['621208', 'Musiri', 'Tamil Nadu', 'true'],
    ['621209', 'Musiri', 'Tamil Nadu', 'true'],
    ['621210', 'Musiri', 'Tamil Nadu', 'true'],
    ['621211', 'Musiri', 'Tamil Nadu', 'true'],
    ['621212', 'Musiri', 'Tamil Nadu', 'true'],
    ['621213', 'Musiri', 'Tamil Nadu', 'true'],
    ['621214', 'Musiri', 'Tamil Nadu', 'true'],
    ['621215', 'Musiri', 'Tamil Nadu', 'true'],
    ['621216', 'Musiri', 'Tamil Nadu', 'true'],
    ['621217', 'Musiri', 'Tamil Nadu', 'true'],
    ['621218', 'Musiri', 'Tamil Nadu', 'true'],
    ['621219', 'Musiri', 'Tamil Nadu', 'true'],
    ['621220', 'Musiri', 'Tamil Nadu', 'true'],
    ['621221', 'Musiri', 'Tamil Nadu', 'true'],
    ['621222', 'Musiri', 'Tamil Nadu', 'true'],
    ['621223', 'Musiri', 'Tamil Nadu', 'true'],
    ['621224', 'Musiri', 'Tamil Nadu', 'true'],
    ['621225', 'Musiri', 'Tamil Nadu', 'true'],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

