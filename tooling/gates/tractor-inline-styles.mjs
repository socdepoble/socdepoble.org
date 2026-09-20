import fs from 'fs';
import path from 'path';
import { senseComentaris } from '../lib/codi.mjs';

// Rutes permeses
const TARGET_DIRS = ['src'];

// Propietats prohibides dins d'un style={{...}} o style={obj}
const FORBIDDEN_PROPERTIES = [
  'padding', 'margin', 'display', 'flex', 'grid', 
  'width', 'height', 'background', 'color', 
  'textAlign', 'borderRadius'
];

// Com que estem treballant amb regex per simplificar (en lloc d'un AST parser), 
// buscarem el patró general de style={{...}} i després comprovarem si té alguna de les propietats.
// Aquesta no és una anàlisi 100% perfecta, però actua com un bon fusible (fail-closed).
const STYLE_REGEX = /style=\{\{([^]*?)\}\}/g;
const STYLE_VAR_REGEX = /style=\{(?!\{)[^}]*\}/g;

let violationsCount = 0;

function analyzeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const cleanCode = senseComentaris(code, filePath);
  let match;
  
  while ((match = STYLE_REGEX.exec(cleanCode)) !== null) {
    const styleContent = match[1];
    
    // Comprovar cadascuna de les propietats prohibides
    for (const prop of FORBIDDEN_PROPERTIES) {
      // Intentar coincidir amb la propietat exacta, ex: "padding:" o "padding :"
      const propRegex = new RegExp(`\\b${prop}\\s*:`, 'i');
      if (propRegex.test(styleContent)) {
        // Hem trobat una violació
        const lines = code.substring(0, match.index).split('\n');
        const lineNumber = lines.length;
        
        console.error(`\n[T2 INLINE-STYLE] ${filePath}:${lineNumber}`);
        console.error(`   Detall: Propietat prohibida '${prop}' usada en un inline style.`);
        console.error(`   Codi:   style={{${styleContent}}}`);
        
        violationsCount++;
        break; // Només reportem una vegada per cada bloc style={{...}} encara que tinga diverses propietats prohibides
      }
    }
  }

  while ((match = STYLE_VAR_REGEX.exec(cleanCode)) !== null) {
    const lines = code.substring(0, match.index).split('\n');
    const lineNumber = lines.length;
    
    console.error(`\n[T2 INLINE-STYLE] ${filePath}:${lineNumber}`);
    console.error(`   Detall: Variable usada en style={obj}. L'objecte d'estil ha de ser literal per poder-lo auditar.`);
    console.error(`   Codi:   ${match[0]}`);
    
    violationsCount++;
  }
}

function scanDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.jsx') || fullPath.endsWith('.js'))) {
      analyzeFile(fullPath);
    }
  }
}

console.log('🚜 [TRACTOR INLINE-STYLES] Analitzant aplicació...');

for (const dir of TARGET_DIRS) {
  const fullPath = path.resolve(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    scanDirectory(fullPath);
  } else {
    console.warn(`⚠️ Directori no trobat: ${dir}`);
  }
}

if (violationsCount > 0) {
  console.error(`\n❌ S'han trobat ${violationsCount} violacions d'estils en línia prohibits.`);
  console.error('🧱 El mur ha parat el build. Passa els estils al CSS usant classes semàntiques.\n');
  process.exit(1);
} else {
  console.log('\n✅ Cap propietat prohibida en style={{...}} detectada. El mur aprova el codi.\n');
  process.exit(0);
}
