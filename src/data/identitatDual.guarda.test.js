/**
 * Gauntlet 261016 (Bloc -1; prompt 261016_1530, l. 87-97) · Guarda
 * anti-regressió de la identitat dual. Ordre del Mestre: només hi ha dos
 * autors, l'entitat «Sóc de Poble» i la persona pilot; el nom i l'àlies del
 * fantasma antic han d'estar erradicats de tot el sistema, «Prohibida
 * qualsevol regressió». El Mac Mini és l'ÚNICA publicació de la persona pilot
 * i la seua foto és sempre la del perfil, mai el logotip verd.
 *
 * Només lectura: cap canvi de producte (Llei del Píxel).
 *   (a) Cap fitxer de src/, supabase/, public/, tests/ ni wordpress-plugin/
 *       nomena el fantasma. El patró es compon a trossos perquè este fitxer
 *       no el continga literal; a més, s'exclou a si mateix. Queden fora els
 *       paquets construïts (node_modules, dist, builds) i els generats des de
 *       la Wiki (wikiManifest.js, rag-index.json i slugIndex.json): una
 *       explicació de doctrina que nomenara el fantasma els faria caure en la
 *       regeneració següent. Revisió adversarial del carril D (261016,
 *       problema 5) · Les altres exclusions, deliberades i amb sonda: els
 *       binaris coneguts (BINARIS: una imatge o una font no nomenen ningú;
 *       qualsevol altra extensió, també una que ningú no haja previst, es
 *       llig), les carpetes ocultes (estat local de les eines que no es
 *       publica: supabase/.temp, que guarda secrets, .branches, .vite) i, dels
 *       fitxers ocults, només les metadades del Finder i els fitxers d'entorn
 *       (.env*, que poden portar secrets: AGENTS §5). public/.htaccess, que
 *       es publica amb el lloc, es llig.
 *   (b) Entre les publicacions de les llavors (APP_CONTENT_ROWS) i de les
 *       files de supabase/seed.sql (feedPosts, marketItems, events i notes),
 *       la persona pilot en signa exactament una: marketItems/mac-mini-m4. La
 *       foto derivada que la Multimèdia en trau (mediaItems) no és cap
 *       publicació. La resta les signa l'entitat pilot.
 *   (c) PERSONA_PILOT.avatar és la foto canònica i el fitxer existix a
 *       public/; el Web Component d'identitat (public/, que no pot importar
 *       la llavor) declara la mateixa ruta.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { APP_CONTENT_ROWS } from './appSeed.js';
import { ENTITATS_SEED, PERSONA_PILOT, autoriaSeed } from './identitatsSeed.js';

const ARREL = process.cwd();
const JO = 'src/data/identitatDual.guarda.test.js';

/* El patró del fantasma, a trossos: el nom i l'àlies, amb espai, guió o
   guió baix (o res) entre les dues paraules, i la forma llarga amb «d'». */
const FANTASMA = new RegExp(['mes', 'tre', "[\\s_-]*(?:d['’]\\s*)?", '(?:po', 'ble|ob', 'res)'].join(''), 'i');

const ARRELS = ['src', 'supabase', 'public', 'tests', 'wordpress-plugin'];
const CARPETES_FORA = new Set(['node_modules', 'dist', 'build', 'builds']);
const GENERATS = new Set(['src/data/wikiManifest.js', 'public/rag-index.json', 'public/slugIndex.json']);
/* Revisió adversarial del carril D (261016, problema 5) · Es llig tot fitxer
   llevat dels binaris coneguts: una imatge, una font o un àudio no nomenen
   ningú i llegir-los és pes mort. Abans només es llegia una llista
   d'extensions de text, i un fantasma escrit en un fitxer amb una extensió no
   prevista passava la guarda sense que caiguera. */
const BINARIS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.ico', '.bmp', '.tif', '.tiff', '.heic',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.webm', '.mov',
  '.pdf', '.zip', '.gz', '.epub', '.sig', '.wasm'
]);
/* Les metadades del Finder i els fitxers d'entorn (.env, .env.local,
   docker.env): poden portar secrets (AGENTS §5) i no es publiquen. */
const METADADES_O_ENTORN = /^(?:\.DS[_-]Store|\.env(?:\..*)?|.+\.env)$/i;
const fitxerFora = (nom) => METADADES_O_ENTORN.test(nom) || BINARIS.has(path.extname(nom).toLowerCase());

function fitxersDeText(relatiu, acumulats = []) {
  const absolut = path.join(ARREL, relatiu);
  if (!existsSync(absolut)) return acumulats;
  for (const entrada of readdirSync(absolut, { withFileTypes: true })) {
    if (entrada.isSymbolicLink()) continue;
    const fill = `${relatiu}/${entrada.name}`;
    if (entrada.isDirectory()) {
      // Les carpetes ocultes són estat local de les eines: no es publiquen.
      if (!entrada.name.startsWith('.') && !CARPETES_FORA.has(entrada.name)) fitxersDeText(fill, acumulats);
    } else if (entrada.isFile() && !fitxerFora(entrada.name) && !GENERATS.has(fill) && fill !== JO) {
      acumulats.push(fill);
    }
  }
  return acumulats;
}

/* Cada fila d'app_content del seed.sql: ('tenant', 'clau', '<json amb les
   cometes doblades>'::jsonb, versio). La mateixa regla que seedSql.autoria.test.js. */
const FILA = /\('[^']*', '([A-Za-z]+)', '((?:[^']|'')*)'::jsonb/g;
function filesDelSeedSql() {
  const sql = readFileSync(path.join(ARREL, 'supabase/seed.sql'), 'utf8');
  const files = new Map();
  for (const [, clau, json] of sql.matchAll(FILA)) files.set(clau, JSON.parse(json.replace(/''/g, "'")));
  return files;
}

const PUBLICACIONS = ['feedPosts', 'marketItems', 'events', 'notes'];
/* Una nota només és publicació quan s'ha publicat (n2 és un esborrany buit). */
const esPublicacio = (clau, item) => clau !== 'notes' || item?.isPublished === true;
const ENTITAT_PILOT = ENTITATS_SEED[0];
const CAMPS_DE_NOM = ['author_name', 'seller', 'author'];

/* La persona pilot signa un element per identificador (autoriaSeed, amb la
   prioritat de l'entitat) o, si algú la torna a escriure a mà, pel seu nom
   visible: la guarda no deixa colar cap segona publicació amb el seu nom. */
const signaLaPilot = (item) => autoriaSeed(item)?.tipus === 'persona'
  || CAMPS_DE_NOM.some((camp) => item?.[camp] === PERSONA_PILOT.nom);
/* L'entitat pilot, per identificador o, sense cap identificador d'autoria,
   pel seu nom (la nota n1 de la llavor). */
const signaLEntitatPilot = (item) => {
  const autoria = autoriaSeed(item);
  if (autoria) return autoria.tipus === 'entitat' && autoria.nom === ENTITAT_PILOT.name;
  return CAMPS_DE_NOM.some((camp) => item?.[camp] === ENTITAT_PILOT.name);
};

function publicacionsDe(font) {
  const llista = [];
  for (const clau of PUBLICACIONS) {
    const payload = font.get(clau);
    if (!Array.isArray(payload)) continue;
    for (const item of payload) if (esPublicacio(clau, item)) llista.push({ clau: `${clau}/${item.id}`, item });
  }
  return llista;
}

const FONTS = {
  llavors: () => new Map(APP_CONTENT_ROWS.map(({ key, payload }) => [key, payload])),
  'supabase/seed.sql': filesDelSeedSql
};

describe('(a) el fantasma antic no torna', () => {
  test('sonda: el patró troba totes les formes del fantasma i no casa amb el Mestre del poble fundacional', () => {
    const formes = [
      ['Mes', 'tre Po', 'ble'], ['mes', 'tre-ob', 'res'], ['Mes', "tre d'Ob", 'res'], ['mes', 'tre_po', 'ble'],
      ['MES', 'TREPO', 'BLE'], ['mes', 'tre d’ ob', 'res']
    ].map((trossos) => trossos.join(''));
    for (const forma of formes) expect([forma, FANTASMA.test(forma)]).toEqual([forma, true]);
    for (const net of ['identitats del Mestre (POBLE_FUNDACIONAL)', 'ordre del Mestre', 'Sóc de Poble']) {
      expect([net, FANTASMA.test(net)]).toEqual([net, false]);
    }
  });

  test('sonda: el recorregut llig les cinc arrels i deixa fora els paquets, els generats i la guarda', () => {
    const fitxers = new Set(fitxersDeText('src').concat(...ARRELS.slice(1).map((arrel) => fitxersDeText(arrel))));
    expect(fitxers.size).toBeGreaterThan(500);
    /* public/.htaccess és ocult però es publica amb el lloc: es llig. */
    for (const viu of ['src/css/utilities.css', 'supabase/seed.sql', 'public/components/sp-identity-components.js', 'tests/standalone-build.test.mjs', 'wordpress-plugin/socdepoble-enxufe.php', 'public/.htaccess']) {
      expect([viu, fitxers.has(viu)]).toEqual([viu, true]);
    }
    for (const fora of [JO, ...GENERATS]) expect([fora, fitxers.has(fora)]).toEqual([fora, false]);
    expect([...fitxers].filter((fitxer) => fitxer.split('/').some((tros) => CARPETES_FORA.has(tros)))).toEqual([]);
    // Cap carpeta oculta, cap binari conegut, cap metadada del Finder ni cap fitxer d'entorn.
    expect([...fitxers].filter((fitxer) => fitxer.split('/').slice(0, -1).some((tros) => tros.startsWith('.')))).toEqual([]);
    expect([...fitxers].filter((fitxer) => fitxerFora(path.basename(fitxer)))).toEqual([]);
  });

  test('sonda: què queda fora pel nom, i què no', () => {
    for (const nom of ['.DS_Store', '.DS-Store', '.env', '.env.local', 'docker.env', 'foto.JPG', 'logo.png', 'lletra.woff2', 'llibre.epub', 'stable.json.sig']) {
      expect([nom, fitxerFora(nom)]).toEqual([nom, true]);
    }
    for (const nom of ['.htaccess', '.keep', 'notes.log', 'dades.tsv', 'Makefile', 'estil.scss', 'env.example.js', 'entorn.md']) {
      expect([nom, fitxerFora(nom)]).toEqual([nom, false]);
    }
  });

  test('cap fitxer de src, supabase, public, tests ni wordpress-plugin el nomena', () => {
    const trobats = ARRELS.flatMap((arrel) => fitxersDeText(arrel)).flatMap((fitxer) => readFileSync(path.join(ARREL, fitxer), 'utf8')
      .split('\n')
      .map((linia, index) => (FANTASMA.test(linia) ? `${fitxer}:${index + 1}` : null))
      .filter(Boolean));
    expect(trobats).toEqual([]);
  }, 60000);
});

describe('(b) el Mac Mini és l’única publicació de la persona pilot', () => {
  test.each(Object.keys(FONTS))('%s: la persona pilot signa exactament marketItems/mac-mini-m4', (nomDeLaFont) => {
    const publicacions = publicacionsDe(FONTS[nomDeLaFont]());
    expect(publicacions.length).toBeGreaterThan(1);
    expect(publicacions.filter(({ item }) => signaLaPilot(item)).map(({ clau }) => clau)).toEqual(['marketItems/mac-mini-m4']);
    const { item: mac } = publicacions.find(({ clau }) => clau === 'marketItems/mac-mini-m4');
    expect(mac).toMatchObject({ seller: 'Javi Llinares', author_name: 'Javi Llinares', author_id: 'javillinares' });
    expect(mac.author_name).toBe(PERSONA_PILOT.nom);
  });

  test.each(Object.keys(FONTS))('%s: totes les altres publicacions les signa «Sóc de Poble»', (nomDeLaFont) => {
    const altres = publicacionsDe(FONTS[nomDeLaFont]()).filter(({ item }) => !signaLaPilot(item));
    expect(altres.length).toBeGreaterThan(0);
    expect(altres.filter(({ item }) => !signaLEntitatPilot(item)).map(({ clau }) => clau)).toEqual([]);
  });

  test('sonda: una segona publicació signada per la pilot (per id o pel nom) es detecta; un homònim amb l’entitat davant, no', () => {
    expect(signaLaPilot({ id: 'x', author_id: 'javi' })).toBe(true);
    expect(signaLaPilot({ id: 'x', owner_user_id: '0001' })).toBe(true);
    expect(signaLaPilot({ id: 'x', author_name: PERSONA_PILOT.nom })).toBe(true);
    expect(signaLaPilot({ id: 'x', author_id: 'javillinares', author_entity_id: 'socdepoble' })).toBe(false);
    expect(signaLEntitatPilot({ id: 'x', author_id: 'pepa', author_name: 'Pepa' })).toBe(false);
  });
});

describe('(c) la foto de la persona pilot', () => {
  const FOTO = '/assets/fotos/javi-llinares-perfil-1200px.jpg';

  test('PERSONA_PILOT.avatar és la foto canònica i el fitxer existix a public/', () => {
    expect(PERSONA_PILOT.avatar).toBe(FOTO);
    expect(existsSync(path.join(ARREL, 'public', FOTO))).toBe(true);
    expect(PERSONA_PILOT.avatar).not.toBe(ENTITAT_PILOT.logo_url);
  });

  test('el Web Component d’identitat (public/components) declara la mateixa ruta', () => {
    const codi = readFileSync(path.join(ARREL, 'public/components/sp-identity-components.js'), 'utf8');
    const rutes = [...codi.matchAll(/avatarUrl:\s*'([^']+)'/g)].map(([, ruta]) => ruta);
    expect(rutes).toEqual([PERSONA_PILOT.avatar]);
  });
});
