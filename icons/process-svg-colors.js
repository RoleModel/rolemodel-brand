#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

// Configuration
const BLACK_DIR = "./Black";
const WHITE_DIR = "./White";
const PROCESSED_DIR = "./Processed";

// Color patterns to match
const COLOR_PATTERNS = {
  black: [
    /fill\s*=\s*["']#000000["']/giu,
    /fill\s*=\s*["']#000["']/giu,
    /fill\s*=\s*["']black["']/giu,
    /fill\s*=\s*["']rgb\(0%?,\s*0%?,\s*0%?\)["']/giu,
    /stroke\s*=\s*["']#000000["']/giu,
    /stroke\s*=\s*["']#000["']/giu,
    /stroke\s*=\s*["']black["']/giu,
    /stroke\s*=\s*["']rgb\(0%?,\s*0%?,\s*0%?\)["']/giu,
    /fill:\s*#000000/giu,
    /fill:\s*#000/giu,
    /fill:\s*black/giu,
    /fill:\s*rgb\(0%?,\s*0%?,\s*0%?\)/giu,
    /stroke:\s*#000000/giu,
    /stroke:\s*#000/giu,
    /stroke:\s*black/giu,
    /stroke:\s*rgb\(0%?,\s*0%?,\s*0%?\)/giu,
  ],
  white: [
    /fill\s*=\s*["']#FFFFFF["']/giu,
    /fill\s*=\s*["']#FFF["']/giu,
    /fill\s*=\s*["']white["']/giu,
    /fill\s*=\s*["']#FAFAFA["']/giu,
    /fill\s*=\s*["']#ffffff["']/giu,
    /fill\s*=\s*["']#fff["']/giu,
    /fill\s*=\s*["']#fafafa["']/giu,
    /stroke\s*=\s*["']#FFFFFF["']/giu,
    /stroke\s*=\s*["']#FFF["']/giu,
    /stroke\s*=\s*["']white["']/giu,
    /stroke\s*=\s*["']#FAFAFA["']/giu,
    /stroke\s*=\s*["']#ffffff["']/giu,
    /stroke\s*=\s*["']#fff["']/giu,
    /stroke\s*=\s*["']#fafafa["']/giu,
    /fill:\s*#FFFFFF/giu,
    /fill:\s*#FFF/giu,
    /fill:\s*white/giu,
    /fill:\s*#FAFAFA/giu,
    /fill:\s*#ffffff/giu,
    /fill:\s*#fff/giu,
    /fill:\s*#fafafa/giu,
    /stroke:\s*#FFFFFF/giu,
    /stroke:\s*#FFF/giu,
    /stroke:\s*white/giu,
    /stroke:\s*#FAFAFA/giu,
    /stroke:\s*#ffffff/giu,
    /stroke:\s*#fff/giu,
    /stroke:\s*#fafafa/giu,
  ],
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error.message);
  }
};

const processSVGFile = async (filePath, targetColor) => {
  try {
    // Read the SVG file
    let content = await fs.readFile(filePath, "utf-8");
    const originalContent = content;

    // Determine which patterns to look for based on target color
    const patternsToReplace =
      targetColor === "black" ? COLOR_PATTERNS.white : COLOR_PATTERNS.black;

    // Replace all matching patterns
    for (const pattern of patternsToReplace) {
      content = content.replace(pattern, (match) => {
        // Preserve the structure, just change the color
        if (match.includes("fill=")) {
          return `fill="${targetColor}"`;
        } else if (match.includes("stroke=")) {
          return `stroke="${targetColor}"`;
        } else if (match.includes("fill:")) {
          return `fill:${targetColor}`;
        } else if (match.includes("stroke:")) {
          return `stroke:${targetColor}`;
        }
        return match;
      });
    }

    // Only return true if changes were made
    return {
      content,
      modified: content !== originalContent,
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { content: null, modified: false };
  }
};

const processSVGDirectory = async (sourceDir, targetColor, processedSubDir) => {
  try {
    const files = await fs.readdir(sourceDir);
    const svgFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".svg")
    );

    console.log(`\nProcessing ${svgFiles.length} SVG files in ${sourceDir}...`);

    // Each SVG is processed independently, so run them in parallel and then
    // report results in the original file order to preserve log ordering.
    const results = await Promise.all(
      svgFiles.map(async (file) => {
        const sourcePath = path.join(sourceDir, file);
        const result = await processSVGFile(sourcePath, targetColor);

        if (result.modified && result.content) {
          // Save to processed directory and overwrite the original file
          const processedPath = path.join(PROCESSED_DIR, processedSubDir, file);
          await Promise.all([
            fs.writeFile(processedPath, result.content),
            fs.writeFile(sourcePath, result.content),
          ]);
        }

        return { file, result };
      })
    );

    let processedCount = 0;
    let modifiedCount = 0;

    for (const { file, result } of results) {
      if (result.modified && result.content) {
        console.log(`✓ ${file} - Updated colors to ${targetColor}`);
        modifiedCount += 1;
      } else if (result.content) {
        console.log(`- ${file} - No color changes needed`);
      }

      processedCount += 1;
    }

    console.log(
      `\nCompleted: ${processedCount} files processed, ${modifiedCount} files modified`
    );
  } catch (error) {
    console.error(`Error processing directory ${sourceDir}:`, error.message);
  }
};

const main = async () => {
  console.log("SVG Color Processor");
  console.log("==================");

  // Create processed directories
  await ensureDirectoryExists(path.join(PROCESSED_DIR, "Black"));
  await ensureDirectoryExists(path.join(PROCESSED_DIR, "White"));

  // Process Black directory - convert white/light colors to black
  if (
    await fs
      .access(BLACK_DIR)
      .then(() => true)
      .catch(() => false)
  ) {
    console.log("\n--- Processing Black Directory ---");
    await processSVGDirectory(BLACK_DIR, "black", "Black");
  } else {
    console.log(`\n⚠️  Black directory not found: ${BLACK_DIR}`);
  }

  // Process White directory - convert black/dark colors to white
  if (
    await fs
      .access(WHITE_DIR)
      .then(() => true)
      .catch(() => false)
  ) {
    console.log("\n--- Processing White Directory ---");
    await processSVGDirectory(WHITE_DIR, "white", "White");
  } else {
    console.log(`\n⚠️  White directory not found: ${WHITE_DIR}`);
  }

  console.log("\n✅ Processing complete!");
  console.log(`Processed files are saved in: ${PROCESSED_DIR}`);
  console.log("Original files have also been updated in place.");
};

// Run the script
try {
  await main();
} catch (error) {
  console.error(error);
}
