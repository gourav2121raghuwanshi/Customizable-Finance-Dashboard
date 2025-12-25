import { DataMapper, StandardizedData, MapperConfig } from '../types';

export const AlphaVantageAdapter: DataMapper = {
  id: 'alpha-vantage',
  name: 'Alpha Vantage Adapter',
  description: 'Handles Time Series and Global Quote data from Alpha Vantage API',
  transform: (data: unknown, config?: MapperConfig): StandardizedData | null => {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;

    // 1. Handle Time Series
    const timeSeriesKey = Object.keys(obj).find(k => 
      k.includes('Time Series') || k.includes('Daily') || k.includes('Weekly') || k.includes('Monthly')
    );

    if (timeSeriesKey) {
      const timeSeries = obj[timeSeriesKey] as Record<string, Record<string, string>>;
      const dates = Object.keys(timeSeries).sort(); // Sort dates if needed, usually they are desc
      
      // Default to "4. close" or similar if no field specified
      const targetField = config?.fieldMapping?.value || '4. close';
      
      const chartData = {
        labels: dates,
        datasets: [{
          label: targetField,
          data: dates.map(date => {
            const val = timeSeries[date]?.[targetField];
            return typeof val === 'string' ? parseFloat(val) : 0;
          })
        }]
      };

      return {
        type: 'chart',
        data: chartData
      };
    }

    // 2. Handle Global Quote
    const quoteKey = 'Global Quote';
    if (obj[quoteKey]) {
      const quote = obj[quoteKey] as Record<string, string>;
      return {
        type: 'metric',
        data: {
          label: quote['01. symbol'] || 'Unknown',
          value: parseFloat(quote['05. price'] || '0'),
          change: parseFloat(quote['09. change'] || '0'),
          changeType: parseFloat(quote['09. change'] || '0') >= 0 ? 'positive' : 'negative'
        }
      };
    }

    return null;
  }
};
