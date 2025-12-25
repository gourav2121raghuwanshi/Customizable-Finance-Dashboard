import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  widgets: [],
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    // we will add actions later
  },
});

export default dashboardSlice.reducer;
