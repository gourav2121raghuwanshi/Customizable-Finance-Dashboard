"use client";

import React, { useMemo } from "react";
import { Responsive as ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import { Widget } from "@/store/slices/widgetSlice";
import WidgetRenderer from "../widgets/WidgetRenderer";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface DashboardGridProps {
  widgets: Widget[];
  onLayoutChange: (layout: any[]) => void;
  onRemove: (id: string) => void;
  onEdit: (widget: Widget) => void;
  theme: "light" | "dark";
}

export default function DashboardGrid({
  widgets,
  onLayoutChange,
  onRemove,
  onEdit,
  theme,
}: DashboardGridProps) {
  // Use the useContainerWidth hook to get the width of the container
  // @ts-ignore - Types for useContainerWidth might be missing or incorrect in the current setup
  const { width, containerRef } = useContainerWidth ? useContainerWidth() : { width: 1200, containerRef: null };
  
  const layout = useMemo(() => {
    return widgets.map((widget, index) => ({
      i: widget.id,
      x: widget.x !== undefined ? widget.x : (index * 4) % 12,
      y: widget.y !== undefined ? widget.y : Math.floor(index / 3) * 4,
      w: widget.w || 4,
      h: widget.h || 4,
    }));
  }, [widgets]);

  const handleLayoutChange = (currentLayout: any) => {
    // Only trigger if layout actually changed
    // Map RGL layout back to our widget structure
    const newLayout = currentLayout.map((l: any) => ({
      id: l.i,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
    }));
    
    onLayoutChange(newLayout);
  };

  if (widgets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No widgets yet. Click "Add Widget" to get started!
        </p>
      </div>
    );
  }

  const bgClass = theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textClass = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const titleClass = theme === "dark" ? "text-gray-200" : "text-gray-800";

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <ResponsiveGridLayout
        className="layout"
        width={width}
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        {...({ draggableHandle: ".drag-handle" } as any)}
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
          className={`rounded-lg border shadow-sm ${bgClass} ${textClass} relative group flex flex-col`}
        >
          {/* Header with Drag Handle */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between drag-handle cursor-move">
            <h3 className={`font-semibold text-sm ${titleClass} truncate flex-1`}>{widget.title}</h3>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent drag
                  onEdit(widget);
                }}
                className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                title="Edit widget"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(widget.id);
                }}
                className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                title="Remove widget"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-2 min-h-0">
             <WidgetRenderer widget={widget} />
          </div>
        </div>
      ))}
      </ResponsiveGridLayout>
    </div>
  );
}
