#!/usr/bin/env node
/**
 * cartograf-som-de-poble.mjs (v2.0.0 · v1.2.26, Lot C1-2, decisió del Mestre del 26-11-2026 a les 02:37 CET)
 *
 * Tractor i sentinella de l'estructura del contenidor «Som de Poble» (la carpeta pare de socdepoble.org).
 * Viu dins de Git (abans era una skill global de ~/.gemini): un sol cervell versionat. Abast real (Gauntlet
 * 261126, lents A i B):
 *   1. `--audit` jutja (salut): cada entrada de l'arrel és a TAXONOMIA_CANONICA; cap symlink no autoritzat ni
 *      fitxer buit dins dels fons temàtics de CARPETES_ESCANEIG (cultura, multimèdia, comunicació, gestoria,
 *      oficina, salut, recursos, safata congelada i els uploads del web); hi ha el mapa de la Wiki i un cartell.
 *      Informa, sense jutjar-los: duplicats pesants (>= 512 KB) per SHA-256, carpetes homònimes i alertes de la
 *      carpeta pare (com «Som%20de%20Poble»). El laboratori, els builds, l'arxiu fred i el repositori no es
 *      jutgen ací: els mesura `--inventari`.
 *   2. `--inventari` llig en temps real cada carpeta de l'arrel (fitxers, carpetes, bytes, profunditat, symlinks
 *      i noms estranys o invisibles) sense desar cap catàleg; amb `--strict` falla per entrades fora del mapa,
 *      noms estranys o symlinks no autoritzats que ixen del contenidor.
 *   3. `--on-va "<descripció>"` diu on va un contingut, per paraules senceres (mai per trossos de paraula).
 * Cap recorregut no segueix enllaços simbòlics, tampoc quan un camí intermedi ho és.
 * Mapa humà canònic: _wiki_de_poble/02_saber/architecture/mapa_canonic_contenidor_som_de_poble.md.
 * Només llig. Cap ruta absoluta: el contenidor és la carpeta pare del repositori principal, també des d'un
 * worktree enllaçat (tooling/lib/contenidor.mjs), o --arrel=DIR.
 *
 * Ús (des de socdepoble.org/):
 *   node tooling/gates/cartograf-som-de-poble.mjs --audit [--strict] [--json]
 *   node tooling/gates/cartograf-som-de-poble.mjs --inventari [--profunditat=N] [--strict] [--json]
 *   Opció comuna: --arrel=DIR. Una opció desconeguda o un error ixen amb 2.
 *   node tooling/gates/cartograf-som-de-poble.mjs --on-va "llibre pdf de receptes de cuina"
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMINS, esMain } from '../lib/arrel.mjs';
import { contenidorDe } from '../lib/contenidor.mjs';

export const REPOSITORI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENIDOR_PER_DEFECTE = contenidorDe(REPOSITORI);
export const MAPA_WIKI = `${CAMINS.wiki}/02_saber/architecture/mapa_canonic_contenidor_som_de_poble.md`;
const IGNORA_ARREL = new Set(['.DS_Store', '.gitignore', '.claude']);
const descodifica = (nom) => { try { return decodeURIComponent(nom); } catch { return nom; } };

export const TAXONOMIA_CANONICA = Object.freeze({
  'README.md': {
    tipus: 'fitxer_arrel',
    rol: 'Cartell de mig foli fora de Git: què és el contenidor i on és el mapa canònic (a la Wiki, dins de Git).',
    paraulesClau: ['readme', 'cartell', 'benvinguda']
  },
  '00_MAPA_CANONIC_SOM_DE_POBLE.md': {
    tipus: 'fitxer_arrel',
    rol: 'Punter de consulta cap al mapa canònic de la Wiki (es conserva fins que AGENTS §5 en permeta el trasllat).',
    paraulesClau: ['mapa', 'index', 'estructura', 'on va', 'directori']
  },
  'socdepoble.org': {
    tipus: 'repositori_codi_i_wiki_viva',
    rol: `Aplicació viva Sóc de Poble (React/Vite/Supabase/Capacitor/WP) i Wiki activa (${CAMINS.wiki}/).`,
    paraulesClau: ['codi', 'jsx', 'css', 'sql', 'migracio', 'test', 'wiki viva', 'acta marmota', 'escriptori', 'informe', 'auditoria', 'prompt', 'pla d implementacio']
  },
  '_cultura_de_poble': {
    tipus: 'patrimoni_cultural_mestre',
    rol: 'Fons cultural, gastronòmic, etnogràfic, musical i lingüístic original (només lectura per a generadors/tests).',
    subcarpetesCanoniques: {
      'menjar_i_beure_de_poble': ['recepta', 'receptari', 'cuina', 'gastronomia', 'que dinem', 'menjar', 'beure', 'alergens', 'llista compra'],
      'musica_i_festa': ['musica', 'banda', 'campanes', 'festes', 'auques', 'rondalles', 'etnografia'],
      'patrimoni_i_llengua': ['patrimoni', 'pou de neu', 'arbres', 'llavors', 'rutes', 'itineraris', 'trilogia', 'moli', 'pep cascant', 'llengua']
    },
    paraulesClau: ['cultura', 'llibre', 'patrimoni', 'recepta', 'cuina', 'menjar', 'beure', 'musica', 'etnografia', 'llavors']
  },
  '_investigacio_ia_de_poble': {
    tipus: 'laboratori_kits_i_memoria_tecnica_ia',
    rol: 'Kits CAS d’integració entre IAs (Claude/Codex/Gemini/Node 0) i Biblioteca Tècnica Destil·lada (00_CULTURA_TECNICA_DESTIL_LADA_MARIA_NODE0/).',
    paraulesClau: ['kit cas', 'estudi ia', 'fitxa tecnica', 'benchmark', 'rss node0', 'auditoria externa', 'github repo', 'reel ia']
  },
  '_builds_de_poble': {
    tipus: 'artefactes_compilats_i_botigues',
    rol: 'Empaquetats compilats per a les 4 botigues (WordPress ZIP, Android APK/AAB, iOS IPA, fitxes App Store / Google Play).',
    paraulesClau: ['apk', 'aab', 'ipa', 'zip wordpress', 'release', 'build', 'app store', 'google play']
  },
  '_gestoria_de_poble': {
    tipus: 'administracio_legal_i_fiscal',
    rol: 'Identitat legal, facturació, impostos, burocràcia, subvencions i plantilles administratives.',
    paraulesClau: ['factura', 'iva', 'irpf', 'aeat', 'cif', 'estatuts', 'subvencio', 'licitacio', 'burocracia', 'gestoria']
  },
  '_oficina_de_poble': {
    tipus: 'claus_i_immobilitzat_sensible',
    rol: 'Custòdia privada de claus, certificats push/botigues i compres de maquinari/immobilitzat (accés restringit).',
    paraulesClau: ['clau', 'certificat', 'p8', 'p12', 'keystore', 'vapid', 'compra maquinari', 'mac mini']
  },
  '_multimedia_de_poble': {
    tipus: 'fons_grafic_i_audiovisual',
    rol: 'Originals gràfics, il·lustracions Nano Banana, fotos base i material audiovisual de treball.',
    paraulesClau: ['nano banana', 'il·lustracio', 'vinyeta', 'video brut', 'raster original', 'foto']
  },
  '_comunicacio_de_poble': {
    tipus: 'comunicacio_i_relat',
    rol: 'Dossiers de comunicació externa, notes de premsa i memòria narrativa institucional.',
    paraulesClau: ['premsa', 'comunicacio', 'nota de premsa', 'presentacio', 'discurs']
  },
  '_salut_de_poble': {
    tipus: 'recerca_salut_comunitaria',
    rol: 'Documentació clínica/acadèmica de referència per als mòduls de salut i benestar rural.',
    paraulesClau: ['salut', 'medic', 'diari miccional', 'agitacio', 'tfg salut', 'cura']
  },
  '_recursos_de_poble': {
    tipus: 'enllacos_i_referencies_externes',
    rol: 'Marcadors (.webloc) i recursos externs d’eines i serveis.',
    paraulesClau: ['webloc', 'marcador', 'bookmark', 'recurs extern']
  },
  '_raw_de_poble': {
    tipus: 'safata_bruta_historica_a_consolidar',
    rol: 'Material brut antic (juliol-octubre) pendent de classificar; NO afegir-hi fitxers nous (fes servir la carpeta temàtica canònica).',
    paraulesClau: []
  },
  '_arxiu_wiki_de_poble': {
    tipus: 'arxiu_fred_historic',
    rol: 'Arxiu històric fred de la Wiki (només consulta puntual; mai per a treball viu). Només hi entra el que ix de la Wiki viva amb Doble Custòdia (D3): etiqueta git anotada i entrada a 00_manifest_arxiu_fred.json.',
    paraulesClau: ['historic antic', 'arxiu fred']
  }
});

const DUPLICATS_JUSTIFICATS_SHA256 = new Map([
  [
    '399d2f54abdba0fb4c75f0e4d1b60744f2b19ed0bdf781ae186e5758bc86fddd',
    'Llibre «Què dinem?» (original mestre a _cultura_de_poble/menjar_i_beure_de_poble/ + còpia servida per Firebase Hosting a socdepoble.org/public/assets/uploads/patrimoni/que-dinem/)'
  ]
]);

// Symlinks explícitament autoritzats mentre un test o índex d'autor en fa ús
const SYMLINKS_AUTORITZATS = new Map([
  [
    '_cultura_de_poble/trilogia_mediterrania_i_moli_la_torre',
    'Requerit per src/data/patrimoni/arbresMonumentals.js:24 i patrimoniR9.fonts.test.js'
  ],
  [
    '.claude/skills',
    'Mirall local de les skills per a Claude (wiki-cicle-de-vida §9): no es versiona'
  ]
]);

const PREFIXOS_SYMLINKS_AUTORITZATS = [
  '_cultura_de_poble/patrimoni_i_llengua/llibres_de_pep_cascant/', // Vista d'autor cap als 12 PDFs de trilogia_mediterrania_i_moli_la_torre
  'socdepoble.org/.claude/skills/' // Mirall local de les skills per a Claude (wiki-cicle-de-vida §9): no es versiona
];

const IGNORA_NOMS = new Set(['.DS_Store', 'Icon\r', '.git', 'node_modules', 'dist', 'dist-natiu', '.obsidian', '.claude']);
const PERMESOS_BUITS = new Set(['.keep', '.gitkeep']);

function normalitzaNom(nom) {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^_+/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function sha256Fitxer(ruta) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(ruta, 'r');
  const buf = Buffer.alloc(65536);
  let bytesRead = 0;
  try {
    while ((bytesRead = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      hash.update(buf.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function esSymlinkAutoritzat(relPath) {
  if (SYMLINKS_AUTORITZATS.has(relPath)) return SYMLINKS_AUTORITZATS.get(relPath);
  if (relPath.startsWith('socdepoble.org/.claude/skills/')) return 'Mirall local de les skills per a Claude (wiki-cicle-de-vida §9)';
  if (PREFIXOS_SYMLINKS_AUTORITZATS.some((p) => relPath.startsWith(p))) {
    return 'Índex per autor (Pep Cascant) cap als originals veïns de trilogia_mediterrania_i_moli_la_torre';
  }
  return null;
}

/** Paraules normalitzades d'un text («Què dinem?» → ['que', 'dinem']). */
const paraules = (text) => normalitzaNom(text).split('_').filter(Boolean);
/** La clau hi casa només si les seues paraules hi apareixen senceres i seguides («clau» no casa amb «Claude»). */
function casaPerParaules(tokens, clau) {
  const c = paraules(clau);
  if (!c.length) return false;
  for (let i = 0; i + c.length <= tokens.length; i++) if (c.every((p, j) => tokens[i + j] === p)) return true;
  return false;
}

export function recomanaUbicacio(consulta) {
  const q = paraules(consulta);
  const cultura = TAXONOMIA_CANONICA['_cultura_de_poble'];
  for (const [sub, claus] of Object.entries(cultura.subcarpetesCanoniques)) {
    for (const clau of claus) {
      if (casaPerParaules(q, clau)) {
        return {
          destiCanonic: `_cultura_de_poble/${sub}/`,
          rol: `${cultura.rol} -> Subdomini: ${sub}`,
          advertencia: 'MAI crees una carpeta paral·lela a l’arrel; fes servir sempre la subcarpeta canònica dins de _cultura_de_poble/.'
        };
      }
    }
  }
  for (const [carpeta, meta] of Object.entries(TAXONOMIA_CANONICA)) {
    if (meta.tipus === 'fitxer_arrel') continue; // un cartell o un punter no són llars de contingut
    for (const clau of meta.paraulesClau || []) {
      if (casaPerParaules(q, clau)) {
        return {
          destiCanonic: `${carpeta}/`,
          rol: meta.rol,
          advertencia: 'Verifica abans les subcarpetes existents dins del destí per no duplicar calaixos.'
        };
      }
    }
  }
  return {
    destiCanonic: 'CONSULTAR_MESTRE',
    rol: 'Cap regla automàtica ha casat amb certesa absoluta (Llei 0).',
    advertencia: `Llig ${MAPA_WIKI} i pregunta al Mestre abans de crear cap carpeta nova.`
  };
}

export function auditaContenidor(rootDir = CONTENIDOR_PER_DEFECTE) {
  const entradesArrel = fs.readdirSync(rootDir);
  const symlinks = [];
  const symlinksNoAutoritzats = [];
  const noCanoniquesArrel = [];
  const fitxersBuits = [];
  const mapaNomsNormalitzats = new Map();
  const candidatsPes = new Map();

  function registraNomCarpeta(relPath) {
    const base = path.basename(relPath);
    const norm = normalitzaNom(base);
    if (!norm || norm.length < 4) return;
    if (!mapaNomsNormalitzats.has(norm)) mapaNomsNormalitzats.set(norm, []);
    mapaNomsNormalitzats.get(norm).push(relPath);
  }

  for (const nom of entradesArrel) {
    if (IGNORA_ARREL.has(nom) || nom.startsWith('.sdp-paperera')) continue;
    const abs = path.join(rootDir, nom);
    const lstat = fs.lstatSync(abs);
    if (lstat.isSymbolicLink()) {
      const target = fs.readlinkSync(abs);
      const motiu = esSymlinkAutoritzat(nom);
      const item = { relPath: nom, target, nivell: 1, autoritzat: Boolean(motiu), motiu };
      symlinks.push(item);
      if (!motiu) symlinksNoAutoritzats.push(item);
      registraNomCarpeta(nom);
      continue;
    }
    if (!TAXONOMIA_CANONICA[nom]) noCanoniquesArrel.push(nom);
    if (lstat.isDirectory()) registraNomCarpeta(nom);
    else if (lstat.isFile() && lstat.size === 0 && !PERMESOS_BUITS.has(nom)) {
      fitxersBuits.push(nom);
    }
  }

  const CARPETES_ESCANEIG = [
    '_cultura_de_poble',
    '_multimedia_de_poble',
    '_comunicacio_de_poble',
    '_gestoria_de_poble',
    '_oficina_de_poble',
    '_salut_de_poble',
    '_recursos_de_poble',
    '_raw_de_poble',
    'socdepoble.org/public/assets/uploads'
  ];

  function camina(relBase, profMax = 5, profActual = 1) {
    const absBase = path.join(rootDir, relBase);
    if (!fs.existsSync(absBase)) return;
    let items;
    try {
      items = fs.readdirSync(absBase);
    } catch {
      return;
    }
    for (const item of items) {
      if (IGNORA_NOMS.has(item)) continue;
      if (item.startsWith('.') && !PERMESOS_BUITS.has(item)) continue;
      const rel = path.posix.join(relBase, item);
      const abs = path.join(rootDir, rel);
      let st;
      try {
        st = fs.lstatSync(abs);
      } catch {
        continue;
      }
      if (st.isSymbolicLink()) {
        const target = fs.readlinkSync(abs);
        const motiu = esSymlinkAutoritzat(rel);
        const rec = { relPath: rel, target, nivell: profActual + 1, autoritzat: Boolean(motiu), motiu };
        symlinks.push(rec);
        if (!motiu) symlinksNoAutoritzats.push(rec);
        if (!PREFIXOS_SYMLINKS_AUTORITZATS.some((p) => rel.startsWith(p))) registraNomCarpeta(rel);
        continue;
      }
      if (st.isDirectory()) {
        if (profActual <= 2 && !relBase.startsWith('socdepoble.org')) registraNomCarpeta(rel);
        if (profActual < profMax) camina(rel, profMax, profActual + 1);
      } else if (st.isFile()) {
        if (st.size === 0 && !PERMESOS_BUITS.has(item)) {
          fitxersBuits.push(rel);
        } else if (st.size >= 512 * 1024) {
          if (!candidatsPes.has(st.size)) candidatsPes.set(st.size, []);
          candidatsPes.get(st.size).push({ rel, abs, size: st.size });
        }
      }
    }
  }

  /* Cap camí d'escaneig no es recorre si algun dels seus trossos és un enllaç simbòlic (Gauntlet 261126, lent A):
     l'enllaç es registra i no s'hi entra, perquè podria portar fora del contenidor. */
  function trosEnllacat(relBase) {
    let acc = '';
    for (const tros of relBase.split('/')) {
      acc = acc ? `${acc}/${tros}` : tros;
      let st; try { st = fs.lstatSync(path.join(rootDir, acc)); } catch { return null; }
      if (st.isSymbolicLink()) return acc;
    }
    return null;
  }
  for (const c of CARPETES_ESCANEIG) {
    const enllac = trosEnllacat(c);
    if (enllac) {
      if (!symlinks.some((s) => s.relPath === enllac)) {
        const motiu = esSymlinkAutoritzat(enllac);
        const rec = { relPath: enllac, target: fs.readlinkSync(path.join(rootDir, enllac)), nivell: enllac.split('/').length, autoritzat: Boolean(motiu), motiu };
        symlinks.push(rec); if (!motiu) symlinksNoAutoritzats.push(rec);
      }
      continue;
    }
    camina(c, 5, 1);
  }

  const carpetesHomonimes = [];
  for (const [norm, rutes] of mapaNomsNormalitzats.entries()) {
    if (rutes.length > 1) carpetesHomonimes.push({ nomNormalitzat: norm, rutes });
  }

  const fitxersDuplicats = [];
  for (const [, llista] of candidatsPes.entries()) {
    if (llista.length < 2) continue;
    const perHash = new Map();
    for (const f of llista) {
      const h = sha256Fitxer(f.abs);
      if (!perHash.has(h)) perHash.set(h, []);
      perHash.get(h).push(f);
    }
    for (const [sha256, iguals] of perHash.entries()) {
      if (iguals.length > 1) {
        fitxersDuplicats.push({
          sha256,
          midaBytes: iguals[0].size,
          midaMB: Number((iguals[0].size / 1e6).toFixed(2)),
          rutes: iguals.map((x) => x.rel),
          justificacioCanonica: DUPLICATS_JUSTIFICATS_SHA256.get(sha256) || null
        });
      }
    }
  }

  const parentDir = path.dirname(rootDir);
  const fitxersBuitsPare = [];
  const alertesPare = [];
  if (fs.existsSync(parentDir)) {
    for (const pItem of fs.readdirSync(parentDir)) {
      if (pItem === path.basename(rootDir) || pItem.startsWith('.')) continue;
      const pAbs = path.join(parentDir, pItem);
      let st;
      try {
        st = fs.lstatSync(pAbs);
      } catch {
        continue;
      }
      if (st.isFile() && st.size === 0) fitxersBuitsPare.push(`../${pItem}`);
      const pNorm = normalitzaNom(descodifica(pItem));
      if (pNorm === 'soc_de_poble' || pNorm === 'som_de_poble' || pNorm === 'som' || pNorm === 'wiki_de_poble') {
        alertesPare.push({ nom: pItem, tipus: st.isDirectory() ? 'directori' : 'fitxer', midaBytes: st.size });
      }
    }
  }

  const teMapaArrel = fs.existsSync(path.join(rootDir, '00_MAPA_CANONIC_SOM_DE_POBLE.md'));
  // El mapa és el del repositori que porta esta eina (també des d'un worktree); amb --arrel, el del contenidor indicat.
  const repoDelMapa = path.resolve(rootDir) === path.resolve(CONTENIDOR_PER_DEFECTE) ? REPOSITORI : path.join(rootDir, 'socdepoble.org');
  const teMapaWiki = fs.existsSync(path.join(repoDelMapa, MAPA_WIKI));
  const teCartell = fs.existsSync(path.join(rootDir, 'README.md'));
  const salutEstructuralOk =
    teMapaWiki &&
    (teCartell || teMapaArrel) &&
    noCanoniquesArrel.length === 0 &&
    symlinksNoAutoritzats.length === 0 &&
    fitxersBuits.length === 0 &&
    fitxersBuitsPare.length === 0;

  return {
    salutEstructuralOk,
    rootDir,
    teMapaWiki,
    teCartell,
    teMapaArrel,
    noCanoniquesArrel,
    symlinks,
    symlinksNoAutoritzats,
    fitxersBuits,
    fitxersBuitsPare,
    carpetesHomonimes,
    fitxersDuplicats,
    alertesPare
  };
}


/** Noms que enganyen humans i IAs: codificats per URL, amb espais als extrems o caràcters de control. */
export function nomEstrany(nom) {
  if (nom === 'Icon\r') return null; // la icona personalitzada del Finder es diu així
  if (/[\u00a0\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/u.test(nom)) return 'caràcters invisibles';
  if (/%[0-9A-Fa-f]{2}/.test(nom)) return 'codificat per URL';
  if (nom !== nom.trim()) return 'espais als extrems';
  if (/[\u0000-\u001f\u007f]/.test(nom)) return 'caràcters de control';
  return null;
}

/** Un enllaç: destí, si està autoritzat i si ix del contenidor (destí absolut o «..» que en surt). Mai no el seguix. */
function descriuEnllac(rootDir, relPath) {
  const target = fs.readlinkSync(path.join(rootDir, relPath));
  const resolt = path.resolve(path.join(rootDir, path.dirname(relPath)), target);
  const arrel = path.resolve(rootDir);
  return { relPath, target, autoritzat: Boolean(esSymlinkAutoritzat(relPath)), surt: resolt !== arrel && !resolt.startsWith(arrel + path.sep) };
}

const IGNORA_INVENTARI = new Set(['node_modules', '.git', 'dist', 'dist-natiu', 'DerivedData', '.gradle', 'Pods']);

/** Inventari en temps real de cada entrada de l'arrel del contenidor. No escriu res. */
export function inventari(rootDir = CONTENIDOR_PER_DEFECTE, { profunditatMaxima = 64 } = {}) {
  if (!Number.isInteger(profunditatMaxima) || profunditatMaxima < 1) throw new Error('--profunditat ha de ser un enter >= 1');
  const inici = Date.now();
  const entrades = [];
  for (const nom of fs.readdirSync(rootDir).sort()) {
    if (nom === '.DS_Store') continue;
    const abs = path.join(rootDir, nom);
    const st = fs.lstatSync(abs);
    const fila = { nom, tipus: st.isSymbolicLink() ? 'symlink' : st.isDirectory() ? 'carpeta' : 'fitxer', canonic: Boolean(TAXONOMIA_CANONICA[nom]) || IGNORA_ARREL.has(nom) || nom.startsWith('.sdp-paperera'),
      fitxers: 0, carpetes: 0, bytes: 0, profunditat: 0, symlinks: [], estranys: [], ignorats: [] };
    const estranyArrel = nomEstrany(nom);
    if (estranyArrel) fila.estranys.push({ relPath: nom, motiu: estranyArrel });
    if (st.isSymbolicLink()) { fila.symlinks.push(descriuEnllac(rootDir, nom)); entrades.push(fila); continue; }
    if (st.isFile()) { fila.fitxers = 1; fila.bytes = st.size; entrades.push(fila); continue; }
    const pila = [[nom, 1]];
    while (pila.length) {
      const [rel, prof] = pila.pop();
      let items;
      try { items = fs.readdirSync(path.join(rootDir, rel)); } catch { continue; }
      for (const item of items) {
        const relItem = path.posix.join(rel, item);
        if (IGNORA_INVENTARI.has(item)) { fila.ignorats.push(relItem); continue; }
        let s;
        try { s = fs.lstatSync(path.join(rootDir, relItem)); } catch { continue; }
        const estrany = nomEstrany(item);
        if (estrany) fila.estranys.push({ relPath: relItem, motiu: estrany });
        if (s.isSymbolicLink()) { fila.symlinks.push(descriuEnllac(rootDir, relItem)); continue; }
        if (s.isDirectory()) { fila.carpetes++; fila.profunditat = Math.max(fila.profunditat, prof); if (prof < profunditatMaxima) pila.push([relItem, prof + 1]); }
        else if (s.isFile()) { fila.fitxers++; fila.bytes += s.size; fila.profunditat = Math.max(fila.profunditat, prof); }
      }
    }
    entrades.push(fila);
  }
  const foraDeMapa = entrades.filter((e) => !e.canonic).map((e) => e.nom);
  const symlinksQueSurten = entrades.flatMap((e) => e.symlinks.filter((x) => !x.autoritzat && x.surt));
  return { rootDir, symlinksQueSurten, generatEl: new Date().toISOString(), durada_ms: Date.now() - inici, entrades, foraDeMapa,
    totals: entrades.reduce((t, e) => ({ fitxers: t.fitxers + e.fitxers, carpetes: t.carpetes + e.carpetes, bytes: t.bytes + e.bytes, symlinks: t.symlinks + e.symlinks.length, estranys: t.estranys + e.estranys.length }), { fitxers: 0, carpetes: 0, bytes: 0, symlinks: 0, estranys: 0 }) };
}

const mida = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(1)} kB`);

export function textInventari(r) {
  const linies = [`=== Inventari en temps real de ${r.rootDir} (${r.durada_ms} ms) ===`, 'Entrada | Tipus | Fitxers | Carpetes | Mida | Prof. | Symlinks | Estranys | Mapa'];
  for (const e of r.entrades) linies.push(`${e.nom} | ${e.tipus} | ${e.fitxers} | ${e.carpetes} | ${mida(e.bytes)} | ${e.profunditat} | ${e.symlinks.length} | ${e.estranys.length} | ${e.canonic ? 'sí' : 'FORA'}`);
  linies.push(`Total: ${r.totals.fitxers} fitxers, ${r.totals.carpetes} carpetes, ${mida(r.totals.bytes)}, ${r.totals.symlinks} symlinks, ${r.totals.estranys} noms estranys.`);
  const estranys = r.entrades.flatMap((e) => e.estranys);
  const symlinks = r.entrades.flatMap((e) => e.symlinks.filter((s) => !s.autoritzat));
  for (const x of estranys.slice(0, 10)) linies.push(`  ⚠️ nom estrany (${x.motiu}): ${x.relPath}`);
  if (estranys.length > 10) linies.push(`  … i ${estranys.length - 10} noms estranys més (--json els llista tots)`);
  for (const x of symlinks.slice(0, 10)) linies.push(`  ⚠️ symlink no autoritzat${x.surt ? ' que ix del contenidor' : ''}: ${x.relPath} -> ${x.target}`);
  if (symlinks.length > 10) linies.push(`  … i ${symlinks.length - 10} symlinks no autoritzats més (--json els llista tots)`);
  if (r.foraDeMapa.length) linies.push(`  ⚠️ fora del mapa: ${r.foraDeMapa.join(', ')}`);
  linies.push('  (no es mesuren node_modules, .git, dist, dist-natiu, DerivedData, .gradle ni Pods: es llisten com a ignorats al --json)');
  return linies;
}

const US = 'Ús: cartograf-som-de-poble.mjs [--audit [--strict]] | --inventari [--profunditat=N] [--strict] | --on-va "<descripció>"  [--json] [--arrel=DIR]';
function main(args) {
  const idxOnVa = args.indexOf('--on-va');
  const lliures = idxOnVa === -1 ? args : args.slice(0, idxOnVa);
  const desconegudes = lliures.filter((a) => !/^--(audit|strict|json|inventari)$|^--(arrel|profunditat)=.+$/.test(a));
  if (desconegudes.length || (idxOnVa !== -1 && !args[idxOnVa + 1]) || (args.includes('--inventari') && idxOnVa !== -1)) {
    console.error(`${US}\n(opció desconeguda o incompleta: ${desconegudes.join(' ') || '--on-va sense descripció'})`);
    return 2;
  }
  const arrel = args.find((a) => a.startsWith('--arrel='))?.slice(8) || CONTENIDOR_PER_DEFECTE;
  if (idxOnVa !== -1) {
    console.log(JSON.stringify(recomanaUbicacio(args.slice(idxOnVa + 1).join(' ')), null, 2));
    return 0;
  }
  if (args.includes('--inventari')) {
    const prof = args.find((a) => a.startsWith('--profunditat='))?.slice(14);
    const r = inventari(arrel, prof ? { profunditatMaxima: Number(prof) } : {});
    console.log(args.includes('--json') ? JSON.stringify(r, null, 2) : textInventari(r).join('\n'));
    return args.includes('--strict') && (r.foraDeMapa.length || r.totals.estranys || r.symlinksQueSurten.length) ? 1 : 0;
  }
  {
    const res = auditaContenidor(arrel);
    if (args.includes('--json')) console.log(JSON.stringify(res, null, 2));
    else {
      console.log('=== 🗺️ CARTOGRAFIA I AUDITORIA «SOM DE POBLE» (v2.0.0) ===');
      console.log(`Salut estructural: ${res.salutEstructuralOk ? '✅ NET' : '❌ REVISAR'}`);
      console.log(`Mapa canònic de la Wiki (${MAPA_WIKI}): ${res.teMapaWiki ? '✅ SÍ' : '❌ FALTA'} · cartell README.md: ${res.teCartell ? '✅ SÍ' : '❌ FALTA'}`);
      console.log(`Entrades fora de taxonomia a l'arrel: ${res.noCanoniquesArrel.length === 0 ? '✅ 0' : '⚠️ ' + res.noCanoniquesArrel.join(', ')}`);
      console.log(`Symlinks no autoritzats: ${res.symlinksNoAutoritzats.length === 0 ? '✅ 0' : '⚠️ ' + res.symlinksNoAutoritzats.map((s) => s.relPath).join(', ')}`);
      console.log(`Fitxers buits (0 bytes): ${res.fitxersBuits.length + res.fitxersBuitsPare.length === 0 ? '✅ 0' : '⚠️ ' + [...res.fitxersBuits, ...res.fitxersBuitsPare].join(', ')}`);
      console.log(`Fitxers pesants (>= 512 KB) duplicats per SHA-256: ${res.fitxersDuplicats.length} (${res.fitxersDuplicats.filter((d) => d.justificacioCanonica).length} justificats)`);
      if (res.carpetesHomonimes.length) console.log(`Carpetes homònimes (informatiu): ${res.carpetesHomonimes.map((h) => h.rutes.join(' = ')).join(' · ')}`);
      if (res.alertesPare.length) console.log(`Alertes a la carpeta pare: ${res.alertesPare.map((a) => a.nom).join(', ')}`);
      console.log('Abast: la salut jutja l\'arrel, el mapa, el cartell i els fons temàtics; duplicats, homònims i carpeta pare només s\'informen. El laboratori, els builds, l\'arxiu fred i el repositori es mesuren amb --inventari.');
    }
    return args.includes('--strict') && !res.salutEstructuralOk ? 1 : 0;
  }
}

if (esMain(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (e) { console.error(`cartograf-som-de-poble: ${e.message}`); process.exitCode = 2; }
}
