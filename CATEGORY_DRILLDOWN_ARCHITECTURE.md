CATEGORY_DRILLDOWN_ARCHITECTURE.md
# Category Drill-Down: Auxiliary Visualizations Architecture                                                                                                                                                  ## Overview
Design and implementation plan for category-level auxiliary visualizations that provide gene-level details when users select a category from the results table.                                               ## Current State Analysis### Existing Infrastructure
- ✅ **Redux State**: `selectedCategoryIds` (Set<string>) in categoryResultsSlice
- ✅ **Selection UI**: CategoryResultsGrid supports multi-row selection
- ✅ **DTOs**: BMDMarkersDto, CurveDataDto, DosePointDto, CategoryAnalysisResultDto
- ✅ **Pathway Curves**: PathwayCurveViewer component (separate chart type)
- ✅ **Category Summary Data**: BMD mean/median/SD, Fisher's test, gene counts
### Gap Analysis
- ❌ No gene-level data endpoint for selected category
- ❌ No UI to display gene details below category table
- ❌ No gene list table with BMD values
- ❌ No BMD distribution visualizations per category
- ❌ No best model breakdown per category
- ❌ No individual gene marker details
---
## Architecture Design
### 1. State Management Strategy
#### Redux Slice Enhancement

```typescript
// categoryResultsSlice.ts additions
interface CategoryResultsState
{// ... existing state ...
selectedCategoryIds: Set<string>;
// NEW: Focused category for drill-down (single selection)
focusedCategoryId: string | null;
// NEW: Gene-level data for focused category
categoryGeneData: {
[categoryId: string]:
genes: GeneResultDto[];
loading: boolean;
error: string | null;
};
};
}
```
**Design Decision**: Use `focusedCategoryId` (single) separate from `selectedCategoryIds` (multi)
- **Rationale**:
- Multi-select is for operations like Venn diagrams
- Drill-down shows details for ONE category at a time
- Clicking a row both selects AND focuses it
- Prevents overwhelming UI with multi-category gene lists
#### Actions

```typescript
- setFocusedCategoryId(categoryId: string | null)
- loadCategoryGeneData(projectId, resultName, categoryId) // async thunk
- clearFocusedCategory()
```

### 2. UI/UX Design
#### Option A: Expandable Row (Recommended)
**Pros**:
- Native table behavior
- Keeps context near the category
- No additional screen space needed
- Ant Design built-in support
**Cons**:
- Limited vertical space
- Harder to show complex visualizations
#### Option B: Side Drawer
**Pros**:
- Full height for visualizations
- Can show multiple chart types
- Modal-like focus
- Easy to close/dismiss
**Cons**:
- Covers part of category table
- Extra navigation step
- Not as immediate
#### Option C: Bottom Panel (RECOMMENDED)
**Pros**:
- ✅ Persistent visibility of category table
- ✅ Large canvas for visualizations
- ✅ Can show multiple tabs (genes, charts, curves)
- ✅ Resizable height
- ✅ Clear visual hierarchy
**Cons**:
- Uses vertical space
- Requires scroll on smaller screens
**Selected Approach**: **Bottom Panel with Tabs**
                           
```

┌─────────────────────────────────────────┐
│  Category Results Table                 │
│  [Rows with selection checkboxes]       │
│                                         │
└─────────────────────────────────────────┘                                                                                                                                                                   

┌─────────────────────────────────────────┐
│  Category Details: "GO:0006955 ..."     │ ← Focused category
│  [Genes Tab] [Charts Tab] [Curves Tab]  │
│  ┌─────────────────────────────────────┐│
│  │ Gene List Table / Visualizations    ││
│  │                                     ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘                                                                                                                                                                   

```                           
### 3. Backend API Endpoints
#### New Endpoint: Get Category Gene Details
```java

@BrowserCallable
public CategoryGeneDataDto
getCategoryGeneData(
String projectId,
String resultName,
String categoryId
)
```

**Returns**: CategoryGeneDataDto

```java
public class CategoryGeneDataDto
{
private String categoryId;
private String categoryDescription;                                                                                                                                                                       
private List<GeneResultDto> genes;                                                                                                                                                                        
private CategoryStatisticsDto statistics; // summary stats                                                                                                                                                
}
public class GeneResultDto {
private String geneId;
private String geneName;
private String probeId;

// BMD values         
private Double bmd;
private Double bmdl;
private Double bmdu;
private Double bmdPValue;
private Double bmdAIC;

// Model info
private String bestModel;
private Integer bestModelIndex;

// Expression data
private Double foldChange;
private Boolean passedFilters;

// Curve data (for drill-down to individual gene curves)
private CurveDataDto curveData; // optional, lazy load
}                         
```
                   
#### Enhanced Endpoint: Get Gene Curve Data
```java


@BrowserCallable
public List<CurveDataDto> getGeneCurves(
String projectId,
String resultName,
String categoryId,
List<String> geneIds // allow multi-select for overlay
)                         
```
                   
### 4. Frontend Components

#### Component Hierarchy
```
CategoryResultsView
 ├── CategoryResultsGrid (existing)
 └── CategoryDrillDownPanel (NEW)
    ├── CategoryDrillDownHeader
    └── CategorySummaryStats
 ├── Tabs
 ├── GeneListTab
 │   ├── GeneResultsTable
 │   │   └── GeneActions (export, select for curves)
 │   ├── ChartsTab
 │   │   ├── BMDDistributionChart (histogram/violin)
 │   │   ├── BMDScatterPlot (BMD vs BMDL)
 │   │   ├── BestModelsChart (pie chart) 
 │   │   └── FoldChangeDistribution
 │   └── CurvesTab
 │       └── GeneCurvesViewer (reuse PathwayCurveViewer logic)
 └── CategoryDrillDownFooter                                                                                                                                                                               
```
                   
#### Component Details    
                      
 **CategoryDrillDownPanel.tsx**                                                                                                                                                                                
 ```typescript             
 interface CategoryDrillDownPanelProps {                                                                                                                                                                       
   projectId: string;      
   resultName: string;     
 }                         
                      
 export default function CategoryDrillDownPanel({                                                                                                                                                              
   projectId,              
   resultName              
 }: CategoryDrillDownPanelProps) {                                                                                                                                                                             
   const focusedCategoryId = useAppSelector(                                                                                                                                                                   
(state) => state.categoryResults.focusedCategoryId                                                                                                                                                        
   );                      
   const geneData = useAppSelector(                                                                                                                                                                            
(state) => state.categoryResults.categoryGeneData[focusedCategoryId]                                                                                                                                      
   );                      
                      
   if (!focusedCategoryId) {                                                                                                                                                                                   
return (              
  <Alert              
    type="info"       
    message="Select a category to view gene-level details"                                                                                                                                                
  />                  
);                    
   }                       
                      
   return (                
<Card title={`Category Details: ${categoryDescription}`}>                                                                                                                                                 
  <Tabs>              
    <TabPane tab="Genes" key="genes">                                                                                                                                                                     
      <GeneResultsTable genes={geneData.genes} />                                                                                                                                                         
    </TabPane>        
    <TabPane tab="Charts" key="charts">                                                                                                                                                                   
      <ChartsTab genes={geneData.genes} />                                                                                                                                                                
    </TabPane>        
    <TabPane tab="Curves" key="curves">                                                                                                                                                                   
      <CurvesTab      
        projectId={projectId}                                                                                                                                                                             
        resultName={resultName}                                                                                                                                                                           
        categoryId={focusedCategoryId}                                                                                                                                                                    
      />              
    </TabPane>        
  </Tabs>             
</Card>               
   );                      
 }                         
 ```                       
                      
 **GeneResultsTable.tsx**  
 ```typescript             
 interface GeneResultsTableProps {                                                                                                                                                                             
   genes: GeneResultDto[]; 
 }                         
                      
 // Table columns:         
 - Gene ID / Name          
 - Probe ID                
 - BMD, BMDL, BMDU         
 - p-value                 
 - Fold Change             
 - Best Model              
 - AIC                     
 - Passed Filters (checkmark)                                                                                                                                                                                  
 ```                       
                      
 **ChartsTab.tsx**         
 ```typescript             
 // Multiple visualizations in grid layout                                                                                                                                                                     
 <Row gutter={16}>         
   <Col span={12}>         
<BMDDistributionChart data={genes} /> // Histogram                                                                                                                                                        
   </Col>                  
   <Col span={12}>         
<BMDScatterPlot data={genes} /> // BMD vs BMDL                                                                                                                                                            
   </Col>                  
   <Col span={12}>         
<BestModelsChart data={genes} /> // Pie chart                                                                                                                                                             
   </Col>                  
   <Col span={12}>         
<FoldChangeDistribution data={genes} />                                                                                                                                                                   
   </Col>                  
 </Row>                    
 ```                       
                      
 ### 5. Visualization Types
                      
 #### A. BMD Distribution (Histogram/Violin)                                                                                                                                                                   
 - **Purpose**: Show distribution of BMD values across genes in category                                                                                                                                       
 - **Library**: @ant-design/charts - Histogram or Violin                                                                                                                                                       
 - **Data**: `genes.map(g => g.bmd).filter(notNull)`                                                                                                                                                           
 - **Insights**:           
   - Tight cluster = consistent dose-response                                                                                                                                                                  
   - Wide spread = heterogeneous category                                                                                                                                                                      
   - Outliers = genes with unusual responses                                                                                                                                                                   
                      
 #### B. BMD vs BMDL Scatter                                                                                                                                                                                   
 - **Purpose**: Show relationship between BMD and confidence interval                                                                                                                                          
 - **Library**: @ant-design/charts - Scatter                                                                                                                                                                   
 - **Data**: `{ x: bmd, y: bmdl, name: geneName }`                                                                                                                                                             
 - **Insights**:           
   - Points far from diagonal = high uncertainty                                                                                                                                                               
   - Clusters = similar confidence levels                                                                                                                                                                      
   - Interactive tooltips with gene names                                                                                                                                                                      
                      
 #### C. Best Models Breakdown (Pie/Bar)                                                                                                                                                                       
 - **Purpose**: Show distribution of best-fit models for genes                                                                                                                                                 
 - **Library**: @ant-design/charts - Pie                                                                                                                                                                       
 - **Data**: Count by `bestModel` (Hill, Power, Linear, etc.)                                                                                                                                                  
 - **Insights**:           
   - Model diversity in category                                                                                                                                                                               
   - Predominant response pattern                                                                                                                                                                              
   - Quality of fits       
                      
 #### D. Fold Change Distribution                                                                                                                                                                              
 - **Purpose**: Show gene expression changes                                                                                                                                                                   
 - **Library**: @ant-design/charts - Histogram                                                                                                                                                                 
 - **Data**: `genes.map(g => g.foldChange)`                                                                                                                                                                    
 - **Insights**:           
   - Magnitude of category response                                                                                                                                                                            
   - Up/down regulation balance                                                                                                                                                                                
   - Outlier genes         
                      
 #### E. Gene Dose-Response Curves                                                                                                                                                                             
 - **Purpose**: Show individual gene curves overlaid                                                                                                                                                           
 - **Library**: Plotly (reuse DoseResponseCurveChart)                                                                                                                                                          
 - **Data**: Multi-gene curve data with BMD markers                                                                                                                                                            
 - **Features**:           
   - Color-coded by gene   
   - Toggle genes on/off   
   - Zoom/pan              
   - BMD/BMDL/BMDU markers 
                      
 ### 6. Data Flow          
                      
 ```                       
 User Action: Click category row                                                                                                                                                                               
↓                     
 Dispatch: setFocusedCategoryId(categoryId)                                                                                                                                                                    
↓                     
 Redux State: focusedCategoryId updated                                                                                                                                                                        
↓                     
 Effect: Detect focusedCategoryId change                                                                                                                                                                       
↓                     
 Dispatch: loadCategoryGeneData(projectId, resultName, categoryId)                                                                                                                                             
↓                     
 API Call: CategoryResultsService.getCategoryGeneData(...)                                                                                                                                                     
↓                     
 Backend:                  
   - Fetch CategoryAnalysisResult by ID                                                                                                                                                                        
   - Extract gene list from BMDResult objects                                                                                                                                                                  
   - Map to GeneResultDto  
   - Return CategoryGeneDataDto                                                                                                                                                                                
↓                     
 Redux: Store in categoryGeneData[categoryId]                                                                                                                                                                  
↓                     
 Component: CategoryDrillDownPanel re-renders                                                                                                                                                                  
↓                     
 UI: Shows gene table and charts                                                                                                                                                                               
 ```                       
                      
 ### 7. Implementation Phases                                                                                                                                                                                  
                      
 #### Phase 1: Foundation (2-3 hours)                                                                                                                                                                          
 - [ ] Create GeneResultDto.java                                                                                                                                                                               
 - [ ] Create CategoryGeneDataDto.java                                                                                                                                                                         
 - [ ] Implement getCategoryGeneData() endpoint                                                                                                                                                                
 - [ ] Add focusedCategoryId to Redux state                                                                                                                                                                    
 - [ ] Add loadCategoryGeneData async thunk                                                                                                                                                                    
 - [ ] Test backend endpoint with sample data                                                                                                                                                                  
                      
 #### Phase 2: Basic UI (2-3 hours)                                                                                                                                                                            
 - [ ] Create CategoryDrillDownPanel component                                                                                                                                                                 
 - [ ] Add panel below CategoryResultsGrid                                                                                                                                                                     
 - [ ] Implement category focus on row click                                                                                                                                                                   
 - [ ] Create GeneResultsTable component                                                                                                                                                                       
 - [ ] Display gene list with basic columns                                                                                                                                                                    
 - [ ] Add loading/error states                                                                                                                                                                                
                      
 #### Phase 3: Charts Tab (3-4 hours)                                                                                                                                                                          
 - [ ] Create ChartsTab component                                                                                                                                                                              
 - [ ] Implement BMDDistributionChart (histogram)                                                                                                                                                              
 - [ ] Implement BMDScatterPlot                                                                                                                                                                                
 - [ ] Implement BestModelsChart (pie)                                                                                                                                                                         
 - [ ] Implement FoldChangeDistribution                                                                                                                                                                        
 - [ ] Responsive grid layout                                                                                                                                                                                  
                      
 #### Phase 4: Curves Tab (2-3 hours)                                                                                                                                                                          
 - [ ] Create CurvesTab component                                                                                                                                                                              
 - [ ] Implement gene selector (checkboxes)                                                                                                                                                                    
 - [ ] Reuse DoseResponseCurveChart for multi-gene overlay                                                                                                                                                     
 - [ ] Add color legend for genes                                                                                                                                                                              
 - [ ] Implement BMD markers per gene                                                                                                                                                                          
                      
 #### Phase 5: Polish & Export (2 hours)                                                                                                                                                                       
 - [ ] Add export functionality (gene list as CSV)                                                                                                                                                             
 - [ ] Add copy/share category URL with focused ID                                                                                                                                                             
 - [ ] Keyboard navigation (arrow keys, Enter to focus)                                                                                                                                                        
 - [ ] Responsive design for mobile                                                                                                                                                                            
 - [ ] Session notes documentation                                                                                                                                                                             
                      
 **Total Estimated Time**: 11-15 hours                                                                                                                                                                         
                      
 ### 8. Technical Considerations                                                                                                                                                                               
                      
 #### Performance          
 - **Lazy Loading**: Only fetch gene data when category focused                                                                                                                                                
 - **Caching**: Store gene data in Redux, don't refetch on tab switch                                                                                                                                          
 - **Pagination**: If gene count > 100, paginate gene table                                                                                                                                                    
 - **Debouncing**: Debounce curve data fetching if user rapidly clicks categories                                                                                                                              
                      
 #### Accessibility        
 - **Keyboard Navigation**: Tab, Enter, Escape                                                                                                                                                                 
 - **ARIA Labels**: Proper labels for screen readers                                                                                                                                                           
 - **Focus Management**: Auto-focus panel when category selected                                                                                                                                               
 - **Color Contrast**: Ensure charts meet WCAG standards                                                                                                                                                       
                      
 #### Error Handling       
 - **No Gene Data**: Show empty state with explanation                                                                                                                                                         
 - **API Failures**: Graceful error display with retry button                                                                                                                                                  
 - **Missing Fields**: Handle null BMD values in charts                                                                                                                                                        
 - **Large Datasets**: Warn if >500 genes, suggest filtering                                                                                                                                                   
                      
 ### 9. Alternative Architectures Considered                                                                                                                                                                   
                      
 #### A. Modal Popup       
 **Rejected**: Hides category table, breaks context                                                                                                                                                            
                      
 #### B. Separate Route    
 **Rejected**: Too much navigation, loses multi-category comparison                                                                                                                                            
                      
 #### C. Inline Expansion  
 **Rejected**: Too cramped for rich visualizations                                                                                                                                                             
                      
 #### D. Dual-Pane Layout  
 **Considered**: Good but complex, deferred for future                                                                                                                                                         
                      
 ### 10. Future Enhancements                                                                                                                                                                                   
                      
 #### Phase 6+: Advanced Features                                                                                                                                                                              
 - [ ] Gene-gene comparison mode (select 2 genes, show curves side-by-side)                                                                                                                                    
 - [ ] Heatmap view (genes × dose levels)                                                                                                                                                                      
 - [ ] Export gene curves as images                                                                                                                                                                            
 - [ ] Gene ontology enrichment for genes in category                                                                                                                                                          
 - [ ] Link to external databases (NCBI, UniProt)                                                                                                                                                              
 - [ ] Collaborative annotations (users can comment on genes)                                                                                                                                                  
 - [ ] Machine learning insights (anomaly detection in gene responses)                                                                                                                                         
                      
 ### 11. Mobile Considerations                                                                                                                                                                                 
                      
 **Responsive Breakpoints**:                                                                                                                                                                                   
 - Desktop (>1200px): Full layout with panel below                                                                                                                                                             
 - Tablet (768-1200px): Panel collapses to drawer                                                                                                                                                              
 - Mobile (<768px): Full-screen modal with back button                                                                                                                                                         
                      
 ### 12. Testing Strategy  
                      
 #### Unit Tests           
 - Redux actions and reducers                                                                                                                                                                                  
 - Component rendering with mock data                                                                                                                                                                          
 - Chart data transformations                                                                                                                                                                                  
                      
 #### Integration Tests    
 - Category selection → gene data fetch → UI update                                                                                                                                                            
 - Tab switching behavior  
 - Error scenarios         
                      
 #### E2E Tests            
 - User clicks category → sees gene details                                                                                                                                                                    
 - User switches between tabs                                                                                                                                                                                  
 - User exports gene list  
                      
 ---                       
                      
 ## Summary                
                      
 This architecture provides a **scalable, user-friendly drill-down experience** that:                                                                                                                          
 - ✅ Leverages existing Redux state management                                                                                                                                                                 
 - ✅ Uses familiar Ant Design components                                                                                                                                                                       
 - ✅ Provides rich, interactive visualizations                                                                                                                                                                 
 - ✅ Maintains context with category table                                                                                                                                                                     
 - ✅ Supports multiple visualization types                                                                                                                                                                     
 - ✅ Follows BMDExpress-3 desktop patterns                                                                                                                                                                     
 - ✅ Extensible for future enhancements                                                                                                                                                                        
                      
 **Key Innovation**: Bottom panel with tabs keeps category table visible while providing full-featured gene-level exploration.                                                                                 
                      
 **Next Steps**:           
 1. Review and approve architecture                                                                                                                                                                            
 2. Begin Phase 1 implementation                                                                                                                                                                               
