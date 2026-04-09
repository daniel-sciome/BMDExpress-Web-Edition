/**
 * Bm2Tool.java
 *
 * General-purpose CLI utility for manipulating BMDExpress .bm2 project files.
 * The .bm2 format is standard Java serialization of BMDProject objects, which
 * contain dose-response experiments, prefilter results, BMD modeling results,
 * and category analysis results.
 *
 * This tool started as Bm2MetadataInjector (for injecting ExperimentDescription
 * metadata) and has been expanded into a multi-command utility for merging
 * projects, converting category types, and more.
 *
 * Commands:
 *   list        — Show experiments, metadata, and category analysis results
 *   inject      — Set metadata on specific or all experiments
 *   auto        — Parse sex/organ from experiment names, apply shared metadata
 *   merge       — Merge two or more .bm2 files into a single project
 *   convert-go  — Convert DefinedCategory results with GO IDs to GO results
 *
 * Usage:
 *   java -cp <classpath> Bm2Tool list <file.bm2>
 *   java -cp <classpath> Bm2Tool inject <input.bm2> <output.bm2> [options]
 *   java -cp <classpath> Bm2Tool auto <input.bm2> <output.bm2> [shared options]
 *   java -cp <classpath> Bm2Tool merge <output.bm2> <input1.bm2> <input2.bm2> [...]
 *   java -cp <classpath> Bm2Tool convert-go <input.bm2> <output.bm2> [--goLevel 0] [--strict]
 *
 * Compile & run (from project root):
 *   javac -cp "lib/bmdexpress3-3.0.0-SNAPSHOT.jar" tools/Bm2Tool.java
 *   java -cp "lib/bmdexpress3-3.0.0-SNAPSHOT.jar:tools" Bm2Tool list some_project.bm2
 */

// -- BMDExpress model classes (from bmdexpress3 JAR) --
import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription;
import com.sciome.bmdexpress2.mvp.model.info.TestArticleIdentifier;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResult;
import com.sciome.bmdexpress2.mvp.model.category.DefinedCategoryAnalysisResult;
import com.sciome.bmdexpress2.mvp.model.category.GOAnalysisResult;
import com.sciome.bmdexpress2.mvp.model.category.identifier.CategoryIdentifier;
import com.sciome.bmdexpress2.mvp.model.category.identifier.GenericCategoryIdentifier;
import com.sciome.bmdexpress2.mvp.model.category.identifier.GOCategoryIdentifier;
import com.sciome.bmdexpress2.util.ProjectUtilities;

// -- Standard library --
import java.io.*;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

public class Bm2Tool {

    // -----------------------------------------------------------------------
    // Entry point — dispatches to the appropriate subcommand based on args[0].
    // Each command has its own method with dedicated arg parsing.
    // -----------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            printUsage();
            System.exit(1);
        }

        String command = args[0];

        switch (command) {
            case "list":
                // list <file.bm2> — show experiments and metadata
                listExperiments(args[1]);
                break;

            case "inject":
                // inject <input.bm2> <output.bm2> [--key value ...] — set metadata
                if (args.length < 3) {
                    System.err.println("Error: inject requires an output path");
                    System.err.println("Usage: Bm2Tool inject <input.bm2> <output.bm2> [options]");
                    System.exit(1);
                }
                injectMetadata(args[1], args[2], parseOptions(args, 3));
                break;

            case "auto":
                // auto <input.bm2> <output.bm2> [--key value ...] — parse sex/organ from names
                if (args.length < 3) {
                    System.err.println("Error: auto requires an output path");
                    System.err.println("Usage: Bm2Tool auto <input.bm2> <output.bm2> [--species Rat] ...");
                    System.exit(1);
                }
                autoInjectMetadata(args[1], args[2], parseOptions(args, 3));
                break;

            case "merge":
                // merge <output.bm2> <input1.bm2> <input2.bm2> [...] — combine projects
                if (args.length < 4) {
                    System.err.println("Error: merge requires an output path and at least 2 input files");
                    System.err.println("Usage: Bm2Tool merge <output.bm2> <input1.bm2> <input2.bm2> [...]");
                    System.exit(1);
                }
                mergeProjects(args);
                break;

            case "convert-go":
                // convert-go <input.bm2> <output.bm2> [--goLevel 0] [--strict] — retype categories
                if (args.length < 3) {
                    System.err.println("Error: convert-go requires input and output paths");
                    System.err.println("Usage: Bm2Tool convert-go <input.bm2> <output.bm2> [--goLevel 0] [--strict]");
                    System.exit(1);
                }
                convertDefinedToGO(args);
                break;

            default:
                System.err.println("Unknown command: " + command);
                printUsage();
                System.exit(1);
        }
    }

    // =======================================================================
    // LIST command
    // =======================================================================

    /**
     * Deserializes a .bm2 file and prints a human-readable summary of every
     * experiment's name, probe/treatment counts, current metadata fields, and
     * all category analysis results with their upstream experiment links.
     */
    private static void listExperiments(String path) throws Exception {
        BMDProject project = loadProject(path);

        System.out.println("Project: " + project.getName());
        System.out.println("=========================================");

        List<DoseResponseExperiment> experiments = project.getDoseResponseExperiments();
        if (experiments == null || experiments.isEmpty()) {
            System.out.println("No DoseResponseExperiments found.");
            return;
        }

        System.out.println("Experiments: " + experiments.size());
        System.out.println();

        for (int i = 0; i < experiments.size(); i++) {
            DoseResponseExperiment exp = experiments.get(i);
            System.out.println("[" + i + "] " + exp.getName());

            // Show basic experiment info (probes and treatments help identify experiments)
            if (exp.getProbeResponses() != null) {
                System.out.println("    Probes: " + exp.getProbeResponses().size());
            }
            if (exp.getTreatments() != null) {
                System.out.println("    Treatments: " + exp.getTreatments().size());
            }

            // Show current ExperimentDescription status
            ExperimentDescription desc = exp.getExperimentDescription();
            if (desc == null) {
                System.out.println("    ExperimentDescription: NULL (not set)");
            } else if (!desc.hasDescription()) {
                System.out.println("    ExperimentDescription: EMPTY (all fields null)");
            } else {
                System.out.println("    ExperimentDescription:");
                printField("      Test Article", desc.getTestArticle() != null ? desc.getTestArticle().getName() : null);
                printField("      CASRN", desc.getTestArticle() != null ? desc.getTestArticle().getCasrn() : null);
                printField("      DSSTox", desc.getTestArticle() != null ? desc.getTestArticle().getDsstox() : null);
                printField("      Subject Type", desc.getSubjectType());
                printField("      Species", desc.getSpecies());
                printField("      Strain", desc.getStrain());
                printField("      Sex", desc.getSex());
                printField("      Organ", desc.getOrgan());
                printField("      Cell Line", desc.getCellLine());
                printField("      Platform", desc.getPlatform());
                printField("      Provider", desc.getProvider());
                printField("      Duration", desc.getStudyDuration());
                printField("      Article Type", desc.getArticleType());
                printField("      Article Route", desc.getArticleRoute());
                printField("      Vehicle", desc.getArticleVehicle());
                printField("      Admin Means", desc.getAdministrationMeans());
            }
            System.out.println();
        }

        // Show category analysis results and which experiment each traces to
        // Also show the concrete type of each result item (GO, Defined, Pathway, Gene)
        if (project.getCategoryAnalysisResults() != null && !project.getCategoryAnalysisResults().isEmpty()) {
            System.out.println("Category Analysis Results: " + project.getCategoryAnalysisResults().size());
            for (var catResult : project.getCategoryAnalysisResults()) {
                String expName = "(unknown)";
                // Traverse: CategoryAnalysisResults → BMDResult → DoseResponseExperiment
                if (catResult.getBmdResult() != null &&
                    catResult.getBmdResult().getDoseResponseExperiment() != null) {
                    expName = catResult.getBmdResult().getDoseResponseExperiment().getName();
                }

                // Determine the category type from the first result item's class
                String catType = "unknown";
                int itemCount = 0;
                var items = catResult.getCategoryAnalsyisResults();
                if (items != null && !items.isEmpty()) {
                    itemCount = items.size();
                    CategoryAnalysisResult firstItem = items.get(0);
                    if (firstItem instanceof GOAnalysisResult) {
                        catType = "GO";
                    } else if (firstItem instanceof DefinedCategoryAnalysisResult) {
                        catType = "Defined";
                    } else {
                        // PathwayAnalysisResult, GeneLevelAnalysisResult, or future types
                        catType = firstItem.getClass().getSimpleName();
                    }
                }

                System.out.println("  - " + catResult.getName());
                System.out.println("      type: " + catType + ", items: " + itemCount + ", experiment: " + expName);
            }
        }
    }

    // =======================================================================
    // INJECT command
    // =======================================================================

    /**
     * Creates or updates ExperimentDescription metadata on targeted experiment(s),
     * then writes the modified project to a new .bm2 file.
     *
     * If --experiment or --index is provided, only that experiment is modified.
     * Otherwise, ALL experiments get the same metadata (useful when the entire
     * project shares the same biological context, e.g., same chemical study).
     */
    private static void injectMetadata(String inputPath, String outputPath, Map<String, String> options)
            throws Exception {
        BMDProject project = loadProject(inputPath);
        List<DoseResponseExperiment> experiments = project.getDoseResponseExperiments();

        if (experiments == null || experiments.isEmpty()) {
            System.err.println("Error: No DoseResponseExperiments found in project.");
            System.exit(1);
        }

        // Determine which experiment(s) to modify
        String targetName = options.get("experiment");
        String targetIndexStr = options.get("index");

        if (targetName != null) {
            // Target a specific experiment by name
            boolean found = false;
            for (DoseResponseExperiment exp : experiments) {
                if (exp.getName() != null && exp.getName().equals(targetName)) {
                    applyMetadata(exp, options);
                    found = true;
                    System.out.println("Injected metadata into experiment: " + exp.getName());
                    break;
                }
            }
            if (!found) {
                System.err.println("Error: No experiment found with name: " + targetName);
                System.err.println("Use 'list' command to see available experiment names.");
                System.exit(1);
            }
        } else if (targetIndexStr != null) {
            // Target a specific experiment by index
            int idx = Integer.parseInt(targetIndexStr);
            if (idx < 0 || idx >= experiments.size()) {
                System.err.println("Error: Index " + idx + " out of range (0-" + (experiments.size() - 1) + ")");
                System.exit(1);
            }
            DoseResponseExperiment exp = experiments.get(idx);
            applyMetadata(exp, options);
            System.out.println("Injected metadata into experiment [" + idx + "]: " + exp.getName());
        } else {
            // No target specified — apply to ALL experiments
            for (int i = 0; i < experiments.size(); i++) {
                DoseResponseExperiment exp = experiments.get(i);
                applyMetadata(exp, options);
                System.out.println("Injected metadata into experiment [" + i + "]: " + exp.getName());
            }
        }

        // Write the modified project to the output file
        saveProject(project, outputPath);
        System.out.println();
        System.out.println("Saved patched project to: " + outputPath);
    }

    // =======================================================================
    // AUTO command
    // =======================================================================

    /**
     * Known organ names for auto-parsing from experiment name strings.
     * Matched case-insensitively against underscore/hyphen-delimited tokens.
     */
    private static final Set<String> KNOWN_ORGANS = new HashSet<>(Arrays.asList(
        "Liver", "Kidney", "Heart", "Brain", "Lung", "Spleen", "Thyroid", "Thymus",
        "Adrenal", "Uterus", "Ovary", "testes", "Testes", "Prostate", "Pancreas",
        "Stomach", "Colon", "Skin", "Bone", "Muscle", "Blood", "Mammary"
    ));

    /**
     * Parses sex and organ from experiment names automatically, then applies
     * them along with any shared metadata (species, strain, testArticle, etc.)
     * passed as command-line options.
     *
     * Expects experiment names like: ChemicalName_Sex_Organ[_NoOutlier]-expression1
     * This avoids needing N separate inject invocations for a project where only
     * sex and organ vary between experiments.
     */
    private static void autoInjectMetadata(String inputPath, String outputPath, Map<String, String> sharedOptions)
            throws Exception {
        BMDProject project = loadProject(inputPath);
        List<DoseResponseExperiment> experiments = project.getDoseResponseExperiments();

        if (experiments == null || experiments.isEmpty()) {
            System.err.println("Error: No DoseResponseExperiments found in project.");
            System.exit(1);
        }

        int injected = 0;
        int skipped = 0;

        for (int i = 0; i < experiments.size(); i++) {
            DoseResponseExperiment exp = experiments.get(i);
            String name = exp.getName();

            // Parse sex from name — look for _Male_ or _Female_ in the experiment name
            String sex = null;
            if (name.contains("_Male_") || name.contains("_Male-")) {
                sex = "Male";
            } else if (name.contains("_Female_") || name.contains("_Female-")) {
                sex = "Female";
            }

            // Parse organ from name — find a known organ name between underscores
            // Split on underscores and hyphens, look for matches in KNOWN_ORGANS
            String organ = null;
            String[] parts = name.split("[_\\-]");
            for (String part : parts) {
                // Check case-insensitive against known organs
                for (String knownOrgan : KNOWN_ORGANS) {
                    if (part.equalsIgnoreCase(knownOrgan)) {
                        // Capitalize first letter for consistency
                        organ = part.substring(0, 1).toUpperCase() + part.substring(1).toLowerCase();
                        break;
                    }
                }
                if (organ != null) break;
            }

            if (sex == null && organ == null) {
                System.out.println("[" + i + "] SKIPPED (could not parse sex/organ): " + name);
                skipped++;
                continue;
            }

            // Build per-experiment options: start with shared options, override with parsed values
            Map<String, String> perExpOptions = new HashMap<>(sharedOptions);
            if (sex != null)   perExpOptions.put("sex", sex);
            if (organ != null) perExpOptions.put("organ", organ);

            applyMetadata(exp, perExpOptions);
            System.out.println("[" + i + "] " + name);
            System.out.println("      → sex=" + sex + ", organ=" + organ);
            injected++;
        }

        saveProject(project, outputPath);
        System.out.println();
        System.out.println("Injected: " + injected + " experiments, Skipped: " + skipped);
        System.out.println("Saved patched project to: " + outputPath);
    }

    // =======================================================================
    // MERGE command
    // =======================================================================

    /**
     * Merges two or more .bm2 project files into a single output file.
     *
     * Uses ProjectUtilities.addProjectToProject() from BMDExpress-3, which
     * concatenates all result lists (experiments, prefilters, BMD results,
     * category analyses) and deduplicates names by appending _1, _2, etc.
     *
     * The first input file becomes the base project; subsequent files are
     * merged into it. Object references within each source project are
     * preserved (e.g., a BMDResult still points to its DoseResponseExperiment).
     *
     * CLI: Bm2Tool merge <output.bm2> <input1.bm2> <input2.bm2> [input3.bm2 ...]
     * Note: output comes first, then variable-length input list.
     */
    private static void mergeProjects(String[] args) throws Exception {
        String outputPath = args[1];

        // Collect all input paths (args[2] through args[n])
        List<String> inputPaths = new ArrayList<>();
        for (int i = 2; i < args.length; i++) {
            inputPaths.add(args[i]);
        }

        // Load the first input as the base project
        System.out.println("Loading base project: " + inputPaths.get(0));
        BMDProject merged = loadProject(inputPaths.get(0));
        printProjectSummary(merged, "  ");

        // Merge each subsequent input into the base
        for (int i = 1; i < inputPaths.size(); i++) {
            String path = inputPaths.get(i);
            System.out.println("Merging: " + path);
            BMDProject toMerge = loadProject(path);
            printProjectSummary(toMerge, "  ");

            // addProjectToProject handles list concatenation and name deduplication
            ProjectUtilities.addProjectToProject(merged, toMerge);
        }

        // Set the merged project's name to the output filename
        String outputName = new File(outputPath).getName();
        merged.setName(outputName);

        saveProject(merged, outputPath);
        System.out.println();
        System.out.println("Merged " + inputPaths.size() + " projects into: " + outputPath);
        printProjectSummary(merged, "  ");
    }

    /**
     * Prints a one-line-per-type summary of a BMDProject's contents.
     * Used by merge to show what's being combined.
     */
    private static void printProjectSummary(BMDProject project, String indent) {
        int experiments = project.getDoseResponseExperiments() != null ? project.getDoseResponseExperiments().size() : 0;
        int bmdResults = project.getbMDResult() != null ? project.getbMDResult().size() : 0;
        int catResults = project.getCategoryAnalysisResults() != null ? project.getCategoryAnalysisResults().size() : 0;

        // Count all prefilter types
        int prefilters = 0;
        if (project.getOneWayANOVAResults() != null) prefilters += project.getOneWayANOVAResults().size();
        if (project.getWilliamsTrendResults() != null) prefilters += project.getWilliamsTrendResults().size();
        if (project.getCurveFitPrefilterResults() != null) prefilters += project.getCurveFitPrefilterResults().size();
        if (project.getOriogenResults() != null) prefilters += project.getOriogenResults().size();

        System.out.println(indent + "experiments=" + experiments + ", prefilters=" + prefilters
                + ", bmdResults=" + bmdResults + ", categoryResults=" + catResults);
    }

    // =======================================================================
    // CONVERT-GO command
    // =======================================================================

    /**
     * Regex pattern matching GO term identifiers (e.g., "GO:0008150").
     * Used to detect which DefinedCategoryAnalysisResult items are actually
     * GO terms that should be typed as GOAnalysisResult.
     */
    private static final Pattern GO_PATTERN = Pattern.compile("GO:\\d{7}");

    /**
     * Converts DefinedCategoryAnalysisResult items to GOAnalysisResult when
     * their category identifier matches the GO term pattern (GO:NNNNNNN).
     *
     * This is needed when a "defined category" analysis was run using gene sets
     * that happen to be GO terms. The results are structurally identical to GO
     * analysis results but typed as DefinedCategoryAnalysisResult, which means
     * the web app (and desktop app) treat them differently — missing GO-specific
     * features like level filtering.
     *
     * The conversion creates new GOAnalysisResult instances, copies all fields
     * via reflection (because many fields on CategoryAnalysisResult lack public
     * setters), and replaces the GenericCategoryIdentifier with a
     * GOCategoryIdentifier.
     *
     * --strict mode: only convert a CategoryAnalysisResults block if ALL of its
     * items have GO-pattern IDs. If any item doesn't match, skip the entire block.
     *
     * Default (no --strict): convert individual matching items within each block,
     * leaving non-GO items as DefinedCategoryAnalysisResult.
     *
     * CLI: Bm2Tool convert-go <input.bm2> <output.bm2> [--goLevel 0] [--strict]
     */
    private static void convertDefinedToGO(String[] args) throws Exception {
        String inputPath = args[1];
        String outputPath = args[2];

        // Parse options: --goLevel and --strict
        Map<String, String> options = parseOptions(args, 3);
        // goLevel must be a parseable integer string because GOAnalysisResult.createRowData()
        // calls Integer.parseInt(goLevel). Default "0" means "unknown level".
        String goLevel = options.getOrDefault("goLevel", "0");
        boolean strict = hasFlag(args, "--strict");

        BMDProject project = loadProject(inputPath);
        List<CategoryAnalysisResults> allResults = project.getCategoryAnalysisResults();

        if (allResults == null || allResults.isEmpty()) {
            System.out.println("No category analysis results found in project.");
            return;
        }

        // Track conversion statistics for the summary report
        int totalResultSets = allResults.size();
        int convertedResultSets = 0;
        int skippedResultSets = 0;
        int totalItemsConverted = 0;
        int totalItemsSkipped = 0;

        for (CategoryAnalysisResults resultSet : allResults) {
            // getCategoryAnalsyisResults() — note the typo "Analsyis" — this is the
            // actual method name in BMDExpress-3's source code
            List<CategoryAnalysisResult> items = resultSet.getCategoryAnalsyisResults();

            if (items == null || items.isEmpty()) {
                continue;
            }

            // Only process result sets that contain DefinedCategoryAnalysisResult items
            boolean hasDefinedItems = false;
            for (CategoryAnalysisResult item : items) {
                if (item instanceof DefinedCategoryAnalysisResult) {
                    hasDefinedItems = true;
                    break;
                }
            }
            if (!hasDefinedItems) {
                // Already GO, Pathway, or GeneLevelAnalysis — nothing to convert
                continue;
            }

            // Count how many items have GO-pattern identifiers
            int goCount = 0;
            int nonGoCount = 0;
            for (CategoryAnalysisResult item : items) {
                if (item instanceof DefinedCategoryAnalysisResult) {
                    CategoryIdentifier id = item.getCategoryIdentifier();
                    if (id != null && id.getId() != null && GO_PATTERN.matcher(id.getId()).matches()) {
                        goCount++;
                    } else {
                        nonGoCount++;
                    }
                }
            }

            // In strict mode, skip blocks that have a mix of GO and non-GO identifiers
            if (strict && nonGoCount > 0) {
                System.out.println("SKIPPED (strict, mixed GO/non-GO): " + resultSet.getName()
                        + " (" + goCount + " GO, " + nonGoCount + " non-GO)");
                skippedResultSets++;
                totalItemsSkipped += goCount + nonGoCount;
                continue;
            }

            if (goCount == 0) {
                // No GO-pattern identifiers found in this block at all
                System.out.println("SKIPPED (no GO identifiers): " + resultSet.getName());
                skippedResultSets++;
                totalItemsSkipped += nonGoCount;
                continue;
            }

            // Convert matching items in place
            int convertedInBlock = 0;
            int skippedInBlock = 0;
            for (int i = 0; i < items.size(); i++) {
                CategoryAnalysisResult item = items.get(i);
                if (!(item instanceof DefinedCategoryAnalysisResult)) {
                    continue;
                }

                CategoryIdentifier oldId = item.getCategoryIdentifier();
                if (oldId == null || oldId.getId() == null || !GO_PATTERN.matcher(oldId.getId()).matches()) {
                    skippedInBlock++;
                    continue;
                }

                // Create new GOAnalysisResult and copy all fields via reflection
                GOAnalysisResult goResult = new GOAnalysisResult();
                copyFieldsReflective(item, goResult);

                // Replace the GenericCategoryIdentifier with a GOCategoryIdentifier
                GOCategoryIdentifier goIdent = new GOCategoryIdentifier();
                goIdent.setId(oldId.getId());
                goIdent.setTitle(oldId.getTitle());
                goIdent.setGoLevel(goLevel);
                goResult.setCategoryIdentifier(goIdent);

                // Swap the item in the list
                items.set(i, goResult);
                convertedInBlock++;
            }

            totalItemsConverted += convertedInBlock;
            totalItemsSkipped += skippedInBlock;

            // Rename the result set: replace "DEFINED-<anything>" with "GO_BP" in the
            // container name so the web app's AnalysisNameParser recognizes it as a GO
            // category analysis rather than a defined category analysis.
            String oldName = resultSet.getName();
            if (oldName != null && convertedInBlock > 0) {
                String newName = oldName.replaceFirst("DEFINED-\\S+?(?=_true|_false)", "GO_BP");
                if (!newName.equals(oldName)) {
                    resultSet.setName(newName);
                    System.out.println("RENAMED: " + oldName + " → " + newName);
                }
            }

            if (skippedInBlock > 0) {
                System.out.println("MIXED: " + resultSet.getName()
                        + " — converted " + convertedInBlock + " of " + (convertedInBlock + skippedInBlock) + " items");
            } else {
                System.out.println("CONVERTED: " + resultSet.getName()
                        + " — " + convertedInBlock + " items");
            }
            convertedResultSets++;
        }

        // Save the modified project
        saveProject(project, outputPath);

        // Print summary
        System.out.println();
        System.out.println("Summary:");
        System.out.println("  Result sets processed: " + totalResultSets);
        System.out.println("  Result sets converted: " + convertedResultSets);
        System.out.println("  Result sets skipped:   " + skippedResultSets);
        System.out.println("  Items converted:       " + totalItemsConverted);
        System.out.println("  Items skipped:         " + totalItemsSkipped);
        System.out.println("  GO level assigned:     " + goLevel);
        System.out.println("Saved to: " + outputPath);
    }

    /**
     * Copies all non-transient, non-static instance fields from one
     * CategoryAnalysisResult to another using reflection.
     *
     * Why reflection instead of getters/setters: CategoryAnalysisResult has ~70
     * non-transient fields, but many of them (percentile indices, up/down BMD
     * stats, statResultCounts, genesWithConflictingProbeSets) lack public setters.
     * Since GOAnalysisResult and DefinedCategoryAnalysisResult add no new fields
     * of their own (they only differ in serialVersionUID and display methods),
     * we can safely copy all parent-class fields to get a complete clone.
     *
     * The categoryIdentifier field IS copied here but will be overwritten
     * afterward by the caller with a new GOCategoryIdentifier.
     */
    private static void copyFieldsReflective(CategoryAnalysisResult source, CategoryAnalysisResult target) {
        // Walk the class hierarchy from CategoryAnalysisResult upward
        // (in case any superclass above it has serialized fields too)
        Class<?> clazz = CategoryAnalysisResult.class;
        while (clazz != null && clazz != Object.class) {
            for (Field field : clazz.getDeclaredFields()) {
                int mods = field.getModifiers();
                // Skip static fields (like serialVersionUID) and transient fields
                // (like row, genes, geneSymbols — these are recomputed on access)
                if (Modifier.isStatic(mods) || Modifier.isTransient(mods)) {
                    continue;
                }
                try {
                    field.setAccessible(true);
                    Object value = field.get(source);
                    field.set(target, value);
                } catch (IllegalAccessException e) {
                    // Should not happen after setAccessible(true), but log it just in case
                    System.err.println("WARNING: Could not copy field '" + field.getName()
                            + "': " + e.getMessage());
                }
            }
            clazz = clazz.getSuperclass();
        }
    }

    // =======================================================================
    // Metadata helpers (shared by inject and auto commands)
    // =======================================================================

    /**
     * Creates or updates the ExperimentDescription on a single experiment.
     * Preserves any existing field values that aren't being overridden, so you
     * can run inject multiple times to build up metadata incrementally.
     */
    private static void applyMetadata(DoseResponseExperiment exp, Map<String, String> options) {
        // Get existing description or create new one
        ExperimentDescription desc = exp.getExperimentDescription();
        if (desc == null) {
            desc = new ExperimentDescription();
            exp.setExperimentDescription(desc);
        }

        // Apply each field if provided in options (preserves existing values if not overridden)
        if (options.containsKey("sex"))          desc.setSex(options.get("sex"));
        if (options.containsKey("organ"))        desc.setOrgan(options.get("organ"));
        if (options.containsKey("species"))      desc.setSpecies(options.get("species"));
        if (options.containsKey("strain"))       desc.setStrain(options.get("strain"));
        if (options.containsKey("platform"))     desc.setPlatform(options.get("platform"));
        if (options.containsKey("provider"))     desc.setProvider(options.get("provider"));
        if (options.containsKey("subjectType"))  desc.setSubjectType(options.get("subjectType"));
        if (options.containsKey("cellLine"))     desc.setCellLine(options.get("cellLine"));
        if (options.containsKey("duration"))     desc.setStudyDuration(options.get("duration"));
        if (options.containsKey("articleType"))  desc.setArticleType(options.get("articleType"));
        if (options.containsKey("articleRoute")) desc.setArticleRoute(options.get("articleRoute"));
        if (options.containsKey("vehicle"))      desc.setArticleVehicle(options.get("vehicle"));
        if (options.containsKey("adminMeans"))   desc.setAdministrationMeans(options.get("adminMeans"));

        // TestArticleIdentifier — create/update if any test article fields are provided
        if (options.containsKey("testArticle") || options.containsKey("casrn") || options.containsKey("dsstox")) {
            TestArticleIdentifier ta = desc.getTestArticle();
            if (ta == null) {
                ta = new TestArticleIdentifier();
                desc.setTestArticle(ta);
            }
            if (options.containsKey("testArticle")) ta.setName(options.get("testArticle"));
            if (options.containsKey("casrn"))        ta.setCasrn(options.get("casrn"));
            if (options.containsKey("dsstox"))       ta.setDsstox(options.get("dsstox"));
        }
    }

    // =======================================================================
    // I/O helpers — deserialize and serialize .bm2 files
    // =======================================================================

    /**
     * Deserialize a .bm2 file into a BMDProject object.
     * Uses a 2MB buffer matching BMDExpress-3's buffer size for performance.
     */
    private static BMDProject loadProject(String path) throws Exception {
        try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream(path), 1024 * 2000);
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            return (BMDProject) ois.readObject();
        }
    }

    /**
     * Serialize a BMDProject object to a .bm2 file.
     * Uses a 2MB buffer matching BMDExpress-3's buffer size for performance.
     */
    private static void saveProject(BMDProject project, String path) throws Exception {
        try (BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(path), 1024 * 2000);
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(project);
        }
    }

    // =======================================================================
    // Argument parsing helpers
    // =======================================================================

    /**
     * Parse --key value pairs from args starting at the given offset.
     * Returns a map of key→value where keys have the "--" prefix stripped.
     * Standalone flags like --strict are NOT captured here (use hasFlag instead).
     */
    private static Map<String, String> parseOptions(String[] args, int startIdx) {
        Map<String, String> options = new HashMap<>();
        for (int i = startIdx; i < args.length; i++) {
            if (args[i].startsWith("--") && i + 1 < args.length && !args[i + 1].startsWith("--")) {
                // Strip the -- prefix to get the key name
                String key = args[i].substring(2);
                String value = args[i + 1];
                options.put(key, value);
                i++; // skip the value on next iteration
            }
        }
        return options;
    }

    /**
     * Check whether a standalone flag (like --strict) is present in the args.
     * Flags are args that start with "--" and are either the last arg or are
     * followed by another "--" arg (i.e., they have no value).
     */
    private static boolean hasFlag(String[] args, String flag) {
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals(flag)) {
                return true;
            }
        }
        return false;
    }

    /** Print a metadata field, showing "(not set)" for null values. */
    private static void printField(String label, String value) {
        System.out.println(label + ": " + (value != null ? value : "(not set)"));
    }

    /** Print usage instructions for all commands. */
    private static void printUsage() {
        System.out.println("Bm2Tool — Manipulate BMDExpress .bm2 project files");
        System.out.println();
        System.out.println("Usage:");
        System.out.println("  Bm2Tool list <file.bm2>");
        System.out.println("  Bm2Tool inject <input.bm2> <output.bm2> [options]");
        System.out.println("  Bm2Tool auto <input.bm2> <output.bm2> [shared options]");
        System.out.println("  Bm2Tool merge <output.bm2> <input1.bm2> <input2.bm2> [...]");
        System.out.println("  Bm2Tool convert-go <input.bm2> <output.bm2> [--goLevel 0] [--strict]");
        System.out.println();
        System.out.println("Commands:");
        System.out.println("  list        Show all experiments, metadata, and category analysis results");
        System.out.println("  inject      Set metadata on specific or all experiments");
        System.out.println("  auto        Parse sex/organ from experiment names, apply shared metadata");
        System.out.println("  merge       Merge multiple .bm2 files into one project");
        System.out.println("  convert-go  Convert DefinedCategory results with GO IDs to GO results");
        System.out.println();
        System.out.println("Options for inject/auto:");
        System.out.println("  --experiment <name>   Target a specific experiment by name");
        System.out.println("  --index <n>           Target a specific experiment by index (0-based)");
        System.out.println("  --sex <value>         Male, Female");
        System.out.println("  --organ <value>       Liver, Kidney, etc.");
        System.out.println("  --species <value>     Rat, Mouse, etc.");
        System.out.println("  --strain <value>      Fischer 344, Sprague Dawley, etc.");
        System.out.println("  --testArticle <name>  Chemical/compound name");
        System.out.println("  --casrn <value>       CAS Registry Number");
        System.out.println("  --dsstox <value>      DSSTox Substance ID");
        System.out.println("  --platform <value>    Array platform name");
        System.out.println("  --provider <value>    Platform provider");
        System.out.println("  --subjectType <value> In Vivo / In Vitro");
        System.out.println("  --cellLine <value>    Cell line (In Vitro)");
        System.out.println("  --duration <value>    Study duration (28d, 24h, etc.)");
        System.out.println("  --articleType <value> Chemical, Mixture, etc.");
        System.out.println("  --articleRoute <value> Oral, Inhaled, Transdermal");
        System.out.println("  --vehicle <value>     Corn Oil, Feed, Water, etc.");
        System.out.println("  --adminMeans <value>  Gavage, Drinking Water, Dietary, etc.");
        System.out.println();
        System.out.println("Options for convert-go:");
        System.out.println("  --goLevel <value>     GO level to assign (default: 0 = unknown)");
        System.out.println("  --strict              Only convert blocks where ALL items are GO terms");
        System.out.println();
        System.out.println("If no --experiment or --index is given, metadata is applied to ALL experiments.");
        System.out.println("Fields not specified are left unchanged (incremental updates supported).");
    }
}
