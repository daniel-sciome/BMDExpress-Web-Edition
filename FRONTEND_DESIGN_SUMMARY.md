# Frontend Design and Operation Summary

This document provides a detailed summary of the design, architecture, and operation of the `bmdexpress-web` frontend codebase located in `src/main/frontend`.

## 1. Core Technologies

The frontend is a modern web application built on a robust stack:

- **Framework:** [React](https://reactjs.org/) (v18) for building the user interface.
- **Build Tool:** [Vite](https://vitejs.dev/) is used for its fast development server and optimized builds.
- **Language:** [TypeScript](https://www.typescriptlang.org/) for type safety and improved developer experience.
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/) serves as the central state management library, providing a predictable and structured data flow.
- **UI Component Libraries:** The application employs a hybrid approach:
    - [Ant Design](https://ant.design/): Heavily used for the main UI components, including grids, layouts, drawers, tabs, and collapsible panels.
    - [Vaadin React Components](https://vaadin.com/docs/latest/react): Used for some foundational elements like layouts and icons.
- **Charting & Visualization:**
    - [Plotly.js](https://plotly.com/javascript/): The primary library for creating a wide variety of interactive charts.
    - [D3.js](https://d3js.org/): Included as a dependency, likely for custom or complex data visualization tasks.
- **Backend Integration:** [Vaadin Hilla](https://vaadin.com/hilla) is a key architectural component that bridges the gap between the Java backend and the React frontend.

## 2. Architecture

### Application Entry Point
The application is a Single Page Application (SPA) initialized from `index.html`. It uses Vaadin Hilla's file-based routing, which directs the application to start rendering from `src/main/frontend/views/@index.tsx`. This main view component, `HomeView`, currently defaults to rendering the `LibraryView`, which provides the primary navigation structure for the application.

### Client-Server Communication (Vaadin Hilla)
A defining architectural feature is the use of Vaadin Hilla for backend communication. This framework automatically generates TypeScript endpoints in the `src/main/frontend/generated/` directory based on the Java backend code.

This allows the frontend to make type-safe, asynchronous calls to backend services as if they were local TypeScript methods. Examples observed in the code include:
- `ConfigService.getOpeningView()`
- `CategoryResultsService.getAllCategoryResultAnnotations()`

This tight integration simplifies data fetching and ensures that the client and server are always in sync.

## 3. State Management (Redux)

The application relies on a well-structured Redux store to manage its complex state. The state is divided into logical `slices`, each responsible for a specific domain of the application's data.

Key state slices include:
- **`categoryResultsSlice`**: Manages the core analysis data, including loading and error states, the main data array, and experiment metadata.
- **`navigationSlice`**: Handles application-wide navigation state, such as the currently selected project and category result.
- **`filterSlice`**: Manages the state of various filters that can be applied to the data.
- **`uiStateSlice`**: Stores UI-specific state that needs to persist across views, such as the visibility and collapse/expand state of charts. This is a direct implementation of the plan detailed in `BMDEXPRESS_WEB_PLAN_SYNTHESIS.md`.
- **`visibilitySlice`**: Manages the visibility of different UI elements, likely working in tandem with `uiStateSlice`.
- **`prefilterSlice`**: Manages state related to the pre-filtering steps of the analysis.
- **`umapIntegration`**: Contains state related to UMAP (Uniform Manifold Approximation and Projection) visualizations.

This modular state management approach allows for a clear separation of concerns and a predictable data flow throughout the application.

## 4. Component Structure and UI

The frontend follows a highly modular, component-based design.

### High-Level Views
The application is organized into high-level views, with `LibraryView` acting as the main navigation hub and `CategoryResultsView` serving as the primary workspace for data analysis and visualization.

### The `CategoryResultsView` Component
This is the most complex and feature-rich component in the application. Its responsibilities include:
- Orchestrating data fetching from the backend based on the selected project.
- Displaying experiment metadata in a prominent header.
- Rendering the main `CategoryResultsGrid` for tabular data display.
- Managing a dynamic and extensive set of interactive charts.
- Providing a tabbed interface to switch between a single dataset view and a multi-dataset comparison view.
- Housing a flyout side panel that allows users to select datasets, view analysis parameters, and toggle the visibility of charts.

### Visualization Components
A major focus of the application is data visualization. The `CategoryResultsView` imports and renders a large number of specialized chart components, including:
- Scatter Plots (`BMDvsPValueScatter`, `UmapScatterPlot`)
- Box Plots (`BMDBoxPlot`)
- Heatmaps (`ClusterHeatmap`)
- Bar and Pie Charts (`BarCharts`, `BestModelsPieChart`)
- Domain-Specific Charts (`PathwayCurveViewer`, `AccumulationCharts`)

This rich library of visualizations provides users with multiple ways to explore and interpret their data.

## 5. Overall Operation

The typical user flow can be inferred from the codebase:

1.  The user starts in the `LibraryView`, which presents a list of available projects and analysis results, likely in a sidebar.
2.  Upon selecting a result, the application navigates to the `CategoryResultsView`, passing the `projectId` and `resultName`.
3.  The `CategoryResultsView` component mounts, triggers Redux actions to fetch all necessary data from the backend via Hilla endpoints.
4.  While data is loading, a spinner is displayed. Once loaded, the component renders the full analysis view: metadata, the main data grid, and a series of collapsible panels containing the various charts.
5.  The user can then interact with the data by sorting/filtering the grid, exploring the charts, and using the side panel to switch between datasets or toggle chart visibility. The state of these UI elements is managed by Redux, ensuring a consistent user experience.