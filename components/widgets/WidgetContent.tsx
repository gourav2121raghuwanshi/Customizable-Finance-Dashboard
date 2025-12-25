// components/widgets/WidgetContent.tsx
"use client";

import { useEffect, useState } from "react";
import { Widget } from "@/store/slices/widgetSlice";

interface WidgetContentProps {
  widget: Widget;
}

export default function WidgetContent({ widget }: WidgetContentProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!widget.apiUrl) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(widget.apiUrl!)}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [widget.apiUrl]);

  if (!data) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <ul className="mt-2 space-y-1 text-sm">
      {widget.selectedFields?.map((field) => (
        <li key={field}>
          <strong>{field}:</strong> {JSON.stringify(data[field])}
        </li>
      ))}
    </ul>
  );
}
