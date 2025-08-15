const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Get all JS files in the dist directory
function obfuscateDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      obfuscateDirectory(filePath);
    } else if (file.endsWith('.js')) {
      obfuscateFile(filePath);
    } else if (file.endsWith('.d.ts')) {
      // For TypeScript definition files, either:
      // 1. Remove them (in production they're not strictly necessary)
      // 2. Or obfuscate them in a simpler way (rename identifiers)
      removeOrObfuscateDtsFile(filePath);
    }
  });
}

function obfuscateFile(filePath) {
  console.log(`Obfuscating JS: ${filePath}`);
  
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.7,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      renameGlobals: false,
      rotateStringArray: true,
      selfDefending: true,
      shuffleStringArray: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      transformObjectKeys: false,
      unicodeEscapeSequence: false
    });
    
    fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
    console.log(`Obfuscated: ${filePath}`);
  } catch (error) {
    console.error(`Error obfuscating ${filePath}:`, error.message);
  }
}

function removeOrObfuscateDtsFile(filePath) {
  // Option 1: Remove the .d.ts file
  try {
    console.log(`Removing TypeScript definition: ${filePath}`);
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Error removing ${filePath}:`, error.message);
  }
  
  // Option 2 (alternative): Obfuscate TypeScript definitions in a basic way
  // This would require a more complex TypeScript parser/transformer
  // Not implemented here as Option 1 is simpler for production builds
}

// Start from the dist directory
const distDir = path.join(__dirname, '..', 'dist');
obfuscateDirectory(distDir);
console.log('Obfuscation complete!'); 