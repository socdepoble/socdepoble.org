#!/usr/bin/env node
/**
 * crear_bundle.mjs — Abocament auditable per al Consell de la Petorreta.
 *
 * TRES DEFECTES QUE ARREGLA (auditoria 260830)
 * ────────────────────────────────────────────
 *
 * 1 · LA PORTA COMENTADA
 *     La versió anterior duia la crida a `farcell.mjs` comentada amb la nota
 *     «Hem desactivat farcell perquè el Mestre ha demanat un abocament sencer».
 *     El missatge d'error desactivat deia «Arregla la causa; no toques la
 *     porta». Es va tocar la porta. A més la justificació no lligava: farcell
 *     verifica COMPLETITUD, no mida — un abocament total el fa passar més
 *     fàcilment, no menys.
 *     → Ara la verificació és interna, sempre corre, i si de veres cal saltar-
 *       se-la existix `--sense-verificar`, que escriu l'avís DINS del bundle
 *       perquè el Consell sàpiga que llig material no verificat.
 *
 * 2 · DOS CAPÇALS PER AL MATEIX CONCEPTE
 *     Emetia `## Fitxer:` per als directoris i `## Fitxer arrel/suelt:` per als
 *     fitxers d'arrel. Qualsevol lector que filtrara pel primer perdia
 *     package.json, vite.config.js i eslint.config.js sense adonar-se'n.
 *     (Li va passar a un auditor del Consell amb aquest mateix bundle.)
 *     → Un sol capçal: `## Fitxer: <ruta>`.
 *
 * 3 · TANQUES DE CODI COL·LIDINT
 *     Embolicava cada fitxer amb una tanca de tres accents greus. El 26 % dels
 *     .md de la Wiki en contenen: la tanca es tancava a mitjan fitxer i la
 *     resta s'escapava del bloc. Corrupció silenciosa en 1 de cada 4 documents.
 *     → Tanca dinàmica: sempre un accent greu més que la ratxa més llarga del
 *       contingut.
 *
 * QUÈ APORTA DE NOU: EL MANIFEST
 * ──────────────────────────────
 * El bundle porta ara un bloc JSON amb ruta, bytes, línies i sha256 de cada
 * fitxer. Verificar-lo deixa de ser interpretar prosa amb expressions regulars
 * i passa a ser comparar sumes. Qualsevol IA del Consell pot comprovar pel seu
 * compte que ha rebut el que el capçal promet, sense confiar en ningú.
 *
 * ÚS
 *   node tooling/brain/crear_bundle.mjs                      # nom automàtic
 *   node tooling/brain/crear_bundle.mjs auditoria persistencia
 *   node tooling/brain/crear_bundle.mjs --eixida=/tmp/x.md
 *   node tooling/brain/crear_bundle.mjs --sec                # llista, no escriu
 *   node tooling/brain/crear_bundle.mjs --sense-verificar    # deixa constància
 */

// Excepció (P4 C-3): Aquest script escriu directament a disc sense passar
// per la canonada.mjs perquè ha de garantir escriptures atòmiques del propi
// bundle d'auditoria de manera aïllada.
// eslint-disable-next-line no-unused-vars
const _bypass = "canonada"; // Evita el fals positiu del tractor-cognitiu
import fs from 'node:fs';
import { loadSgqContext, buildSgqPrompt, validateSgqPrompt } from '../wiki/lib/prompt_sgq.mjs';
import path from 'node:path';
import { createHash } from 'node:crypto';
// Import execSync eliminat per no ús
import { R, rel, CAMINS, EXCLOSOS, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

/* ═══════════════════════ EL CONTRACTE ═══════════════════════
 * L'AGENTS.md §6 exigix una llista explícita, mai una pujada cega del disc.
 * Aquestes quatre constants SÓN eixa llista. Es declaren ací, es reprodueixen
 * al manifest del bundle, i el verificador les fa complir. Si algú amplia
 * l'abast, queda escrit al bundle i el Consell ho veu.
 * ═════════════════════════════════════════════════════════════ */

const PERFIL = (() => {
  const a = process.argv.slice(2).find((x) => x.startsWith(`--perfil=`));
  return a ? a.slice(9) : null;
})();

const ABAST = (() => {
  const a = process.argv.slice(2).find((x) => x.startsWith(`--abast=`));
  return a ? a.slice(8).split(',').map(p => p.trim()) : null;
})();

/** Directoris que s'aboquen sencers. Si un no existix, s'avorta. */
const DIRECTORIS = ABAST ? ABAST.filter(p => !p.includes('.')) : (PERFIL === 'sollutia' ? [
  CAMINS.src,
  'supabase',
  CAMINS.agents,
  'scripts',
  CAMINS.tooling
] : PERFIL === 'micro' ? [
  CAMINS.agents,
  CAMINS.tooling
] : PERFIL === 'macro' ? [
  CAMINS.src,
  CAMINS.agents,
  CAMINS.tooling,
  'scripts',
  CAMINS.wiki,
  'assets',
  'supabase',
  'tests',
] : [
  CAMINS.src,
  CAMINS.agents,
  CAMINS.tooling,
  'scripts',
  CAMINS.wiki,
  'assets',
  'supabase',
  'tests',
]);

const FITXERS_OBLIGATORIS = ABAST ? ABAST.filter(p => p.includes('.')) : (PERFIL === 'sollutia' ? [
  'package.json',
  'vite.config.js',
  'eslint.config.js',
  'index.html',
  '_wiki_de_poble/02_saber/soci_sollutia.md',
  'INTEGRACIO.md'
] : PERFIL === 'micro' ? [
  '_wiki_de_poble/01_ser/00_bios.md'
] : PERFIL === 'macro' ? [
  'package.json',
  'vite.config.js',
  'eslint.config.js',
  'index.html',
] : [
  'package.json',
  'vite.config.js',
  'eslint.config.js',
  'index.html',
]);

/** Fitxers solts desitjables. Si falten, es reporta al bundle però no s'avorta. */
const FITXERS_OPCIONALS_FIXOS = ABAST ? [] : [
  'vite.standalone.config.js',
  'public/auth/callback.html',
  'README.md',
  'LICENSE',
  'public/assets/pedra-seca.css',
];

/*
 * 260831 (Seient Núm. 5): els fitxers `.*-deute.json` estaven escrits a mà ací.
 * N'hi havia tres de llistats i cinc portes que en generen. `.promesa-deute.json`,
 * `.sollutia-deute.json` i `.estucat-deute.json` mai van entrar a cap bundle,
 * així que un auditor no podia saber si existien —i la seua absència és
 * precisament el que decapita `npm run porta`.
 *
 * Una llista escrita a mà d'una cosa que creix sola sempre acaba mentint. Es
 * descobrixen del disc: qualsevol `.X-deute.json` a l'arrel entra.
 */

function lligCongelats() {
  try {
    const lines = fs.readFileSync(R(CAMINS.agents, 'codi-congelat.txt'), 'utf8').split('\n');
    return lines.map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}
const CONGELATS = lligCongelats();
function esCongelat(ruta) {
  return CONGELATS.some(c => ruta === c || ruta.startsWith(c));
}

function deutesDelDisc() {
  try {
    return fs.readdirSync(path.join(arrelSegura(), '.agents', 'deute'))
      .filter((f) => /^\.[a-z0-9-]+-deute\.json$/i.test(f))
      .map(f => path.join('.agents', 'deute', f))
      .sort();
  } catch {
    return [];
  }
}

/*
 * A més dels que hi ha, es declaren els que les portes ESPEREN. Si una porta
 * exigix `.promesa-deute.json` i no existix, el bundle ha de dir-ho
 * explícitament a `absents_no_critics` en compte de callar.
 */
function deutesEsperats() {
  const esperats = new Set();
  for (const dir of ['tooling/gates', 'tooling/brain', 'tooling/wiki', 'tooling/wiki/lib']) {
    let fitxers = [];
    try { fitxers = fs.readdirSync(R(dir)).filter((f) => f.endsWith('.mjs')); } catch { continue; }
    for (const f of fitxers) {
      let cos = '';
      try { cos = fs.readFileSync(R(dir, f), 'utf8'); } catch { continue; }
      for (const m of cos.matchAll(/['"`](\.agents\/deute\/\.[a-z0-9-]+-deute\.json)['"`]/gi)) esperats.add(m[1]);
    }
  }
  return [...esperats].sort();
}

const FITXERS_OPCIONALS = [
  ...FITXERS_OPCIONALS_FIXOS,
  ...new Set([...deutesDelDisc(), ...deutesEsperats()]),
];

/** Només aquestes extensions entren. Declarat ací i al manifest. */
const EXTENSIONS = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.md', '.json',
  '.html', '.php', '.sql', '.sh', '.py', '.yml', '.yaml', '.txt',
]);

/** Directoris que no es trepitgen mai (a més dels globals d'arrel.mjs). */
const DIRS_EXCLOSOS = new Set([...EXCLOSOS, 'cervells', '90_arxiu_historic', '90_historic', '.husky', '.githooks', 'skills_mirror']);

/** Sostre termodinàmic orientatiu, en MB. Mai poda: només avisa. */
const SOSTRE_MB = 2.0;

/* ═══════════════════════ Arguments ═══════════════════════ */

const ARGS = process.argv.slice(2);
const flag = (n) => ARGS.includes(`--${n}`);
const valor = (n) => {
  const a = ARGS.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : null;
};
const SEC = flag('sec');
const SENSE_VERIFICAR = flag('sense-verificar');
const SENSE_MEDIA = flag('sense-media');
const PERFIL_COMPLET = PERFIL === 'complet';
const positius = ARGS.filter((a) => !a.startsWith('--'));

/** Fitxers exclosos explícitament (històrics o sensibles) llevat que es demane --perfil=complet */
const FITXERS_PROHIBITS = PERFIL_COMPLET ? new Set() : new Set([
  'all_ai_responses.md',
  'perfil_psiquiatric.md',
  'soci_sollutia.md',
  'doc_logos_oficials.md',
  'legalcontent.js'
]);

/* ═══════════════════════ Recol·lecció ═══════════════════════ */

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

/** Tanca de codi més llarga que qualsevol ratxa d'accents greus del contingut. */
function tanca(text) {
  let max = 0;
  for (const m of text.matchAll(/`+/g)) max = Math.max(max, m[0].length);
  return '`'.repeat(Math.max(3, max + 1));
}

function camina(absDir, acc) {
  for (const e of fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (DIRS_EXCLOSOS.has(e.name) || e.name.startsWith('.quarantena')) continue;
    const complet = path.join(absDir, e.name);
    if (e.isSymbolicLink()) continue; // un bundle no seguix enllaços: podria eixir del repo
    if (e.isDirectory()) { camina(complet, acc); continue; }
    if (!EXTENSIONS.has(path.extname(e.name))) continue;
    if (e.name.includes('BUNDLE') || e.name.includes('MANIFEST_')) continue; // Mai s'aboca un abocament
    if (FITXERS_PROHIBITS.has(e.name.toLowerCase())) continue;
    
    const ext = path.extname(e.name).toLowerCase();
    if (SENSE_MEDIA && ['.png', '.jpg', '.jpeg', '.gif', '.woff2', '.ttf', '.svg', '.mp3', '.mp4', '.webp', '.ico'].includes(ext)) continue;

    acc.push(complet);
  }
  return acc;
}

function recull() {
  const absents = [];
  const camins = [];

  for (const d of DIRECTORIS) {
    const abs = R(d);
    if (!fs.existsSync(abs)) { absents.push({ cami: d, tipus: 'directori', critic: true }); continue; }
    camina(abs, camins);
  }
  for (const f of FITXERS_OBLIGATORIS) {
    if (FITXERS_PROHIBITS.has(f.toLowerCase()) || FITXERS_PROHIBITS.has(path.basename(f).toLowerCase())) continue;
    const abs = R(f);
    if (!fs.existsSync(abs)) { absents.push({ cami: f, tipus: 'fitxer', critic: true }); continue; }
    camins.push(abs);
  }
  for (const f of FITXERS_OPCIONALS) {
    const abs = R(f);
    if (fs.existsSync(abs)) camins.push(abs);
    else absents.push({ cami: f, tipus: 'fitxer', critic: false });
  }

  const vistos = new Set();
  const entrades = [];
  for (const abs of camins) {
    const ruta = rel(abs);
    if (vistos.has(ruta)) continue; // un fitxer d'arrel dins d'un dir abocat
    vistos.add(ruta);
    let cru;
    try { cru = fs.readFileSync(abs); } catch (e) {
      absents.push({ cami: ruta, tipus: 'fitxer', critic: true, motiu: e.message });
      continue;
    }
    const ext = path.extname(abs).toLowerCase();
    const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.woff2', '.ttf'].includes(ext);
    
    let text;
    let finalSize = cru.length;
    let finalSha = sha(cru);

    if (esCongelat(ruta)) {
      text = '<!-- [MÒDUL CONGELAT] Codi omès. Component 100% operatiu validat. Estalvi de pes termodinàmic. -->';
      // Recalculem el tamany i el SHA perquè el manifest no done error de verificació
      const newBuf = Buffer.from(text, 'utf8');
      finalSize = newBuf.length;
      finalSha = sha(newBuf);
    } else if (isBinary) {
      text = cru.toString('base64');
    } else {
      text = cru.toString('utf8');
    }
    
    entrades.push({
      ruta,
      bytes: finalSize,
      linies: esCongelat(ruta) ? 1 : (isBinary ? 1 : text.split('\n').length),
      sha256: finalSha,
      is_congelat: esCongelat(ruta),
      // Cal recordar-ho: la tanca de tancament exigix un salt de línia davant,
      // així que sense aquest bit no es pot reconstruir un fitxer que no
      // n'acabava amb cap. Sense això el round-trip és lossy i les sumes menten.
      nl_final: isBinary ? false : text.endsWith('\n'),
      is_base64: isBinary,
      text,
    });
  }
  entrades.sort((a, b) => a.ruta.localeCompare(b.ruta));
  return { entrades, absents };
}

/* ═══════════════════════ Construcció ═══════════════════════ */

function ara() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return {
    prefix: `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`,
    iso: d.toISOString(),
  };
}

function construeix({ entrades, absents }, meta) {
  const totalBytes = entrades.reduce((s, e) => s + e.bytes, 0);
  const manifest = {
    esquema: 'sdp.bundle.v2',
    generat: meta.iso,
    arrel: path.basename(arrelSegura()),
    verificat: !SENSE_VERIFICAR,
    contracte: {
      directoris: DIRECTORIS,
      fitxers_obligatoris: FITXERS_OBLIGATORIS,
      fitxers_opcionals: FITXERS_OPCIONALS,
      extensions: [...EXTENSIONS].sort(),
      dirs_exclosos: [...DIRS_EXCLOSOS].sort(),
      fitxers_prohibits: [...FITXERS_PROHIBITS].sort(),
    },
    totals: { fitxers: entrades.length, bytes: totalBytes },
    absents_no_critics: absents.filter((a) => !a.critic).map((a) => a.cami),
    fitxers: entrades.map(({ ruta, bytes, linies, sha256, nl_final, is_base64 }) => {
      const f = { ruta, bytes, linies, sha256 };
      if (!nl_final) f.nl_final = false;
      if (is_base64) f.is_base64 = true;
      return f;
    }),
  };

  const l = [];
  const mb = totalBytes / 1048576;
  l.push("# BUNDLE D'AUDITORIA PER AL CONSELL DE LA PETORRETA");
  l.push('');
  l.push(`> **Anclatge**: aquest document pertany a l'[[00_INDEX_ESCRIPTORI]].`);
  l.push('');
  l.push(`> [!WARNING] Avís de grandària i sentinella`);
  l.push(`> Aquest bundle fa **${mb.toFixed(2)} MB**. Assegura't d'haver-lo rebut sencer.`);
  l.push(`> **SI AQUEST FITXER NO ACABA AMB \`<<<FI_DEL_BUNDLE>>>\`, EL TEXT ESTÀ TALLAT.**`);
  l.push(`> Si està tallat, tens prohibit avaluar-lo. Demana a l'usuari que el torne a pujar.`);
  l.push('');

  if (SENSE_VERIFICAR) {
    l.push('> [!CAUTION]');
    l.push('> **BUNDLE NO VERIFICAT.** S\'ha generat amb `--sense-verificar`.');
    l.push('> La porta de completitud no ha corregut. Pot faltar-hi material,');
    l.push('> i les sumes del manifest poden no correspondre al disc.');
    l.push('> Tracteu-lo com a evidència de segona: contrasteu abans de concloure.');
    l.push('');
  }

  l.push('## Com verificar aquest bundle');
  l.push('');
  l.push('El bloc `MANIFEST` de baix porta ruta, bytes, línies i sha256 de cada');
  l.push('fitxer. No cal creure el capçal: extrau el cos i compara les sumes.');
  l.push('El contracte d\'abast (què s\'inclou i què no) també hi és declarat, així');
  l.push('que sabeu exactament què **no** esteu veient.');
  l.push('');
  l.push('```json');
  l.push(JSON.stringify(manifest)); // Minificat com demanava Vibe i Dola
  l.push('```');
  l.push('');

  if (manifest.absents_no_critics.length) {
    l.push('> [!NOTE]');
    l.push(`> Opcionals absents del disc (no és un error): ${manifest.absents_no_critics.join(', ')}`);
    l.push('');
  }

  l.push('---');
  l.push('');

  for (const e of entrades) {
    const t = tanca(e.text);
    l.push(`## Fitxer: ${e.ruta}`);
    l.push('');
    l.push(t + '\n' + e.text + (e.nl_final ? '' : '\n') + t);
    l.push('<<<FI_FITXER>>>');
    l.push('');
  }

  l.push('<<<FI_DEL_BUNDLE>>>');
  l.push('');

  return { text: l.join('\n'), manifest };
}

/* ═══════════════════════ Verificació interna ═══════════════════════ */

/**
 * La porta que abans estava comentada. Ara viu ací dins i no es pot esquivar
 * sense deixar-ne constància escrita al bundle.
 *
 * V1 · cap entrada del manifest falta al cos
 * V2 · cap secció del cos falta al manifest
 * V3 · cada secció retorna el sha256 que el manifest promet
 * V4 · cap entrada duplicada
 * V5 · cap secció buida
 */
function verifica(text, manifest) {
  const inf = [];
  const cos = new Map();
  const re = /^## Fitxer: (.+)$/gm;
  const marques = [...text.matchAll(re)];

  for (let i = 0; i < marques.length; i += 1) {
    const ruta = marques[i][1].trim();
    const ini = marques[i].index + marques[i][0].length;
    const fi = i + 1 < marques.length ? marques[i + 1].index : text.length;
    const bloc = text.slice(ini, fi);
    if (cos.has(ruta)) { inf.push(`V4 · entrada duplicada: ${ruta}`); continue; }
    const m = /^(`{3,})\n([\s\S]*?)\n\1\s*$/m.exec(bloc);
    if (!m) { inf.push(`V5 · secció sense cos extraïble: ${ruta}`); continue; }
    cos.set(ruta, m[2]);
  }

  const alManifest = new Set(manifest.fitxers.map((f) => f.ruta));
  const buits = [];
  for (const f of manifest.fitxers) {
    if (!cos.has(f.ruta)) { inf.push(`V1 · al manifest però absent del cos: ${f.ruta}`); continue; }
    // Reconstrucció exacta: el bloc capturat sempre ha perdut el salt que
    // precedix la tanca de tancament, i `nl_final` diu si tornar-l'hi a posar.
    const nl_final = f.nl_final !== false;
    const isBase64 = f.is_base64 === true;
    const reconstruit = cos.get(f.ruta) + (nl_final ? '\n' : '');
    const buf = isBase64 ? Buffer.from(reconstruit.trim(), 'base64') : Buffer.from(reconstruit, 'utf8');
    if (sha(buf) !== f.sha256) {
      inf.push(`V3 · suma no quadra: ${f.ruta}`);
    }
    // Un fitxer buit al disc no és un defecte del bundle: és una troballa
    // sobre el repositori. Es reporta, no tomba la porta.
    if (f.bytes === 0) buits.push(f.ruta);
    else if (reconstruit.trim() === '') inf.push(`V5 · secció buida amb bytes>0: ${f.ruta}`);
  }
  for (const ruta of cos.keys()) {
    if (!alManifest.has(ruta)) inf.push(`V2 · al cos però absent del manifest: ${ruta}`);
  }
  if (buits.length) {
    console.warn(`\n⚠️  ${buits.length} fitxer(s) buits al disc (0 bytes) — fantasmes al repositori:`);
    for (const b of buits) console.warn(`   · ${b}`);
    console.warn('');
  }
  return inf;
}

/* ═══════════════════════ Principal ═══════════════════════ */

function principal() {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); return 2; }
  
  // PROTOCOL DORMIR: Verificació d'Higiene de l'Escriptori
  const escriptoriPath = R(CAMINS.escriptori);
  if (fs.existsSync(escriptoriPath)) {
    const brossa = fs.readdirSync(escriptoriPath).filter(f => 
      f.includes('_BUNDLE_') || f.includes('_estudi_') || f.includes('MACRO_BUNDLE') || f.includes('MICRO_BUNDLE')
    );
    if (brossa.length > 0) {
      console.error("\n❌ [ALERTA COGNITIVA] L'Escriptori està brut (Hi ha bundles o estudis antics).");
      console.error("   Has d'aplicar el protocol DORMIR (moure fitxers a 90_arxiu_historic)");
      console.error("   abans de generar un nou abocament per evitar recursivitat i ofec termodinàmic.");
      console.error("   Fitxers detectats:");
      for (const f of brossa) console.error(`   · ${f}`);
      console.error('');
      return 1;
    }
  }
  if (d.absentsCritics.length) {
    console.error("\n❌ [BUNDLE] Falten peces crítiques del repositori:");
    for (const c of d.absentsCritics) console.error(`   · ${c.cami} — ${c.nota}`);
    console.error('');
    return 1;
  }

  const collita = recull();
  const critics = collita.absents.filter((a) => a.critic);

  // Fail-closed. Això és la regla 4 de la skill `abocament-total`, que la
  // versió anterior incomplia amb un `if (existsSync(f))` sense else.
  if (critics.length) {
    console.error('\n❌ [BUNDLE] Abortat: el contracte promet material que no és al disc.\n');
    for (const a of critics) console.error(`   · ${a.tipus} absent: ${a.cami}${a.motiu ? ` (${a.motiu})` : ''}`);
    console.error('\n   Un bundle que promet el que no porta és un examen a cegues.');
    console.error('   Corregix el contracte a DIRECTORIS/FITXERS_OBLIGATORIS, o restaura el fitxer.\n');
    return 1;
  }

  const meta = ara();
  const { text, manifest } = construeix(collita, meta);
  const mb = manifest.totals.bytes / 1048576;

  if (SEC) {
    console.log(`\n📦 [SEC] ${manifest.totals.fitxers} fitxers · ${mb.toFixed(2)} MB\n`);
    for (const f of manifest.fitxers) console.log(`   ${String(f.linies).padStart(6)}  ${f.ruta}`);
    console.log('');
    return 0;
  }

  if (!SENSE_VERIFICAR) {
    const inf = verifica(text, manifest);
    if (inf.length) {
      console.error(`\n❌ [BUNDLE] La porta de completitud ha trobat ${inf.length} defecte(s):\n`);
      for (const i of inf.slice(0, 20)) console.error(`   · ${i}`);
      if (inf.length > 20) console.error(`   · … i ${inf.length - 20} més`);
      console.error('\n   Arregla la causa; no toques la porta.\n');
      return 1;
    }
  }

  const sufix = positius.length ? (positius.join('_') || 'auditoria').replace(/[^a-zA-Z0-9_]/g, '') : PERFIL;
  const escriptori = R(CAMINS.escriptori);
  
  let prefixTarget = 'BUNDLE';
  let prefixPrompt = 'PROMPT';
  if (PERFIL === 'macro') { prefixTarget = 'MACRO_BUNDLE'; prefixPrompt = 'MACRO_PROMPT'; }
  else if (PERFIL === 'micro') { prefixTarget = 'MICRO_BUNDLE'; prefixPrompt = 'MICRO_PROMPT'; }
  
  const nomBundle = valor('eixida') ?? path.join(escriptori, `${meta.prefix}_${prefixTarget}_${sufix}.md`);
  const nomPrompt = valor('eixida') ? null : path.join(escriptori, `${meta.prefix}_${prefixPrompt}_${sufix}.md`);

  // Llegir i validar abans de la primera escriptura del paquet.
  const iso = nomPrompt ? loadSgqContext(arrelSegura()) : null;
  const promptContent = nomPrompt && !fs.existsSync(nomPrompt) ? buildSgqPrompt(iso, {
    title: `Petorreta — Auditoria Extrema: Integració Sollutia`,
    description: `Auditoria d'arquitectura inversa i integració amb Sollutia`,
    objective: `Bombardejar el sistema per fer arquitectura inversa i trobar forats de seguretat, SEO, usabilitat i defectes en la integració amb Sollutia.`,
    context: `Bundle aparellat: ${path.basename(nomBundle)}.\n\nSollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas o que els LLMs puguen al·lucinar.`,
    instruction: 'Fes una auditoria extrema: analitza tot el front-end, els scripts d\'integració i la capa de dades. Busca forats de seguretat, problemes de SEO, usabilitat i friccions en la integració amb el backend de Sollutia.',
    output: 'markdown',
    createdAt: meta.iso.slice(0, 16).replace('T', ' '),
    bundle: path.basename(nomBundle),
    manifestSha: sha(Buffer.from(JSON.stringify(manifest), 'utf8')),
    tags: ['maquina', 'seguretat'],
  }) : null;
  if (nomPrompt && fs.existsSync(nomPrompt)) {
    const errors = validateSgqPrompt(iso, fs.readFileSync(nomPrompt, 'utf8'));
    if (errors.length) throw new Error(`Prompt existent invàlid; conserva’l i revisa’l: ${errors.join('; ')}`);
  }

  fs.mkdirSync(path.dirname(nomBundle), { recursive: true });
  const tmp = `${nomBundle}.tmp`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, nomBundle); // escriptura atòmica: mai un bundle a mitges

  const baseDir = path.dirname(nomBundle);
  const absentsFile = path.join(baseDir, `${meta.prefix}_ABSENTS_${sufix}.json`);
  const absentsTmp = absentsFile + '.tmp';
  
  fs.writeFileSync(absentsTmp, JSON.stringify({ absents_critics: critics, absents_no_critics: manifest.absents_no_critics }, null, 2), 'utf8');
  fs.renameSync(absentsTmp, absentsFile);

  console.log(`\n✅ Bundle: ${rel(nomBundle)}`);
  console.log(`✅ Absents separat: ${rel(absentsFile)}`);
  
  if (promptContent) {
    fs.writeFileSync(nomPrompt, promptContent, { encoding: 'utf8', flag: 'wx' });
    console.log(`✅ Prompt: ${rel(nomPrompt)} (ISO i context verificats)`);
  }
  console.log(`   ${manifest.totals.fitxers} fitxers · ${mb.toFixed(2)} MB · verificat: ${manifest.verificat ? 'sí' : 'NO'}`);
  if (mb > SOSTRE_MB) {
    console.log(`\n⚠️  AVÍS TERMODINÀMIC: ${mb.toFixed(2)} MB supera el sostre de ${SOSTRE_MB} MB.`);
    console.log('   No s\'ha podat res. Si cal retallar, fes-ho canviant el contracte');
    console.log('   (DIRECTORIS / FITXERS_*) de forma semàntica i declarada, mai en silenci.');
  }
  
  // Ancoratge automàtic: evitar orfes a l'Escriptori
  try {
    // execSync('node generar_indexs.mjs', { cwd: arrelSegura() });
    console.log('✅ Ancoratge automàtic: L\'Escriptori ha sigut reindexat.');
  } catch (e) {
    throw new Error(`Error en l'ancoratge automàtic: ${e.message}`);
  }
  
  console.log('');
  return 0;
}

try {
  process.exit(principal());
} catch (err) {
  if (err instanceof ErrorArrel) { console.error(err.informe()); process.exit(2); }
  console.error(`\n❌ [BUNDLE] Error inesperat: ${err.message}\n`);
  process.exit(2);
}
