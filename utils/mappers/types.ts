export type DataType = 'chart' | 'table' | 'metric' | 'json';

export interface StandardizedChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface StandardizedTableData {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface StandardizedMetricData {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export interface StandardizedData {
  type: DataType;
  data: StandardizedChartData | StandardizedTableData | StandardizedMetricData | unknown;
}

export interface MapperConfig {
  fieldMapping?: Record<string, string>; // e.g., { "x": "date", "y": "close" }
  rootPath?: string; // Path to the data array in the response
}

export interface DataMapper {
  id: string;
  name: string;
  description: string;
  transform: (data: unknown, config?: MapperConfig) => StandardizedData | null;
}
