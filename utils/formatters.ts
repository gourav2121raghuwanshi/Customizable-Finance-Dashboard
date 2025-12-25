// Data formatting utilities

export type FormatType = "currency" | "percentage" | "number" | "text";

export function formatValue(value: unknown, format?: FormatType): string {
  if (value === null || value === undefined) return "N/A";

  const numValue = typeof value === "string" ? parseFloat(value) : (typeof value === 'number' ? value : NaN);

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(isNaN(numValue) ? 0 : numValue);
    
    case "percentage":
      return isNaN(numValue)
        ? String(value)
        : `${numValue.toFixed(2)}%`;
    
    case "number":
      return isNaN(numValue)
        ? String(value)
        : new Intl.NumberFormat("en-US").format(numValue);
    
    case "text":
    default:
      return String(value);
  }
}

// Extract nested data from API responses
export function extractData(data: unknown, path?: string): unknown {
  if (!data) return null;
  if (!path) return data;

  const keys = path.split(".");
  let result: unknown = data;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }

  return result;
}

// Find time series data in various formats
export function findTimeSeries(data: unknown): { key: string; data: unknown } | null {
  if (!data || typeof data !== "object") return null;

  const dataObj = data as Record<string, unknown>;

  // Common patterns for time series keys
  const patterns = [
    /time.?series/i,
    /time_series/i,
    /Time Series/i,
    /daily/i,
    /weekly/i,
    /monthly/i,
  ];

  for (const key in dataObj) {
    if (patterns.some(pattern => pattern.test(key))) {
      const value = dataObj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        // Check if it's actually time series (has date-like keys)
        const firstKey = Object.keys(value)[0];
        if (firstKey && /^\d{4}-\d{2}-\d{2}/.test(firstKey)) {
          return { key, data: value };
        }
      }
    }
  }

  // If no pattern matches, check if data itself is time series-like
  // (object with date-like keys)
  const firstKey = Object.keys(dataObj)[0];
  if (firstKey && /^\d{4}-\d{2}-\d{2}/.test(firstKey)) {
    return { key: "root", data: dataObj };
  }

  return null;
}

// Find non-time-series data structures (like Global Quote, Meta Data)
export function findDataStructure(data: unknown): { key: string; data: unknown; isTimeSeries: boolean } | null {
  if (!data || typeof data !== "object") return null;
  const dataObj = data as Record<string, unknown>;

  // First check for time series
  const timeSeries = findTimeSeries(dataObj);
  if (timeSeries) {
    return { ...timeSeries, isTimeSeries: true };
  }

  // Check for Global Quote or similar structures
  const quotePatterns = [/global.?quote/i, /quote/i, /data/i];
  for (const key in dataObj) {
    if (quotePatterns.some(pattern => pattern.test(key))) {
      const value = dataObj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return { key, data: value, isTimeSeries: false };
      }
    }
  }

  // If no specific structure found, return the root data
  return { key: "root", data: dataObj, isTimeSeries: false };
}

// Extract fields specifically for time series data (returns only fields within time series entries)
export function extractTimeSeriesFields(data: unknown): string[] {
  const timeSeries = findTimeSeries(data);
  if (!timeSeries) return [];

  const timeSeriesData = timeSeries.data as Record<string, unknown>;
  
  // Get all dates and find the first one
  const dates = Object.keys(timeSeriesData);
  if (dates.length === 0) return [];
  
  const firstDate = dates[0];
  const firstEntry = timeSeriesData[firstDate];
  
  if (!firstEntry || typeof firstEntry !== "object" || Array.isArray(firstEntry)) {
    return [];
  }
  
  // Get the actual field names from the entry
  const fields: string[] = [];
  const entryObj = firstEntry as Record<string, unknown>;
  for (const key in entryObj) {
    if (entryObj.hasOwnProperty(key) && typeof key === "string") {
      fields.push(key);
    }
  }
  
  // Sort fields naturally (so "1. open" comes before "2. high", not "10. something")
  return fields.sort((a, b) => {
    // Extract numbers from field names for natural sorting
    const numA = parseInt(a.match(/^\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/^\d+/)?.[0] || "0");
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
}

// Extract fields from non-time-series data (like Global Quote)
export function extractSimpleFields(data: unknown): string[] {
  const structure = findDataStructure(data);
  if (!structure) return [];

  const structureData = structure.data as Record<string, unknown>;
  if (!structureData || typeof structureData !== "object" || Array.isArray(structureData)) {
    return [];
  }

  const fields: string[] = [];
  for (const key in structureData) {
    if (structureData.hasOwnProperty(key) && typeof key === "string") {
      // Only include fields that are not nested objects (leaf values)
      const value = structureData[key];
      if (value === null || value === undefined || 
          (typeof value !== "object") || Array.isArray(value)) {
        fields.push(key);
      }
    }
  }

  // Sort fields naturally
  return fields.sort((a, b) => {
    const numA = parseInt(a.match(/^\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/^\d+/)?.[0] || "0");
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
}

// Extract all possible fields from data structure
export function extractFields(data: unknown, _maxDepth: number = 3): string[] {
  if (!data || typeof data !== "object") return [];
  const dataObj = data as Record<string, unknown>;

  // First, check if this is time series data - if so, return only time series fields
  const timeSeries = findTimeSeries(dataObj);
  if (timeSeries) {
    const fields = extractTimeSeriesFields(dataObj);
    // Ensure all fields are strings and filter out pure numeric strings
    return fields.filter(f => typeof f === "string" && f.length > 0 && !/^\d+$/.test(f));
  }

  // Check for simple data structures like Global Quote
  const structure = findDataStructure(dataObj);
  if (structure && !structure.isTimeSeries) {
    const fields = extractSimpleFields(dataObj);
    return fields.filter(f => typeof f === "string" && f.length > 0 && !/^\d+$/.test(f));
  }

  // Fallback: extract fields from root level
  const fields: string[] = [];
  for (const key in dataObj) {
    if (dataObj.hasOwnProperty(key) && typeof key === "string") {
      const value = dataObj[key];
      // Only include leaf values or simple structures
      if (value === null || value === undefined || 
          (typeof value !== "object") || Array.isArray(value)) {
        if (!/^\d+$/.test(key)) {
          fields.push(key);
        }
      } else if (typeof value === "object") {
        // For nested objects, extract their fields
        const nestedFields = Object.keys(value as Record<string, unknown>);
        nestedFields.forEach(field => {
          if (typeof field === "string" && !/^\d+$/.test(field)) {
            fields.push(field);
          }
        });
      }
    }
  }

  return fields.sort();
}

