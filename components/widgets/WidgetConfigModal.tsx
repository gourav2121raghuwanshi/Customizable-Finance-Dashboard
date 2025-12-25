"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { JSONTree } from "react-json-tree";
import { WidgetType, Widget } from "@/store/slices/widgetSlice";
import { extractFields, FormatType } from "@/utils/formatters";
import { RootState } from "@/store/store";
import { mappers } from "@/utils/mappers";

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Widget) => void;
  editingWidget?: Widget | null;
}

export default function WidgetConfigModal({
  isOpen,
  onClose,
  onSave,
  editingWidget,
}: WidgetConfigModalProps) {
  const theme = useSelector((state: RootState) => state.widgets.theme);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [widgetType, setWidgetType] = useState<WidgetType>("card");
  const [apiUrl, setApiUrl] = useState("");
  const [jsonData, setJsonData] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [format, setFormat] = useState<FormatType>("text");
  const [chartType, setChartType] = useState<"line" | "candlestick" | "bar">("line");
  const [chartInterval, setChartInterval] = useState<"daily" | "weekly" | "monthly">("daily");
  const [mapperId, setMapperId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldSearch, setFieldSearch] = useState("");

  // Initialize form if editing
  useEffect(() => {
    if (editingWidget) {
      setTitle(editingWidget.title);
      setDescription(editingWidget.description || "");
      setWidgetType(editingWidget.type);
      setApiUrl(editingWidget.apiUrl);
      setSelectedFields(editingWidget.selectedFields);
      setRefreshInterval(editingWidget.refreshInterval);
      setFormat(editingWidget.format || "text");
      setChartType(editingWidget.chartType || "line");
      setChartInterval(editingWidget.chartInterval || "daily");
      setMapperId(editingWidget.mapperId || "");
    } else {
      // Reset form
      setTitle("");
      setDescription("");
      setWidgetType("card");
      setApiUrl("");
      setSelectedFields([]);
      setRefreshInterval(60);
      setFormat("text");
      setChartType("line");
      setChartInterval("daily");
      setMapperId("");
      setJsonData(null);
      setError(null);
    }
  }, [editingWidget, isOpen]);

  // Fetch API data
  useEffect(() => {
    if (!apiUrl || !isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
        const json = await res.json();

        if (json.error) {
          throw new Error(json.error);
        }

        setJsonData(json);
        setError(null);

        // Auto-select common fields if none selected
        if (selectedFields.length === 0) {
          const fields = extractFields(json);
          // Auto-select first few fields
          setSelectedFields(fields.slice(0, 5));
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch API");
        setJsonData(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(fetchData, 500);
    return () => clearTimeout(timeoutId);
  }, [apiUrl, isOpen]);

  // Get available fields
  const getFieldOptions = (): string[] => {
    if (!jsonData) return [];

    const fields = extractFields(jsonData);
    
    // Ensure we have valid string fields (allow fields that start with numbers like "1. open")
    // but exclude pure numeric strings that might be array indices
    const validFields = fields.filter((field) => {
      // Must be a string
      if (typeof field !== "string") return false;
      // Must have length
      if (field.length === 0) return false;
      // Exclude pure numeric strings (like "0", "1", "2") which are likely array indices
      // But allow strings that start with numbers followed by other chars (like "1. open")
      if (/^\d+$/.test(field)) return false;
      return true;
    });
    
    if (fieldSearch) {
      const searchLower = fieldSearch.toLowerCase();
      return validFields.filter((field) => field.toLowerCase().includes(searchLower));
    }
    return validFields;
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSelectAll = () => {
    const allFields = getFieldOptions();
    setSelectedFields(allFields);
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError("Widget title is required");
      return;
    }
    if (!apiUrl.trim()) {
      setError("API URL is required");
      return;
    }
    if (selectedFields.length === 0) {
      setError("Please select at least one field to display");
      return;
    }

    const config: Widget = {
      id: editingWidget?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      type: widgetType,
      apiUrl: apiUrl.trim(),
      selectedFields,
      refreshInterval,
      format,
      chartType: widgetType === "chart" ? chartType : undefined,
      chartInterval: widgetType === "chart" ? chartInterval : undefined,
      mapperId: mapperId || undefined,
    };

    onSave(config);
  };

  if (!isOpen) return null;

  const fieldOptions = getFieldOptions();

  const isDark = theme === "dark";
  const modalBg = isDark ? "bg-gray-800" : "bg-white";
  const modalText = isDark ? "text-gray-100" : "text-gray-900";
  const modalBorder = isDark ? "border-gray-700" : "border-gray-200";
  const inputBg = isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900";
  const inputPlaceholder = isDark ? "placeholder-gray-400" : "placeholder-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg ${modalBg} ${modalText} shadow-xl`}>
        <div className={`sticky top-0 ${modalBg} border-b ${modalBorder} p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {editingWidget ? "Edit Widget" : "Configure Widget"}
            </h2>
            <button
              onClick={onClose}
              className={`${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"} text-2xl`}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium text-sm">Widget Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Stock Prices, Market Data"
                className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-sm">Widget Type *</label>
              <select
                value={widgetType}
                onChange={(e) => setWidgetType(e.target.value as WidgetType)}
                className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
              >
                <option value="card">Card</option>
                <option value="table">Table</option>
                <option value="chart">Chart</option>
              </select>
              {widgetType === "chart" && (
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="block mb-1 font-medium text-xs">Chart Type</label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as "line" | "candlestick" | "bar")}
                      className={`w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
                    >
                      <option value="line">Line</option>
                      <option value="candlestick">Candlestick</option>
                      <option value="bar">Bar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-xs">Time Interval</label>
                    <select
                      value={chartInterval}
                      onChange={(e) => setChartInterval(e.target.value as "daily" | "weekly" | "monthly")}
                      className={`w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium text-sm">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this widget"
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* API Configuration */}
          <div className={`border-t ${modalBorder} pt-6`}>
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-sm">Data Mapper</label>
                <select
                    value={mapperId}
                    onChange={(e) => setMapperId(e.target.value)}
                    className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
                >
                    <option value="">Auto-detect (None)</option>
                    {Object.values(mappers).map(mapper => (
                        <option key={mapper.id} value={mapper.id}>{mapper.name}</option>
                    ))}
                </select>
                <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Select a specific mapper for your API data structure.
                </p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">API URL *</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
                />
                <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Enter the full API endpoint URL. Make sure it includes your API key if required.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-sm">Refresh Interval (seconds)</label>
                  <input
                    type="number"
                    min={5}
                    max={3600}
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm">Data Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as FormatType)}
                    className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* API Response Preview */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500">Fetching API data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className={`rounded-lg border ${isDark ? "border-red-800 bg-red-900/30" : "border-red-200 bg-red-50"} p-4`}>
              <p className={`text-sm font-semibold ${isDark ? "text-red-300" : "text-red-800"}`}>Error</p>
              <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
            </div>
          )}

          {jsonData && !loading && (
            <div className={`border-t ${modalBorder} pt-6`}>
              <h3 className="text-lg font-semibold mb-4">API Response Preview</h3>
              <div className={`max-h-60 overflow-y-auto border ${modalBorder} rounded p-4 mb-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                <JSONTree data={jsonData} theme={isDark ? "monokai" : "bright"} />
              </div>

              {/* Field Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Select Fields to Display *</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className={`text-sm ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                    >
                      Select All
                    </button>
                    <span className={isDark ? "text-gray-600" : "text-gray-300"}>|</span>
                    <button
                      onClick={handleDeselectAll}
                      className={`text-sm ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search fields..."
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputPlaceholder}`}
                  />
                </div>

                <div className={`max-h-64 overflow-y-auto border ${modalBorder} rounded p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                  {fieldOptions.length === 0 ? (
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No fields available</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {fieldOptions.map((field) => (
                        <label
                          key={field}
                          className={`flex items-center gap-2 p-2 ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"} rounded cursor-pointer`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field)}
                            onChange={() => handleFieldToggle(field)}
                            className={`rounded ${isDark ? "border-gray-600" : "border-gray-300"} text-blue-600 focus:ring-blue-500`}
                          />
                          <span className="text-sm">{field}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedFields.length > 0 && (
                  <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {selectedFields.length} field(s) selected
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`sticky bottom-0 ${modalBg} border-t ${modalBorder} p-6 flex justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`rounded-lg border ${isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"} px-6 py-2`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            {editingWidget ? "Update Widget" : "Create Widget"}
          </button>
        </div>
      </div>
    </div>
  );
}
