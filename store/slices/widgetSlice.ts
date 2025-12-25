// Widget Slice
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { MapperConfig } from "@/utils/mappers/types";

export type WidgetType = "card" | "table" | "chart";
export type ChartType = "line" | "candlestick" | "bar";

export interface Widget {
  id: string;
  title: string;
  type: WidgetType;
  apiUrl: string;
  selectedFields: string[];
  refreshInterval: number; // seconds
  position?: number; // for drag-and-drop ordering
  format?: "currency" | "percentage" | "number" | "text"; // data formatting
  description?: string;
  chartType?: ChartType; // for chart widgets
  chartInterval?: "daily" | "weekly" | "monthly"; // chart time interval
  mapperId?: string; // ID of the data mapper to use
  mapperConfig?: MapperConfig; // Configuration for the mapper
  // Layout for React Grid Layout
  w?: number;
  h?: number;
  x?: number;
  y?: number;
}

interface WidgetState {
  widgets: Widget[];
  theme: "dark" | "light";
}

// Load initial state from localStorage
const loadInitialState = (): WidgetState => {
  if (typeof window === "undefined") {
    return { widgets: [], theme: "dark" };
  }

  try {
    const saved = localStorage.getItem("dashboard-state");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        widgets: parsed.widgets || [],
        theme: parsed.theme || "dark",
      };
    }
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
  }

  return { widgets: [], theme: "dark" };
};

const initialState: WidgetState = loadInitialState();

const widgetSlice = createSlice({
  name: "widgets",
  initialState,
  reducers: {
    addWidget(state, action: PayloadAction<Widget>) {
      const newWidget = {
        ...action.payload,
        position: state.widgets.length,
        w: action.payload.w || 1, // Default to 1 column (out of 3 or 4)
        h: action.payload.h || 4,
        x: action.payload.x || 0,
        y: action.payload.y || Infinity,
      };
      state.widgets.push(newWidget);
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-state", JSON.stringify(state));
      }
    },
    updateLayout(state, action: PayloadAction<{ id: string; x: number; y: number; w: number; h: number }[]>) {
      action.payload.forEach(item => {
        const widget = state.widgets.find(w => w.id === item.id);
        if (widget) {
          widget.x = item.x;
          widget.y = item.y;
          widget.w = item.w;
          widget.h = item.h;
        }
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-state", JSON.stringify(state));
      }
    },
    removeWidget(state, action: PayloadAction<string>) {
      state.widgets = state.widgets.filter(w => w.id !== action.payload);
      // Reorder positions
      state.widgets.forEach((widget, index) => {
        widget.position = index;
      });
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-state", JSON.stringify(state));
      }
    },
    updateWidget(state, action: PayloadAction<Partial<Widget> & { id: string }>) {
      const index = state.widgets.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.widgets[index] = { ...state.widgets[index], ...action.payload };
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("dashboard-state", JSON.stringify(state));
        }
      }
    },
    reorderWidgets(state, action: PayloadAction<{ startIndex: number; endIndex: number }>) {
      const { startIndex, endIndex } = action.payload;
      const [removed] = state.widgets.splice(startIndex, 1);
      state.widgets.splice(endIndex, 0, removed);
      // Update positions
      state.widgets.forEach((widget, index) => {
        widget.position = index;
      });
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-state", JSON.stringify(state));
      }
    },
    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.theme = action.payload;
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-state", JSON.stringify(state));
      }
    },
    loadDashboard(state, action: PayloadAction<WidgetState>) {
      state.widgets = action.payload.widgets;
      state.theme = action.payload.theme;
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-state", JSON.stringify(state));
      }
    },
  },
});

export const { addWidget, removeWidget, updateWidget, updateLayout, reorderWidgets, setTheme, loadDashboard } = widgetSlice.actions;
export default widgetSlice.reducer;
