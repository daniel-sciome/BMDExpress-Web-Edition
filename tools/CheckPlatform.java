import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import java.io.*;
import java.lang.reflect.*;

public class CheckPlatform {
    public static void main(String[] args) throws Exception {
        var ois = new ObjectInputStream(new FileInputStream(args[0]));
        var project = (BMDProject) ois.readObject();
        ois.close();

        // Find all platform-related fields/methods on DoseResponseExperiment
        System.out.println("=== DoseResponseExperiment methods containing 'chip' or 'platform' (case-insensitive) ===");
        for (Method m : DoseResponseExperiment.class.getMethods()) {
            String name = m.getName().toLowerCase();
            if (name.contains("chip") || name.contains("platform")) {
                System.out.println("  " + m.getName() + "() -> " + m.getReturnType().getSimpleName());
            }
        }

        System.out.println("\n=== Values per experiment ===");
        for (var exp : project.getDoseResponseExperiments()) {
            System.out.print(exp.getName());

            // Try getChip()
            try {
                Method getChip = DoseResponseExperiment.class.getMethod("getChip");
                Object chip = getChip.invoke(exp);
                System.out.print("  chip=" + chip);
            } catch (NoSuchMethodException e) {
                // try field
                try {
                    Field f = DoseResponseExperiment.class.getDeclaredField("chip");
                    f.setAccessible(true);
                    System.out.print("  chip(field)=" + f.get(exp));
                } catch (NoSuchFieldException e2) {
                    System.out.print("  (no chip)");
                }
            }

            // Try getPlatform()
            try {
                Method getPlatform = DoseResponseExperiment.class.getMethod("getPlatform");
                Object platform = getPlatform.invoke(exp);
                System.out.print("  platform=" + platform);
            } catch (NoSuchMethodException e) {
                System.out.print("  (no getPlatform)");
            }

            System.out.println();
        }
    }
}
