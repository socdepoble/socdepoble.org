// @vitest-environment node
/* Onada R9 (carril C5; IDEA-112, IDEA-113 i IDEA-115) · Les dades del banc de llavors, de les rutes i dels arbres
   monumentals, contra la font. Dos nivells:
     1. sempre: cada dada és, lletra a lletra, a les línies que cita dels extractes de tests/fixtures/patrimoni/;
     2. quan la font sencera és al disc (../_cultura_de_poble, o SDP_CULTURA_DE_POBLE), cada línia de l'extracte
        és la de la font i l'empremta SHA-256 n'és la del fitxer.
   També blinda els rebutjos de G9-01 a G9-05: cap arbre, ruta, custodi, lot ni atribució inventats. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ESPECIES_ATLES_CATALUNYA, FONTS_BANC_LLAVORS, VARIETATS_AVL_MALLORCA, VARIETATS_CATALEG_VALENCIA,
  entradesDelCataleg, filtraEntrades
} from './bancLlavors.js';
import { PLANTILLA_RUTES_DE_POBLE, RUTES_LA_TORRE, validaRutesDePoble } from './rutesDePoble.js';
import { ARBRES_MONUMENTALS_LA_TORRE, FONT_ARBRES_MONUMENTALS } from './arbresMonumentals.js';

const FIX = path.join(process.cwd(), 'tests/fixtures/patrimoni');
const ARREL_CULTURA = process.env.SDP_CULTURA_DE_POBLE || path.resolve(process.cwd(), '..', '_cultura_de_poble');
const TEL = /\b\d{3} \d{2,3} \d{2,3}(?: \d{2,3})?/g;
const redacta = (text) => text.replace(TEL, '[telèfon retirat]');
const norm = (text) => String(text).normalize('NFC').replace(/\s+/g, ' ').trim();
/* Com l'extracció: una línia que acaba en guionet i una que comença en minúscula fan una sola paraula. */
const uneix = (linies) => linies.reduce((acc, linia) => {
  const t = linia.trim();
  if (!t) return acc;
  if (/\p{L}-$/u.test(acc) && /^\p{Ll}/u.test(t)) return acc + t;
  return acc ? `${acc} ${t}` : t;
}, '').replace(/\s+/g, ' ').trim();

function extracte(nom) {
  const cap = {};
  const linies = new Map();
  for (const linia of readFileSync(path.join(FIX, nom), 'utf8').split('\n')) {
    if (!linia) continue;
    if (linia.startsWith('# ')) {
      const m = /^# (font|sha256|linies-font): (.+)$/.exec(linia);
      if (m) cap[m[1]] = m[2];
      continue;
    }
    const tab = linia.indexOf('\t');
    linies.set(Number(linia.slice(0, tab)), linia.slice(tab + 1));
  }
  return { cap, linies };
}
const fontSencera = (relatiu) => {
  const cami = path.join(path.dirname(ARREL_CULTURA), relatiu);
  return existsSync(cami) ? readFileSync(cami) : null;
};
const linia = (ex, n) => {
  expect(ex.linies.has(n), `la línia ${n} no és a l'extracte`).toBe(true);
  return ex.linies.get(n);
};
const tros = (ex, a, b = a) => {
  const out = [];
  for (let n = a; n <= b; n += 1) out.push(linia(ex, n));
  return uneix(out);
};

const EX_VALENCIA = extracte('cataleg-valencia.extracte.txt');
const EX_AVL = extracte('avl-mallorca-2020.extracte.txt');
const EX_ATLES = extracte('atles-catalunya.extracte.txt');
const EX_ITINERARIS = extracte('itineraris-la-torre.extracte.txt');
const EX_WP = JSON.parse(readFileSync(path.join(FIX, 'arbres-wp619.extracte.json'), 'utf8'));
const font = (id) => FONTS_BANC_LLAVORS.find((f) => f.id === id);

describe('els extractes són literals de la font sencera (quan és al disc)', () => {
  for (const [nom, ex] of [['cataleg-valencia', EX_VALENCIA], ['avl-mallorca-2020', EX_AVL], ['atles-catalunya', EX_ATLES], ['itineraris-la-torre', EX_ITINERARIS]]) {
    const bytes = fontSencera(ex.cap.font);
    it.skipIf(!bytes)(`${nom}: SHA-256 i cada línia citada`, () => {
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(ex.cap.sha256);
      const linies = bytes.toString('utf8').split('\n');
      expect(linies.length).toBe(Number(ex.cap['linies-font']));
      for (const [n, text] of ex.linies) expect(redacta(linies[n - 1]), `${nom}:${n}`).toBe(text);
    });
  }
  const bytesWp = fontSencera(EX_WP.font);
  it.skipIf(!bytesWp)('WP 619: SHA-256, camp text i àncores de les 19 fitxes', () => {
    expect(createHash('sha256').update(bytesWp).digest('hex')).toBe(EX_WP.sha256);
    const wp = JSON.parse(bytesWp.toString('utf8'))[FONT_ARBRES_MONUMENTALS.camp];
    expect([wp.id, wp.link, wp.date, wp.title]).toEqual([EX_WP.id, EX_WP.link, EX_WP.date, EX_WP.title]);
    const text = wp.text.split('\n');
    for (const [n, valor] of Object.entries(EX_WP.text)) expect(text[Number(n) - 1]).toBe(valor);
    for (const a of EX_WP.ancores) expect(wp.contentHtml).toContain(`<a href="${a.href}">${a.text}</a>`);
  });
  it('les empremtes de les dades són les dels extractes', () => {
    expect(font('cataleg-valencia').sha256).toBe(EX_VALENCIA.cap.sha256);
    expect(font('avl-mallorca').sha256).toBe(EX_AVL.cap.sha256);
    expect(font('atles-catalunya').sha256).toBe(EX_ATLES.cap.sha256);
    expect(RUTES_LA_TORRE.font.sha256).toBe(EX_ITINERARIS.cap.sha256);
    expect(FONT_ARBRES_MONUMENTALS.sha256).toBe(EX_WP.sha256);
    for (const [f, ex] of [[font('cataleg-valencia'), EX_VALENCIA], [font('avl-mallorca'), EX_AVL], [font('atles-catalunya'), EX_ATLES], [RUTES_LA_TORRE.font, EX_ITINERARIS]]) {
      expect(f.document).toBe(ex.cap.font);
    }
  });
});

describe('IDEA-112 · banc de llavors', () => {
  it('atribució de cada catàleg segons el document (G9-03)', () => {
    const v = font('cataleg-valencia');
    expect(tros(EX_VALENCIA, ...v.cites.marc)).toContain('Pla de diversitat agrària');
    expect(tros(EX_VALENCIA, ...v.cites.cataleg)).toContain('Catàleg valencià de varietats tradicionals d’interés agrari');
    expect(tros(EX_VALENCIA, ...v.cites.llavors)).toContain('Elx, Vila-real i Carcaixent');
    expect(tros(EX_VALENCIA, ...v.cites.llavors)).toContain('productors i productores que les sol·liciten');
    expect(v.ambit).toBe('Terres valencianes');
    expect(tros(EX_VALENCIA, ...v.cites.ambit)).toContain('terres valencianes');
    const a = font('avl-mallorca');
    expect(a.autoria).toBe('Associació de Varietats Locals (AVL), de Mallorca');
    expect(tros(EX_AVL, ...a.cites.autoria)).toMatch(/^L’Associació de Varietats Locals \(AVL en endavant\) és .*de Mallorca\.$/);
    expect(tros(EX_AVL, ...a.cites.web)).toContain('www.varietatslocals.org');
    expect(tros(EX_AVL, ...a.cites.titol)).toBe('catàleg de llavors 2020');
    // La discrepància és certa: la capçalera del corpus diu «Acadèmia», el document no.
    expect(linia(EX_AVL, 1)).toContain('Acadèmia Valenciana de la Llengua');
    expect(a.discrepancies.join(' ')).toContain('Mana el document');
    for (const f of FONTS_BANC_LLAVORS) expect(f.autoria).not.toMatch(/Acadèmia/);
    const t = font('atles-catalunya');
    expect(tros(EX_ATLES, ...t.cites.autoria)).toMatch(/^La Fundació Miquel Agustí, entitat de referència/);
    expect(tros(EX_ATLES, ...t.cites.autoria)).toContain('Primera proposta de l’Atles de les varietats hortícoles locals catalanes');
    expect(linia(EX_ATLES, 1)).toContain('Atles de les Varietats Locals i Patrimoni Agrícola');
  });

  it('Catàleg valencià: 45 fitxes, cada camp a les seues línies', () => {
    expect(VARIETATS_CATALEG_VALENCIA).toHaveLength(45);
    expect(new Set(VARIETATS_CATALEG_VALENCIA.map((v) => v.id)).size).toBe(45);
    expect(VARIETATS_CATALEG_VALENCIA.map((v) => v.pagina)).toEqual(Array.from({ length: 45 }, (_, i) => i + 4));
    for (const v of VARIETATS_CATALEG_VALENCIA) {
      expect(tros(EX_VALENCIA, ...v.linies.nom), v.id).toBe(v.nom);
      expect(tros(EX_VALENCIA, ...v.linies.cientific), v.id).toBe(v.nomCientific);
      if (v.familia) expect(norm(linia(EX_VALENCIA, v.linies.familia)), v.id).toBe(v.familia);
      else expect(v.linies.familia).toBeNull();
      expect(v.camps.length, v.id).toBeGreaterThan(4);
      for (const camp of v.camps) {
        expect(tros(EX_VALENCIA, ...camp.linies), `${v.id} ${camp.clau}`).toBe(camp.clau ? `${camp.clau}: ${camp.valor}` : camp.valor);
      }
    }
  });

  it('Catàleg valencià: els quatre noms de l’índex que no coincidixen es mostren tots dos', () => {
    const ambIndex = VARIETATS_CATALEG_VALENCIA.filter((v) => v.nomIndex);
    expect(ambIndex.map((v) => [v.nom, v.nomIndex.text])).toEqual([
      ['Tomaca quarantena', 'Tomaca quarentena'], ['Bajoca de la mantega', 'Bajoca mantega'],
      ['Carabassa de cacauet', 'Carabassa de cacahuet'], ['Encisam meravella d’Espadà', 'Encisam maravilla d’Espadà']
    ]);
    for (const v of ambIndex) expect(norm(linia(EX_VALENCIA, v.nomIndex.linia)).replace(/^•\s*/, '')).toBe(v.nomIndex.text);
  });

  it('Catàleg valencià: les dades de G9-04 són les de la font, no les del kit rebutjat', () => {
    const per = (nom) => VARIETATS_CATALEG_VALENCIA.find((v) => v.nom === nom);
    const camp = (nom, clau) => per(nom).camps.find((c) => c.clau === clau)?.valor;
    expect(camp('Tomaca mutxamel', 'Pes mitjà del fruit')).toBe('180 – 275 g');
    expect(camp('Tomaca quarantena', 'Pes mitjà del fruit')).toBe('180 – 220 g');
    expect(camp('Tomaca rosada d’Altea', 'Pes mitjà del fruit')).toBe('350 – 550 g');
    expect(per('Fava de Bétera')).toBeTruthy();
    expect(per('Col de Xàtiva')).toBeTruthy();
    expect(per('Carabasseta d’Utiel').avisos).toEqual(['unitat-pes-cm']);
  });

  it('AVL (Mallorca): 65 varietats amb nom, nom científic i origen literals', () => {
    expect(VARIETATS_AVL_MALLORCA).toHaveLength(65);
    expect(new Set(VARIETATS_AVL_MALLORCA.map((v) => v.id)).size).toBe(65);
    for (const v of VARIETATS_AVL_MALLORCA) {
      expect(norm(linia(EX_AVL, v.linies.nom)), v.id).toBe(v.nom);
      expect(norm(linia(EX_AVL, v.linies.cientific)), v.id).toBe(v.nomCientific);
      expect(tros(EX_AVL, ...v.linies.origen), v.id).toBe(`Origen: ${v.origen}.`);
      expect(['estiu', 'hivern']).toContain(v.temporada);
    }
    expect(VARIETATS_AVL_MALLORCA.filter((v) => v.temporada === 'estiu')).toHaveLength(40);
  });

  it('Atles (Fundació Miquel Agustí): 15 fitxes d’espècie, llistes literals', () => {
    expect(ESPECIES_ATLES_CATALUNYA).toHaveLength(15);
    for (const e of ESPECIES_ATLES_CATALUNYA) {
      expect(norm(linia(EX_ATLES, e.linies.especie)), e.id).toBe(`${e.especie} (${e.nomCientific})`);
      for (const clau of ['llista', 'altres', 'sinonimies']) {
        const literals = e.linies[clau].map((n) => norm(linia(EX_ATLES, n))).filter((t) => t !== '-');
        expect(literals, `${e.id} ${clau}`).toEqual(e[clau]);
      }
      expect(e.llista.length, e.id).toBeGreaterThan(0);
    }
  });

  it('Atles: les 5 línies que ajunten dues varietats es partixen sense tocar el literal (R9V-C5-04)', () => {
    const particions = ESPECIES_ATLES_CATALUNYA.flatMap((e) => e.particions.map((p) => ({ ...p, especie: e })));
    expect(particions.map((p) => p.linia)).toEqual([323, 362, 401, 414, 453]);
    expect(particions.map((p) => p.especie.pagina)).toEqual([24, 34, 42, 44, 59]);
    for (const { linia: n, trossos, especie } of particions) {
      const literal = norm(linia(EX_ATLES, n));
      expect(trossos.join(' '), `línia ${n}`).toBe(literal);
      expect(especie.llista, `línia ${n}`).toContain(literal);
      expect(especie.linies.llista, `línia ${n}`).toContain(n);
      expect(trossos).toHaveLength(2);
      // Cada tros comença pel nom de l'espècie, com cada requadre del PDF.
      for (const t of trossos) expect(t.startsWith(especie.especie.split(' ')[0]), `${n}: ${t}`).toBe(true);
    }
    for (const e of ESPECIES_ATLES_CATALUNYA) expect(Array.isArray(e.particions), e.id).toBe(true);
    // La prova és el PDF mateix: es cita amb la seua empremta.
    const pdf = font('atles-catalunya').pdf;
    expect(pdf.document).toBe(font('atles-catalunya').document.replace('corpus_text/', '').replace(/\.md$/, '.pdf'));
    expect(pdf.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  const bytesPdfAtles = fontSencera(FONTS_BANC_LLAVORS.find((f) => f.id === 'atles-catalunya').pdf.document);
  it.skipIf(!bytesPdfAtles)('Atles: l’empremta del PDF citat per les particions és la del fitxer', () => {
    expect(createHash('sha256').update(bytesPdfAtles).digest('hex')).toBe(font('atles-catalunya').pdf.sha256);
  });

  it('les pàgines citades a les notes són les del PDF (R9V-C5-10)', () => {
    expect(font('cataleg-valencia').discrepancies[0]).toContain('pàgina 3 del PDF');
    expect(font('avl-mallorca').discrepancies[0]).toContain('pàgina 3 del PDF');
    expect(font('atles-catalunya').nota).toContain('de la pàgina 14 a la 65 del PDF');
  });

  it('cap custodi, lot, poble custodi ni vocabulari inventat (G9-03, G9-04, G9-05)', () => {
    const dades = JSON.stringify([VARIETATS_CATALEG_VALENCIA, VARIETATS_AVL_MALLORCA, ESPECIES_ATLES_CATALUNYA]);
    for (const prohibit of ['custodi', 'Custodi', 'lot', 'sobre', 'Mariola', 'Assut', 'La Torre de les Maçanes', 'Capsicum baccatum', 'Alficòs', '8.132']) {
      expect(dades.includes(`"${prohibit}`) || new RegExp(`\\b${prohibit}\\b`).test(dades), prohibit).toBe(false);
    }
    expect(dades).not.toMatch(/mas[ií]a|masies/i);
  });

  it('la cerca no distingix accents ni el punt volat, i troba el nom de l’índex', () => {
    const valencia = entradesDelCataleg('cataleg-valencia');
    expect(valencia).toHaveLength(45);
    expect(filtraEntrades(valencia, 'quarentena').map((e) => e.nom)).toEqual(['Tomaca quarantena']);
    expect(filtraEntrades(valencia, 'meloo').length).toBe(0);
    expect(filtraEntrades(valencia, 'melo alger').map((e) => e.nom)).toEqual(['Meló d’Alger pipa roja', 'Meló d’Alger sang de bou']);
    expect(filtraEntrades(entradesDelCataleg('avl-mallorca'), 'tomatiga mutxamel').map((e) => e.nom)).toEqual(['Tomàtiga de Mutxamel']);
    expect(filtraEntrades(entradesDelCataleg('atles-catalunya'), 'Allium').map((e) => e.nom)).toEqual(['All', 'Porro']);
    expect(entradesDelCataleg('cap')).toEqual([]);
    expect(Object.isFrozen(VARIETATS_CATALEG_VALENCIA[0].camps[0])).toBe(true);
  });
});

describe('IDEA-113 · rutes de poble', () => {
  const { rutes, recursos, font: fontR } = RUTES_LA_TORRE;
  it('els 6 eixos són els de la font, amb la durada i la distància de cada ruta (G9-02)', () => {
    expect(rutes.map((r) => r.eix)).toEqual(['SOM PA, SOM OLI', 'SOM VINCLES', 'SOM AIGUA', 'SOM TERRA', 'SOM POBLE', 'SOM PAISATGE']);
    expect(rutes.map((r) => r.distancia)).toEqual(['1,3 km', '1,5 km', '2 km', '2 km', '2 km', '6 km']);
    expect(rutes.map((r) => r.temps)).toEqual(['4 h', '4 h', '4 h', '4 h', '8 h', '8 h']);
    expect(rutes.map((r) => r.pagina)).toEqual([4, 6, 8, 10, 12, 14]);
    for (const r of rutes) {
      expect(norm(linia(EX_ITINERARIS, r.linies.eix))).toBe(r.eix);
      const mida = norm(linia(EX_ITINERARIS, r.linies.mida));
      expect(mida.startsWith(`${RUTES_LA_TORRE.poble}, ${RUTES_LA_TORRE.comarca} ${r.temps}`), mida).toBe(true);
      expect(mida.endsWith(r.distancia), mida).toBe(true);
      if (r.lema) expect(norm(linia(EX_ITINERARIS, r.linies.lema))).toBe(r.lema);
      else expect(r.numero).toBe(2);
      expect(tros(EX_ITINERARIS, ...r.linies.programa)).toBe(r.programa);
    }
  });

  it('cada parada: hora i títol a la seua línia i l’explicació a les següents', () => {
    expect(rutes.map((r) => r.parades.length)).toEqual([5, 5, 6, 4, 5, 5]);
    for (const r of rutes) {
      for (const p of r.parades) {
        const [a, b] = p.linies;
        expect(norm(linia(EX_ITINERARIS, a))).toBe(`${p.hora} ${p.titol}`);
        const resta = [];
        for (let n = a + 1; n <= b; n += 1) resta.push(linia(EX_ITINERARIS, n).replace(/^\s*•\s*/, ''));
        expect(uneix(resta)).toBe(p.explicacio);
      }
    }
    expect(rutes[5].parades[1]).toMatchObject({ hora: '11:00', titol: 'Excursió al Pou de la Neu' });
  });

  it('19 fitxes de recurs, amb nom i adreça literals; dels establiments, cap nom ni telèfon', () => {
    expect(recursos).toHaveLength(19);
    expect(recursos.map((x) => x.pagina)).toEqual(Array.from({ length: 19 }, (_, i) => i + 15));
    for (const x of recursos) {
      expect(norm(linia(EX_ITINERARIS, x.linies.nom))).toBe(`▶ ${x.nom}`);
      if (x.adreca) expect(linia(EX_ITINERARIS, x.linies.adreca)).toContain(x.adreca);
    }
    expect(recursos.filter((x) => x.establiments).map((x) => x.nom)).toEqual(['Els Forns de pa', 'Les Carnisseries', 'Els Restaurants']);
    expect(recursos.filter((x) => x.establiments).every((x) => x.adreca === null)).toBe(true);
    expect(JSON.stringify(RUTES_LA_TORRE)).not.toMatch(TEL);
    expect(readFileSync(path.join(FIX, 'itineraris-la-torre.extracte.txt'), 'utf8')).not.toMatch(TEL);
  });

  it('la capçalera de la font: títol, editor, revisió i web', () => {
    expect(norm(linia(EX_ITINERARIS, fontR.linies.revisio))).toBe(`Revisió: ${fontR.revisio}`);
    expect(norm(linia(EX_ITINERARIS, fontR.linies.titol))).toBe(fontR.titol);
    expect(norm(linia(EX_ITINERARIS, fontR.linies.editor[1]))).toBe('El Diari de La Torre de les Maçanes');
    expect(linia(EX_ITINERARIS, fontR.linies.web).startsWith('gentdelatorre.net')).toBe(true);
    expect(norm(linia(EX_ITINERARIS, fontR.linies.pobleComarca)).startsWith(`${RUTES_LA_TORRE.poble}, ${RUTES_LA_TORRE.comarca}`)).toBe(true);
  });

  it('cap dada del kit rebutjat r65 ni de cap altre poble; sempre «mas», com a la regla del repo (G9-08)', () => {
    const dades = JSON.stringify(RUTES_LA_TORRE);
    for (const prohibit of ['Tia Martina', 'Corral de Lipo', 'Monerris', 'Racó dels Pèsols', 'Penyes del Roget', 'Teularet', 'Esquerdo', 'Torre Grossa', 'Casa del Delme', '16,6 km', '580 m', '1658', 'Pa Beneït']) {
      expect(dades.includes(prohibit), prohibit).toBe(false);
    }
    expect(dades).not.toMatch(/mas[ií]a|masies/i);
  });

  it('la plantilla: La Torre la complix; la forma buida i les dades trencades, no', () => {
    expect(validaRutesDePoble(RUTES_LA_TORRE)).toEqual([]);
    expect(validaRutesDePoble(PLANTILLA_RUTES_DE_POBLE)).toEqual(expect.arrayContaining(['poble: buit', 'font.titol: buit', 'rutes: cap ruta']));
    expect(validaRutesDePoble(null)).toEqual(['el conjunt no és un objecte']);
    const trencat = JSON.parse(JSON.stringify(RUTES_LA_TORRE));
    trencat.rutes[0].parades[0].hora = '10h';
    trencat.rutes[1].pagina = 0;
    trencat.recursos[0].nom = '';
    expect(validaRutesDePoble(trencat)).toEqual(['rutes[0].parades[0].hora: no és HH:MM', 'rutes[1].pagina: sense pàgina de la font', 'recursos[0].nom: buit']);
    expect(Object.isFrozen(PLANTILLA_RUTES_DE_POBLE.font)).toBe(true);
    expect(PLANTILLA_RUTES_DE_POBLE.rutes).toEqual([]);
  });
});

describe('IDEA-115 · arbres monumentals', () => {
  it('els 19 noms de la WP 619, en l’ordre de la font, amb l’enllaç de cada fitxa (G9-01)', () => {
    expect(ARBRES_MONUMENTALS_LA_TORRE).toHaveLength(19);
    expect(ARBRES_MONUMENTALS_LA_TORRE.map((a) => a.nom)).toEqual(EX_WP.ancores.map((a) => a.nom));
    expect(ARBRES_MONUMENTALS_LA_TORRE.map((a) => a.enllac)).toEqual(EX_WP.ancores.map((a) => a.href));
    expect(ARBRES_MONUMENTALS_LA_TORRE.map((a) => a.nom)).toEqual([
      'Àlbers blancs del Pont', 'Àlborç del Xipreret', 'Carrasca de La Foia Blanca', 'Carrasca de La Zurca', 'Carrasca de Nofre',
      'Carrasca del Buitre', 'Carrasca del Moral', 'Fleixos del Barranc d’Horta', 'Ginebre de Mitja Orella', 'Llorer de Villa María',
      'Oms de la Plaça de l’Església', 'Pi de la Foia Boix', 'Pi del Mas de Pipa', 'Pi del Pla Verd', 'Pi dels Arrendaors',
      'Roures de Nofre', 'Xiprer de la Foia', 'Xiprers del Calvari', 'Xiprers del Cementeri'
    ]);
    for (const a of ARBRES_MONUMENTALS_LA_TORRE) {
      expect(norm(EX_WP.text[String(a.liniaText)])).toBe(a.monumental ? `${a.nom} (Monumental)` : a.nom);
      expect(a.enllac).toMatch(/^https:\/\/socdepoble\.net\/2007\/09\/07\/[a-z0-9-]+\/$/);
    }
    expect(ARBRES_MONUMENTALS_LA_TORRE.filter((a) => a.monumental).map((a) => a.nom)).toEqual(['Carrasca del Buitre', 'Pi dels Arrendaors']);
  });

  it('la font: enllaç, data i paràgrafs citats, literals', () => {
    expect(FONT_ARBRES_MONUMENTALS).toMatchObject({ wpId: EX_WP.id, enllac: EX_WP.link, data: EX_WP.date, titol: EX_WP.title });
    for (const [clau, n] of Object.entries(FONT_ARBRES_MONUMENTALS.cites)) expect(EX_WP.text[String(n)], clau).toBe(FONT_ARBRES_MONUMENTALS.paragrafs[clau]);
    expect(FONT_ARBRES_MONUMENTALS.paragrafs.ordenanca).toContain('en vigor des de l’any 2005');
    expect(FONT_ARBRES_MONUMENTALS.paragrafs.autoria).toMatch(/^Pedro Ferrer Rodriguez, enginyer tècnic forestal i biòleg amb la col·laboració de l’associació El Rentonar/);
  });

  it('cap arbre, mesura ni data del kit rebutjat r65', () => {
    const dades = JSON.stringify([ARBRES_MONUMENTALS_LA_TORRE, FONT_ARBRES_MONUMENTALS]);
    for (const prohibit of ['Olivera Grossa', 'Mas de la Foia de Baix', 'Teixos', 'Garrofera', 'Glorieta', 'Teuleria', '56 exemplars', 'Ple de març', '03132']) {
      expect(dades.includes(prohibit), prohibit).toBe(false);
    }
    for (const a of ARBRES_MONUMENTALS_LA_TORRE) expect(Object.keys(a).sort()).toEqual(['enllac', 'id', 'liniaText', 'monumental', 'nom', 'ordre']);
  });
});
