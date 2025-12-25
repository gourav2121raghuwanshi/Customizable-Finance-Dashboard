"use client";

import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Widget } from "@/store/slices/widgetSlice";
import { Line, Bar } from "react-chartjs-2";
import { RootState } from "@/store/store";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
// Note: Candlestick charts require chartjs-chart-financial
// For now, we'll use a line chart as fallback for candlestick data
import { useApiData } from "@/utils/useApiData";
import { formatValue, findTimeSeries, extractData, FormatType } from "@/utils/formatters";
import { getMapper } from "@/utils/mappers";
import { StandardizedData, StandardizedChartData, StandardizedTableData, StandardizedMetricData } from "@/utils/mappers/types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WidgetRendererProps {
  widget: Widget;
}

type ProcessedData =
  | { type: "timeSeries"; data: Record<string, Record<string, unknown>>; key: string }
  | { type: "quote"; data: Record<string, unknown>; key: string }
  | { type: "array"; data: Record<string, unknown>[] }
  | { type: "object"; data: Record<string, unknown> }
  | StandardizedData;

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  const theme = useSelector((state: RootState) => state.widgets.theme);
  const isDark = theme === "dark";
  const { data, loading, error } = useApiData({
    url: widget.apiUrl,
    refreshInterval: widget.refreshInterval,
    enabled: !!widget.apiUrl,
  });

  // Table state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Process data
  const processedData = useMemo<ProcessedData | null>(() => {
    if (!data) return null;

    // New Mapper System
    if (widget.mapperId) {
      const mapper = getMapper(widget.mapperId);
      const result = mapper.transform(data, widget.mapperConfig);
      if (result) return result;
    }

    // Try to find time series data
    const timeSeries = findTimeSeries(data);
    if (timeSeries) {
      return {
        type: "timeSeries",
        data: timeSeries.data as Record<string, Record<string, unknown>>,
        key: timeSeries.key,
      };
    }

    // Check for Global Quote or similar structures
    const quotePatterns = [/global.?quote/i, /quote/i];
    const dataObj = data as Record<string, unknown>;
    for (const key in dataObj) {
      if (quotePatterns.some(pattern => pattern.test(key))) {
        const value = dataObj[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return {
            type: "quote",
            data: value as Record<string, unknown>,
            key: key,
          };
        }
      }
    }

    // Check if it's an array
    if (Array.isArray(data)) {
      return {
        type: "array",
        data: data as Record<string, unknown>[],
      };
    }

    // Check if it's a simple object with flat structure
    if (typeof data === "object" && data !== null) {
      return {
        type: "object",
        data: data as Record<string, unknown>,
      };
    }

    return null;
  }, [data, widget.mapperId, widget.mapperConfig]);

  // Get fields to display
  const fields = useMemo<string[]>(() => {
    if (widget.selectedFields && widget.selectedFields.length > 0) {
      return widget.selectedFields;
    }

    if (!processedData) return [];

    // Standardized Data Types
    if (processedData.type === 'chart') {
      return (processedData.data as StandardizedChartData).datasets.map(d => d.label);
    }
    if (processedData.type === 'table') {
      return (processedData.data as StandardizedTableData).headers;
    }
    if (processedData.type === 'metric') {
      return [(processedData.data as StandardizedMetricData).label];
    }

    if (processedData.type === "timeSeries") {
      const firstDate = Object.keys(processedData.data)[0];
      if (firstDate) {
        const entryFields = Object.keys(processedData.data[firstDate]);
        // Filter out pure numeric strings
        return entryFields.filter((f: string) => typeof f === "string" && !/^\d+$/.test(f));
      }
    }

    if (processedData.type === "quote") {
      return Object.keys(processedData.data).filter((f: string) => typeof f === "string" && !/^\d+$/.test(f));
    }

    if (processedData.type === "array" && processedData.data.length > 0) {
      return Object.keys(processedData.data[0]).filter((f: string) => typeof f === "string" && !/^\d+$/.test(f));
    }

    if (processedData.type === "object") {
      return Object.keys(processedData.data).filter((f: string) => typeof f === "string" && !/^\d+$/.test(f));
    }

    return [];
  }, [widget.selectedFields, processedData]);

  // Helper to get field value - handles both direct access and dot notation
  const getFieldValue = (obj: unknown, field: string): unknown => {
    if (!obj || !field) return null;
    
    // Direct property access
    if (typeof obj === "object" && obj !== null && field in (obj as Record<string, unknown>)) {
      return (obj as Record<string, unknown>)[field];
    }
    
    // Fallback to extractData for nested paths
    return extractData(obj, field);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Error</p>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // No data state
  if (!data || !processedData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  // Standardized Views
  if (['chart', 'table', 'metric'].includes(processedData.type)) {
      let renderType = processedData.type;
      let renderData = processedData.data;

      // View Conversion Logic
      if (widget.type === 'table' && renderType === 'chart') {
          // Convert Chart to Table
          const chartData = renderData as StandardizedChartData;
          const headers = ['Label', ...chartData.datasets.map(d => d.label)];
          const rows = chartData.labels.map((label, i) => {
              const row: Record<string, unknown> = { 'Label': label };
              chartData.datasets.forEach(ds => {
                  row[ds.label] = ds.data[i];
              });
              return row;
          });
          renderType = 'table';
          renderData = { headers, rows };
      } else if (widget.type === 'chart' && renderType === 'table') {
          // Convert Table to Chart (Assume 1st column is Label, others are Data)
          const tableData = renderData as StandardizedTableData;
          if (tableData.headers.length > 1) {
               const labelField = tableData.headers[0];
               const dataFields = tableData.headers.slice(1);
               const labels = tableData.rows.map(r => String(r[labelField]));
               const datasets = dataFields.map(field => ({
                   label: field,
                   data: tableData.rows.map(r => {
                       const val = r[field];
                       return typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : (typeof val === 'number' ? val : 0);
                   })
               }));
               renderType = 'chart';
               renderData = { labels, datasets };
          }
      }

      if (renderType === 'chart') {
        const chartData = renderData as StandardizedChartData;
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top" as const,
              labels: { color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)" },
            },
          },
          scales: {
             x: { ticks: { color: isDark ? "#f3f4f6" : "#111827" }, grid: { color: isDark ? "#374151" : "#e5e7eb" } },
             y: { ticks: { color: isDark ? "#f3f4f6" : "#111827" }, grid: { color: isDark ? "#374151" : "#e5e7eb" } },
          }
        };
        
        const colors = isDark ? [
          "rgba(96, 165, 250, 1)", "rgba(52, 211, 153, 1)", "rgba(248, 113, 113, 1)"
        ] : [
          "rgba(37, 99, 235, 1)", "rgba(5, 150, 105, 1)", "rgba(220, 38, 38, 1)"
        ];

        const data = {
          labels: chartData.labels,
          datasets: chartData.datasets.map((ds, idx) => ({
              label: ds.label,
              data: ds.data,
              borderColor: colors[idx % colors.length],
              backgroundColor: colors[idx % colors.length].replace('1)', '0.2)'),
              tension: 0.1
          }))
        };

        return (
          <div className="h-64">
             <Line data={data} options={options} />
          </div>
        );
      }
      
      if (renderType === 'table') {
          const tableData = renderData as StandardizedTableData;
          return (
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                      <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                              {tableData.headers.map(h => (
                                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">{h}</th>
                              ))}
                          </tr>
                      </thead>
                      <tbody>
                          {tableData.rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                  {tableData.headers.map(h => (
                                      <td key={h} className="px-3 py-2 text-gray-900 dark:text-gray-100">{
                                          typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])
                                      }</td>
                                  ))}
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          );
      }
      
      if (renderType === 'metric') {
          const metricData = renderData as StandardizedMetricData;
          return (
              <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{metricData.label}</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatValue(metricData.value, widget.format)}</div>
                  {metricData.change !== undefined && (
                       <div className={`text-sm mt-2 font-medium ${metricData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {metricData.change > 0 ? '↑' : '↓'} {Math.abs(metricData.change)}%
                       </div>
                  )}
              </div>
          );
      }
  }

  // Table view
  if (widget.type === "table") {
    let tableData: Record<string, unknown>[] = [];

    if (processedData.type === "timeSeries") {
      // For time series, create rows with date and all selected fields
      const seriesObj = processedData.data as Record<string, Record<string, unknown>>;
      const entries = Object.entries(seriesObj).map(([date, values]) => {
        const row: Record<string, unknown> = { date };
        // Add all fields from the time series entry
        if (values && typeof values === "object") {
          Object.assign(row, values);
        }
        return row;
      });
      tableData = entries;
    } else if (processedData.type === "quote") {
      // For quote data, create a single row
      tableData = [processedData.data];
    } else if (processedData.type === "array") {
      tableData = processedData.data;
    } else if (processedData.type === "object") {
      tableData = [processedData.data];
    }

    // Filter data
    const filteredData = tableData.filter((row) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchLower)
      );
    });

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
      if (!sortField) return 0;
      const aVal = getFieldValue(a, sortField);
      const bVal = getFieldValue(b, sortField);
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    // Paginate data
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    const handleSort = (field: string) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    };

    return (
      <div className="space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 text-sm"
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              {/* <tr className="bg-gray-100 dark:bg-gray-800"> */}
              <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">

                {processedData.type === "timeSeries" && (
                  <th
                    className="cursor-pointer border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      Date
                      <span className={`text-xs ${sortField === "date" ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {sortField === "date" ? (
                          <span className="font-bold">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        ) : (
                          <span className="opacity-60">⇅</span>
                        )}
                      </span>
                    </div>
                  </th>
                )}
                {fields.map((field) => (
                  <th
                    key={field}
                    className="cursor-pointer border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSort(field)}
                  >
                    <div className="flex items-center gap-1.5">
                      {field.replace(/^\d+\.\s*/, "")} {/* Remove leading numbers like "1. " */}
                      <span className={`text-xs ${sortField === field ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {sortField === field ? (
                          <span className="font-bold">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        ) : (
                          <span className="opacity-60">⇅</span>
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + (processedData.type === "timeSeries" ? 1 : 0)} className="border border-gray-300 dark:border-gray-700 px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {processedData.type === "timeSeries" && (
                      <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">
                        {row.date ? new Date(row.date as string).toLocaleDateString() : String(row.date ?? "")}
                      </td>
                    )}
                    {fields.map((field) => (
                      <td key={field} className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">
                        {formatValue(getFieldValue(row, field), widget.format)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, sortedData.length)} of{" "}
              {sortedData.length} entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-900 dark:text-gray-100">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Chart view
  if (widget.type === "chart") {
    if (processedData.type !== "timeSeries") {
      return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Chart view requires time series data
          </p>
        </div>
      );
    }

    const timeSeries = processedData.data;
    const labels = Object.keys(timeSeries).sort((a, b) => a.localeCompare(b));
    const chartType = widget.chartType || "line";

    // Candlestick chart (simplified visualization using multiple line series)
    if (chartType === "candlestick") {
      // Look for OHLC fields (Open, High, Low, Close)
      const ohlcFields = {
        open: fields.find((f: string) => f.toLowerCase().includes("open") || f.toLowerCase().includes("1. open")),
        high: fields.find((f: string) => f.toLowerCase().includes("high") || f.toLowerCase().includes("2. high")),
        low: fields.find((f: string) => f.toLowerCase().includes("low") || f.toLowerCase().includes("3. low")),
        close: fields.find((f: string) => f.toLowerCase().includes("close") || f.toLowerCase().includes("4. close")),
      };

      if (!ohlcFields.open || !ohlcFields.high || !ohlcFields.low || !ohlcFields.close) {
        return (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Candlestick chart requires Open, High, Low, and Close fields. Please select these fields.
            </p>
          </div>
        );
      }

      // Create candlestick visualization using line chart with multiple series
      const formattedLabels = labels.map((date) => {
        try {
          return new Date(date).toLocaleDateString();
        } catch {
          return date;
        }
      });

      const highColor = isDark ? "rgba(52, 211, 153, 1)" : "rgba(16, 185, 129, 1)";
      const closeColor = isDark ? "rgba(96, 165, 250, 1)" : "rgba(59, 130, 246, 1)";
      const openColor = isDark ? "rgba(251, 191, 36, 1)" : "rgba(245, 158, 11, 1)";
      const lowColor = isDark ? "rgba(248, 113, 113, 1)" : "rgba(239, 68, 68, 1)";

      const datasets = [
        {
          label: "High",
          data: labels.map((date) => {
            const val = timeSeries[date][ohlcFields.high!];
            return typeof val === "string" ? parseFloat(val) : (typeof val === "number" ? val : 0);
          }),
          borderColor: highColor,
          backgroundColor: highColor.replace("1)", "0.2)"),
          fill: false,
        },
        {
          label: "Close",
          data: labels.map((date) => {
            const val = timeSeries[date][ohlcFields.close!];
            return typeof val === "string" ? parseFloat(val) : (typeof val === "number" ? val : 0);
          }),
          borderColor: closeColor,
          backgroundColor: closeColor.replace("1)", "0.2)"),
          fill: false,
        },
        {
          label: "Open",
          data: labels.map((date) => {
            const val = timeSeries[date][ohlcFields.open!];
            return typeof val === "string" ? parseFloat(val) : (typeof val === "number" ? val : 0);
          }),
          borderColor: openColor,
          backgroundColor: openColor.replace("1)", "0.2)"),
          fill: false,
        },
        {
          label: "Low",
          data: labels.map((date) => {
            const val = timeSeries[date][ohlcFields.low!];
            return typeof val === "string" ? parseFloat(val) : (typeof val === "number" ? val : 0);
          }),
          borderColor: lowColor,
          backgroundColor: lowColor.replace("1)", "0.2)"),
          fill: false,
        },
      ];

      const chartData = {
        labels: formattedLabels,
        datasets,
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top" as const,
            labels: {
              color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)",
            },
          },
          title: {
            display: true,
            text: "OHLC Candlestick View",
            color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)",
          },
        },
        scales: {
          x: {
            ticks: {
              color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)",
            },
            grid: {
              color: isDark ? "rgba(55, 65, 81, 1)" : "rgba(229, 231, 235, 1)",
            },
          },
          y: {
            beginAtZero: false,
            ticks: {
              color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)",
            },
            grid: {
              color: isDark ? "rgba(55, 65, 81, 1)" : "rgba(229, 231, 235, 1)",
            },
          },
        },
      };

      return (
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      );
    }

    // Line or Bar chart - use brighter, more visible colors
    const colors = isDark ? [
      "rgba(96, 165, 250, 1)", // bright blue
      "rgba(52, 211, 153, 1)", // bright green
      "rgba(248, 113, 113, 1)", // bright red
      "rgba(251, 191, 36, 1)", // bright yellow
      "rgba(167, 139, 250, 1)", // bright purple
      "rgba(236, 72, 153, 1)", // bright pink
      "rgba(34, 197, 94, 1)", // bright emerald
    ] : [
      "rgba(37, 99, 235, 1)", // vibrant blue
      "rgba(5, 150, 105, 1)", // vibrant green
      "rgba(220, 38, 38, 1)", // vibrant red
      "rgba(217, 119, 6, 1)", // vibrant orange
      "rgba(124, 58, 237, 1)", // vibrant purple
      "rgba(219, 39, 119, 1)", // vibrant pink
      "rgba(14, 165, 233, 1)", // vibrant cyan
    ];

    const isBarChart = chartType === "bar";
    
    const datasets = fields.map((field, idx) => {
      const baseColor = colors[idx % colors.length];
      return {
        label: field.replace(/^\d+\.\s*/, ""), // Remove leading numbers like "1. "
        data: labels.map((date) => {
          const val = timeSeries[date][field];
          return typeof val === "string" ? parseFloat(val) || 0 : val || 0;
        }),
        borderColor: baseColor,
        backgroundColor: isBarChart 
          ? baseColor.replace("1)", isDark ? "0.8)" : "0.7)") // Higher opacity for bars
          : baseColor.replace("1)", "0.2)"), // Lower opacity for lines
        borderWidth: isBarChart ? 2 : 2, // Border width for better visibility
        fill: false,
        tension: 0.1,
      };
    });

    const chartData = {
      labels: labels.map((date) => {
        try {
          return new Date(date).toLocaleDateString();
        } catch {
          return date;
        }
      }),
      datasets,
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)",
            usePointStyle: true,
            padding: 15,
          },
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)",
          },
          grid: {
            color: isDark ? "rgba(55, 65, 81, 1)" : "rgba(229, 231, 235, 1)",
            display: !isBarChart, // Hide grid for bar charts for cleaner look
          },
        },
        y: {
          beginAtZero: isBarChart, // Start at zero for bar charts
          ticks: {
            color: isDark ? "rgba(243, 244, 246, 1)" : "rgba(17, 24, 39, 1)",
          },
          grid: {
            color: isDark ? "rgba(55, 65, 81, 1)" : "rgba(229, 231, 235, 1)",
          },
        },
      },
      ...(isBarChart && {
        // Bar chart specific options
        barThickness: 'flex',
        maxBarThickness: 50,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      }),
    };

    return (
      <div className="h-64">
        {chartType === "bar" ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    );
  }

  // Card view
  if (processedData.type === "timeSeries") {
    const timeSeries = processedData.data;
    const labels = Object.keys(timeSeries).sort((a, b) => a.localeCompare(b));
    const latestDate = labels[labels.length - 1];
    const latestData = timeSeries[latestDate];

    return (
      <div className="space-y-2 text-gray-900 dark:text-gray-100">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          Latest ({new Date(latestDate).toLocaleDateString()})
        </p>
        <div className="space-y-1">
          {fields.map((field) => (
            <div key={field} className="flex justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-300">{field.replace(/^\d+\.\s*/, "")}:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {formatValue(getFieldValue(latestData, field), widget.format)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (processedData.type === "quote") {
    return (
      <div className="space-y-2 text-gray-900 dark:text-gray-100">
        {fields.map((field) => (
          <div key={field} className="flex justify-between text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-300">{field.replace(/^\d+\.\s*/, "")}:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatValue(getFieldValue(processedData.data, field), widget.format)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (processedData.type === "array" && processedData.data.length > 0) {
    const firstItem = processedData.data[0];
    return (
      <div className="space-y-2 text-gray-900 dark:text-gray-100">
        {fields.map((field) => (
          <div key={field} className="flex justify-between text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-300">{field.replace(/^\d+\.\s*/, "")}:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatValue(getFieldValue(firstItem, field), widget.format)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (processedData.type === "object") {
    return (
      <div className="space-y-2 text-gray-900 dark:text-gray-100">
        {fields.map((field) => (
          <div key={field} className="flex justify-between text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-300">{field.replace(/^\d+\.\s*/, "")}:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatValue(getFieldValue(processedData.data, field), widget.format)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
      <p className="text-sm text-gray-500">Unable to render data</p>
    </div>
  );
}
