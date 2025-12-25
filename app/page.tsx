"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  addWidget,
  removeWidget,
  updateWidget,
  updateLayout,
  setTheme,
  loadDashboard,
  Widget,
} from "@/store/slices/widgetSlice";
import { RootState } from "@/store/store";
import { useState, useEffect } from "react";
import WidgetConfigModal from "@/components/widgets/WidgetConfigModal";
import DashboardGrid from "@/components/dashboard/DashboardGrid";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  const dispatch = useDispatch();
  const { widgets, theme } = useSelector((state: RootState) => state.widgets);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Handle add widget
  const handleAddWidget = () => {
    setEditingWidget(null);
    setConfigModalOpen(true);
  };

  // Handle edit widget
  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    setConfigModalOpen(true);
  };

  // Handle save widget (create or update)
  const handleSaveWidget = (config: Widget) => {
    if (editingWidget) {
      dispatch(updateWidget(config));
    } else {
      dispatch(addWidget(config));
    }
    setConfigModalOpen(false);
    setEditingWidget(null);
  };

  // Handle remove widget
  const handleRemoveWidget = (id: string) => {
    if (confirm("Are you sure you want to remove this widget?")) {
      dispatch(removeWidget(id));
    }
  };

  // Handle layout change
  const handleLayoutChange = (layout: any[]) => {
    dispatch(updateLayout(layout));
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    dispatch(setTheme(theme === "light" ? "dark" : "light"));
  };

  // Handle export dashboard
  const handleExportDashboard = () => {
    const exportData = {
      widgets,
      theme,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import dashboard
  const handleImportDashboard = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.widgets && Array.isArray(data.widgets)) {
            if (
              confirm("This will replace your current dashboard. Continue?")
            ) {
              dispatch(
                loadDashboard({
                  widgets: data.widgets,
                  theme: data.theme || "dark",
                })
              );
            }
          } else {
            alert("Invalid dashboard file format");
          }
        } catch (error) {
          alert("Failed to parse dashboard file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const bgClass = theme === "dark" ? "bg-gray-900" : "bg-gray-50";
  const textClass = theme === "dark" ? "text-gray-100" : "text-gray-900";
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">FinBoard</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Customizable Finance Dashboard
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Theme Toggle */}
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                title={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
              >
                {theme === "light" ? (
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
              </button>

              {/* Export/Import */}
              <div className="flex gap-2">
                <button
                  onClick={handleExportDashboard}
                  className="px-3 md:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs md:text-sm"
                  title="Export dashboard configuration"
                >
                  Export
                </button>
                <button
                  onClick={handleImportDashboard}
                  className="px-3 md:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs md:text-sm"
                  title="Import dashboard configuration"
                >
                  Import
                </button>
              </div>

              {/* Add Widget Button */}
              <button
                onClick={handleAddWidget}
                className="px-4 md:px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg text-sm md:text-base w-full md:w-auto"
              >
                + Add Widget
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{widgets.length} widget(s)</span>
            <span>•</span>
            <span>Drag widgets to rearrange</span>
            <span>•</span>
            <span>Click edit icon to modify</span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <DashboardGrid
          widgets={widgets}
          onLayoutChange={handleLayoutChange}
          onRemove={handleRemoveWidget}
          onEdit={handleEditWidget}
          theme={theme}
        />

        {/* Config Modal */}
        {configModalOpen && (
          <WidgetConfigModal
            isOpen={configModalOpen}
            onClose={() => {
              setConfigModalOpen(false);
              setEditingWidget(null);
            }}
            onSave={handleSaveWidget}
            editingWidget={editingWidget}
          />
        )}
      </main>
    </div>
  );
}
