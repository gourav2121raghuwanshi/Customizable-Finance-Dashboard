export type WidgetType = "chart" | "table" | "text";

export interface Widget {
  id: string;
  title: string;
  type: WidgetType;
}
