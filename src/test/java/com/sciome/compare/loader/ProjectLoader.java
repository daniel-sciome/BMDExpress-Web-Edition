package com.sciome.compare.loader;

import com.sciome.bmdexpress2.mvp.model.BMDProject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.ObjectInputStream;

/**
 * Loads BMDProject from .bm2 files
 */
public class ProjectLoader {

    /**
     * Load a BMDProject from a .bm2 file
     *
     * @param path Path to the .bm2 file
     * @return The deserialized BMDProject
     * @throws ProjectLoadException if loading fails
     */
    public BMDProject load(String path) throws ProjectLoadException {
        File file = new File(path);
        if (!file.exists()) {
            throw new ProjectLoadException("File not found: " + path);
        }
        if (!file.canRead()) {
            throw new ProjectLoadException("Cannot read file: " + path);
        }

        try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream(file), 1024 * 2000);
             ObjectInputStream ois = new ObjectInputStream(bis)) {

            Object obj = ois.readObject();
            if (!(obj instanceof BMDProject)) {
                throw new ProjectLoadException("File does not contain a BMDProject: " + path);
            }
            return (BMDProject) obj;

        } catch (Exception e) {
            throw new ProjectLoadException("Failed to load project: " + path, e);
        }
    }

    /**
     * Exception thrown when project loading fails
     */
    public static class ProjectLoadException extends Exception {
        public ProjectLoadException(String message) {
            super(message);
        }

        public ProjectLoadException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
