#!/usr/bin/env node
/**
 * frontissa-contingut.mjs — Frontissa de contingut estructural.
 *
 * DESTÍ: tooling/gates/frontissa-contingut.mjs (en quarantena al laboratori).
 *
 * PER QUÈ EXISTIX
 *   El 24-09 un refactor nocturn va reanomenar la clau `wikidepoble` de
 *   PAGE_COPY a `skills`. El Mur va descartar la targeta en silenci i la
 *   portada de la Wiki es va quedar sense text. Cap porta ho va dir, i el dany
 *   ja era a HEAD: «restaurar el fitxer» haguera restaurat el dany.
 *
 * QUÈ FA (només lectura, excepte les ordres de registre, que són humanes)
 *   1. Importa l'objecte real `PAGE_COPY` (no busca text: un comentari que
 *      mencione una clau no la fa existir).
 *   2. Deriva les claus obligatòries dels consumidors: SYSTEM_PAGES i
 *      COVER_PAGE_KEYS de src/config/systemPages.js, i els `pageKey` de
 *      src/config/sections.js. Una clau demanada i absent fa fallar la porta.
 *   3. Compara l'empremta de cada clau (SHA-256 del valor serialitzat i
 *      longitud de l'HTML) amb el registre .agents/contingut_estructural.json.
 *      Una empremta nova només passa si algú l'aprova, i l'aprovació queda
 *      lligada exactament a eixa empremta: no val per a un altre canvi.
 *   4. Un retall de l'HTML del 30% o més no s'aprova sense --accepta-retall.
 *
 * ON S'EXECUTA
 *   · primer pas de .husky/pre-commit, abans i fora de run-portes.mjs;
 *   · CI; · el Mapa de la Consola (mètrica integritat-contingut).
 *
 * ÚS
 *   node tooling/gates/frontissa-contingut.mjs                 # comprova (exit 1 si falla)
 *   node tooling/gates/frontissa-contingut.mjs --json
 *   node tooling/gates/frontissa-contingut.mjs --inicia --per NOM
 *   node tooling/gates/frontissa-contingut.mjs --aprova CLAU --per NOM [--accepta-retall]
 *   node tooling/gates/frontissa-contingut.mjs --retira CLAU --per NOM
 *
 * Les tres últimes escriuen dins de .agents/: són decisions humanes. El diff
 * del registre és el que es revisa abans de fusionar.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

export const REGISTRE = '.agents/contingut_estructural.json';
export const ESQUEMA_REGISTRE = 'sdp.contingut.v1';
export const RETALL_MAXIM = 0.3;
export const RECUPERACIO = 'No restaures fitxers sencers: si el dany ja és a HEAD, HEAD és el dany. '
  + 'Recupera només la clau afectada des de refs/time-machine/<branca> (node tooling/brain/time-machine.mjs --llista src/sections/text/pageContent.js) '
  + 'o des del commit anterior, seguint la skill core-restauracio-segellada.';

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

export function empremta(valor) {
  return {
    sha256: sha256(JSON.stringify(valor)),
    html: typeof valor?.html === 'string' ? valor.html.length : 0
  };
}

/**
 * Claus que la interfície necessita. sections.js importa icones de
 * lucide-react i no es carrega en node sense el paquet del navegador; els seus
 * `pageKey` són literals de configuració i es lligen del text. Un literal
 * comentat només faria la porta més estricta, mai més fluixa.
 */
export async function carregaContingut(arrel) {
  const importa = (rel) => import(pathToFileURL(path.join(arrel, rel)).href);
  const { PAGE_COPY } = await importa('src/sections/text/pageContent.js');
  const { SYSTEM_PAGES, COVER_PAGE_KEYS } = await importa('src/config/systemPages.js');
  const seccions = fs.readFileSync(path.join(arrel, 'src/config/sections.js'), 'utf8');
  const pageKeys = [...seccions.matchAll(/\bpageKey:\s*['"]([\w-]+)['"]/g)].map((m) => m[1]);
  const requerides = [...new Set([
    ...SYSTEM_PAGES.map((p) => p.key),
    ...Object.values(COVER_PAGE_KEYS),
    ...pageKeys
  ])].sort();
  return { PAGE_COPY, requerides };
}

export function llegeixRegistre(arrel) {
  const fitxer = path.join(arrel, REGISTRE);
  if (!fs.existsSync(fitxer)) return null;
  const r = JSON.parse(fs.readFileSync(fitxer, 'utf8'));
  if (r?.schema !== ESQUEMA_REGISTRE || !r.claus || typeof r.claus !== 'object') {
    throw new Error(`${REGISTRE} no és un registre ${ESQUEMA_REGISTRE}`);
  }
  return r;
}

function escriuRegistre(arrel, registre) {
  const ordenat = Object.fromEntries(Object.keys(registre.claus).sort().map((k) => [k, registre.claus[k]]));
  const fitxer = path.join(arrel, REGISTRE);
  fs.mkdirSync(path.dirname(fitxer), { recursive: true });
  fs.writeFileSync(fitxer, `${JSON.stringify({ schema: ESQUEMA_REGISTRE, claus: ordenat }, null, 2)}\n`);
}

/** Retall relatiu de l'HTML respecte del registrat (0 si no ha minvat). */
export function retall(registrat, actual) {
  if (!registrat?.html) return 0;
  return Math.max(0, 1 - actual.html / registrat.html);
}

export function comprova({ PAGE_COPY, requerides }, registre) {
  const claus = registre?.claus ?? null;
  const obligatories = [...new Set([...requerides, ...(claus ? Object.keys(claus) : [])])].sort();
  const errors = [];
  let correctes = 0;
  if (!claus) {
    errors.push({ clau: null, codi: 'registre-absent',
      missatge: `Falta ${REGISTRE}: sense empremtes només es comprova la presència. Inicia'l amb --inicia --per NOM (decisió humana).` });
  }
  for (const clau of obligatories) {
    const valor = PAGE_COPY?.[clau];
    if (valor === undefined) {
      errors.push({ clau, codi: 'absent',
        missatge: `La clau «${clau}» falta a PAGE_COPY i un consumidor la demana (o el registre la protegix).` });
      continue;
    }
    if (!claus) continue;
    const registrada = claus[clau];
    if (!registrada) {
      errors.push({ clau, codi: 'sense-registre',
        missatge: `La clau «${clau}» és obligatòria i no té empremta aprovada. Aprova-la amb --aprova ${clau} --per NOM.` });
      continue;
    }
    const actual = empremta(valor);
    if (actual.sha256 !== registrada.sha256) {
      const r = retall(registrada, actual);
      errors.push({ clau, codi: r >= RETALL_MAXIM ? 'retall' : 'empremta-divergent',
        missatge: r >= RETALL_MAXIM
          ? `La clau «${clau}» ha perdut el ${Math.round(r * 100)}% de l'HTML (${registrada.html} → ${actual.html} caràcters).`
          : `La clau «${clau}» ha canviat des de l'última aprovació (${registrada.aprovat_per ?? '?'}, ${registrada.data ?? '?'}).`,
        actual, registrada });
      continue;
    }
    correctes += 1;
  }
  return { valid: errors.length === 0, requerides: obligatories.length, correctes: claus ? correctes : null, errors };
}

function opcio(argv, nom) {
  const i = argv.indexOf(`--${nom}`);
  return i === -1 ? null : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '');
}

export async function executa(argv, arrel = arrelSegura()) {
  const contingut = await carregaContingut(arrel);
  const registre = llegeixRegistre(arrel);
  const per = opcio(argv, 'per');
  const avui = new Date().toISOString().slice(0, 10);

  if (argv.includes('--inicia')) {
    if (registre) throw new Error(`${REGISTRE} ja existix; usa --aprova per a cada canvi.`);
    if (!per) throw new Error('--inicia necessita --per NOM (qui aprova l’estat actual).');
    const absents = contingut.requerides.filter((k) => contingut.PAGE_COPY[k] === undefined);
    if (absents.length) throw new Error(`No s’inicia un registre amb claus absents: ${absents.join(', ')}`);
    const claus = Object.fromEntries(contingut.requerides.map((k) =>
      [k, { ...empremta(contingut.PAGE_COPY[k]), aprovat_per: per, data: avui }]));
    escriuRegistre(arrel, { claus });
    return { accio: 'inicia', claus: Object.keys(claus).length };
  }

  const aprova = opcio(argv, 'aprova');
  if (aprova !== null) {
    if (!aprova || !per) throw new Error('Ús: --aprova CLAU --per NOM');
    if (!registre) throw new Error(`Falta ${REGISTRE}; primer --inicia.`);
    const valor = contingut.PAGE_COPY[aprova];
    if (valor === undefined) throw new Error(`La clau «${aprova}» no existix a PAGE_COPY: no hi ha res a aprovar. ${RECUPERACIO}`);
    const actual = empremta(valor);
    const r = retall(registre.claus[aprova], actual);
    if (r >= RETALL_MAXIM && !argv.includes('--accepta-retall')) {
      throw new Error(`La clau «${aprova}» ha perdut el ${Math.round(r * 100)}% de l'HTML. Si és volgut, repeteix amb --accepta-retall.`);
    }
    registre.claus[aprova] = { ...actual, aprovat_per: per, data: avui };
    escriuRegistre(arrel, registre);
    return { accio: 'aprova', clau: aprova, sha256: actual.sha256 };
  }

  const retira = opcio(argv, 'retira');
  if (retira !== null) {
    if (!retira || !per) throw new Error('Ús: --retira CLAU --per NOM');
    if (!registre?.claus[retira]) throw new Error(`La clau «${retira}» no és al registre.`);
    if (contingut.requerides.includes(retira)) throw new Error(`La clau «${retira}» encara la demana un consumidor: primer lleva-la del consumidor.`);
    delete registre.claus[retira];
    escriuRegistre(arrel, registre);
    return { accio: 'retira', clau: retira };
  }

  return comprova(contingut, registre);
}

async function main() {
  const argv = process.argv.slice(2);
  const r = await executa(argv);
  if (r.accio) {
    console.log(`✅ [Frontissa] ${r.accio}${r.clau ? ` · ${r.clau}` : ''}${r.claus ? ` · ${r.claus} claus` : ''}`);
    return;
  }
  if (argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else if (r.valid) console.log(`✅ [Frontissa] ${r.correctes}/${r.requerides} claus estructurals amb empremta aprovada.`);
  else {
    console.error(`❌ [Frontissa] ${r.errors.length} problema(es) de contingut estructural:`);
    for (const e of r.errors) console.error(`   · ${e.missatge}`);
    if (r.errors.some((e) => e.codi === 'absent' || e.codi === 'retall')) console.error(`   ${RECUPERACIO}`);
  }
  process.exitCode = r.valid ? 0 : 1;
}

if (esMain(import.meta.url)) {
  main().catch((e) => { console.error(`[Frontissa] ${e.message}`); process.exitCode = 2; });
}
