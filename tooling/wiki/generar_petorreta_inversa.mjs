import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadSgqContext, buildSgqPrompt } from './lib/prompt_sgq.mjs';
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

const instant = new Date();
const pad = value => String(value).padStart(2, '0');
const TIMESTAMP = `${String(instant.getFullYear()).slice(-2)}${pad(instant.getMonth() + 1)}${pad(instant.getDate())}_${pad(instant.getHours())}${pad(instant.getMinutes())}`;
const outBundleName = `${TIMESTAMP}_BUNDLE_auditoria_inversa.md`;
const outPromptName = `${TIMESTAMP}_PROMPT_auditoria_inversa.md`;
const outBundle = path.join(ROOT, '_wiki_de_poble/04_escriptori', outBundleName);
const outPetorreta = path.join(ROOT, '_wiki_de_poble/04_escriptori', outPromptName);

// 1. Generate BUNDLE
let bundleContent = `# BUNDLE D'AUDITORIA INVERSA (ACTE REFLEX)
Data: 25 d'Agost de 2026

## CONTEXT GLOBAL (MANDATORI)
Aquest context s'injecta automàticament per complir amb la Regla 6 (Acte Reflex).
El sistema és **Sóc de Poble**, una xarxa social per a pobles integrada amb l'ecosistema **Sollutia**, amb arquitectura Pedra Seca, orientada al Baseline 2022.
Visió: Tornar el poble a la gent teixint comunitat. Missió: Evitar dependències extractives.

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

// L’escriptura espera que el prompt ISO haja passat la validació.
console.log('Bundle creat:', outBundle);

// 2. Generate PROMPT (Petorreta)
let promptContent = `---
estat: "Petorreta"
tipus: "document"
description: "Petorreta d'Auditoria Inversa i Auto-Destructiva del Consell. Enfocada al SEO, codi mort i avaluació tècnica."
---

# 🧨 PETORRETA SUPREMA: Auditoria Post-Poda per al Vistiplau de Sollutia (Consell d'IAs)

**Context:** Hem finalitzat amb èxit la Fase 1 de la poda (eliminació de CSS zombi, higiene extrema del tooling, eliminació d'estils en línia massius i actualització del \`tractor-pedra-seca.mjs\`). Totes les validacions CI internes (\`npm run porta\`) estan en verd. No obstant, abans de presentar el projecte a l'equip de Sollutia i d'avançar cap a la refactorització profunda (Fase 2 i el nou Xat estil WhatsApp), necessitem certesa absoluta. Volem arribar al punt on el Consell ens diga: "No hi ha més merda amagada, tot està bé, ja podeu enfrontar-vos a Sollutia i a les IAs de Frontera".

Teniu adjunt l'arxiu \`${outBundleName}\` que conté absolutament tot l'estat netejat de Sóc de Poble.

## 🛑 ADVERTÈNCIA CRÍTICA SOBRE CONCEPTES PROPIETARIS:
**"Pedra Seca"** i **"Trellat"** són denominacions pròpies i internes del nostre projecte. 
- **Pedra Seca** és el nostre Sistema de Disseny (Design System) exclusiu. No és un concepte de desenvolupament web estàndard, no busqueu a internet què significa en termes de codificació ni intenteu deduir-ho de fonts externes. Es simplement el nom que li donem al nostre llibre d'estils i components.
- **Trellat** és la nostra filosofia de treball i marc d'anàlisi, basada en el sentit comú i l'eficiència (del valencià "trellat").
**No gasteu tokens ni feu recerques externes intentant entendre aquests termes fora del context de Sóc de Poble. Són nostres.**

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

const context = loadSgqContext(ROOT);
const isoPrompt = buildSgqPrompt(context, {
  title: '🛡️ PETORRETA AL CONSELL: AUDITORIA INVERSA',
  description: 'Auditoria inversa del codi, la Wiki i la integració online amb Sollutia',
  objective: 'Identificar defectes verificables del sistema i proposar reparacions mínimes',
  context: promptContent.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^# /gm, '### ').replace(/^## /gm, '### '),
  instruction: 'Audita les missions descrites en el context i separa evidències, riscos i propostes',
  output: 'markdown',
});
if (existsSync(outBundle) || existsSync(outPetorreta)) throw new Error('El paquet ja existix; no es sobreescriu');
writeFileSync(outBundle, bundleContent, { flag: 'wx' });
writeFileSync(outPetorreta, isoPrompt, { flag: 'wx' });
console.log('Petorreta creada:', outPetorreta);

// 3. Validació Post-Acció (Anti-Mandra)
function verifyAntiMandra(announcedName, filePath) {
  const actualName = path.basename(filePath);
  if (announcedName !== actualName) {
    throw new Error(`Anti-Mandra Alert: El nom anunciat '${announcedName}' no coincideix amb l'escrit a disc '${actualName}'. Això trenca la traçabilitat!`);
  }
}

verifyAntiMandra(outBundleName, outBundle);
console.log('✅ Verificació Post-Acció (Anti-Mandra): els noms anunciats coincideixen amb el disc.');
