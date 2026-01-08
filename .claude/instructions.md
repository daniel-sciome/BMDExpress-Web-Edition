# BMDExpress Web - Project Instructions

## Current Investigation (Dec 2024)

### ExperimentDescription Object Reference Issue - ACTIVE BUG

**Status**: Root cause UNKNOWN; workaround is permanent solution; requires runtime debugging in desktop app

**Problem**: `CategoryAnalysisResults.getExperimentDescription()` returns NULL even though DoseResponseExperiment objects in `project.getDoseResponseExperiments()` have ExperimentDescriptions populated.

**Critical Finding (Dec 2024)**: Issue persists even for NEW analyses where ExperimentDescription was added BEFORE running any analysis. This **rules out workflow timing** as the root cause.

**Evidence**:
- No cloning found in the entire analysis pipeline
- Workflow timing ruled out by testing with new analyses
- Prime suspect: CurveFitPrefilter creates a temporary DoseResponseExperiment (`de`) with same name but without ExperimentDescription
- Needs runtime debugging in desktop app to find the divergence point

**Permanent Solution**: `CategoryResultsService.findExperimentDescriptionByName()` resolves ExperimentDescription by matching experiment names. This MUST remain as the permanent solution regardless of root cause.

**Documentation**: See `../BMDExpress-3/EXPERIMENT_DESCRIPTION_OBJECT_REFERENCE_ISSUE.md` for full investigation details including runtime debugging code to add.

**Key files**:
- Workaround: `src/main/java/com/sciome/service/CategoryResultsService.java` (lines 124-148)
- Test utility: `src/test/java/InspectBm2File.java`

---

## Project Context

- This is the web-based version of BMDExpress-3
- Uses Hilla/Vaadin for browser-callable services
- Reads .bm2 files created by BMDExpress-3 desktop app
- Desktop app repo is at `../BMDExpress-3`

## Key Documentation

- `DOCUMENTATION_INDEX.md` - Start here for all documentation
- `ENGINEERING_DESIGN_GUIDE.md` - Technical reference for new engineers
- `../BMDExpress-3/EXPERIMENT_DESCRIPTION_OBJECT_REFERENCE_ISSUE.md` - Current investigation

## Development Notes

- IGNORE electron builds and packaging commands - focusing on web-based development only
- Remember: progress bar with oboe when working on streaming UI
