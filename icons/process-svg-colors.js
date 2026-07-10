#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Configuration
const BLACK_DIR = './Black';
const WHITE_DIR = './White';
const PROCESSED_DIR = './Processed';

// Color patterns to match
const COLOR_PATTERNS = {
  black: [
    /fill\s*=\s*["']#000000["']/gi,
    /fill\s*=\s*["']#000["']/gi,
    /fill\s*=\s*["']black["']/gi,
    /fill\s*=\s*["']rgb\(0%?,\s*0%?,\s*0%?\)["']/gi,
    /stroke\s*=\s*["']#000000["']/gi,
    /stroke\s*=\s*["']#000["']/gi,
    /stroke\s*=\s*["']black["']/gi,
    /stroke\s*=\s*["']rgb\(0%?,\s*0%?,\s*0%?\)["']/gi,
    /fill:\s*#000000/gi,
    /fill:\s*#000/gi,
    /fill:\s*black/gi,
    /fill:\s*rgb\(0%?,\s*0%?,\s*0%?\)/gi,
    /stroke:\s*#000000/gi,
    /stroke:\s*#000/gi,
    /stroke:\s*black/gi,
    /stroke:\s*rgb\(0%?,\s*0%?,\s*0%?\)/gi
  ],
  white: [
    /fill\s*=\s*["']#FFFFFF["']/gi,
    /fill\s*=\s*["']#FFF["']/gi,
    /fill\s*=\s*["']white["']/gi,
    /fill\s*=\s*["']#FAFAFA["']/gi,
    /fill\s*=\s*["']#ffffff["']/gi,
    /fill\s*=\s*["']#fff["']/gi,
    /fill\s*=\s*["']#fafafa["']/gi,
    /stroke\s*=\s*["']#FFFFFF["']/gi,
    /stroke\s*=\s*["']#FFF["']/gi,
    /stroke\s*=\s*["']white["']/gi,
    /stroke\s*=\s*["']#FAFAFA["']/gi,
    /stroke\s*=\s*["']#ffffff["']/gi,
    /stroke\s*=\s*["']#fff["']/gi,
    /stroke\s*=\s*["']#fafafa["']/gi,
    /fill:\s*#FFFFFF/gi,
    /fill:\s*#FFF/gi,
    /fill:\s*white/gi,
    /fill:\s*#FAFAFA/gi,
    /fill:\s*#ffffff/gi,
    /fill:\s*#fff/gi,
    /fill:\s*#fafafa/gi,
    /stroke:\s*#FFFFFF/gi,
    /stroke:\s*#FFF/gi,
    /stroke:\s*white/gi,
    /stroke:\s*#FAFAFA/gi,
    /stroke:\s*#ffffff/gi,
    /stroke:\s*#fff/gi,
    /stroke:\s*#fafafa/gi
  ]
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error.message);
  }
}

async function processSVGFile(filePath, targetColor) {
  try {
    // Read the SVG file
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Determine which patterns to look for based on target color
    const patternsToReplace = targetColor === 'black' ? COLOR_PATTERNS.white : COLOR_PATTERNS.black;
    
    // Replace all matching patterns
    patternsToReplace.forEach(pattern => {
      content = content.replace(pattern, (match) => {
        // Preserve the structure, just change the color
        if (match.includes('fill=')) {
          return `fill="${targetColor}"`;
        } else if (match.includes('stroke=')) {
          return `stroke="${targetColor}"`;
        } else if (match.includes('fill:')) {
          return `fill:${targetColor}`;
        } else if (match.includes('stroke:')) {
          return `stroke:${targetColor}`;
        }
        return match;
      });
    });
    
    // Only return true if changes were made
    return {
      modified: content !== originalContent,
      content: content
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { modified: false, content: null };
  }
}

async function processSVGDirectory(sourceDir, targetColor, processedSubDir) {
  try {
    const files = await fs.readdir(sourceDir);
    const svgFiles = files.filter(file => file.toLowerCase().endsWith('.svg'));
    
    console.log(`\nProcessing ${svgFiles.length} SVG files in ${sourceDir}...`);
    
    let processedCount = 0;
    let modifiedCount = 0;
    
    for (const file of svgFiles) {
      const sourcePath = path.join(sourceDir, file);
      const result = await processSVGFile(sourcePath, targetColor);
      
      if (result.modified && result.content) {
        // Save to processed directory
        const processedPath = path.join(PROCESSED_DIR, processedSubDir, file);
        await fs.writeFile(processedPath, result.content);
        
        // Also overwrite the original file
        await fs.writeFile(sourcePath, result.content);
        
        console.log(`✓ ${file} - Updated colors to ${targetColor}`);
        modifiedCount++;
      } else if (result.content) {
        console.log(`- ${file} - No color changes needed`);
      }
      
      processedCount++;
    }
    
    console.log(`\nCompleted: ${processedCount} files processed, ${modifiedCount} files modified`);
    
  } catch (error) {
    console.error(`Error processing directory ${sourceDir}:`, error.message);
  }
}

async function main() {
  console.log('SVG Color Processor');
  console.log('==================');
  
  // Create processed directories
  await ensureDirectoryExists(path.join(PROCESSED_DIR, 'Black'));
  await ensureDirectoryExists(path.join(PROCESSED_DIR, 'White'));
  
  // Process Black directory - convert white/light colors to black
  if (await fs.access(BLACK_DIR).then(() => true).catch(() => false)) {
    console.log('\n--- Processing Black Directory ---');
    await processSVGDirectory(BLACK_DIR, 'black', 'Black');
  } else {
    console.log(`\n⚠️  Black directory not found: ${BLACK_DIR}`);
  }
  
  // Process White directory - convert black/dark colors to white  
  if (await fs.access(WHITE_DIR).then(() => true).catch(() => false)) {
    console.log('\n--- Processing White Directory ---');
    await processSVGDirectory(WHITE_DIR, 'white', 'White');
  } else {
    console.log(`\n⚠️  White directory not found: ${WHITE_DIR}`);
  }
  
  console.log('\n✅ Processing complete!');
  console.log(`Processed files are saved in: ${PROCESSED_DIR}`);
  console.log('Original files have also been updated in place.');
}

// Run the script
main().catch(console.error);


