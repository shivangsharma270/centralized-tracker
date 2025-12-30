
import { Concern } from '../types';

export const BASE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ofyzwBVRjI6y1VNn-OBJtIPVKjaMdaMY2aZt-sFN7ao/export?format=csv';

// User defined strict GIDs
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
  const url = `${BASE_SHEET_URL}&gid=${gid}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const csvText = await response.text();
    
    // Safety check: if Google returns login page or HTML
    if (csvText.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Received HTML instead of CSV - check sheet access permissions');
    }

    return parseCSV<T>(csvText);
  } catch (error) {
    console.error(`Error fetching GID ${gid}:`, error);
    return { data: [], headers: [] };
  }
}

function parseCSV<T>(csv: string): ParsedSheetData<T> {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  // Split lines while respecting quoted newlines
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') inQuotes = !inQuotes;
    if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length < 1) return { data: [], headers: [] };

  const splitLine = (line: string) => {
    const result: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) {
        result.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return result;
  };

  const rawHeaders = splitLine(lines[0]).map(h => h.trim());
  const headers = rawHeaders.filter(h => h.length > 0);
  
  const data: T[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitLine(line);
    const entry: any = {};
    
    rawHeaders.forEach((header, index) => {
      const val = (values[index] || '').trim();
      if (header) {
        entry[header] = val;
      }
    });

    // Unique ID generation
    const ticketId = entry['Ticket Id'] || entry['Ticket ID'] || entry['S no.'] || i;
    entry.id = `row-${i}-${ticketId}`;
    
    // Minimal mapping for general compatibility
    if (!entry.title) entry.title = entry['Mail Thread'] || entry['Ticket ID'] || 'N/A';
    
    data.push(entry as T);
  }

  return { data, headers };
}
