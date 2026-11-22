#!/usr/bin/env node
/**
 * cartograf_som_de_poble.mjs (v1.1.0)
 *
 * Tractor i Sentinella d'Estructura Humana + IA del contenidor «Som de Poble».
 * Garanteix que:
 *   1. Cada domini de «Som de Poble/» té un propòsit humà únic, clar i documentat.
 *   2. No es creen carpetes duplicades, homònimes ni enllaços simbòlics (symlinks) no autoritzats.
 *   3. No queden fitxers buits (0 bytes, fora de .keep/.gitkeep) abandonats pel disc.
 *   4. Detecta fitxers pesants (>= 512 KB) duplicats byte-a-byte per SHA-256.
 *   5. Qualsevol IA pot consultar amb `--on-va "<descripció>"` on va exactament un contingut.
 *
 * Ús:
 *   node cartograf_som_de_poble.mjs --audit
 *   node cartograf_som_de_poble.mjs --audit --strict   # Exit 1 si hi ha symlinks no autoritzats, 0-byte files o carpetes fora de mapa
 *   node cartograf_som_de_poble.mjs --audit --json
 *   node cartograf_som_de_poble.mjs --on-va "llibre pdf de receptes de cuina"
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ROOT = '/Users/javillinares/Documents/Antigravity/Som de Poble';

export const TAXONOMIA_CANONICA = Object.freeze({
  '00_MAPA_CANONIC_SOM_DE_POBLE.md': {
    tipus: 'fitxer_arrel',
    rol: 'Mapa mestre humà + IA (L0/L1) de tot l’ecosistema Som de Poble.',
    paraulesClau: ['mapa', 'index', 'estructura', 'on va', 'directori']
  },
  'socdepoble.org': {
    tipus: 'repositori_codi_i_wiki_viva',
    rol: 'Aplicació viva Sóc de Poble (React/Vite/Supabase/Capacitor/WP) i Wiki activa (_wiki_de_poble/).',
    paraulesClau: ['codi', 'jsx', 'css', 'sql', 'migracio', 'test', 'wiki viva', 'acta marmota', 'escriptori']
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
    rol: 'Material brut antic (juliol-octubre) pendent de classificar; NO afegir-hi fitxers nous (usar la carpeta temàtica canònica).',
    paraulesClau: []
  },
  '_arxiu_wiki_de_poble': {
    tipus: 'arxiu_fred_historic',
    rol: 'Arxiu històric fred d’etapes anteriors de la Wiki (només consulta puntual; mai per a treball viu).',
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
  ]
]);

const PREFIXOS_SYMLINKS_AUTORITZATS = [
  '_cultura_de_poble/patrimoni_i_llengua/llibres_de_pep_cascant/' // Vista d'autor cap als 12 PDFs de trilogia_mediterrania_i_moli_la_torre
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
  if (PREFIXOS_SYMLINKS_AUTORITZATS.some((p) => relPath.startsWith(p))) {
    return 'Índex per autor (Pep Cascant) cap als originals veïns de trilogia_mediterrania_i_moli_la_torre';
  }
  return null;
}

export function recomanaUbicacio(consulta) {
  const q = normalitzaNom(consulta).replace(/_/g, ' ');
  const cultura = TAXONOMIA_CANONICA['_cultura_de_poble'];
  for (const [sub, claus] of Object.entries(cultura.subcarpetesCanoniques)) {
    for (const clau of claus) {
      if (q.includes(normalitzaNom(clau).replace(/_/g, ' '))) {
        return {
          destiCanonic: `_cultura_de_poble/${sub}/`,
          rol: `${cultura.rol} -> Subdomini: ${sub}`,
          advertencia: 'MAI crees una carpeta paral·lela a l’arrel; usa sempre la subcarpeta canònica dins de _cultura_de_poble/.'
        };
      }
    }
  }
  for (const [carpeta, meta] of Object.entries(TAXONOMIA_CANONICA)) {
    for (const clau of meta.paraulesClau || []) {
      if (q.includes(normalitzaNom(clau).replace(/_/g, ' '))) {
        return {
          destiCanonic: carpeta.endsWith('.md') ? carpeta : `${carpeta}/`,
          rol: meta.rol,
          advertencia: 'Verifica abans les subcarpetes existents dins del destí per no duplicar calaixos.'
        };
      }
    }
  }
  return {
    destiCanonic: 'CONSULTAR_MESTRE_O_00_MAPA_CANONIC_SOM_DE_POBLE.md',
    rol: 'Cap regla automàtica ha casat amb certesa absoluta (Llei 0).',
    advertencia: 'Llig 00_MAPA_CANONIC_SOM_DE_POBLE.md i pregunta al Mestre abans de crear cap carpeta nova.'
  };
}

export function auditaContenidor(rootDir = DEFAULT_ROOT) {
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
    if (nom === '.DS_Store' || nom === '.gitignore' || nom === '.claude' || nom.startsWith('.sdp-paperera')) continue;
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

  for (const c of CARPETES_ESCANEIG) camina(c, 5, 1);

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
      if (pItem === 'Som de Poble' || pItem.startsWith('.')) continue;
      const pAbs = path.join(parentDir, pItem);
      let st;
      try {
        st = fs.lstatSync(pAbs);
      } catch {
        continue;
      }
      if (st.isFile() && st.size === 0) fitxersBuitsPare.push(`../${pItem}`);
      const pNorm = normalitzaNom(pItem);
      if (pNorm === 'soc_de_poble' || pNorm === 'som' || pNorm === 'wiki_de_poble') {
        alertesPare.push({ nom: pItem, tipus: st.isDirectory() ? 'directori' : 'fitxer', midaBytes: st.size });
      }
    }
  }

  const teMapaArrel = fs.existsSync(path.join(rootDir, '00_MAPA_CANONIC_SOM_DE_POBLE.md'));
  const salutEstructuralOk =
    teMapaArrel &&
    noCanoniquesArrel.length === 0 &&
    symlinksNoAutoritzats.length === 0 &&
    fitxersBuits.length === 0 &&
    fitxersBuitsPare.length === 0;

  return {
    salutEstructuralOk,
    rootDir,
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const idxOnVa = args.indexOf('--on-va');
  if (idxOnVa !== -1 && args[idxOnVa + 1]) {
    console.log(JSON.stringify(recomanaUbicacio(args.slice(idxOnVa + 1).join(' ')), null, 2));
    process.exit(0);
  }

  const res = auditaContenidor(DEFAULT_ROOT);
  if (args.includes('--json')) {
    console.log(JSON.stringify(res, null, 2));
    process.exit(args.includes('--strict') && !res.salutEstructuralOk ? 1 : 0);
  }

  console.log('=== 🗺️ CARTOGRAFIA I AUDITORIA «SOM DE POBLE» (v1.1.0) ===');
  console.log(`Salut estructural (Mapa + Taxonomia + 0 Symlinks redundants + 0 Fitxers 0B): ${res.salutEstructuralOk ? '✅ 10/10 NET' : '❌ REVISAR'}`);
  console.log(`Mapa canònic 00_MAPA_CANONIC_SOM_DE_POBLE.md: ${res.teMapaArrel ? '✅ SÍ' : '❌ FALTA'}`);
  console.log(`Entrades fora de taxonomia a l'arrel: ${res.noCanoniquesArrel.length === 0 ? '✅ 0' : '⚠️ ' + res.noCanoniquesArrel.join(', ')}`);
  console.log(`Symlinks no autoritzats: ${res.symlinksNoAutoritzats.length === 0 ? '✅ 0' : '⚠️ ' + res.symlinksNoAutoritzats.map((s) => s.relPath).join(', ')}`);
  console.log(`Fitxers buits (0 bytes): ${res.fitxersBuits.length + res.fitxersBuitsPare.length === 0 ? '✅ 0' : '⚠️ ' + [...res.fitxersBuits, ...res.fitxersBuitsPare].join(', ')}`);
  console.log(`Fitxers pesants (>= 512 KB) duplicats per SHA-256: ${res.fitxersDuplicats.length} (${res.fitxersDuplicats.filter((d) => d.justificacioCanonica).length} justificats)`);

  if (args.includes('--strict') && !res.salutEstructuralOk) {
    process.exit(1);
  }
}
