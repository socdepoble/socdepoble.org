import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { PROJECT_DIR } from './lib/project_paths.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function prepararDocument(tipus, documentId) {
  // 1. Trobar plantilla segons tipus al registre centralitzat JSON
  const registryPath = path.join(PROJECT_DIR, '.agents/protocolledge.json');
  let plantillaPath;
  try {
    const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
    // Mapatge: si entra 'prompt_consell', busca 'prompt.consell'
    const id = tipus.replace('_', '.');
    const entrada = registry.rutes.find(r => r.id === id);
    if (!entrada) throw new Error();
    plantillaPath = path.join(PROJECT_DIR, entrada.plantilla);
  } catch (e) {
    throw new Error(`Plantilla no trobada per al tipus ${tipus} al registre central`);
  }
  
  const plantilla = await fs.readFile(plantillaPath, 'utf8').catch(() => null);
  
  if (!plantilla) {
    throw new Error(`Plantilla no es pot llegir físicament: ${plantillaPath}`);
  }

  // 2. Esborrany fora de la Wiki (a .sdp-reflex/esborranys)
  const draftDir = path.join(PROJECT_DIR, '.sdp-reflex', 'esborranys');
  await fs.mkdir(draftDir, { recursive: true });
  
  const esborranyPath = path.join(draftDir, `${documentId}.md`);
  await fs.writeFile(esborranyPath, plantilla, 'utf8');

  // 3. Retornar versions i empremtes
  return {
    plantillaSha256: sha256(plantilla),
    esborranyPath,
    missatge: `Esborrany preparat a ${esborranyPath}`
  };
}

export async function validarDocument(esborranyPath) {
  const content = await fs.readFile(esborranyPath, 'utf8');
  
  // Parsejar frontmatter amb l'esquema vigent
  const parsed = parseFrontmatter(content);
  
  if (!parsed.data.type || !parsed.data.status) {
    throw new Error('Frontmatter invàlid: falten camps obligatoris (type, status)');
  }

  // Validar estructura del markdown
  if (!content.includes('# ')) {
    throw new Error('Estructura Markdown invàlida: falta un títol (H1)');
  }
  
  return { valid: true, sha256: sha256(content), parsed };
}

export async function promoureDocument(esborranyPath, destinacioRelativa, preimatgeSha256) {
  const content = await fs.readFile(esborranyPath, 'utf8');
  const actualSha256 = sha256(content);
  
  if (preimatgeSha256 && actualSha256 !== preimatgeSha256) {
    throw new Error('El preimatge no coincideix. El document ha estat alterat.');
  }
  
  const destinacioAbsoluta = path.join(PROJECT_DIR, destinacioRelativa);
  const destDir = path.dirname(destinacioAbsoluta);
  
  await fs.mkdir(destDir, { recursive: true });
  
  // Escriure atòmicament mitjançant un fitxer temporal
  const tempFile = `${destinacioAbsoluta}.tmp`;
  await fs.writeFile(tempFile, content, 'utf8');
  await fs.rename(tempFile, destinacioAbsoluta);
  
  // Netejar esborrany
  await fs.unlink(esborranyPath).catch(() => {});
  
  return { promogut: true, destinacio: destinacioRelativa, finalSha256: actualSha256 };
}
