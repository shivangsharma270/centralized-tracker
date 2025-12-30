
import { Concern } from '../types';

/**
 * Use the export endpoint for direct CSV access.
 * This is generally more reliable for browser-based fetching of public sheets.
 */
export const BASE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ofyzwBVRjI6y1VNn-OBJtIPVKjaMdaMY2aZt-sFN7ao/export?format=csv';

export const GIDS = {
  SOCIAL_MEDIA: '856039892',
  PROXY_CASES: '0'
};

export interface ParsedSheetData<T> {
  data: T[];
  headers: string[];
}

/**
 * Fetches CSV data from a specific tab using its GID.
 */
export async function fetchSheetData<T>(gid: string): Promise<ParsedSheetData<T>> {
  // Add a timestamp to bypass browser cache
  const url = `${BASE_SHEET_URL}&gid=${gid}&t=${Date.now()}`;
  
  try {
    console.debug(`Attempting fetch for GID ${gid}...`);
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    
    // Check if we got an HTML login page instead of CSV
    if (csvText.trim().toLowerCase().startsWith('<!doctype') || csvText.includes('google-signin')) {
      throw new Error('Access Denied: The sheet must be set to "Anyone with the link can view".');
    }

    if (!csvText || csvText.trim().length === 0) {
      throw new Error('The sheet returned no data.');
    }

    return parseCSV<T>(csvText, gid);
  } catch (error: any) {
    console.error(`Fetch error for GID ${gid}:`, error.message);
    throw error; // Let the component handle the error UI
  }
}

/**
 * Robust CSV Line Splitter
 * Correctly handles:
 * - Quoted fields: "Value, with comma"
 * - Escaped quotes: "Value with ""quote"""
 * - Empty fields: ,,
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let curVal = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped double quote
        curVal += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // New field
      result.push(curVal.trim());
      curVal = '';
    } else {
      curVal += char;
    }
  }
  result.push(curVal.trim());
  return result;
}

/**
 * Parses CSV text into objects based on headers
 */
function parseCSV<T>(csv: string, gid: string): ParsedSheetData<T> {
  // Split lines while respecting quotes
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') inQuotes = !inQuotes;
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
      if (char === '\r' && csv[i + 1] === '\n') i++; // Handle CRLF
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length === 0) return { data: [], headers: [] };

  // 1. Clean Headers
  // Remove BOM and trim everything
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = splitCSVLine(firstLine).map(h => h.replace(/^["']|["']$/g, '').trim());

  const data: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]).map(v => v.replace(/^["']|["']$/g, '').trim());
    const obj: any = {};
    
    headers.forEach((header, idx) => {
      if (header) {
        obj[header] = values[idx] || '';
      }
    });

    // Generate stable ID
    const rowId = obj['Ticket ID'] || obj['Ticket Id'] || obj['S no.'] || `row-${i}`;
    obj.id = `sheet-${gid}-${i}-${rowId}`;

    data.push(obj as T);
  }

  return { data, headers };
}
