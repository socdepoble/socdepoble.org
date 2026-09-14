import fs from 'fs';
import path from 'path';

// Rutes permeses
const TARGET_DIRS = ['src'];

const FORBIDDEN_PATTERNS = [
  { regex: /font-family\s*:\s*[^;}]*(?<!sans-)\b(serif|times|georgia)\b/i, msg: "Prohibit l'ús de tipografies Serif (incloent Times o Georgia). Única font permesa: Noto Sans." },
  { regex: /rgb\(\s*9\s*,\s*132\s*,\s*227\s*\)/i, msg: "Color no canònic: rgb(9, 132, 227). Utilitza var(--sdp-secondary-500) o #016ebf." },
  { regex: /rgb\(\s*255\s*,\s*115\s*,\s*0\s*\)/i, msg: "Color no canònic: rgb(255, 115, 0). Utilitza var(--sdp-primary-500) o #FF7300." },
  { regex: /font-family\s*=\s*['"][^'"]*(?<!sans-)\b(serif|times|georgia)\b/i, msg: "Prohibit l'ús de tipografies Serif (incloent Times o Georgia). Única font permesa: Noto Sans." }
];

let violationsCount = 0;

function analyzeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        console.error(`\n[T2 TIPOGRAFIA] ${filePath}:${index + 1}`);
        console.error(`   Detall: ${pattern.msg}`);
        console.error(`   Línia:  ${line.trim()}`);
        violationsCount++;
      }
    }
  });
}

function scanDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css'))) {
      analyzeFile(fullPath);
    }
  }
}

console.log('🚜 [TRACTOR TIPOGRAFIA] Analitzant aplicació...');

for (const dir of TARGET_DIRS) {
  const fullPath = path.resolve(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    scanDirectory(fullPath);
  } else {
    console.warn(`⚠️ Directori no trobat: ${dir}`);
  }
}

if (violationsCount > 0) {
  console.error(`\n❌ S'han trobat ${violationsCount} violacions de tipografia o colors no canònics.`);
  console.error('🧱 El mur ha parat el build. Aplica els valors canònics de Pedra Seca.\n');
  process.exit(1);
} else {
  console.log('\n✅ Cap tipografia o color no canònic detectat. El mur aprova el codi.\n');
  process.exit(0);
}
