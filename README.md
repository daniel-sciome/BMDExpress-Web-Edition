# BMDExpress-Vaadin-Flow-Hilla

Web-based implementation of BMDExpress using Vaadin Flow and Hilla framework for dose-response analysis of high-dimensional data.

<img width="612" height="573" alt="image" src="https://github.com/user-attachments/assets/bbd3941f-9a4c-4cdc-86fc-57697cdfb419" />
## About

This application provides a web interface for BMDExpress, which uses dose-response models from the EPA BMDS software and ToxicR to analyze high dimensional dose-response data, particularly gene expression data. The outputs are gene and gene set level benchmark dose values.

This web application is built on top of [BMDExpress-3](https://github.com/auerbachs/BMDExpress-3), providing browser-based access to BMDExpress functionality through a modern web interface.



## Features

- **Interactive Category Analysis Results View**: Browse and analyze category analysis results with sorting, filtering, and pagination
- **Plotly-Based Visualizations**:
  - BMD vs P-Value scatter plots
  - BMD box plots for pathway comparison
  - Dose-response curve viewer with BMD/BMDL/BMDU markers
- **Pathway Curve Viewer**: Select pathways and genes to visualize dose-response curves with:
  - 190-point interpolated curves
  - Measured data points
  - BMD confidence markers (BMD, BMDL, BMDU)
  - Logarithmic dose scaling
- **Project Library**: Access pre-loaded BMDExpress analysis projects
- **Analysis Annotations**: Automatic parsing of analysis metadata (chemical, sex, organ, species, platform)
- **Collapsible UI Components**: Efficient screen space management with collapsible chart sections

## Technology Stack

- **Backend**: Java 17, Spring Boot 3.x, Hilla
- **Frontend**: React, TypeScript, Ant Design, Plotly.js
- **Build Tool**: Maven
- **Framework**: Vaadin Flow with Hilla

## Getting Started

### Prerequisites

- Java 17 or later
- Maven 3.8+
- Node.js 18+ (for frontend development)

### Running in Development Mode

To start the application in development mode:

```bash
mvn spring-boot:run
```

Or import into your IDE and run the `Application` class.

The application will be available at: TBD

### Building for Production

To build the application in production mode:

```bash
mvn -Pproduction package
```

The production build will be available in `target/` directory.

### Docker Build

To build a Docker image:

```bash
docker build -t bmdexpress-web:latest .
```

If you use commercial Vaadin components, pass the license key as a build secret:

```bash
docker build --secret id=proKey,src=$HOME/.vaadin/proKey .
```

## Project Structure

```
src/
├── main/frontend/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BMDvsPValueScatter.tsx
│   │   │   ├── BMDBoxPlot.tsx
│   │   │   └── DoseResponseCurveChart.tsx
│   │   ├── CategoryResultsGrid.tsx
│   │   ├── CategoryResultsView.tsx
│   │   └── PathwayCurveViewer.tsx
│   ├── store/
│   │   └── slices/
│   │       └── categoryResultsSlice.ts
│   ├── themes/
│   └── views/
├── main/java/com/sciome/
│   ├── dto/
│   │   ├── CategoryAnalysisResultDto.java
│   │   ├── PathwayInfoDto.java
│   │   ├── CurveDataDto.java
│   │   ├── BMDMarkersDto.java
│   │   └── DosePointDto.java
│   ├── service/
│   │   ├── CategoryResultsService.java
│   │   ├── ProjectService.java
│   │   └── AnalysisNameParser.java
│   └── Application.java
└── test/java/
```

## Key Components

### Backend Services

- **CategoryResultsService**: API endpoints for category analysis data, pathway information, and curve data extraction
- **ProjectService**: Project management and BMDExpress file loading
- **AnalysisNameParser**: Parses analysis names into structured metadata

### Frontend Components

- **CategoryResultsView**: Main view for displaying analysis results with integrated charts
- **PathwayCurveViewer**: Interactive pathway and gene selection with dose-response visualization
- **DoseResponseCurveChart**: Plotly-based chart rendering with BMD markers
- **CategoryResultsGrid**: Sortable, filterable data grid for category results

## Contributors

- Dan Svoboda (daniel.svoboda@sciome.com) - Web Application Developer

### BMDExpress-3 Project Team

See [BMDExpress-3](https://github.com/auerbachs/BMDExpress-3) for the complete list of contributors to the core BMDExpress software.

## Questions and Contact Information

For questions about the web application, contact Dan Svoboda (daniel.svoboda@sciome.com).

For questions about BMDExpress methodology and models, contact Scott Auerbach (auerbachs@niehs.nih.gov) or Jason Phillips (jason.phillips@sciome.com).

## BMDExpress License Agreements

BMDExpress Copyright © 2015-2022 by National Institute of Environmental Health Sciences. All rights reserved.

BMDExpress Copyright © 2007-2015 by The Hamner Institutes. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Related Resources

- [BMDExpress-3 Desktop Application](https://github.com/auerbachs/BMDExpress-3)
- [BMDExpress 2.0](https://github.com/auerbachs/BMDExpress-2/wiki)
- [ToxicR Package](https://github.com/ToxicR)
- [EPA BMDS Software](https://www.epa.gov/bmds)
- [Vaadin Documentation](https://vaadin.com/docs)
- [Hilla Documentation](https://hilla.dev/docs)
