#!/usr/bin/env node
/**
 * teixidora_sinapsis.mjs — La Teixidora de Sinapsis (Enllaçat Intel·ligent del Cos)
 * Destí: 02_ACTUAR_Maquina_Tecnica/scripts/teixidora_sinapsis.mjs
 *
 * SUBSTITUEIX I DEROGA orphan_linker.mjs (la "Llei Zero Enllaços").
 * Aquell script ARRANCAVA els [[enllaços]] del cos i els soterrava al frontmatter:
 * és el que va deixar la 00_BIOS muda. Esta fa exactament el contrari, complint
 * la Regla 10 d'AUDITORIA_CANONICA (Integritat Neuronal): els conceptes clau
 * s'enllacen [[...]] la primera volta que apareixen AL COS DEL TEXT.
 *
 * PRINCIPIS (heretats de purge_ghost_links.mjs v2, el millor gos pastor viu):
 *  1. NO DESTRUCTIVA: dry-run real per defecte, sense crear Actes.
 *     El --DISABLED-procedeix legacy està tombstonat fins integrar pla+Reflex+rollback.
 *  2. Mai enllaços a #capçaleres ni a ^blocs: sempre a arxius complets.
 *  3. El codi és sagrat: frontmatter, blocs ``` i codi inline `..` es protegixen
 *     abans de tocar res (prohibit lobotomitzar exemples, cas Robotomia).
 *  4. Jerarquia del Mas: els Troncals (BIOS, GENOTIP, Governança...) guanyen
 *     tota col·lisió de noms; després mana el pilar (SER > GOVERNAR > SABER >
 *     ACTUAR); els docs `arxivat`/`deprecated` NO reben enllaços nous.
 *  5. Jurisdiccions excloses: Sollutia i els miralls d'agents no es toquen.
 *  6. Primera menció i prou: un concepte s'enllaça UNA volta per document,
 *     amb pressupost màxim per no fer sopa blava (defecte: 12).
 *  7. Passada estructural: les sinapsis nues («## Sinapsis» amb llistes sense
 *     corxetes, peus «**Tornar a:** X», punters «👉 X») es curen sempre,
 *     fora de pressupost. És el cas exacte de la 00_BIOS.
 *
 * ÚS:
 *   node teixidora_sinapsis.mjs                    # dry-run per stdout
 *   node teixidora_sinapsis.mjs --DISABLED-procedeix        # bloquejat fail-closed
 *   node teixidora_sinapsis.mjs --json             # resum JSON (Consola Term.)
 *   node teixidora_sinapsis.mjs --max=8            # pressupost per document
 *   node teixidora_sinapsis.mjs --fitxer=00_SER_Brain_Identitat/00_BIOS.md
 *
 * Zero dependències externes (Pedra Seca). Node >= 20 (fa servir lookbehind).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildWikiIndex } from './lib/wiki_walker.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { getTimestamp } from './lib/termodinamic.mjs';
// Reflex_petorreta imports are currently disabled / mocked bypassed
import { WIKI_DIR } from './lib/project_paths.mjs';

const ESCRIPTORI = '04_escriptori';

/* ------------------------------------------------------------------ *
 * 0. CONFIGURACIÓ DE JERARQUIA (el mapa topogràfic del Mas)           *
 * ------------------------------------------------------------------ */

/** Jurisdiccions on la Teixidora NO cus per defecte (ni com a font ni destí). */
const JURISDICCIONS_EXCLOSES = [
  '00_SER_Brain_Identitat/Sollutia',
];

/** Pilars que mai es MODIFIQUEN (memòria morta o treball efímer). */
const PILARS_NO_MODIFICAR = ['90_historic', ESCRIPTORI];

/** Pilars que mai són DESTÍ d'enllaç automàtic (noms efímers). */
const PILARS_NO_DESTI = ['90_historic', ESCRIPTORI];

/** Documents Troncals (Tier 0): guanyen tota col·lisió. Font: 00_INDEX. */
const TRONCALS = new Set([
  '00_BIOS', '00_INDEX', '02_GENOTIP', '01_IDENTITAT', '02_FAMILIA',
  'Soci_Sollutia', '01_trellat', 'DOC_Governanca', 'ESTANDARD_Pedra_Seca',
  'FORJA_TO_CORE', '00_GLOSSARI_CANONIC', '00_visio_i_pilars',
  'LLEI_05_Privacitat', 'DOC_Taula_Mestra',
]);

/** Pes per pilar: qui mana quan dos fitxers es diuen quasi igual. */
const PES_PILAR = {
  '00_SER_Brain_Identitat': 90,
  '03_GOVERNAR_Normativa_Regles': 80,
  '01_SABER_Cultura_Coneixement': 70,
  '02_ACTUAR_Maquina_Tecnica': 60,
};

/** Paraules soles massa comunes: mai són candidat per si soles. */
const STOPLIST = new Set([
  'readme', 'index', 'skill', 'skills', 'agents', 'scripts', 'plantilles',
  'arquitectura', 'identitat', 'governanca', 'seguretat', 'disseny',
  'trellat', 'projecte', 'antigravity', 'wiki', 'core', 'doc',
]);

const MIN_LLARG_CANDIDAT = 5;
const MIN_COS_VIU = 80; // docs quasi buits: no es toquen

/* ------------------------------------------------------------------ *
 * 1. CLI                                                              *
 * ------------------------------------------------------------------ */
const args = process.argv.slice(2);
const PROCEDEIX = args.includes('--procedeix');
const JSON_OUT = args.includes('--json');
const MAX_PER_DOC = Number((args.find(a => a.startsWith('--max=')) || '--max=12').split('=')[1]) || 12;
const NOMES_FITXER = (args.find(a => a.startsWith('--fitxer=')) || '').split('=')[1] || null;

const aPosix = (p) => p.split(path.sep).join('/');
const dinsDe = (rel, llista) => llista.some(j => aPosix(rel).startsWith(j + '/') || aPosix(rel) === j);
const escapaRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ------------------------------------------------------------------ *
 * 2. SEGMENTADOR: frontmatter i blocs de codi queden fora de perill.  *
 *    (Mateixa doctrina que purge_ghost_links v2.)                     *
 * ------------------------------------------------------------------ */
function segmentaMarkdown(content) {
  const segments = [];
  let resta = content;

  if (/^---\r?\n/.test(resta)) {
    const m = resta.slice(4).match(/\r?\n---(\r?\n|$)/);
    if (m) {
      const tall = 4 + m.index + m[0].length;
      segments.push({ codi: true, text: resta.slice(0, tall) });
      resta = resta.slice(tall);
    }
  }

  const linies = resta.split(/(\r?\n)/);
  let buf = '';
  let enFence = false;
  let marca = '';
  let llargariaMarca = 0;
  const buida = (codi) => { if (buf) segments.push({ codi, text: buf }); buf = ''; };

  for (const tros of linies) {
    const obri = tros.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (!enFence && obri) {
      buida(false); enFence = true; marca = obri[1][0]; llargariaMarca = obri[1].length; buf += tros;
    } else if (enFence) {
      buf += tros;
      const tanca = tros.match(/^\s{0,3}(`{3,}|~{3,})\s*$/);
      if (tanca && tanca[1][0] === marca && tanca[1].length >= llargariaMarca) { buida(true); enFence = false; }
    } else {
      buf += tros;
    }
  }
  buida(enFence);
  return segments;
}

/** Emmascara dins d'un segment viu tot allò intocable. */
function emmascara(text) {
  const rebost = [];
  const guarda = (m) => { rebost.push(m); return `\u0001${rebost.length - 1}\u0001`; };
  let t = text
    .replace(/<!--[\s\S]*?-->/g, guarda)           // HTML comments
    .replace(/<[^>]+>/g, guarda)                   // HTML tags
    .replace(/\$\$[\s\S]*?\$\$/g, guarda)          // Math blocks
    .replace(/\$[^$\n]+\$/g, guarda)               // Inline math
    .replace(/\[\^[^\]]+\]/g, guarda)              // Footnotes
    .replace(/!?\[\[[^\]]*\]\]/g, guarda)          // wikilinks i embeds existents
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, guarda)     // enllaços markdown [x](y)
    .replace(/(`+)([\s\S]*?)\1/g, guarda)          // codi inline
    .replace(/https?:\/\/\S+/g, guarda)            // URLs nues
    .replace(/^#{1,6} .*$/gm, guarda);             // capçaleres: no s'hi cus
  return { t, rebost };
}
const restaura = (text, rebost) => {
  let actual = text;
  for (let volta = 0; volta <= rebost.length; volta++) {
    const seguent = actual.replace(/\x01(\d+)\x01/g, (_, i) => rebost[Number(i)]);
    if (seguent === actual) return actual;
    actual = seguent;
  }
  if (/\x01\d+\x01/.test(actual)) throw new Error('Emmascarament niat no restaurable; es cancel·la sense escriure.');
  return actual;
};

/* ------------------------------------------------------------------ *
 * 3. ÍNDEX DE DESTINS amb jerarquia i àlies.                          *
 * ------------------------------------------------------------------ */
function pesDe(relPath, base, estat) {
  if (TRONCALS.has(base)) return 100;
  const pilar = aPosix(relPath).split('/')[0];
  let pes = PES_PILAR[pilar] ?? 10;
  if (estat === 'canonic') pes += 15;
  return pes;
}

function candidatsDe(base, fmData, cosViu) {
  const c = new Set();
  const afig = (s) => {
    if (!s) return;
    const net = String(s).trim();
    if (net.length < MIN_LLARG_CANDIDAT && !TRONCALS.has(base)) return;
    if (STOPLIST.has(net.toLowerCase())) return;
    if (/^[a-zàèéíòóúç]+$/i.test(net) && !net.includes('_') && net.length < 10) return; // paraula sola curta
    c.add(net);
  };
  afig(base);
  const sensePrefix = base.replace(/^\d+_\d+_/, '').replace(/^\d+_/, '');
  afig(sensePrefix);
  afig(sensePrefix.replace(/_/g, ' '));
  const aliases = Array.isArray(fmData.aliases) ? fmData.aliases : [];
  for (const a of aliases) afig(a);
  const h1 = (cosViu.match(/^# (.+)$/m) || [])[1];
  if (h1) {
    const net = h1.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/^[\s:—-]+|[\s:—-]+$/g, '');
    if (net.length >= 8 && net.length <= 60 && !/[:|]/.test(net)) afig(net);
  }
  return [...c];
}

async function construixIndexDestins(mdDocs) {
  const perCandidat = new Map(); // candidatMinuscula -> { base, pes, candidat }
  const colisions = [];
  const targetables = new Map(); // base -> true

  for (const doc of mdDocs) {
    const rel = aPosix(doc.relPath);
    if (dinsDe(rel, JURISDICCIONS_EXCLOSES)) continue;
    if (PILARS_NO_DESTI.some(p => rel.startsWith(p + '/'))) continue;
    const base = doc.name.replace(/\.md$/, '');
    if (base.includes('_BUNDLE_') || base.includes('BUNDLE_') || base.includes('_PETORRETA_') || base.includes('PETORRETA_')) continue;
    const { data } = parseFrontmatter(doc.content);
    const estat = (data.estat || '').toLowerCase();
    if (estat === 'arxivat' || estat === 'deprecated') continue; // no enllacem cap a morts
    targetables.set(base, true);
    const pes = pesDe(doc.relPath, base, estat);
    const cos = doc.content;
    for (const cand of candidatsDe(base, data, cos)) {
      const clau = cand.toLowerCase();
      const previ = perCandidat.get(clau);
      if (!previ) {
        perCandidat.set(clau, { base, pes, candidat: cand });
      } else if (previ.base !== base) {
        if (pes > previ.pes) {
          colisions.push({ candidat: cand, guanya: base, perd: previ.base });
          perCandidat.set(clau, { base, pes, candidat: cand });
        } else {
          colisions.push({ candidat: cand, guanya: previ.base, perd: base });
        }
      }
    }
  }
  // Ordenats de llarg a curt: el match llarg mana.
  const ordenats = [...perCandidat.values()].sort((a, b) => b.candidat.length - a.candidat.length);
  return { ordenats, perCandidat, targetables, colisions };
}

/** Resol un nom nu (sinapsis, Tornar a:, 👉) cap a un base real. */
function resolNom(nomBrut, perCandidat, targetables) {
  let n = nomBrut.trim().replace(/[.,;:!]+$/, '').trim();
  if (!n || n.length > 80) return null;
  const proves = [n, n.replace(/ /g, '_'), n.replace(/_/g, ' ')];
  for (const p of proves) {
    if (targetables.has(p)) return p;
    const hit = perCandidat.get(p.toLowerCase());
    if (hit) return hit.base;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 4. LA COSTURA: primera menció + passada estructural.                *
 * ------------------------------------------------------------------ */
function cusDocument(doc, index) {
  const base = doc.name.replace(/\.md$/, '');
  const segments = segmentaMarkdown(doc.content);
  const jaEnllacats = new Set(
    [...doc.content.matchAll(/\[\[([^\]|#]+)/g)].map(m => m[1].trim())
  );
  let afegits = 0;
  const detall = [];

  const nous = segments.map(seg => {
    if (seg.codi) return seg.text;
    let { t, rebost } = emmascara(seg.text);

    /* 4a. PASSADA ESTRUCTURAL (sinapsis nues, Tornar a:, 👉) — sense pressupost */
    const estructural = (nomBrut) => {
      const desti = resolNom(nomBrut, index.perCandidat, index.targetables);
      if (!desti || desti === base) return null;
      jaEnllacats.add(desti);
      afegits++;
      detall.push({ tipus: 'estructural', desti, text: nomBrut.trim() });
      const net = nomBrut.trim();
      return net === desti ? `[[${desti}]]` : `[[${desti}|${net}]]`;
    };

    // 👉 Punter  /  → Punter
    t = t.replace(/(^|\n)(\s*(?:👉|→)\s*)([^\n\x01]+)/g, (m, pre, fletxa, resta) => {
      const peces = resta.split(/,\s*/).map(p => estructural(p) || p.trim());
      return `${pre}${fletxa}${peces.join(', ')}`;
    });

    // **Tornar a:** X, Y
    t = t.replace(/(\*\*Tornar a:\*\*\s*)([^\n\x01]+)/g, (m, pre, resta) => {
      const peces = resta.split(/,\s*/).map(p => estructural(p) || p.trim());
      return `${pre}${peces.join(', ')}`;
    });

    // Llistes sota capçaleres de Sinapsis / Veure també (les capçaleres estan
    // emmascarades, així que detectem el bloc per la línia original del segment).
    const teSinapsis = /#{2,3} .*(Sinapsi|Sinapsis|Veure també|Enllaços de Tornada)/i.test(seg.text);
    if (teSinapsis) {
      t = t.replace(/(^|\n)(\s*[-*]\s+)([^\n\x01[]+)$/gm, (m, pre, guio, nom) => {
        const cusit = estructural(nom);
        return cusit ? `${pre}${guio}${cusit}` : m;
      });
    }

    /* 4b. PRIMERA MENCIÓ AL COS — amb pressupost */
    for (const { base: desti, candidat } of index.ordenats) {
      if (afegits >= MAX_PER_DOC + detall.filter(d => d.tipus === 'estructural').length) break;
      if (desti === base || jaEnllacats.has(desti)) continue;
      const re = new RegExp(`(?<![\\w\\[\\]|/#\\-.])${escapaRegex(candidat)}(?![\\w\\]|/#\\-])`);
      const m = re.exec(t);
      if (!m) continue;
      const trobat = m[0];
      const enllac = trobat === desti ? `[[${desti}]]` : `[[${desti}|${trobat}]]`;
      t = t.slice(0, m.index) + enllac + t.slice(m.index + trobat.length);
      jaEnllacats.add(desti);
      afegits++;
      detall.push({ tipus: 'concepte', desti, text: trobat });
    }

    return restaura(t, rebost);
  });

  let nouContingut = nous.join('');
  
  const pilar = doc.relPath.split(/[/\\]/)[0];
  let categoriaStr = 'General';
  if (pilar.includes('SER')) categoriaStr = 'Identitat';
  else if (pilar.includes('SABER')) categoriaStr = 'Coneixement';
  else if (pilar.includes('ACTUAR')) categoriaStr = 'Maquina';
  else if (pilar.includes('GOVERNAR')) categoriaStr = 'Govern';
  else if (pilar.includes('ARXIU')) categoriaStr = 'Arxiu';

  // La taxonomia es gestiona exclusivament al Frontmatter.
  // Ja no s'injecten blocs '## Taxonomia' al cos del text per evitar pol·luir el Graf visual d'Obsidian.

  return { nouContingut, afegits, detall };
}

/* ------------------------------------------------------------------ *
 * 5. MOTOR PRINCIPAL                                                  *
 * ------------------------------------------------------------------ */
export async function teixeix(wikiDir = WIKI_DIR) {


  if (PROCEDEIX) {
    console.log('🤖 Operant la Teixidora en mode escriptura.');
  }
  const { mdDocs } = await buildWikiIndex(wikiDir);
  const index = await construixIndexDestins(mdDocs);

  const resum = {
    ok: true,
    mode: PROCEDEIX ? 'ESCRIPTURA' : 'DRY-RUN',
    fitxers_revisats: 0,
    fitxers_modificats: 0,
    enllacos_afegits: 0,
    colisions: index.colisions.length,
    canvis: [],
  };

  const docsToUpdate = [];

  for (const doc of mdDocs) {
    const rel = aPosix(doc.relPath);
    if (NOMES_FITXER && rel !== aPosix(NOMES_FITXER)) continue;
    if (doc.name.includes('_BUNDLE_') || doc.name.includes('BUNDLE_') || doc.name.includes('_PETORRETA_') || doc.name.includes('PETORRETA_')) continue;
    if (dinsDe(rel, JURISDICCIONS_EXCLOSES)) continue;
    if (PILARS_NO_MODIFICAR.some(p => rel.startsWith(p + '/'))) continue;

    const { body } = parseFrontmatter(doc.content);
    if ((body || '').trim().length < MIN_COS_VIU) continue;

    resum.fitxers_revisats++;
    const { nouContingut, afegits, detall } = cusDocument(doc, index);
    if (afegits === 0 || nouContingut === doc.content) continue;

    resum.fitxers_modificats++;
    resum.enllacos_afegits += afegits;
    resum.canvis.push({ fitxer: rel, afegits, detall });

    if (PROCEDEIX) {
      docsToUpdate.push({ doc, nouContingut });
    }
  }

  if (PROCEDEIX && docsToUpdate.length > 0) {
    for (const { doc, nouContingut } of docsToUpdate) {
      await fs.writeFile(path.join(wikiDir, doc.relPath), nouContingut, 'utf8');
    }
  }

  /* Acta a l'Escriptori (sempre en dry-run; en escriptura, com a registre). */
  const ts = getTimestamp();
  const nomActa = `${ts}_ACTA_Teixidora_Proposta_Insercio_Enllacos_Interns_Cos_Documents_Canonics.md`;
  const dirActa = path.join(wikiDir, ESCRIPTORI);
  const linies = [
    `# Acta de la Teixidora de Sinapsis (${resum.mode})`,
    '',
    `- Fitxers revisats: ${resum.fitxers_revisats}`,
    `- Fitxers ${PROCEDEIX ? 'modificats' : 'amb proposta'}: ${resum.fitxers_modificats}`,
    `- Enllaços ${PROCEDEIX ? 'cosits' : 'proposats'}: ${resum.enllacos_afegits}`,
    `- Col·lisions de nom resoltes per jerarquia: ${resum.colisions}`,
    '',
    ...resum.canvis.map(c =>
      `## ${c.fitxer} (+${c.afegits})\n` +
      c.detall.map(d => `- [${d.tipus}] «${d.text}» → [[${d.desti}]]`).join('\n')
    ),
    '',
    ...(index.colisions.length
      ? ['## Col·lisions (guanya el pes de jerarquia)',
         ...index.colisions.map(k => `- «${k.candidat}»: ${k.guanya} guanya a ${k.perd}`)]
      : []),
    '',
    '> (Escriptura reactivada)',
  ];
  try {
    if (PROCEDEIX) {
      await fs.mkdir(dirActa, { recursive: true });
      await fs.writeFile(path.join(dirActa, nomActa), linies.join('\n'), 'utf8');
      resum.acta = `${ESCRIPTORI}/${nomActa}`;
    } else {
      resum.acta = 'No generada (Dry-Run forçós)';
    }
    if (!PROCEDEIX) return resum;
  } catch {
    resum.acta = null; // Escriptori bloquejat: el resum ix igualment per consola.
  }

  return resum;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  teixeix()
    .then(r => {
      if (JSON_OUT) {
        console.log(JSON.stringify(r, null, 2));
      } else {
        console.log(`\n🧵 [TEIXIDORA] ${r.mode}`);
        console.log(`   Fitxers revisats: ${r.fitxers_revisats}`);
        console.log(`   Fitxers ${r.mode === 'ESCRIPTURA' ? 'modificats' : 'amb proposta'}: ${r.fitxers_modificats}`);
        console.log(`   Enllaços: ${r.enllacos_afegits} | Col·lisions: ${r.colisions}`);
        if (r.acta) console.log(`   Acta: ${r.acta}`);
        if (r.mode !== 'ESCRIPTURA') console.log('   → No s’ha escrit res; qualsevol cosit futur necessita un pla canònic.');
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ [TEIXIDORA] Error crític:', err);
      process.exit(1);
    });
}
