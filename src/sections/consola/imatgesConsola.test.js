import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · Les
   il·lustracions de la Consola, d'una sola taula (imatgesConsola.js): cap
   ruta inventada (el fitxer és al disc, dins de public/), cap imatge
   repetida (una il·lustració, un sol lloc de /consola) i cap text
   alternatiu inventat per a una imatge que ja pinta una altra font (PAGE_COPY
   o el registre de plugins): el seu. Mateix patró que les proves de l'Índex
   de l'Onada 12 (indexConsola.test.js), que la taula hereta. */
import { IMATGES_CONSOLA, imatgeDePagina, miniaturaDe, miniaturaDePagina } from './imatgesConsola.js';
import { IDS_PAGINES } from './consolaPagines.js';
import { IDS_GOVERN } from './govern/governConsola.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { PLUGINS, pluginPerId } from '../plugins/registrePlugins.js';

const PUBLIC = path.join(process.cwd(), 'public');
const alDisc = (ruta) => path.join(PUBLIC, ...ruta.split('/').filter(Boolean));
const esFitxerAmbPes = (ruta) => existsSync(alDisc(ruta)) && statSync(alDisc(ruta)).isFile() && statSync(alDisc(ruta)).size > 0;
/* Expectativa actualitzada a propòsit (ordre del Mestre, 261021, torn fase 2,
   Mòdul B, P0-14) · Les vinyetes de Treball, el Mapa i Salut ja només viuen
   com a WebP (l'original .jpg ix de public/; la bessona té les mateixes
   mides): la forma admet .webp, però només quan no hi ha cap .jpg al costat
   (ho vigila la prova «cada fitxer és a public/…»). Abans: només .jpg. */
const FORMA = /^\/assets\/(ui\/plugins\/[a-z]+_vinyeta|nano_cards\/[a-z_]+_nano_card)\.(?:jpg|webp)$/;

/* Totes les fonts que ja pinten una imatge, amb el seu text alternatiu. */
const FONTS = [
  ...Object.entries(PAGE_COPY).filter(([, c]) => c?.image).map(([clau, c]) => ({ on: `PAGE_COPY.${clau}`, imatge: c.image, alt: c.imageAlt })),
  ...PLUGINS.map((p) => ({ on: `plugin ${p.id}`, imatge: p.imatge, alt: p.imatgeAlt }))
];

describe('la taula', () => {
  /* Ordre del Mestre del 30-10-2026 (B1) · Expectativa actualitzada a
     propòsit: darrere de les nou pàgines del tauler, les quatre del Govern del
     Mestre, en l'ordre d'IDS_GOVERN. Abans: ['index', ...IDS_PAGINES]. */
  test('una entrada per a l’H2 de l’Índex, una per cada pàgina del tauler, en l’ordre d’IDS_PAGINES, i una per cada pàgina del govern', () => {
    expect(Object.keys(IMATGES_CONSOLA)).toEqual(['index', ...IDS_PAGINES, ...IDS_GOVERN]);
    expect(Object.isFrozen(IMATGES_CONSOLA)).toBe(true);
    for (const [id, il] of Object.entries(IMATGES_CONSOLA)) {
      expect(Object.isFrozen(il), id).toBe(true);
      expect(Object.keys(il), id).toEqual(['imatge', 'imatgeAlt']);
    }
  });

  test('cada fitxer és a public/, amb pes, i té la forma d’una vinyeta o d’una nano card', () => {
    for (const [id, { imatge }] of Object.entries(IMATGES_CONSOLA)) {
      expect(imatge, id).toMatch(FORMA);
      expect(esFitxerAmbPes(imatge), `${imatge} no és a public/`).toBe(true);
      // Una .webp només si el seu .jpg ja no és al disc: mentre hi ha l'original, la taula nomena l'original.
      if (imatge.endsWith('.webp')) expect(existsSync(alDisc(imatge.replace(/\.webp$/, '.jpg'))), imatge).toBe(false);
    }
    expect(Object.values(IMATGES_CONSOLA).map((x) => x.imatge).filter((ruta) => ruta.endsWith('.webp')).sort())
      .toEqual(['/assets/ui/plugins/mapa_vinyeta.webp', '/assets/ui/plugins/salut_vinyeta.webp', '/assets/ui/plugins/treball_vinyeta.webp']);
  });

  test('cap imatge repetida: una il·lustració, un sol lloc de /consola (lliçó 261010)', () => {
    const rutes = Object.values(IMATGES_CONSOLA).map((x) => x.imatge);
    expect(new Set(rutes).size).toBe(rutes.length);
  });

  test('cada text alternatiu descriu la imatge (més de 20 caràcters, sense punt final) i cap es repetix', () => {
    const alts = Object.values(IMATGES_CONSOLA).map((x) => x.imatgeAlt);
    for (const alt of alts) {
      expect(alt.length, alt).toBeGreaterThan(20);
      expect(alt, alt).not.toMatch(/\.$/);
    }
    expect(new Set(alts).size).toBe(alts.length);
  });
});

describe('les fonts', () => {
  test('una imatge que ja pinta una altra font porta el text alternatiu d’eixa font', () => {
    for (const [id, { imatge, imatgeAlt }] of Object.entries(IMATGES_CONSOLA)) {
      const seues = FONTS.filter((f) => f.imatge === imatge);
      if (seues.length) expect(seues.map((f) => f.alt), `${id} · ${imatge}`).toContain(imatgeAlt);
    }
  });

  test('les de les fonts nomenades al criteri: la Consola, el Cervell, Treball, el Calendari, el Mapa i Salut', () => {
    expect(IMATGES_CONSOLA.index).toEqual({ imatge: PAGE_COPY.consola.image, imatgeAlt: PAGE_COPY.consola.imageAlt });
    expect(IMATGES_CONSOLA.explorador).toEqual({ imatge: PAGE_COPY.cervell.image, imatgeAlt: PAGE_COPY.cervell.imageAlt });
    expect(IMATGES_CONSOLA.fluxos).toEqual({ imatge: PAGE_COPY.treball.image, imatgeAlt: PAGE_COPY.treball.imageAlt });
    expect(IMATGES_CONSOLA.calendari).toEqual({ imatge: PAGE_COPY.publicar_calendari.image, imatgeAlt: PAGE_COPY.publicar_calendari.imageAlt });
    expect(IMATGES_CONSOLA.actors).toEqual({ imatge: PAGE_COPY.publicar_mapa.image, imatgeAlt: PAGE_COPY.publicar_mapa.imageAlt });
    const salut = pluginPerId('salut');
    expect(IMATGES_CONSOLA.salut).toEqual({ imatge: salut.imatge, imatgeAlt: salut.imatgeAlt });
    // «El Cervell» viu a l'Explorador: ho diu el seu copy, i per això la seua imatge va a eixa targeta.
    expect(PAGE_COPY.cervell.lead).toContain('Explorador');
  });

  test('les quatre que cap altra pantalla no pinta porten un text propi (pols, inventari, entrades i agents)', () => {
    for (const id of ['pols', 'inventari', 'entrades', 'agents']) {
      expect(FONTS.filter((f) => f.imatge === IMATGES_CONSOLA[id].imatge), id).toEqual([]);
    }
  });

  /* Ordre del Mestre del 30-10-2026 (B1) · Les quatre portades del Govern del
     Mestre: la nano card del seu id, que cap altra pantalla no pinta, i un alt
     que descriu el dibuix sense interpretar-lo (cap «somriure murri» ni cap
     «inventora boja»). */
  test('les quatre del Govern del Mestre: la seua nano card de 1024 px, cap altra font i un alt que descriu sense interpretar', () => {
    for (const id of IDS_GOVERN) {
      const { imatge, imatgeAlt } = IMATGES_CONSOLA[id];
      expect(imatge, id).toBe(`/assets/nano_cards/govern_${id}_nano_card.jpg`);
      expect(FONTS.filter((f) => f.imatge === imatge), id).toEqual([]);
      expect(imatgeAlt, id).toMatch(/^Il·lustració de còmic: /);
      expect(imatgeAlt, id).not.toMatch(/somri|murri|\bboj|\bbog|masia/iu);
      // q≈85 i ~250-400 KB, com les vinyetes de la Consola; la bessona .webp hi és i pesa menys.
      expect(statSync(alDisc(imatge)).size, id).toBeGreaterThan(250_000);
      expect(statSync(alDisc(imatge)).size, id).toBeLessThan(450_000);
      expect(esFitxerAmbPes(imatge.replace(/\.jpg$/, '.webp')), id).toBe(true);
    }
  });

  /* Gauntlet f4b (govern, «b1-alt-certificacio-imprecis») · Els alts diuen el que es veu: a la
     certificació, només el robot de l'engranatge sosté un full (el de la marca verda té les mans
     buides); a la comunicació, la iaia porta ulleres redones de vidre fosc. Derogat: «porten fulls». */
  test('els alts de la certificació i de la comunicació diuen el que es veu', () => {
    expect(IMATGES_CONSOLA.certificacio.imatgeAlt).toContain('un amb una marca verda al pit i l’altre, amb un engranatge, que sosté un full,');
    expect(IMATGES_CONSOLA.certificacio.imatgeAlt).not.toMatch(/porten fulls/);
    expect(IMATGES_CONSOLA.comunicacio.imatgeAlt).toContain('una iaia amb ulleres redones fosques, mocador groc de pics');
  });
});

/* Gauntlet f4b (govern, «b1-portades-sense-mida-ni-identitat») · Cap descodificador d'imatges a
   node_modules (cap npm install sense el Mestre): la mida i la identitat de cada il·lustració que el
   tauler pinta per la bessona .webp (miniaturaDe) les mesura Pillow al manifest identitatImatges.json,
   lligat a cada fitxer pel sha256 i el pes: si algú canvia una imatge sense tornar a mesurar-la, cau.
   La identitat és un dHash de 16×16 en grisos: la bessona i el seu .jpg queden a una distància de
   Hamming de `llindar` o menys, i cada portada del Govern, a la mateixa distància de l'original de
   l'ordre B1 (ORIGINALS_GOVERN, mesurats una vegada; per a la certificació, la «bonhomia») i a més de
   `llindar` de la versió descartada. LÍMIT DECLARAT: un dHash veu la composició, no el detall; dos
   dibuixos quasi iguals (la certificació descartada en queda a 13 bits) els separa el llindar, però
   un retoc menut no el veu.
   Regeneració, des de l'arrel del repositori (Python 3 amb Pillow, amb WebP); l'eixida és determinista:

python3 -I - > src/sections/consola/identitatImatges.json <<'PY'
import hashlib, json
from PIL import Image
PARELLES = [('/assets/ui/plugins', 'consola_vinyeta'), ('/assets/ui/plugins', 'cervell_vinyeta')] + [
    ('/assets/nano_cards', f'govern_{i}_nano_card') for i in ('requeriments', 'balanc', 'certificacio', 'comunicacio')]
def dhash(cami, n=16):
    g = Image.open(cami).convert('L').resize((n + 1, n), Image.Resampling.BOX)
    px = g.load()
    bits = ''.join('1' if px[x + 1, y] > px[x, y] else '0' for y in range(n) for x in range(n))
    return f'{int(bits, 2):0{n * n // 4}x}'
def entrada(cami):
    with open(cami, 'rb') as fh: dades = fh.read()
    return {'sha256': hashlib.sha256(dades).hexdigest(), 'bytes': len(dades), 'mida': list(Image.open(cami).size), 'dhash': dhash(cami)}
imatges = {f'{c}/{b}{e}': entrada(f'public{c}/{b}{e}') for c, b in PARELLES for e in ('.jpg', '.webp')}
cap = {'schema': 'sdp.identitat-imatges.v1', 'metode': "dHash de 16×16 en grisos: Pillow, convert('L') i resize((17, 16), BOX); 256 bits en hexadecimal", 'llindar': 8}
linies = ['{'] + [f' {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},' for k, v in cap.items()] + [' "imatges": {']
claus = sorted(imatges)
linies += [f'  {json.dumps(k)}: {json.dumps(imatges[k])}' + (',' if i < len(claus) - 1 else '') for i, k in enumerate(claus)]
print('\n'.join(linies + [' }', '}']))
PY
*/
const IDENTITAT = JSON.parse(readFileSync(path.join(process.cwd(), 'src/sections/consola/identitatImatges.json'), 'utf8'));
/* Els originals de l'ordre B1, al cervell de Gemini (fora del repositori), mesurats amb el mateix dHash el 30-10-2026. */
const ORIGINALS_GOVERN = Object.freeze({
  requeriments: {
    font: 'govern_requeriments_1024_1793366415744.jpg', sha256: '0e0acde863a904563a53db4f812e0913ea1d849d63cdc8efc46c1ee6c4f01789',
    dhash: 'fe18de54cfda73276a36683661ce60e660f0623372f53e4c1d2c192c7987be23'
  },
  balanc: {
    font: 'govern_balanc_1024_1793366472193.jpg', sha256: '069d386018c31583e98a61f8519da0ead9e0b492b51d9b829aee2a0120779de4',
    dhash: '782966ad66d2c4d4dcd4d3b5f319f398a5a5b54b7751b3cbc9ecdd0933993f41'
  },
  certificacio: {
    font: 'govern_certificacio_1024_bonhomia_1793369178971.jpg', sha256: 'ed9969627cbc514dd224a6f2122c1b187e72d63779efd377d0014759868815cb',
    dhash: 'b0ccfaccb1f0130cbb0c9f089f0dbb2561a03d8455d134bd142508e59b16f184',
    descartada: {
      font: 'govern_certificacio_1024_1793368258762.jpg', sha256: '569ac07efc79ca808243877e527cf872438be75f4a894d3fcb1e4b7555de59bb',
      dhash: 'b0ccfaccb1f0130cba0c8d8c9c9dbb2561a03dc4559136bd142508e58b16f184'
    }
  },
  comunicacio: {
    font: 'govern_comunicacio_1024_1793366652556.jpg', sha256: '424ce404c43dfae14049e34e03da89a874c6c770a523e4c01edd3ef328d245a0',
    dhash: '80c8ee08ecdbedd6e650672683261325233c3339618b31175587360fdae8cfc8'
  }
});
/* Quants bits canvien entre dos dHash (en hexadecimal, de la mateixa llargària). */
function hamming(a, b) {
  let bits = 0;
  for (let i = 0; i < a.length; i += 1) {
    let x = Number.parseInt(a[i], 16) ^ Number.parseInt(b[i], 16);
    while (x) { bits += x & 1; x >>= 1; }
  }
  return bits;
}
/* Les il·lustracions de la taula que el tauler pinta per la seua bessona: [.jpg, .webp]. */
const BESSONES = Object.values(IMATGES_CONSOLA).map(({ imatge }) => imatge)
  .filter((imatge) => miniaturaDe(imatge) !== imatge).map((imatge) => [imatge, miniaturaDe(imatge)]);

describe('la mida i la identitat de les il·lustracions que el tauler pinta per la bessona (identitatImatges.json)', () => {
  test('el manifest és el de les bessones de la taula, i cada entrada és la del fitxer (pes i sha256)', () => {
    expect(IDENTITAT.schema).toBe('sdp.identitat-imatges.v1');
    expect(IDENTITAT.llindar).toBe(8);
    expect(BESSONES).toHaveLength(6);
    expect(Object.keys(IDENTITAT.imatges).sort()).toEqual(BESSONES.flat().sort());
    for (const src of BESSONES.flat()) {
      const bytes = readFileSync(alDisc(src));
      const missatge = `${src} ha canviat sense tornar a mesurar-la: regenera identitatImatges.json (capçalera d'este bloc de proves)`;
      expect(bytes.length, missatge).toBe(IDENTITAT.imatges[src].bytes);
      expect(createHash('sha256').update(bytes).digest('hex'), missatge).toBe(IDENTITAT.imatges[src].sha256);
      expect(IDENTITAT.imatges[src].dhash, src).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test('cada bessona .webp és la mateixa il·lustració que el seu .jpg, a la mateixa mida', () => {
    for (const [jpg, webp] of BESSONES) {
      expect(IDENTITAT.imatges[webp].mida, webp).toEqual(IDENTITAT.imatges[jpg].mida);
      expect(hamming(IDENTITAT.imatges[jpg].dhash, IDENTITAT.imatges[webp].dhash), webp).toBeLessThanOrEqual(IDENTITAT.llindar);
    }
  });

  test('les quatre portades del Govern, .jpg i .webp, són de 1024×1024 i són els originals de l’ordre B1 (la certificació, la «bonhomia»)', () => {
    // El llindar separa les dues versions de la certificació.
    expect(hamming(ORIGINALS_GOVERN.certificacio.dhash, ORIGINALS_GOVERN.certificacio.descartada.dhash)).toBeGreaterThan(IDENTITAT.llindar);
    for (const id of IDS_GOVERN) {
      const original = ORIGINALS_GOVERN[id];
      for (const src of [IMATGES_CONSOLA[id].imatge, miniaturaDe(IMATGES_CONSOLA[id].imatge)]) {
        expect(IDENTITAT.imatges[src]?.mida, src).toEqual([1024, 1024]);
        expect(hamming(IDENTITAT.imatges[src].dhash, original.dhash), `${src} · ${original.font}`).toBeLessThanOrEqual(IDENTITAT.llindar);
        if (original.descartada) {
          expect(hamming(IDENTITAT.imatges[src].dhash, original.descartada.dhash), `${src} · ${original.descartada.font}`).toBeGreaterThan(IDENTITAT.llindar);
        }
      }
    }
  });
});

describe('imatgeDePagina', () => {
  test('cada pàgina del tauler i del govern, la seua entrada de la taula, tal qual', () => {
    for (const id of [...IDS_PAGINES, ...IDS_GOVERN]) expect(imatgeDePagina(id), id).toBe(IMATGES_CONSOLA[id]);
  });

  test('l’H2 de l’Índex no és cap pàgina, i un id desconegut o heretat no en porta: null i buit', () => {
    for (const id of ['index', 'mas', 'pestanyes', '', undefined, null, 'toString', '__proto__']) {
      expect(imatgeDePagina(id), String(id)).toEqual({ imatge: null, imatgeAlt: '' });
    }
  });
});

/* Gauntlet 261030 (cicle 2, vinyetes-1024-jpg-a-miniatures; Fase 3, P1Y) · El
   tauler pinta la bessona .webp de les vinyetes de 1024 px; la taula i el SEO
   continuen amb el .jpg (l'original, que és al disc). */
describe('miniaturaDe i miniaturaDePagina', () => {
  test('la Consola i el Cervell es pinten amb la bessona .webp, que és al disc amb pes i pesa menys', () => {
    expect(miniaturaDe(IMATGES_CONSOLA.index.imatge)).toBe('/assets/ui/plugins/consola_vinyeta.webp');
    expect(miniaturaDe(IMATGES_CONSOLA.explorador.imatge)).toBe('/assets/ui/plugins/cervell_vinyeta.webp');
    for (const id of ['index', 'explorador']) {
      const { imatge } = IMATGES_CONSOLA[id];
      expect(imatge, id).toMatch(/\.jpg$/);
      expect(esFitxerAmbPes(miniaturaDe(imatge)), id).toBe(true);
      expect(statSync(alDisc(miniaturaDe(imatge))).size, id).toBeLessThan(statSync(alDisc(imatge)).size);
    }
  });

  // Ordre del Mestre del 30-10-2026 (B1) · Les quatre portades del Govern també.
  test('les quatre del Govern es pinten amb la bessona .webp, que és al disc amb pes i pesa menys', () => {
    for (const id of IDS_GOVERN) {
      const { imatge, imatgeAlt } = IMATGES_CONSOLA[id];
      expect(miniaturaDe(imatge), id).toBe(`/assets/nano_cards/govern_${id}_nano_card.webp`);
      expect(esFitxerAmbPes(miniaturaDe(imatge)), id).toBe(true);
      expect(statSync(alDisc(miniaturaDe(imatge))).size, id).toBeLessThan(statSync(alDisc(imatge)).size);
      expect(miniaturaDePagina(id), id).toEqual({ imatge: miniaturaDe(imatge), imatgeAlt });
      expect(imatgeDePagina(id).imatge, id).toBe(imatge);
    }
  });

  test('la resta de rutes passen tal qual (cap .webp inventada)', () => {
    for (const id of IDS_PAGINES.filter((x) => x !== 'explorador')) {
      expect(miniaturaDe(IMATGES_CONSOLA[id].imatge), id).toBe(IMATGES_CONSOLA[id].imatge);
    }
    for (const ruta of ['/assets/ui/plugins/consola_vinyeta.webp', '/assets/ui/plugins/consola_vinyeta-social-1200x630.jpg', '', null, undefined]) {
      expect(miniaturaDe(ruta), String(ruta)).toBe(ruta);
    }
  });

  test('miniaturaDePagina: l’alt i la forma de imatgeDePagina, amb la ruta de la miniatura; la taula no canvia', () => {
    expect(miniaturaDePagina('explorador')).toEqual({ imatge: '/assets/ui/plugins/cervell_vinyeta.webp', imatgeAlt: IMATGES_CONSOLA.explorador.imatgeAlt });
    for (const id of IDS_PAGINES.filter((x) => x !== 'explorador')) expect(miniaturaDePagina(id), id).toEqual(imatgeDePagina(id));
    for (const id of ['index', 'mas', '', undefined]) expect(miniaturaDePagina(id), String(id)).toEqual({ imatge: null, imatgeAlt: '' });
    expect(imatgeDePagina('explorador').imatge).toBe('/assets/ui/plugins/cervell_vinyeta.jpg');
  });
});
