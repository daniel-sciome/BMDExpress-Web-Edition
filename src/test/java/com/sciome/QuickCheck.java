package com.sciome;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;

import java.io.*;

public class QuickCheck {
    public static void main(String[] args) throws Exception {
        // Check both source and target files
        checkFile("src/main/resources/data/bmd/P3MP_metadata.bm2", "SOURCE");
        checkFile("target/classes/data/bmd/P3MP_metadata.bm2", "TARGET");
    }

    static void checkFile(String path, String label) throws Exception {
        File file = new File(path);
        System.out.println("\n=== " + label + " (" + path + ") ===");
        System.out.println("Modified: " + new java.util.Date(file.lastModified()));
        System.out.println("Size: " + file.length());

        BufferedInputStream bis = new BufferedInputStream(new FileInputStream(file), 1024 * 2000);
        ObjectInputStream ois = new ObjectInputStream(bis);
        BMDProject project = (BMDProject) ois.readObject();
        ois.close();

        int catCount = project.getCategoryAnalysisResults() != null ? project.getCategoryAnalysisResults().size() : 0;
        System.out.println("Category results: " + catCount);

        if (catCount > 0) {
            int gobp = 0, gene = 0;
            for (CategoryAnalysisResults car : project.getCategoryAnalysisResults()) {
                String name = car.getName();
                if (name.contains("GO_BP")) gobp++;
                else if (name.contains("GENE")) gene++;
            }
            System.out.println("  GO_BP: " + gobp);
            System.out.println("  GENE: " + gene);
        }
    }
}
