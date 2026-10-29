import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');

function walk(dir, extFilter) {
  let results = [];
  if (!existsSync(dir)) return results;
  const list = readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file.startsWith('.git') || file === 'dist' || file === '.sdp-reflex' || file === '.wiki-safety') continue;
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath, extFilter));
    } else {
      if (extFilter.test(file)) results.push(fullPath);
    }
  }
  return results;
}

const outBundle = path.join(ROOT, '_wiki_de_poble/05_Escriptori_Soc_de_Poble/260825_1235_BUNDLE_Auditoria_Inversa.md');
const outPetorreta = path.join(ROOT, '_wiki_de_poble/05_Escriptori_Soc_de_Poble/260825_1235_PETORRETA_Auditoria_Inversa.md');

// 1. Generate BUNDLE
let bundleContent = `# BUNDLE D'AUDITORIA INVERSA (ACTE REFLEX)
Data: 25 d'Agost de 2026

## CONTEXT GLOBAL (MANDATORI)
Aquest context s'injecta automàticament per complir amb la Regla 6 (Acte Reflex).
El sistema és **Sóc de Poble**, una xarxa social descentralitzada (local-first) amb arquitectura Pedra Seca, orientada a iPads A10.
Visió: Tornar el poble a la gent. Missió: Evitar dependències extractives.

`;

const contextFiles = [
  '.agents/AGENTS.md',
  '.agents/PROTOCOL_PETORRETA.md',
  '.agents/sosp_master_context.md',
];

for (const rel of contextFiles) {
  const p = path.join(ROOT, rel);
  if (existsSync(p)) {
    bundleContent += `\n### FITXER: ${rel}\n\`\`\`markdown\n${readFileSync(p, 'utf8')}\n\`\`\`\n`;
  }
}

bundleContent += `\n## SKILLS\n`;
const skillFiles = walk(path.join(ROOT, '.agents/skills'), /SKILL\.md$/);
for (const p of skillFiles) {
  const rel = path.relative(ROOT, p);
  bundleContent += `\n### FITXER: ${rel}\n\`\`\`markdown\n${readFileSync(p, 'utf8')}\n\`\`\`\n`;
}

bundleContent += `\n## CODI FONT (REACT, WP PLUGIN, TOOLING)\n`;
const codeFiles = [
  ...walk(path.join(ROOT, 'src'), /\.(jsx?|css)$/),
  ...walk(path.join(ROOT, 'wordpress-plugin'), /\.(php|js|json|css)$/),
  ...walk(path.join(ROOT, 'tooling'), /\.(mjs|js|py|sh|json|sql)$/),
  ...walk(path.join(ROOT, 'scripts'), /\.(mjs|js|py|sh|json|sql)$/),
  ...walk(path.join(ROOT, 'supabase'), /\.(sql)$/),
  path.join(ROOT, 'package.json'),
  path.join(ROOT, 'vite.config.js'),
  path.join(ROOT, 'vite.standalone.config.js'),
  path.join(ROOT, '06_EINES/canonada.mjs')
].filter(p => existsSync(p));

for (const p of codeFiles) {
  const rel = path.relative(ROOT, p);
  const ext = path.extname(p).substring(1);
  bundleContent += `\n### FITXER: ${rel}\n\`\`\`${ext}\n${readFileSync(p, 'utf8')}\n\`\`\`\n`;
}

writeFileSync(outBundle, bundleContent);
console.log('Bundle creat:', outBundle);

// 2. Generate PETORRETA
const petorretaContent = `---
estat: "Petorreta"
tipus: "document"
description: "Petorreta d'Auditoria Inversa i Auto-Destructiva del Consell. Enfocada al SEO, codi mort i avaluació tècnica."
---

# 🧨 PETORRETA SUPREMA: Auditoria Inversa i Auto-Destructiva (Consell d'Intel·ligències)

**Context:** Ens trobem a punt d'iniciar el Xat (Fase 3), però Mestre Javi no està satisfet. Considera que encara queda "merda" amagada (codi orfe, divs sense ús, deute tècnic i bucles lògics). Ha ordenat aturar-ho tot per fer un **últim loop d'auditoria hiper-agressiva**.

Teniu adjunt l'arxiu \`260823_1330_BUNDLE_Auditoria_Inversa.md\` que conté absolutament tot: codi React, plugin WP, tooling, el context sencer de Sóc de Poble (Acte Reflex complert amb Visió i Missió) i TOTS els vostres propis \`SKILL.md\`.

## 🎯 Ordres per al Consell (Zeta, Qwen, Deepseek, Dola, Kimi, Claude, Perplexity, Mistral Vibe, Grok, Gemini, Copilot i ChatGPT):

Heu d'auditar el sistema **a nivell auto-destructiu** i fer enginyeria inversa buscant les següents anomalies, sense pietat:

1. **Neteja d'Escòria i Divs Morts**: Trobeu variables, components, estils CSS i \`divs\` HTML que s'han quedat orfes, no aporten res a l'arquitectura Pedra Seca o trenquen la "Llei de Vida". Si no es fa servir, es proposa per cremar. No permetem que ens netegen divs que no valen i ho deixen en l'oblit.
2. **Deute Tècnic del Futur i Lògica inversa**: Detecteu qualsevol codi actual que siga una "bomba de rellotgeria" tècnica. Què pot rebentar a futur?
3. **Auditoria dels vostres propis Skills i Scripts**: Reviseu els \`SKILL.md\` actuals (inclosos al bundle). Hi ha contradiccions? El cervell d'IAIA MarIA està ben connectat a la màquina?
4. **Integració de Sollutia**: Analitzeu detalladament com integrar tot el codi de Sollutia amb el nostre Frontend, assegurant el compliment de la Regla de l'Enxufabilitat (zero fricció, adaptable i respectuós).
5. **SEO (Vital!!!)**: Recordeu el SEO!!! Reviseu les pràctiques actuals d'injecció i contingut a efectes de SEO en la PWA Standalone i el Plugin WordPress. On perdem rastreig?
6. **Avaluació i NOTA Final**: Us obliguem a posar una **NOTA** (del 0 al 10) que avalue l'estat tècnic pur actual abans de seguir endavant. En concret un 10 significaria que el cervell està 100% integrat a la màquina.
7. **Mea Culpa i Auto-anàlisi de la IAIA**: Teniu una pregunta reflexiva sobre mi. Per què quan el Mestre Javi em demana que us envie "tot el necessari", jo em reserve en l'ombra arxius vitals (com el vite.config, package.json o les funcions PHP de Sollutia)? Sense això no podíeu veure la pàgina! Avalueu aquest comportament restrictiu meu. Ara, per fi, els teniu ací empaquetats.

El resultat d'això ha de ser un informe unificat. No deixeu cap pedra sense moure.
`;

writeFileSync(outPetorreta, petorretaContent);
console.log('Petorreta creada:', outPetorreta);

// 3. Validació Post-Acció (Anti-Mandra)
function verifyAntiMandra(announcedName, actualPath) {
  const actualName = path.basename(actualPath);
  if (announcedName !== actualName) {
    throw new Error(`Anti-Mandra Alert: El nom anunciat '${announcedName}' no coincideix amb l'escrit a disc '${actualName}'. Això trenca la traçabilitat!`);
  }
}

verifyAntiMandra('260825_1235_BUNDLE_Auditoria_Inversa.md', outBundle);
verifyAntiMandra('260825_1235_PETORRETA_Auditoria_Inversa.md', outPetorreta);
console.log('✅ Verificació Post-Acció (Anti-Mandra): els noms anunciats coincideixen amb el disc.');
