# FinBoard - Customizable Finance Dashboard

A powerful, customizable finance dashboard built with Next.js that allows users to build their own real-time finance monitoring dashboard by connecting to various financial APIs and displaying data through customizable widgets.

## Features

### 🎯 Core Features

1. **Widget Management System**
   - ✅ Add Widgets: Create new finance data widgets by connecting to any financial API
   - ✅ Remove Widgets: Easy deletion of unwanted widgets
   - ✅ Drag-and-Drop: Rearrange widget positions on the dashboard
   - ✅ Widget Configuration: Each widget includes a comprehensive configuration panel

2. **Widget Types**
   - **Table**: Paginated list/grid with search, filter, and sort functionality
   - **Finance Cards**: Display key metrics (Watchlist, Market Gainers, Performance Data, Financial Data)
   - **Charts**: 
     - Line charts with different time intervals (Daily, Weekly, Monthly)
     - Candlestick charts for OHLC data
     - Bar charts

3. **API Integration & Data Handling**
   - ✅ Dynamic Data Mapping: Explore API responses and select specific fields to display
   - ✅ Real-time Updates: Automatic data refresh with configurable intervals
   - ✅ Data Caching: Intelligent caching system to optimize API calls
   - ✅ Rate Limiting: Built-in rate limiting to prevent API quota exhaustion
   - ✅ Error Handling: Comprehensive error handling with user-friendly messages

4. **User Interface & Experience**
   - ✅ Customizable Widgets: Each widget displays as a finance card with editable titles and selected metrics
   - ✅ Responsive Design: Fully responsive layout supporting multiple screen sizes
   - ✅ Loading & Error States: Comprehensive handling of loading, error, and empty data states
   - ✅ Dark/Light Theme: Seamless theme switching

5. **Data Persistence**
   - ✅ Browser Storage: All widget configurations and dashboard layouts persist across sessions
   - ✅ State Recovery: Complete dashboard restoration upon page refresh
   - ✅ Export/Import: Export/import functionality for dashboard configurations

6. **Advanced Widget Features**
   - ✅ Field Selection Interface: Interactive JSON explorer for choosing display fields
   - ✅ Custom Formatting: Support for different data formats (currency, percentage, number, text)
   - ✅ Widget Naming: User-defined widget titles and descriptions
   - ✅ API Endpoint Management: Easy switching between different API endpoints per widget

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage Guide

### Creating a Widget

1. Click the **"+ Add Widget"** button
2. Enter a widget title and description (optional)
3. Select the widget type (Card, Table, or Chart)
4. Enter the API URL (make sure it includes your API key if required)
5. Wait for the API response to load
6. Select the fields you want to display from the JSON preview
7. Configure refresh interval and data format
8. Click **"Create Widget"**

### Editing a Widget

1. Click the **edit icon** (pencil) on any widget
2. Modify the configuration as needed
3. Click **"Update Widget"**

### Rearranging Widgets

1. Hover over a widget to see the drag handle
2. Click and drag the widget to your desired position
3. Release to drop the widget in the new position

### Exporting/Importing Dashboard

- **Export**: Click the "Export" button to download your dashboard configuration as a JSON file
- **Import**: Click the "Import" button and select a previously exported JSON file to restore your dashboard

### Theme Switching

Click the theme toggle button (sun/moon icon) in the header to switch between light and dark modes.

## API Integration

### Supported APIs

The dashboard works with any REST API that returns JSON data. Popular financial APIs include:

- **Alpha Vantage**: https://www.alphavantage.co/documentation/
- **Finnhub**: https://finnhub.io/docs/api
- **IndianAPI**: https://indianapi.in/

### API URL Format

When configuring a widget, enter the full API endpoint URL including your API key:

```
https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=YOUR_API_KEY
```

### Rate Limiting

The dashboard includes built-in rate limiting to prevent exceeding API quotas. If you encounter rate limit errors:

1. Check your API provider's rate limits
2. Increase the refresh interval for widgets
3. The dashboard caches responses to reduce API calls

## Project Structure

```
finance-dashboard/
├── app/
│   ├── api/
│   │   └── proxy/          # API proxy route (handles CORS and rate limiting)
│   ├── page.tsx            # Main dashboard page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── dashboard/
│   │   └── DashboardGrid.tsx  # Drag-and-drop grid component
│   └── widgets/
│       ├── WidgetConfigModal.tsx  # Widget configuration modal
│       └── WidgetRenderer.tsx      # Widget rendering component
├── store/
│   ├── widgetSlice.ts      # Redux slice for widget state
│   └── store.ts             # Redux store configuration
├── utils/
│   ├── cache.ts            # Data caching utility
│   ├── formatters.ts       # Data formatting utilities
│   └── useApiData.ts       # Custom hook for API data fetching
└── types/
    └── widget.ts            # TypeScript type definitions
```

## Technologies Used

- **Frontend Framework**: Next.js 16
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Data Visualization**: Chart.js, react-chartjs-2, chartjs-chart-financial
- **Drag and Drop**: @dnd-kit
- **TypeScript**: For type safety

## Features in Detail

### Data Caching

The dashboard implements intelligent caching to reduce API calls:
- Responses are cached for 1 minute by default
- Cache is automatically cleared when refresh interval triggers
- Manual cache clearing available via refetch

### Field Selection

The widget configuration modal provides:
- Interactive JSON tree viewer
- Search functionality to find fields quickly
- Select all / Deselect all options
- Visual feedback for selected fields

### Table Features

Table widgets include:
- Pagination (10 items per page)
- Search across all columns
- Sortable columns (click headers)
- Responsive design

### Chart Features

Chart widgets support:
- Line charts for time series data
- Candlestick charts for OHLC data
- Bar charts
- Multiple data series
- Customizable time intervals

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

This is an assignment project. For questions or feedback, please refer to the assignment guidelines.

## License

This project is created for educational/assignment purposes.
