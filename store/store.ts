import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "./slices/dashboardSlice";
import widgetReducer from "./slices/widgetSlice";
export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    widgets: widgetReducer,
  },
});

// Types for later 
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;