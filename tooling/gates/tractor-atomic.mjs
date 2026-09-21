import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Tractor per vigilar l'adopció del Sistema Atòmic de UI
// Assegura que PageFrame i UniversalCard no defineixen handlers de router
// per Connectar, Traduir, Comentar i Compartir ells mateixos,
// sinó que fan servir la lògica compartida de `useAccions.js`.

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');

const FILES_TO_CHECK = [
  'src/components/PedraSeca/organismes/UniversalCard.jsx',
  'src/components/universal/PageFrame.jsx'
];

function comprovaFitxer(relPath) {
  const file = path.join(ROOT, relPath);
  if (!fs.existsSync(file)) {
    console.error(`❌ El fitxer ${relPath} no existeix.`);
    return false;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  let ok = true;
  
  if (!content.includes('useAccions(')) {
    console.error(`❌ ${relPath} ha de fer servir el hook úseAccions per la gestió de UI.`);
    ok = false;
  }
  
  // They shouldn't contain manual action fallbacks anymore.
  if (content.includes("navigate('/connectar")) {
    console.error(`❌ ${relPath} conté lògica de rutes codificada. Ha d'utilitzar useAccions.`);
    ok = false;
  }
  if (content.includes("navigate('/traduccions")) {
    console.error(`❌ ${relPath} conté lògica de rutes codificada. Ha d'utilitzar useAccions.`);
    ok = false;
  }
  if (content.includes("navigate('/xat")) {
    console.error(`❌ ${relPath} conté lògica de rutes codificada. Ha d'utilitzar useAccions.`);
    ok = false;
  }

  return ok;
}

function tractorAtomic() {
  console.log("⚛️ [tractor-atomic] Verificant l'arquitectura atòmica (ús de useAccions)...");
  let allOk = true;
  for (const file of FILES_TO_CHECK) {
    if (!comprovaFitxer(file)) {
      allOk = false;
    }
  }

  if (!allOk) {
    console.error("💥 Falla tractor-atomic: violació del sistema atòmic de la UI.");
    process.exit(1);
  }
  
  console.log("✅ Totes les vistes passen la verificació atòmica.");
  process.exit(0);
}

tractorAtomic();
