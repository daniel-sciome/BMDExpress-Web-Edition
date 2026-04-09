/**
 * Bm2MetadataInjector.java
 *
 * Standalone CLI tool for inspecting and injecting ExperimentDescription metadata
 * into BMDExpress .bm2 project files. This solves the problem where .bm2 files
 * created without metadata cannot be viewed in BMDExpress Web Edition (which
 * requires sex, organ, and species to be set on each experiment).
 *
 * The tool operates on the serialized BMDProject Java objects inside .bm2 files.
 * Each project contains one or more DoseResponseExperiment objects, and each
 * experiment can have its own ExperimentDescription with distinct metadata
 * (different sex, organ, species, etc.).
 *
 * Usage:
 *   # List all experiments and their current metadata status:
 *   java -cp <classpath> Bm2MetadataInjector list <file.bm2>
 *
 *   # Inject metadata into ALL experiments (same values for all):
 *   java -cp <classpath> Bm2MetadataInjector inject <file.bm2> <output.bm2> \
 *       --sex Male --organ Liver --species Rat --strain "Fischer 344" \
 *       --testArticle P3MP --casrn 123-45-6 --dsstox DTXSID1234567
 *
 *   # Inject metadata into a SPECIFIC experiment by name:
 *   java -cp <classpath> Bm2MetadataInjector inject <file.bm2> <output.bm2> \
 *       --experiment "expression1" \
 *       --sex Male --organ Liver --species Rat --strain "Fischer 344"
 *
 *   # Inject metadata into a specific experiment by index (0-based):
 *   java -cp <classpath> Bm2MetadataInjector inject <file.bm2> <output.bm2> \
 *       --index 0 \
 *       --sex Female --organ Kidney --species Mouse --strain "C57BL/6"
 *
 * Supported metadata fields (all optional, but sex/organ/species are required by the web app):
 *   --sex          Male, Female
 *   --organ        Liver, Kidney, etc.
 *   --species      Rat, Mouse, etc.
 *   --strain       Fischer 344, Sprague Dawley, C57BL/6, etc.
 *   --testArticle  Chemical/compound name
 *   --casrn        CAS Registry Number
 *   --dsstox       DSSTox Substance ID (e.g., DTXSID1234567)
 *   --platform     Array platform name
 *   --provider     Platform provider
 *   --subjectType  "In Vivo" or "In Vitro"
 *   --cellLine     Cell line (for In Vitro experiments)
 *   --duration     Study duration (e.g., "28d", "24h")
 *   --articleType  Chemical, Mixture, etc.
 *   --articleRoute Oral, Inhaled, Transdermal
 *   --vehicle      Corn Oil, Feed, Water, etc.
 *   --adminMeans   Gavage, Drinking Water, Dietary, etc.
 *
 * Compile & run (from project root):
 *   javac -cp "lib/bmdexpress3-3.0.0-SNAPSHOT.jar" tools/Bm2MetadataInjector.java
 *   java -cp "lib/bmdexpress3-3.0.0-SNAPSHOT.jar:tools" Bm2MetadataInjector list src/main/resources/data/bmd/P3MP-Parham.bm2
 */

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription;
import com.sciome.bmdexpress2.mvp.model.info.TestArticleIdentifier;

import java.io.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Bm2MetadataInjector {

    // -----------------------------------------------------------------------
    // Entry point — dispatches to list or inject subcommand.
    // -----------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            printUsage();
            System.exit(1);
        }

        String command = args[0];
        String inputPath = args[1];

        switch (command) {
            case "list":
                listExperiments(inputPath);
                break;
            case "inject":
                if (args.length < 3) {
                    System.err.println("Error: inject requires an output path");
                    System.err.println("Usage: Bm2MetadataInjector inject <input.bm2> <output.bm2> [options]");
                    System.exit(1);
                }
                String outputPath = args[2];
                // Parse remaining args as key-value metadata options
                Map<String, String> options = parseOptions(args, 3);
                injectMetadata(inputPath, outputPath, options);
                break;
            case "auto":
                // Auto-parse mode: extract sex/organ from experiment names and inject
                // Expects names like: ChemicalName_Sex_Organ[_NoOutlier]-expression1
                if (args.length < 3) {
                    System.err.println("Error: auto requires an output path");
                    System.err.println("Usage: Bm2MetadataInjector auto <input.bm2> <output.bm2> [--species Rat] [--testArticle name] [--strain name] ...");
                    System.exit(1);
                }
                String autoOutputPath = args[2];
                Map<String, String> autoOptions = parseOptions(args, 3);
                autoInjectMetadata(inputPath, autoOutputPath, autoOptions);
                break;
            default:
                System.err.println("Unknown command: " + command);
                printUsage();
                System.exit(1);
        }
    }

    // -----------------------------------------------------------------------
    // LIST subcommand — deserializes the .bm2 and prints every experiment's
    // name, index, probe count, and current ExperimentDescription fields.
    // -----------------------------------------------------------------------
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

        // Also show category analysis results and which experiment each traces to
        if (project.getCategoryAnalysisResults() != null && !project.getCategoryAnalysisResults().isEmpty()) {
            System.out.println("Category Analysis Results: " + project.getCategoryAnalysisResults().size());
            for (var catResult : project.getCategoryAnalysisResults()) {
                String expName = "(unknown)";
                // Traverse: CategoryAnalysisResults → BMDResult → DoseResponseExperiment
                if (catResult.getBmdResult() != null &&
                    catResult.getBmdResult().getDoseResponseExperiment() != null) {
                    expName = catResult.getBmdResult().getDoseResponseExperiment().getName();
                }
                System.out.println("  - " + catResult.getName() + "  →  experiment: " + expName);
            }
        }
    }

    // -----------------------------------------------------------------------
    // INJECT subcommand — creates/updates ExperimentDescription on the
    // targeted experiment(s), then writes the modified project to a new file.
    //
    // If --experiment or --index is provided, only that experiment is modified.
    // Otherwise, ALL experiments get the same metadata (useful when the entire
    // project shares the same biological context, e.g., same chemical study).
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // AUTO subcommand — parses sex and organ from experiment names automatically.
    //
    // The naming convention in BMDExpress projects is typically:
    //   ChemicalName_Sex_Organ[_NoOutlier]-expression1
    //
    // This method extracts sex and organ from the name, then applies them along
    // with any shared metadata (species, strain, testArticle, etc.) passed as
    // command-line options. This avoids needing 21 separate inject invocations
    // for a project where only sex and organ vary between experiments.
    //
    // Known sex values: Male, Female
    // Known organ values: see KNOWN_ORGANS set below
    // -----------------------------------------------------------------------
    private static final java.util.Set<String> KNOWN_ORGANS = new java.util.HashSet<>(java.util.Arrays.asList(
        "Liver", "Kidney", "Heart", "Brain", "Lung", "Spleen", "Thyroid", "Thymus",
        "Adrenal", "Uterus", "Ovary", "testes", "Testes", "Prostate", "Pancreas",
        "Stomach", "Colon", "Skin", "Bone", "Muscle", "Blood", "Mammary"
    ));

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

    // -----------------------------------------------------------------------
    // applyMetadata — creates or updates the ExperimentDescription on a
    // single DoseResponseExperiment. Preserves any existing field values
    // that aren't being overridden (so you can run inject multiple times
    // to build up metadata incrementally).
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // I/O helpers — deserialize and serialize .bm2 files. The .bm2 format is
    // standard Java object serialization of a BMDProject instance.
    // -----------------------------------------------------------------------

    /** Deserialize a .bm2 file into a BMDProject object. */
    private static BMDProject loadProject(String path) throws Exception {
        try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream(path), 1024 * 2000);
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            return (BMDProject) ois.readObject();
        }
    }

    /** Serialize a BMDProject object to a .bm2 file. */
    private static void saveProject(BMDProject project, String path) throws Exception {
        try (BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(path), 1024 * 2000);
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(project);
        }
    }

    // -----------------------------------------------------------------------
    // Argument parsing helpers
    // -----------------------------------------------------------------------

    /** Parse --key value pairs from args starting at the given offset. */
    private static Map<String, String> parseOptions(String[] args, int startIdx) {
        Map<String, String> options = new HashMap<>();
        for (int i = startIdx; i < args.length; i++) {
            if (args[i].startsWith("--") && i + 1 < args.length) {
                // Strip the -- prefix to get the key name
                String key = args[i].substring(2);
                String value = args[i + 1];
                options.put(key, value);
                i++; // skip the value on next iteration
            }
        }
        return options;
    }

    /** Print a metadata field, showing "(not set)" for null values. */
    private static void printField(String label, String value) {
        System.out.println(label + ": " + (value != null ? value : "(not set)"));
    }

    /** Print usage instructions. */
    private static void printUsage() {
        System.out.println("Bm2MetadataInjector — Inspect and inject metadata into .bm2 files");
        System.out.println();
        System.out.println("Usage:");
        System.out.println("  Bm2MetadataInjector list <file.bm2>");
        System.out.println("  Bm2MetadataInjector inject <input.bm2> <output.bm2> [options]");
        System.out.println("  Bm2MetadataInjector auto <input.bm2> <output.bm2> [shared options]");
        System.out.println();
        System.out.println("Commands:");
        System.out.println("  list    Show all experiments and their current metadata");
        System.out.println("  inject  Set metadata on specific or all experiments");
        System.out.println("  auto    Parse sex/organ from experiment names, apply shared metadata");
        System.out.println();
        System.out.println("Options for inject:");
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
        System.out.println("If no --experiment or --index is given, metadata is applied to ALL experiments.");
        System.out.println("Fields not specified are left unchanged (incremental updates supported).");
    }
}
