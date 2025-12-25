import { DataMapper, StandardizedData, MapperConfig } from '../types';

export const GenericJSONAdapter: DataMapper = {
  id: 'generic-json',
  name: 'Generic JSON Adapter',
  description: 'Auto-detects structure (Array -> Table, Object -> Metric/List)',
  transform: (data: unknown, config?: MapperConfig): StandardizedData | null => {
    if (!data) return null;

    let targetData: unknown = data;
    
    // Navigate to root path if specified
    if (config?.rootPath) {
      const parts = config.rootPath.split('.');
      for (const part of parts) {
        if (typeof targetData === 'object' && targetData !== null && (targetData as Record<string, unknown>)[part] !== undefined) {
          targetData = (targetData as Record<string, unknown>)[part];
        } else {
          return null;
        }
      }
    }

    // If Array -> Table
    if (Array.isArray(targetData)) {
      if (targetData.length === 0) return { type: 'table', data: { headers: [], rows: [] } };
      
      const headers = Object.keys(targetData[0] as Record<string, unknown>);
      return {
        type: 'table',
        data: {
          headers,
          rows: targetData as Record<string, unknown>[]
        }
      };
    }

    // If Object -> Key-Value List (treated as Table for now or Metric if small)
    if (typeof targetData === 'object' && targetData !== null) {
      // If user wants specific fields for a metric
      if (config?.fieldMapping?.value) {
        const val = (targetData as Record<string, unknown>)[config.fieldMapping.value];
        return {
          type: 'metric',
          data: {
            label: config.fieldMapping.label || 'Value',
            value: val
          }
        };
      }

      // Default: Convert object to table of key-values
      return {
        type: 'table',
        data: {
          headers: ['Key', 'Value'],
          rows: Object.entries(targetData as Record<string, unknown>).map(([k, v]) => ({
            Key: k,
            Value: typeof v === 'object' ? JSON.stringify(v) : v
          }))
        }
      };
    }

    return null;
  }
};
