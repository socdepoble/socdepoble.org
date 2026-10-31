// @vitest-environment node
/* P1-26 (Llibre Mestre: «forats del precommit»; guàrdia nocturna 261030, Fase
   3, P1Y) · Les proves que guarden una frontera de seguretat han de córrer al
   pre-commit (`npm run test:precommit`, vitest.precommit.config.js), no només
   a la suite sencera de 9 minuts que ningú no passa en cada commit. Esta
   guarda llig PRECOMMIT_INCLUDE del fitxer com a codi (acorn, sense importar
   la configuració de Vite) i comprova que cada prova de la llista hi casa i
   és al disc. Es diu *.seguretat.test.js: entra al pre-commit pel seu nom.
   Una prova de seguretat nova: o es diu *.seguretat.test.{js,jsx}, o entra a
   PRECOMMIT_INCLUDE i a esta llista.
   Gauntlet 261030 (c3, guarda-p126-compta-comentaris) · Abans la guarda llegia
   les cadenes del text amb una expressió regular, comentaris inclosos: una
   entrada comentada continuava dins per a la guarda i fora per a Vitest. Ara
   un comentari no és cap entrada, una entrada que no és una cadena literal és
   un error, i l'include i l'exclude de Vitest només es tocen a la línia
   `config.test.include = [...PRECOMMIT_INCLUDE]`. Els mutants són al final. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const FONT = readFileSync(path.join(ARREL, 'vitest.precommit.config.js'), 'utf8');

/* Les opcions de Vitest que decidixen quins fitxers es recullen. */
const OPCIONS_DE_RECOLLIDA = new Set(['include', 'exclude', 'dir', 'root', 'projects', 'workspace']);

function* nodes(node) {
  if (!node || typeof node.type !== 'string') return;
  yield node;
  for (const valor of Object.values(node)) {
    if (Array.isArray(valor)) for (const fill of valor) yield* nodes(fill);
    else if (valor && typeof valor === 'object') yield* nodes(valor);
  }
}

/* El nom d'una clau (`a.b`, `a['b']`, `{ b: … }`); null si es calcula en temps d'execució. */
function nomDeClau(clau, calculada = false) {
  if (clau?.type === 'Literal') return String(clau.value);
  if (clau?.type === 'Identifier' && !calculada) return clau.name;
  return null;
}

const esLaLlista = (node) => node?.type === 'Identifier' && node.name === 'PRECOMMIT_INCLUDE';

/* Llig vitest.precommit.config.js com a codi i torna els patrons de
   PRECOMMIT_INCLUDE (només les cadenes literals de l'array: un comentari no
   hi és) i, a `errors`, tot el que faria que Vitest no recollira el mateix. */
function analitza(font) {
  let programa;
  try {
    programa = parse(font, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (error) {
    return { patrons: [], errors: [`no es pot analitzar: ${error.message}`] };
  }
  const errors = [];
  const tots = [...nodes(programa)];

  const declaracions = tots.filter((n) => n.type === 'VariableDeclarator' && esLaLlista(n.id));
  const valor = declaracions.length === 1 ? declaracions[0].init : null;
  const congelada = valor?.type === 'CallExpression' && valor.callee.type === 'MemberExpression'
    && nomDeClau(valor.callee.object) === 'Object' && nomDeClau(valor.callee.property, valor.callee.computed) === 'freeze'
    && valor.arguments.length === 1 && valor.arguments[0].type === 'ArrayExpression';
  if (!congelada) errors.push(`PRECOMMIT_INCLUDE s'ha de declarar una sola volta com a Object.freeze([...]) (${declaracions.length} declaracions)`);
  const patrons = [];
  for (const entrada of congelada ? valor.arguments[0].elements : []) {
    if (entrada?.type === 'Literal' && typeof entrada.value === 'string') patrons.push(entrada.value);
    else errors.push(`entrada de PRECOMMIT_INCLUDE que no és una cadena literal (${entrada?.type ?? 'forat'}): no es pot comprovar sense executar-la`);
  }

  const canoniques = tots.filter((n) => n.type === 'AssignmentExpression' && n.operator === '='
    && n.left.type === 'MemberExpression' && nomDeClau(n.left.property, n.left.computed) === 'include'
    && n.left.object.type === 'MemberExpression' && nomDeClau(n.left.object.property, n.left.object.computed) === 'test'
    && n.right.type === 'ArrayExpression' && n.right.elements.length === 1
    && n.right.elements[0]?.type === 'SpreadElement' && esLaLlista(n.right.elements[0].argument));
  if (canoniques.length !== 1) errors.push(`l'include ha de ser una sola línia «config.test.include = [...PRECOMMIT_INCLUDE]» (n'hi ha ${canoniques.length})`);
  const permesa = canoniques.length === 1 ? canoniques[0].left : null;

  for (const n of tots) {
    if (n.type === 'MemberExpression' && n !== permesa) {
      const nom = nomDeClau(n.property, n.computed);
      if (OPCIONS_DE_RECOLLIDA.has(nom)) errors.push(`«${nom}» es toca fora de la línia de l'include (posició ${n.start})`);
      if (esLaLlista(n.object)) errors.push(`PRECOMMIT_INCLUDE es fa servir fora de l'include (posició ${n.start})`);
    }
    if (n.type === 'Property' && OPCIONS_DE_RECOLLIDA.has(nomDeClau(n.key, n.computed))) {
      errors.push(`«${nomDeClau(n.key, n.computed)}» en un objecte de configuració (posició ${n.start})`);
    }
    if (n.type === 'Literal' && OPCIONS_DE_RECOLLIDA.has(n.value)) errors.push(`la cadena «${n.value}» (posició ${n.start})`);
    const clauCalculada = (n.type === 'Property' && nomDeClau(n.key, n.computed) === null)
      || (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && nomDeClau(n.left.property, n.left.computed) === null);
    if (clauCalculada) errors.push(`clau calculada (posició ${n.start}): no es pot comprovar sense executar-la`);
  }
  return { patrons, errors };
}

const ANALISI = analitza(FONT);
const casa = (fitxer, patrons = ANALISI.patrons) => patrons.some((patro) => path.matchesGlob(fitxer, patro));

/* Les fronteres de seguretat que han de córrer a cada commit. */
const FRONTERES = Object.freeze([
  // Abans d'esta guàrdia ja hi eren: no han d'eixir.
  'src/utils/sanitize.test.js',
  'src/sections/xat/components/EnllacSegur.test.jsx',
  'src/sections/xat/enllacos.test.js',
  'src/app/enllacosInterns.test.js',
  'src/config/origenPublic.test.js',
  'src/sections/multimedia/urlsArxiuLocal.test.js',
  'src/components/universal/traduccio/blocsTraduibles.test.js',
  // P1-26 (261030): isSafeUrl i els esquemes admesos.
  'src/components/universal/UniversalUtils.capacitor.test.js',
  // P1-26 (261030): la CSP i les capçaleres de conformitat del lloc.
  'src/config/firebaseHosting.test.js',
  // P1-26 (261030): el sanejador de la configuració de l'amfitrió.
  'src/config/configAmfitrio.test.js',
  // P1-26 (261030): el contingut de fora de /connectar (javascript:, data:, longitud).
  'src/sections/connectar/contingutExtern.test.js',
  // P1-26 (261030): el service worker no guarda l'API, l'autenticació ni altres orígens.
  'src/pwa/sw.test.js',
  // c3 (261030), Web Push: la llista tancada de serveis de push (SSRF), cap p256dh ni auth
  // cap al servidor, el permís només des d'un gest i cap espera abans de requestPermission.
  'src/pwa/avisosPush.test.js',
  // c3 (261030): cap altre fitxer de producció toca el service worker.
  'src/pwa/registre.test.js',
  // c3 (261030): cap crida al pont natiu sense connector.
  'src/natiu/avisosPushNatius.test.js',
  // c3 (261030), Viquipèdia: el client, sense galetes ni referent (entra per src/data/**).
  'src/data/adaptadors/viquipedia/client.test.js',
  // c3 (261030): cap petició a Wikimedia abans del clic, fotos de Commons sense galetes
  // ni referent i cap panell a l'app nativa.
  'src/sections/pobles/PanellDeViquipedia.test.jsx',
  // c3 (261030): la llista blanca del que es llig de la cau (només https de Wikimedia).
  'src/sections/pobles/cauDeViquipedia.test.js',
  // c3 (261030): la fusió no sobreescriu la fitxa ni porta fotos de Commons a la capçalera.
  'src/sections/pobles/fitxaDelPoble.test.js',
  // c3 (261030): amb la fitxa completa, cap petició, cap panell ni cap base IndexedDB.
  'src/sections/pobles/PoblesSection.lleiDelPixel.test.jsx',
  'src/sections/detail/ItemDetailSection.pobleIncomplet.test.jsx',
  // c3 (261030): el text legal (§20 i §21) diu el que fa el codi.
  'src/sections/text/legal.viquipedia.test.js',
  // c3 (261030): la vCard d'una organització no pot injectar cap propietat.
  'src/sections/profile/vcardOrganitzacio.test.js',
  // c4 (261030), ALT-C1: cap dada d'este ordinador ix de /consola cap a un motor de traducció.
  'src/sections/consola/ConsolaSection.traduccio.test.jsx',
  // c4 (261030): ni la guarda estàtica de les pàgines privades (Consola inclosa) ni la fitxa
  // de la Consola dins de la Wiki (entren pel nom).
  'src/components/universal/PageFrame.traduccio.privades.seguretat.test.js',
  'src/sections/wiki-de-poble/WikiDePobleSection.consolaTraduccio.seguretat.test.jsx',
  // c4 (261030): el WebFinger estàtic de Firebase mai respon el JRD d'un compte per a un altre
  // (simulació de Mastodon) i porta CORS també al 404 (entra pel nom).
  'src/config/firebaseHosting.webfinger.seguretat.test.js',
  // f4b (261030), B3: «Copiar l’enllaç de la imatge» mai porta un arxiu local, un camí del disc,
  // una referència opaca del port, la seua URL signada ni un altre origen (entra pel nom).
  'src/sections/multimedia/panellDeLaFoto.enllac.seguretat.test.js',
  // f4b (261030), B2: les rutes /__iaia (també govern.json, el Llibre Mestre) només responen al
  // mateix ordinador, encara que el servidor de desenvolupament escolte la xarxa (entra pel nom).
  'src/sections/consola/consolaIaia.nomesLocal.seguretat.test.js'
]);

describe('P1-26 · les fronteres de seguretat corren al pre-commit', () => {
  test('PRECOMMIT_INCLUDE es llig del fitxer com a codi, sense cap entrada dubtosa', () => {
    expect(ANALISI.errors).toEqual([]);
    expect(ANALISI.patrons.length).toBeGreaterThan(10);
    expect(ANALISI.patrons).toContain('src/**/*.seguretat.test.{js,jsx}');
  });

  test.each(FRONTERES)('%s és al disc i hi casa', (fitxer) => {
    expect(existsSync(path.join(ARREL, fitxer)), fitxer).toBe(true);
    expect(casa(fitxer), fitxer).toBe(true);
  });

  test('esta guarda també hi entra (pel seu nom)', () => {
    expect(casa('src/config/precommit.cobertura.seguretat.test.js')).toBe(true);
  });

  test('una prova qualsevol fora de la llista no hi casa (la guarda distingix)', () => {
    expect(casa('src/sections/mur/MurSection.test.jsx')).toBe(false);
    expect(casa('src/config/assetResolver.test.js')).toBe(false);
  });
});

/* Mutants en memòria de vitest.precommit.config.js (cap fitxer es toca): les
   maneres plausibles de traure una frontera del pre-commit sense que es veja. */
describe('P1-26 · la guarda no es deixa enganyar', () => {
  const SW = /^([ \t]*)'src\/pwa\/sw\.test\.js',?$/m;
  const muta = (de, a) => {
    const mutant = FONT.replace(de, a);
    expect(mutant, 'el mutant ha de canviar el fitxer').not.toBe(FONT);
    return analitza(mutant);
  };

  test('una entrada comentada amb // ja no hi és', () => {
    const { patrons, errors } = muta(SW, (_, sagnat) => `${sagnat}// 'src/pwa/sw.test.js',`);
    expect(errors).toEqual([]);
    expect(casa('src/pwa/sw.test.js', patrons)).toBe(false);
  });

  test('ni comentada amb /* */', () => {
    const { patrons } = muta(SW, (_, sagnat) => `${sagnat}/* 'src/pwa/sw.test.js', */`);
    expect(casa('src/pwa/sw.test.js', patrons)).toBe(false);
  });

  test('una entrada que no és una cadena literal és un error', () => {
    const { errors } = muta(SW, (_, sagnat) => `${sagnat}'src/pwa/' + 'sw.test.js',`);
    expect(errors.join('\n')).toMatch(/no és una cadena literal/);
  });

  test('un include sobreescrit més avall, o retallat, és un error', () => {
    const sobreescrit = muta('  return config;', "  config.test.include = ['src/data/**/*.test.{js,jsx}'];\n  return config;");
    expect(sobreescrit.errors.join('\n')).toMatch(/include/);
    const retallat = muta('config.test.include = [...PRECOMMIT_INCLUDE];', 'config.test.include = [...PRECOMMIT_INCLUDE].slice(1);');
    expect(retallat.errors.join('\n')).toMatch(/include/);
  });

  test('un exclude afegit, a mà o dins de mergeConfig, és un error', () => {
    const aMa = muta('  return config;', "  config.test.exclude = [...config.test.exclude, 'src/pwa/**'];\n  return config;");
    expect(aMa.errors.join('\n')).toMatch(/exclude/);
    const fusionat = muta('testTimeout: TEMPS_PER_PROVA_MS }', "testTimeout: TEMPS_PER_PROVA_MS, exclude: ['src/pwa/**'] }");
    expect(fusionat.errors.join('\n')).toMatch(/exclude/);
  });

  test('una clau calculada, que no es pot llegir sense executar-la, és un error', () => {
    const { errors } = muta('  return config;', "  const clau = 'in' + 'clude';\n  config.test[clau] = [];\n  return config;");
    expect(errors.join('\n')).toMatch(/clau calculada/);
  });
});
