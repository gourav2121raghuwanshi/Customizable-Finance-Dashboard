"use client";

import { Provider, useSelector } from "react-redux";
import { store, RootState } from "./store";
import { useEffect } from "react";

function ThemeHandler() {
  const theme = useSelector((state: RootState) => state.widgets.theme);
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);
  
  return null;
}

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeHandler />
      {children}
    </Provider>
  );
}
