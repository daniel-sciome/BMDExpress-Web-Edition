import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription;
import com.sciome.bmdexpress2.mvp.model.prefilter.*;
import java.io.*;

/**
 * Standalone utility to inspect .bm2 files and check ExperimentDescription object references.
 * Run with: mvn test-compile exec:java -Dexec.mainClass=InspectBm2File -Dexec.classpathScope=test
 */
public class InspectBm2File {
    public static void main(String[] args) throws Exception {
        String filePath = args.length > 0 ? args[0] :
            "src/main/resources/data/bmd/P3MP_metadata.bm2";

        System.out.println("============================================");
        System.out.println("Inspecting: " + filePath);
        System.out.println("============================================\n");

        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filePath));
        BMDProject project = (BMDProject) ois.readObject();
        ois.close();

        // Check DoseResponseExperiments in project
        System.out.println("=== DoseResponseExperiments in project ===");
        if (project.getDoseResponseExperiments() != null) {
            for (DoseResponseExperiment exp : project.getDoseResponseExperiments()) {
                System.out.println("Name: " + exp.getName());
                System.out.println("  Object ID: " + System.identityHashCode(exp));
                System.out.println("  Has ExperimentDescription: " + (exp.getExperimentDescription() != null));
                if (exp.getExperimentDescription() != null) {
                    ExperimentDescription ed = exp.getExperimentDescription();
                    System.out.println("    Sex: " + ed.getSex());
                    System.out.println("    Organ: " + ed.getOrgan());
                    System.out.println("    Species: " + ed.getSpecies());
                    System.out.println("    Strain: " + ed.getStrain());
                    System.out.println("    TestArticle: " + ed.getTestArticle());
                }
            }
        }

        // Check ALL prefilter results in project
        System.out.println("\n=== Prefilter Results in Project ===");

        System.out.println("\nWilliams Trend Results: " +
            (project.getWilliamsTrendResults() != null ? project.getWilliamsTrendResults().size() : 0));
        if (project.getWilliamsTrendResults() != null) {
            for (WilliamsTrendResults wtr : project.getWilliamsTrendResults()) {
                System.out.println("  Name: " + wtr.getName());
                DoseResponseExperiment exp = wtr.getDoseResponseExperiement();
                if (exp != null) {
                    System.out.println("    DoseResponseExperiment: " + exp.getName());
                    System.out.println("    Object ID: " + System.identityHashCode(exp));
                    System.out.println("    Has ExperimentDescription: " + (exp.getExperimentDescription() != null));
                }
            }
        }

        System.out.println("\nCurve Fit Prefilter Results: " +
            (project.getCurveFitPrefilterResults() != null ? project.getCurveFitPrefilterResults().size() : 0));
        if (project.getCurveFitPrefilterResults() != null) {
            for (CurveFitPrefilterResults cfr : project.getCurveFitPrefilterResults()) {
                System.out.println("  Name: " + cfr.getName());
                DoseResponseExperiment exp = cfr.getDoseResponseExperiement();
                if (exp != null) {
                    System.out.println("    DoseResponseExperiment: " + exp.getName());
                    System.out.println("    Object ID: " + System.identityHashCode(exp));
                    System.out.println("    Has ExperimentDescription: " + (exp.getExperimentDescription() != null));
                }
            }
        }

        System.out.println("\nOne-Way ANOVA Results: " +
            (project.getOneWayANOVAResults() != null ? project.getOneWayANOVAResults().size() : 0));

        System.out.println("\nOriogen Results: " +
            (project.getOriogenResults() != null ? project.getOriogenResults().size() : 0));

        // Check CategoryAnalysisResults (summary)
        System.out.println("\n=== CategoryAnalysisResults Summary ===");
        System.out.println("Total count: " +
            (project.getCategoryAnalysisResults() != null ? project.getCategoryAnalysisResults().size() : 0));

        if (project.getCategoryAnalysisResults() != null && !project.getCategoryAnalysisResults().isEmpty()) {
            // Just check the first few
            int count = 0;
            for (CategoryAnalysisResults catResults : project.getCategoryAnalysisResults()) {
                if (count++ >= 3) {
                    System.out.println("\n... (showing first 3 only)");
                    break;
                }
                System.out.println("\nCategory: " + catResults.getName());

                // Check the convenience method
                ExperimentDescription directDesc = catResults.getExperimentDescription();
                System.out.println("  getExperimentDescription() returns: " +
                    (directDesc != null ? "POPULATED" : "NULL"));

                // Check BMDResult chain
                if (catResults.getBmdResult() != null) {
                    DoseResponseExperiment bmdExp = catResults.getBmdResult().getDoseResponseExperiment();
                    if (bmdExp != null) {
                        System.out.println("  BMDResult.DoseResponseExperiment:");
                        System.out.println("    Name: " + bmdExp.getName());
                        System.out.println("    Object ID: " + System.identityHashCode(bmdExp));
                        System.out.println("    Has ExperimentDescription: " +
                            (bmdExp.getExperimentDescription() != null));

                        // Identity check with project's list
                        if (project.getDoseResponseExperiments() != null) {
                            for (DoseResponseExperiment projectExp : project.getDoseResponseExperiments()) {
                                if (projectExp.getName() != null && projectExp.getName().equals(bmdExp.getName())) {
                                    boolean sameObject = (projectExp == bmdExp);
                                    System.out.println("  IDENTITY CHECK with project's '" + projectExp.getName() + "': " +
                                        (sameObject ? "SAME OBJECT" : "*** DIFFERENT OBJECTS ***"));
                                    if (!sameObject) {
                                        System.out.println("    Project's exp Object ID: " + System.identityHashCode(projectExp));
                                        System.out.println("    BMDResult's exp Object ID: " + System.identityHashCode(bmdExp));
                                    }
                                }
                            }
                        }
                    } else {
                        System.out.println("  BMDResult.DoseResponseExperiment: NULL");
                    }
                } else {
                    System.out.println("  BMDResult: NULL");
                }

                // Check PrefilterResults if available
                if (catResults.getBmdResult() != null && catResults.getBmdResult().getPrefilterResults() != null) {
                    var prefilterResults = catResults.getBmdResult().getPrefilterResults();
                    System.out.println("  PrefilterResults type: " + prefilterResults.getClass().getSimpleName());
                    DoseResponseExperiment prefilterExp = prefilterResults.getDoseResponseExperiement();
                    if (prefilterExp != null) {
                        System.out.println("  PrefilterResults.DoseResponseExperiment:");
                        System.out.println("    Name: " + prefilterExp.getName());
                        System.out.println("    Object ID: " + System.identityHashCode(prefilterExp));
                        System.out.println("    Has ExperimentDescription: " +
                            (prefilterExp.getExperimentDescription() != null));
                    }
                }
            }
        }

        System.out.println("\n============================================");
        System.out.println("Inspection complete.");
    }
}
