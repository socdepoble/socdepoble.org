#!/usr/bin/env node
/**
 * tooling/session/persona_router.mjs
 * El Router Cognitiu de la IAIA MarIA.
 *
 * Fins al 260923 era l'ÚNIC lloc del repositori que usava `triggers_on` per a
 * encaminar, i tenia zero cridadors i una dependència inexistent
 * (`.agents/skills_index.json`, que cap script generava). Les skills
 * declaraven disparadors semàntics que cap motor llegia: ornamentació.
 *
 * Ara està endollat, i s'ha triat el mode barat a propòsit:
 *
 * - `--punters` (el que usa el hook `UserPromptSubmit`) emet NOMÉS els noms i
 *   les rutes de les skills que han disparat. Una senyal de trànsit, no la
 *   càrrega: l'agent obri la skill si la necessita. Cost: unes poques línies
 *   per torn, no setze documents.
 * - Sense bandera continua bolcant el context complet en JSON, per si algun
 *   consumidor el vol sencer.
 *
 * L'índex es construïx sol si falta, perquè una eina que es queixa d'un fitxer
 * que ningú genera no està viva, només fa soroll.
 */

import { readFileSync, existsSync, readSync, realpathSync } from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { R, arrelSegura } from '../lib/arrel.mjs';
import { escriuIndex, INDEX_REL } from '../brain/build_skills_index.mjs';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function carregaIndex(arrel = arrelSegura()) {
  const fitxer = R(INDEX_REL);
  if (!existsSync(fitxer)) return escriuIndex(arrel).index;
  try {
    return JSON.parse(readFileSync(fitxer, 'utf8'));
  } catch {
    return escriuIndex(arrel).index;
  }
}

/**
 * Skills el disparador de les quals apareix al text.
 *
 * S'encaminen les CORE també, i no per descuit: els disparadors que més valen
 * («petorreta», «acte reflex», «workflow», «disseny») viuen justament en skills
 * marcades `core: true`. Que una skill estiga permanentment al context no la fa
 * present en el moment d'actuar —eixa és la fallada que estem reparant—, així
 * que el punter les nomena igual i diu quines ja hi són.
 */
export function encamina(text, index, { carregades = new Set() } = {}) {
  const prompt = String(text || '').toLowerCase();
  const totes = [
    ...(index.core || []).map((def) => ({ ...def, nucli: true })),
    ...Object.entries(index.plugins || {}).map(([nom, def]) => ({ ...def, name: def.name || nom, nucli: false }))
  ];
  return totes
    .filter((def) => (def.triggers_on || []).some((t) => prompt.includes(String(t).toLowerCase())))
    .map((def) => ({ ...def, jaAlContext: carregades.has(def.path) }));
}

/** Skills que `CLAUDE.md` ja `@`-importa: no cal tornar a dir que es carreguen. */
export function jaAlContext(arrel = arrelSegura()) {
  try {
    const text = readFileSync(`${arrel}/CLAUDE.md`, 'utf8');
    return new Set([...text.matchAll(/^@(\S+SKILL\.md)\s*$/gm)].map((m) => m[1]));
  } catch {
    return new Set();
  }
}

function contextComplet(index, disparades) {
  const ctx = { timestamp: new Date().toISOString(), core: [], plugins: [] };
  for (const skill of index.core || []) {
    const content = readFileSync(R(skill.path), 'utf8');
    ctx.core.push({ name: skill.name, path: skill.path, hash: sha256(content), content });
  }
  for (const skill of disparades) {
    const content = readFileSync(R(skill.path), 'utf8');
    ctx.plugins.push({ name: skill.name, path: skill.path, hash: sha256(content), content });
  }
  return ctx;
}

/** El hook `UserPromptSubmit` no passa el text per argv: ve pel payload de stdin. */
function textDeStdin() {
  const trossos = [];
  const buffer = Buffer.alloc(65536);
  try {
    for (;;) {
      const llegits = readSync(0, buffer, 0, buffer.length, null);
      if (!llegits) break;
      trossos.push(buffer.toString('utf8', 0, llegits));
    }
  } catch { /* sense stdin: no és un error, és una crida per argv */ }
  const raw = trossos.join('');
  if (!raw.trim()) return '';
  try {
    const p = JSON.parse(raw);
    return p.prompt || p.userPrompt || p.text || '';
  } catch {
    return raw;
  }
}

function main() {
  const args = process.argv.slice(2);
  const punters = args.includes('--punters');
  const text = args.includes('--hook')
    ? textDeStdin()
    : args.filter((a) => !a.startsWith('--')).join(' ');
  const index = carregaIndex();
  const disparades = encamina(text, index, { carregades: jaAlContext() });

  if (punters) {
    if (!disparades.length) return;
    console.log('[Router cognitiu] Aquesta petició dispara procediments consultables:');
    for (const s of disparades) {
      const marca = s.jaAlContext ? ' · ja al context, aplica-la ara' : '';
      console.log(`- ${s.name} → ${s.path}${marca}${s.description ? ` · ${s.description}` : ''}`);
    }
    console.log('Obri les que no tingues i aplica les que ja hi són. Cap s’ha carregat sola.');
    return;
  }

  console.log(JSON.stringify(contextComplet(index, disparades.filter((s) => !s.nucli)), null, 2));
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
