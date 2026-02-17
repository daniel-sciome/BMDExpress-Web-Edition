# Report Builder User Guide

The Report Builder is a browser-based authoring environment for creating regulatory toxicology reports from BMDExpress analysis results. Reports are stored locally in your browser (IndexedDB) and can be exported to PDF or Word.

---

## Getting Started

### Creating a Report

1. Click **+ New** in the top-left of the report list panel.
2. Enter a **title** for your report.
3. Select the **project** containing your BMDExpress analysis results.
4. Choose a **template**:

   | Template | Use Case |
   |---|---|
   | **EPA BMD Guidance** | EPA Benchmark Dose Technical Guidance submissions |
   | **ICH General Tox** | ICH S4/M3 general toxicology studies |
   | **OECD TG** | OECD Test Guideline reporting |
   | **Blank** | Empty report with no pre-populated sections |

5. Click **Create**. The report opens with pre-populated section headings based on your template.

### Opening an Existing Report

Click any report in the left sidebar. The most recently updated report appears first. Each entry shows:

- The report title and template name
- A progress bar indicating the percentage of sections marked **Final**

### Deleting a Report

Click the trash icon on any report in the sidebar and confirm the deletion. This permanently removes the report from your browser's storage.

---

## The Workspace

The Report Builder has a two-panel layout:

```
LEFT SIDEBAR                 RIGHT PANE
┌─────────────────────┐     ┌─────────────────────────────┐
│  Report List         │     │  Section Editor              │
│  ──────────────────  │     │  (title, purpose, content,   │
│  Section Tree        │     │   data, charts, clinical)    │
│  (when report open)  │     │                              │
└─────────────────────┘     └─────────────────────────────┘
```

**Left sidebar** (280px): Report list at the top, section navigation tree below (visible when a report is open).

**Right pane**: The section editor, where you write and manage content for the selected section.

---

## Section Navigation

When a report is open, the **Section Tree** appears in the left sidebar. It displays all sections as a hierarchical outline.

### Selecting a Section

Click any section name. The editor on the right updates to show that section's content.

### Reordering Sections

Drag and drop sections to rearrange them:

- **Drop between sections** to reorder within the same level.
- **Drop onto a section** to make the dragged section a child (nested subsection).

Changes are saved automatically after reordering.

### Visual Indicators

Each section in the tree has a colored dot showing its status:

- Orange = Draft
- Blue = Reviewed
- Green = Final
- Gray = No content yet

Sections with content appear in dark text; empty sections appear in gray.

---

## Editing a Section

### Section Title

The section title appears at the top of the editor. **Double-click** to rename it, then press **Enter** or click away to save.

### Section Purpose

Below the title is a collapsible **Section Purpose** field. This is a short description of what the section should cover (e.g., "Describe the dose-response modeling methodology and model selection criteria").

The purpose serves two functions:

1. It appears as placeholder text in the editor ("Write about: ...").
2. It's sent to the AI assistant as context when generating content.

### Writing Content

The rich text editor supports standard formatting: bold, italic, headings, lists, tables, and more. Content auto-saves 1.5 seconds after you stop typing — look for the "Saving..." indicator in the toolbar.

### Section Status

Use the status dropdown in the toolbar to track progress:

- **Draft** — initial writing stage
- **Reviewed** — content has been reviewed
- **Final** — section is complete

Status changes appear in the section tree and contribute to the report's overall progress percentage.

---

## Attaching Data

### BMDExpress Analysis Data

Click **Attach Data** in the action bar to open the data attachment drawer.

1. Select a **project** (defaults to the report's project).
2. Select a **category analysis result** from the dropdown.
3. Click **Attach to Section**.

Attached data appears as a green summary block below the editor. This data is included in the AI prompt when you use the Assist feature, allowing the AI to reference your actual analysis results.

To remove an attachment, click the delete button on its summary card.

### Chart Snapshots

Click **Capture Chart** to open the chart snapshot drawer.

1. Navigate to any Plotly chart in BMDExpress (in another tab or panel).
2. Optionally enter a title for the snapshot.
3. Click **Capture Visible Chart**.

The chart is saved as a high-resolution PNG image (1200x800 at 2x scale). Captured charts appear as thumbnails in the section editor and as full-sized figures with captions in the document preview and export.

### Clinical Data

The **Clinical Data** panel at the bottom of the editor supports three input methods:

**Upload CSV/Excel**: Upload a `.csv`, `.xlsx`, or `.xls` file containing clinical endpoint measurements.

**Manual Entry**: Add individual clinical measurements using the built-in table. Each row includes:
- Category (Hematology, Clinical Chemistry, Organ Weights, or Histopathology)
- Endpoint name
- Dose
- Value
- Unit

**Narrative Summary**: Enter a free-text description of clinical findings. Useful for summarizing histopathology observations or other qualitative data.

Clinical data is included in the AI prompt as contextual information, enabling the AI to cross-reference genomic findings with traditional endpoints.

---

## AI Writing Assistant

The AI Assist feature generates draft content for any section using your BMDExpress data, attached analyses, clinical data, and configurable analysis skills.

### Setup

1. Click **Assist** in the section toolbar to open the AI assistant dialog.
2. Click the **gear icon** to open settings and configure:

   | Setting | Description |
   |---|---|
   | **Provider** | Claude (Anthropic), OpenAI, or Gemini (Google) |
   | **API Key** | Your API key for the selected provider (stored in your browser only — never sent to the BMDExpress server) |
   | **Model** | Optional override (defaults: Claude Sonnet 4.5, GPT-4o, Gemini 2.0 Flash) |
   | **Temperature** | Controls randomness (0.0 = deterministic, 1.0 = creative; default 0.3) |

   API keys are stored per-provider, so you can switch between providers without re-entering keys.

### Generating Content

1. Select a provider from the dropdown.
2. Optionally type an **instruction** (e.g., "Focus on dose-response concordance between genomic and apical endpoints"). If left blank, the AI uses a default instruction based on the section's purpose.
3. Click **Generate**.

The system runs a multi-step pipeline:

1. **Backend data extraction skills** query your BMDExpress project for experiment details, prefilter results, BMD analysis summaries, and pathway analyses.
2. **Frontend interpretation skills** add analysis instructions to the AI prompt (e.g., how to classify dose-response curves or estimate a point-of-departure).
3. The assembled prompt — including section purpose, study context, extracted data, clinical data, adjacent section summaries, and your instruction — is sent to the LLM.

After generation completes:

- **Preview** the generated HTML content in the dialog.
- Purple tags show which backend skills contributed data.
- Click **Apply to Section** to insert the content into the editor.
- Click **Discard** to throw it away.

### Refinement Mode

If a section already has content when you run Assist, the existing content is included in the prompt. The AI can then revise, expand, or refine what's already written rather than starting from scratch.

---

## AI Skills

Skills are modular analysis capabilities that enrich AI-generated content. Open the skills drawer by clicking the **Skills** button (with badge count) in the AI assistant dialog.

### Skill Categories

#### Data Extraction (Server-Side)

These skills run on the BMDExpress server and extract structured data from your project. They are tagged **Server** in the drawer.

| Skill | What It Extracts |
|---|---|
| **Experiment Summary** | Species, strain, sex, organ, test article, dose levels, probe counts |
| **Prefilter Summary** | ANOVA, Williams Trend, Oriogen, Curve Fit results with parameters |
| **BMD Analysis Summary** | Probes modeled, model type distribution, BMD value statistics |
| **Category Analysis Summary** | Top 20 pathways by Fisher's p-value with gene counts, BMD/BMDL medians, direction |

All four are enabled by default and provide the foundational data for AI generation.

#### Chart Interpretation (Prompt-Based)

These skills add analysis instructions to the AI prompt, guiding how the LLM interprets your data. They are organized by tier:

**Tier 1 — Core** (enabled by default):

| Skill | Analysis Focus |
|---|---|
| **Dose-Response Shape Classifier** | Classifies curve shapes (monotonic, U-shaped, threshold) and explains toxicological significance |
| **BMD Sensitivity Profiler** | Characterizes organ sensitivity from BMD distributions |
| **Pathway Toxicity Ranker** | Identifies high-concern pathways by combined significance, sensitivity, and gene count |
| **Point-of-Departure Estimator** | Estimates a transcriptomic point-of-departure (tPoD) |
| **Direction of Effect Interpreter** | Analyzes up/down regulation patterns to infer toxicity mechanisms |

**Tier 2 — Quality** (disabled by default):

| Skill | Analysis Focus |
|---|---|
| **Confidence Interval Assessor** | Evaluates BMD estimate precision from BMDL-BMDU spread |
| **Model Fit Quality Evaluator** | Assesses model distribution and fit quality |
| **Within-Pathway Homogeneity Assessor** | Evaluates gene-level coordination within pathways |

**Tier 3 — Integrative** (disabled by default):

| Skill | Analysis Focus |
|---|---|
| **Cross-Analysis Comparator** | Compares findings across sex, organ, or platform |
| **Gene Cluster Functional Annotator** | Interprets UMAP and gene clusters |
| **Clinical-Genomic Concordance** | Cross-references genomic findings with clinical data |
| **Adverse Outcome Pathway Mapper** | Maps pathways to known adverse outcome pathways (MIE → KE → AO) |

### Managing Skills

**Enable/disable**: Toggle the switch next to any skill. Changes take effect immediately for the next generation.

**Search**: Use the search bar to filter skills by name, description, or chart type.

**Bulk actions**:
- **Defaults** — resets all toggles to their default on/off state
- **All On** — enables every skill

### Editing Skills

Click the **pencil icon** on any skill to edit it.

**For chart interpretation skills** (non-backend), you can modify:

| Field | Description |
|---|---|
| **Name** | Display name shown in the drawer |
| **Description** | What the skill does |
| **Tier** | Core (1), Quality (2), or Integrative (3) |
| **Chart Types** | Which chart types the skill applies to |
| **Prompt Template** | The actual instructions sent to the AI when this skill is active |
| **Enabled by Default** | Whether the skill starts enabled for new sessions |

Modified built-in skills show an orange **Modified** tag. Click **Reset to Default** in the edit dialog to restore the original values.

**For data extraction skills** (backend), the edit dialog opens in read-only mode with an informational message. These skills run on the server and cannot be modified from the UI.

### Creating Custom Skills

Click **+ New Custom Skill** at the bottom of the skills drawer.

1. Enter a **name** and **description**.
2. Choose a **category** and **tier**.
3. Add relevant **chart types** (type a name and press Enter).
4. Write a **prompt template** — the instructions the AI will follow when this skill is active.
5. Set whether the skill should be **enabled by default**.
6. Click **Create**.

Custom skills appear in their chosen category with a purple **Custom** tag. They can be edited, toggled, and deleted using the trash icon.

**Example custom skill**: A domain expert studying hepatotoxicity might create a "Hepatotoxicity Screening" skill with a prompt template like:

> *Specifically evaluate whether the disrupted pathways are consistent with known hepatotoxic mechanisms: bile acid metabolism disruption, mitochondrial dysfunction, oxidative stress via Nrf2/Keap1, or immune-mediated injury. Assess whether the BMD values for liver-specific pathways fall below the lowest dose tested.*

---

## Document Preview

Click **Preview** in the action bar to see a formatted view of the entire report. The preview renders all sections with:

- Automatic hierarchical numbering (1, 1.1, 1.2, 2, 2.1, etc.)
- Template-themed colors (navy for EPA, purple for ICH, green for OECD)
- A title page with report metadata
- Embedded chart snapshots as figures with captions
- Data attachment summaries
- Sections without content shown as "No content yet" in italic

Use the preview to check document flow, spot gaps, and verify that section ordering looks correct before exporting.

---

## Exporting

Click **Export** in the action bar to download the report.

| Format | Description |
|---|---|
| **PDF** | Formatted PDF with embedded charts and tables |
| **Word (.docx)** | Editable Word document with heading structure |

A summary of the report (title, section count, clinical datasets) is shown before download. The file opens in a new browser tab.

---

## Data Storage

All report data is stored **locally in your browser** using IndexedDB. This means:

- Reports are private to your browser and device.
- Clearing browser data will delete your reports.
- Reports do not sync across devices or browsers.
- No report content is stored on the BMDExpress server.

LLM settings (API keys, provider selection, temperature) are stored in browser localStorage, also local to your device. API keys are never sent to the BMDExpress server — they are sent directly from your browser to the LLM provider's API.

Skill customizations (edited prompts, custom skills, enable/disable toggles) are also stored in localStorage and persist across sessions.

---

## Tips

- **Start with a template** — Templates provide a standard section structure that makes writing faster and ensures regulatory compliance.
- **Set section purposes first** — Fill in the purpose for each section before writing. This helps the AI generate more targeted content and serves as an outline for manual writing.
- **Enable Tier 2 and 3 skills selectively** — The Quality and Integrative skills are disabled by default because they add complexity. Enable them when your analysis includes the relevant data (e.g., enable "Cross-Analysis Comparator" only if your project has multiple experiments to compare).
- **Use refinement mode** — Run Assist on a section that already has content to refine and expand it rather than replacing it entirely.
- **Customize skill prompts** — If the AI consistently misinterprets your data in a specific way, edit the relevant skill's prompt template to add domain-specific guidance.
- **Track progress with statuses** — Mark sections as Draft → Reviewed → Final to track completion. The progress bar in the report list gives you an at-a-glance view.
- **Preview before exporting** — The document preview reveals numbering, ordering, and formatting issues that aren't obvious in the section editor.
