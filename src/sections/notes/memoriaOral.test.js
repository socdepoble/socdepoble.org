// @vitest-environment node
/* T3.2 (marató 261101; IDEA-29, IDEA-41 i IDEA-49 del Llibre Mestre) ·
   L'estructurador local de memòria oral: títol, resum, etiquetes del
   vocabulari rural tancat, municipi de la llavor i el document OKF v0.2, de
   manera determinista, sense DOM (entorn node), sense xarxa i sense rellotge.
   El relat d'exemple està escrit per a esta prova: no és el testimoni de cap
   persona real. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CORE_SCHEMA, DEFAULT_SCHEMA, load } from 'js-yaml';
import {
  ACTOR_ESTRUCTURADOR, FONT_SENSE_URL, MAX_ETIQUETES, MAX_RESUM, MIDA_MAXIMA_TEXT, MIN_ARREL, MIN_PARAULES, PARAULES_TEXT_LLARG,
  MOTIUS_MEMORIA, NIVELLS_CONFIANCA, OKF_VERSIO, TIPUS_OKF, VOCABULARI_RURAL, AVISOS_MEMORIA, ARRELS_QUE_SON_NOMS,
  entradaLog, estructuraMemoriaOral, indexOkf, marcaRevisioHumana, nivellDeConfianca, validaFitxaOkf
} from './memoriaOral.js';
import { LLAVOR_NOTA } from './llavorNota.js';

const ARA = '2026-11-01T03:00:00Z';

const RELAT = `Jo vaig nàixer a la Torre de les Maçanes l'any quaranta-dos, en plena postguerra. Mon pare era llaurador i ma mare cosia per a les veïnes del carrer.

A l'estiu segàvem el blat amb la falç i després el batíem a l'era amb la mula. Les dones cantaven albades mentres collien les olives, i els xiquets anàvem darrere arreplegant el que queia.

A casa no hi havia aigua corrent: anàvem a la font amb els càntirs, i a la bassa rentàvem la roba. Quan no plovia, el poble pujava en processó a l'ermita a demanar pluja.

Per a les festes de setembre baixava la banda de música de Xixona i tot el poble ballava a la plaça fins a la matinada. Al meu avi li deien el Rabosa, i encara hui a nosaltres ens diuen els de la Rabosa.

Quan tornàrem a viure a la Torre de les Maçanes, la iaia ens contava rondalles a la vora del foc.`;

/* El frontmatter i el cos d'un markdown OKF. */
function parteix(markdown) {
  expect(markdown.startsWith('---\n')).toBe(true);
  const fi = markdown.indexOf('\n---\n', 4);
  expect(fi).toBeGreaterThan(0);
  return { yaml: markdown.slice(4, fi), cos: markdown.slice(fi + 5) };
}

const ids = (r) => r.etiquetes.map((e) => e.id);

describe('memoriaOral · un relat oral en valencià', () => {
  const r = estructuraMemoriaOral(RELAT, { ara: ARA });

  test('municipi, etiquetes i títol estructurat', () => {
    expect(r.motiu).toBe(MOTIUS_MEMORIA.proposta);
    expect(r.municipi).toEqual({ id: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes', comarca: "L'Alacantí", provincia: 'Alacant', mencions: 2 });
    expect(r.candidats.map((c) => [c.id, c.mencions])).toEqual([['la-torre-de-les-macanes', 2], ['xixona', 1]]);
    expect(ids(r)).toEqual(['collita', 'aigua', 'festes', 'cancons', 'oficis']);
    expect(r.titol).toBe("La collita i l'aigua a la Torre de les Maçanes");
    expect(r.descripcio).toBe("Relat de memòria oral sobre la collita, l'aigua i les festes (poble més esmentat: la Torre de les Maçanes).");
    expect(r.titolDelText).toBe("Jo vaig nàixer a la Torre de les Maçanes l'any quaranta-dos, en plena postguerra");
    expect(r.avisos).toEqual(["El relat esmenta més d'un poble: cal confirmar el municipi."]);
  });

  test('cada etiqueta porta les paraules del relat que la justifiquen', () => {
    const perId = Object.fromEntries(r.etiquetes.map((e) => [e.id, e]));
    expect(perId.collita.proves).toEqual(['segàvem', 'blat', 'falç', 'batíem', 'collien', 'olives']);
    expect(perId.aigua.proves).toEqual(['aigua', 'font', 'càntirs', 'bassa', 'plovia', 'pluja']);
    expect(perId.festes.proves).toEqual(['processó', 'ermita', 'festes', 'ballava']);
    expect(perId.cancons.proves).toEqual(['cantaven', 'albades', 'banda de música']);
    expect(perId.oficis.proves).toEqual(['llaurador', 'cosia']);
    const baix = RELAT.toLowerCase();
    for (const e of r.etiquetes) {
      expect(e.coincidencies).toBeGreaterThanOrEqual(2);
      for (const prova of e.proves) expect(baix, prova).toContain(prova);
      expect(VOCABULARI_RURAL.find((t) => t.id === e.id)?.descripcio).toBe(e.descripcio);
    }
  });

  test('el resum és fet de frases senceres del relat, en el seu ordre, i cap paraula del motor', () => {
    expect(r.resum).toBe([
      'Les dones cantaven albades mentres collien les olives, i els xiquets anàvem darrere arreplegant el que queia.',
      "Quan no plovia, el poble pujava en processó a l'ermita a demanar pluja.",
      'Per a les festes de setembre baixava la banda de música de Xixona i tot el poble ballava a la plaça fins a la matinada.'
    ].join(' '));
    expect(r.resum.length).toBeLessThanOrEqual(MAX_RESUM);
    for (const frase of r.resum.split(/(?<=[.!?…])\s/)) expect(RELAT, frase).toContain(frase);
  });

  test('sense cap tema triat, el resum és la primera frase que hi cap', () => {
    const s = estructuraMemoriaOral('Això ho va dir ell una vesprada qualsevol. Després ningú no en va parlar mai més.');
    expect(s.etiquetes).toEqual([]);
    expect(s.resum).toBe('Això ho va dir ell una vesprada qualsevol.');
    expect(s.titol).toBe('Això ho va dir ell una vesprada qualsevol');
  });
});

describe('memoriaOral · municipi (només de la llista, mai inventat)', () => {
  test('tolerant a accents, majúscules i article, i a un text en NFD', () => {
    const casos = [
      ['Vam anar a penaguila a peu.', 'penaguila'],
      ['VAM ANAR A PENÀGUILA A PEU.', 'penaguila'],
      ['Vam anar a Penàguila a peu.'.normalize('NFD'), 'penaguila'],
      ['Vivíem a Torre de les Macanes.', 'la-torre-de-les-macanes'],
      ['Vivíem a la torre de les maçanes.', 'la-torre-de-les-macanes'],
      ['Vivíem a La Torre de les Maçanes.', 'la-torre-de-les-macanes'],
      ['El torró de Xixona.', 'xixona']
    ];
    for (const [text, id] of casos) expect(estructuraMemoriaOral(text).municipi?.id, text).toBe(id);
  });

  test('un poble fora de la llista no es detecta mai, i no se n’inventa cap', () => {
    const r = estructuraMemoriaOral('Mon pare treballava a Alcoi i a Ibi, en una fàbrica de joguets.');
    expect([r.municipi, r.candidats]).toEqual([null, []]);
    expect(r.okf.frontmatter).not.toHaveProperty('municipi');
    expect(r.descripcio).toBe('Relat de memòria oral sobre els oficis.');
  });

  test('«Relleu» només és el poble escrit amb majúscula: el relleu del terreny no ho és', () => {
    expect(estructuraMemoriaOral('El relleu del terreny és molt abrupte per ací.').municipi).toBeNull();
    expect(estructuraMemoriaOral('Vaig nàixer a Relleu un dia de pluja.').municipi?.id).toBe('relleu');
    expect(estructuraMemoriaOral('VAIG NÀIXER A RELLEU.').municipi?.id).toBe('relleu');
  });

  test('empat de mencions: el primer que ix, i un avís; les paraules del nom del poble no fan etiqueta', () => {
    const r = estructuraMemoriaOral('Vaig nàixer a Tibi i em vaig casar a Xixona.');
    expect(r.municipi.id).toBe('tibi');
    expect(r.candidats.map((c) => c.id)).toEqual(['tibi', 'xixona']);
    expect(r.avisos).toContain("El relat esmenta més d'un poble: cal confirmar el municipi.");
    const m = estructuraMemoriaOral('Les maçanes de la Torre de les Maçanes eren les millors.');
    expect(m.etiquetes).toEqual([expect.objectContaining({ id: 'collita', coincidencies: 1, proves: ['maçanes'] })]);
  });

  test('la llista de pobles es pot passar; una llista buida no en detecta cap', () => {
    const alcoi = [{ id: 'alcoi', title: 'Alcoi', comarca: "L'Alcoià", provincia: 'Alacant' }];
    expect(estructuraMemoriaOral('Treballava a Alcoi.', { pobles: alcoi }).municipi).toEqual({ id: 'alcoi', nom: 'Alcoi', comarca: "L'Alcoià", provincia: 'Alacant', mencions: 1 });
    expect(estructuraMemoriaOral('Treballava a Tibi.', { pobles: [] }).municipi).toBeNull();
    expect(() => estructuraMemoriaOral('Tibi', { pobles: 'Tibi' })).toThrow(TypeError);
  });

  test('les preposicions davant del poble: «a la», «d’» i «de»', () => {
    expect(estructuraMemoriaOral('Hui no hi ha cap tema ací, però el relat passa a Alcoleja.').titol).toBe('Hui no hi ha cap tema ací, però el relat passa a Alcoleja');
    expect(estructuraMemoriaOral('Alcoleja.').titol).toBe('Alcoleja');
    const sensePrimera = estructuraMemoriaOral({ title: '', lead: '', content: '<p>Alcoleja</p>' });
    expect(sensePrimera.titol).toBe('Alcoleja');
    const pobles = [{ id: 'el-campello', title: 'El Campello' }, { id: 'orxeta', title: 'Orxeta' }];
    expect(estructuraMemoriaOral('Les festes del Campello. Les festes de El Campello.', { pobles }).titol).toBe('Les festes al Campello');
    expect(estructuraMemoriaOral('Les festes i les cançons d’Orxeta.', { pobles }).descripcio).toBe('Relat de memòria oral sobre les festes i les cançons (poble esmentat: Orxeta).');
  });
});

describe('memoriaOral · etiquetes d’un vocabulari tancat i explicable', () => {
  test('cada tema té identificador, nom, títol amb article i una descripció', () => {
    const vistos = new Set();
    for (const t of VOCABULARI_RURAL) {
      expect(t.id).toMatch(/^[a-z]+$/);
      expect(vistos.has(t.id)).toBe(false);
      vistos.add(t.id);
      for (const camp of [t.nom, t.titol, t.descripcio]) expect(camp.trim().length, t.id).toBeGreaterThan(0);
      expect(t.titol).toMatch(/^(El |Els |La |Les |L')/);
    }
    expect([...vistos]).toEqual(['festes', 'oficis', 'aigua', 'collita', 'malnoms', 'cancons', 'cuina', 'bestiar', 'infancia', 'guerra', 'emigracio', 'remeis', 'rondalles']);
  });

  test('higiene: cap forma ni cap arrel en dos temes, i cap arrel de menys de MIN_ARREL lletres', () => {
    const forma = (text) => text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[·']/g, ' ').trim();
    const formes = new Map();
    const arrels = new Map();
    for (const t of VOCABULARI_RURAL) {
      for (const f of [...t.paraules, ...t.expressions, ...t.ambMajuscula, ...t.ambContext.flatMap((c) => c.formes)]) {
        const clau = forma(f);
        expect(formes.get(clau) ?? t.id, `${f} (${t.id} i ${formes.get(clau)})`).toBe(t.id);
        formes.set(clau, t.id);
      }
      for (const a of t.arrels) {
        const clau = forma(a);
        expect(clau, a).toMatch(/^[a-z]+$/);
        expect(clau.length, a).toBeGreaterThanOrEqual(MIN_ARREL);
        expect(arrels.get(clau) ?? t.id, a).toBe(t.id);
        arrels.set(clau, t.id);
      }
    }
  });

  test('cada forma del vocabulari, tota sola en una frase, dispara el seu tema (i només eixe)', () => {
    for (const t of VOCABULARI_RURAL) {
      const formes = [...t.paraules, ...t.expressions, ...t.ambMajuscula, ...t.arrels];
      for (const f of formes) {
        const r = estructuraMemoriaOral(`Hi apareix: ${f}.`);
        expect(ids(r), `${f} → ${t.id}`).toEqual([t.id]);
      }
      // Les formes amb context, en el seu context: un nom propi darrere si el demanen.
      for (const c of t.ambContext) {
        for (const f of c.formes) {
          const r = estructuraMemoriaOral(`Hi apareix: ${f}${c.seguidaDeNom ? ' el Rabosa' : ''}.`);
          expect(ids(r), `${f} → ${t.id}`).toEqual([t.id]);
        }
      }
    }
  });

  test('l’arrel més llarga guanya, i les expressions de dues paraules compten', () => {
    const r = estructuraMemoriaOral('El llaurador llaurava el camp. Li deien el Rabosa. Li feien el mal d’ull.');
    const perId = Object.fromEntries(r.etiquetes.map((e) => [e.id, e.proves]));
    expect(perId.oficis).toEqual(['llaurador']);
    expect(perId.collita).toEqual(['llaurava', 'camp']);
    expect(perId.malnoms).toEqual(['li deien']);
    expect(perId.remeis).toEqual(['mal d’ull']);
  });

  test('les paraules corrents que comencen igual no disparen cap tema', () => {
    for (const text of ['Ens agradava escoltar la ràdio.', 'Era una persona molt franca i molt racional.', 'Això no cabre mai en la brúixola.']) {
      expect(ids(estructuraMemoriaOral(text)), text).toEqual([]);
    }
    expect(ids(estructuraMemoriaOral('Mon germà se’n va anar a França a veremar.'))).toEqual(['emigracio', 'collita']);
  });

  test('un relat llarg demana dues coincidències per etiqueta, i n’hi ha com a molt MAX_ETIQUETES', () => {
    const farciment = 'i aleshores la vida anava passant a poc a poc com sempre '.repeat(8);
    const r = estructuraMemoriaOral(`La mula era vella ${farciment}. ${'Hi havia festes, aigua, blat, cançons, oficis, matances, guerra i remeis. '.repeat(2)}`);
    expect(r.paraules).toBeGreaterThanOrEqual(80);
    expect(ids(r)).not.toContain('bestiar');
    expect(r.etiquetes.length).toBe(MAX_ETIQUETES);
  });
});

describe('memoriaOral · document Open Knowledge Format v0.2', () => {
  const r = estructuraMemoriaOral(RELAT, { ara: ARA, recurs: 'https://socdepoble.org/notes?nota=n-1', autor: 'javi', caducaEl: new Date('2027-11-01T00:00:00Z') });

  test('el frontmatter és YAML vàlid i diu exactament el que porta l’objecte', () => {
    const { yaml } = parteix(r.okf.markdown);
    expect(load(yaml, { schema: CORE_SCHEMA })).toEqual(r.okf.frontmatter);
    const ambDates = load(yaml, { schema: DEFAULT_SCHEMA });
    expect(ambDates.generated.at).toBeInstanceOf(Date);
    expect(ambDates.generated.at.toISOString()).toBe('2026-11-01T03:00:00.000Z');
    expect(ambDates.stale_after.toISOString()).toBe('2027-11-01T00:00:00.000Z');
  });

  test('els camps i els noms exactes d’OKF v0.2', () => {
    expect(r.okf.frontmatter).toEqual({
      type: TIPUS_OKF,
      title: r.titol,
      description: r.descripcio,
      resource: 'https://socdepoble.org/notes?nota=n-1',
      tags: ['collita', 'aigua', 'festes', 'cancons', 'oficis'],
      status: 'draft',
      generated: { by: ACTOR_ESTRUCTURADOR, at: ARA },
      stale_after: '2027-11-01T00:00:00.000Z',
      sources: [{ id: 'relat', resource: 'https://socdepoble.org/notes?nota=n-1', title: 'Relat oral original', author: 'human:javi' }],
      municipi: 'la-torre-de-les-macanes'
    });
    expect(ACTOR_ESTRUCTURADOR).toMatch(/^[^\s/]+\/\d+\.\d+\.\d+$/);
    expect(validaFitxaOkf(r.okf.frontmatter)).toEqual({ valida: true, errors: [] });
    expect(nivellDeConfianca(r.okf.frontmatter)).toBe(NIVELLS_CONFIANCA.senseVerificar);
    expect(r.okf.frontmatter).not.toHaveProperty('verified');
  });

  test('el cos: resum amb la nota a peu de la font, etiquetes explicades, poble i el relat sencer', () => {
    const { cos } = parteix(r.okf.markdown);
    expect(cos.match(/^# .+$/gm)).toEqual(['# Resum', '# Etiquetes', '# Poble', '# Relat', "# Com s'ha fet"]);
    expect(cos).toContain(`${r.resum}[^relat]`);
    expect(cos).toContain('\n[^relat]: Relat oral original\n');
    expect(cos).toContain('* **Collita i camp** (`collita`):');
    expect(cos).toContain('* La Torre de les Maçanes (L\'Alacantí, Alacant): 2 mencions.');
    for (const paragraf of RELAT.split('\n\n')) expect(cos).toContain(paragraf.replace(/\n/g, ' '));
    expect(r.okf.cami).toMatch(/^memoria-oral\/la-torre-de-les-macanes\/la-collita-i-l-aigua-a-la-torre-de-les-macanes-[0-9a-f]{8}\.md$/);
  });

  test('sense «ara» no hi ha hora; sense URL, la font és un descriptor d’abast (§5.1)', () => {
    const s = estructuraMemoriaOral(RELAT);
    expect(s.okf.frontmatter.generated).toEqual({ by: ACTOR_ESTRUCTURADOR });
    expect(s.okf.frontmatter.sources).toEqual([{ id: 'relat', resource: FONT_SENSE_URL, title: 'Relat oral original' }]);
    expect(s.okf.frontmatter).not.toHaveProperty('resource');
    expect(s.okf.frontmatter).not.toHaveProperty('stale_after');
    expect(s.okf.markdown).not.toMatch(/^ {2}at:/m);
    expect(validaFitxaOkf(s.okf.frontmatter).valida).toBe(true);
  });

  test('les opcions mal formades fallen amb TypeError, no amb una fitxa a mitges', () => {
    for (const opcions of [{ ara: '2026-11-01' }, { ara: '2026-11-01T03:00:00' }, { ara: new Date('x') }, { ara: new Date(Date.UTC(10000, 0, 1)) }, { caducaEl: 'demà' },
      // Gauntlet 261101, B2-06: dates que no existixen i dates sense segons.
      { ara: '2026-02-30T00:00:00Z' }, { ara: '2026-11-01T24:00:00Z' }, { ara: '2026-11-01T23:59:60Z' }, { ara: '2026-13-01T00:00:00Z' },
      { ara: '2026-11-01T03:00:00+99:99' }, { ara: '2026-11-01T03:00Z' }, { caducaEl: '2027-02-29T00:00:00Z' },
      { recurs: 'javascript:alert(1)' }, { recurs: 'https://x y' }, { autor: 'Javi Llinares' }, { autor: '' },
      // B2-13: un camí que el navegador llig com un URL a un altre domini.
      { recurs: '//evil.example/x' }, { recurs: '/\\evil.example/x' }, { recurs: '/notes\\..\\x' }]) {
      expect(() => estructuraMemoriaOral(RELAT, opcions), JSON.stringify(opcions)).toThrow(TypeError);
    }
  });

  test('el text de la persona no pot fer marca, ni trencar el YAML, ni obrir un altre frontmatter', () => {
    const nota = {
      title: 'Fira &quot;gran&quot;: --- # no \\ «sí» \ud800 🌾\nstatus: stable',
      content: '<p># Títol fals</p><p>&lt;script&gt;alert(1)&lt;/script&gt;</p><p>1. llista</p><p>[enllaç](javascript:x) i [^relat]: fals</p><p>---</p><p>Festes a Tibi.</p>'
    };
    const s = estructuraMemoriaOral(nota, { ara: ARA });
    expect(s.titol).toBe('Fira "gran": --- # no \\ «sí» \ufffd 🌾 status: stable');
    const { yaml, cos } = parteix(s.okf.markdown);
    expect(load(yaml, { schema: CORE_SCHEMA })).toEqual(s.okf.frontmatter);
    expect(s.okf.frontmatter.status).toBe('draft');
    const relat = cos.slice(cos.indexOf('# Relat\n'));
    expect(relat).toContain('\\# Títol fals');
    expect(relat).toContain('\\<script\\>alert(1)\\</script\\>');
    expect(relat).toContain('1\\. llista');
    expect(relat).toContain('\\[enllaç\\](javascript:x) i \\[^relat\\]: fals');
    expect(cos.split('\n')).not.toContain('---');
    expect(cos).not.toMatch(/(?:^|[^\\])</m);
    expect(cos.match(/^\[\^relat\]:/gm)).toEqual(['[^relat]:']);
  });

  test('la revisió humana: stable, verified human:<id>, human-reviewed; l’esborrany no canvia', () => {
    const revisada = marcaRevisioHumana(r, { persona: 'javi', ara: '2026-11-01T09:30:00+01:00' });
    expect(revisada.okf.frontmatter.status).toBe('stable');
    expect(revisada.okf.frontmatter.verified).toEqual([{ by: 'human:javi', at: '2026-11-01T09:30:00+01:00' }]);
    expect(nivellDeConfianca(revisada.okf.frontmatter)).toBe(NIVELLS_CONFIANCA.huma);
    expect(validaFitxaOkf(revisada.okf.frontmatter).valida).toBe(true);
    expect(load(parteix(revisada.okf.markdown).yaml, { schema: CORE_SCHEMA })).toEqual(revisada.okf.frontmatter);
    expect(revisada.okf.cos).toBe(r.okf.cos);
    expect(r.okf.frontmatter.status).toBe('draft');
    const dues = marcaRevisioHumana(revisada, { persona: 'maria', ara: ARA });
    expect(dues.okf.frontmatter.verified.map((v) => v.by)).toEqual(['human:javi', 'human:maria']);
    expect(() => marcaRevisioHumana(r, { persona: 'javi' })).toThrow(TypeError);
    expect(() => marcaRevisioHumana(r, { persona: 'human:javi', ara: ARA })).toThrow(TypeError);
    expect(() => marcaRevisioHumana(estructuraMemoriaOral(''), { persona: 'javi', ara: ARA })).toThrow(TypeError);
  });

  test('validaFitxaOkf segueix l’especificació: només `type` és obligatori i les claus d’extensió passen', () => {
    expect(validaFitxaOkf({ type: 'Playbook' }).valida).toBe(true);
    expect(validaFitxaOkf({ type: 'x', municipi: 'tibi', qualsevol: 1 }).valida).toBe(true);
    expect(validaFitxaOkf({ type: 'x', verified: { by: 'human:a', at: '2026-06-25T09:00:00Z' } }).valida).toBe(true);
    expect(validaFitxaOkf({ type: 'x', verified: { by: 'process:nit', at: new Date('2026-06-25T09:00:00Z') } }).valida).toBe(true);
    for (const dolent of [null, [], {}, { type: ' ' }, { type: 'x', status: 'final' }, { type: 'x', stale_after: '2026-01-01' },
      { type: 'x', generated: { at: ARA } }, { type: 'x', generated: { by: 'algú amb espais', at: ARA } }, { type: 'x', sources: [{ id: 'a' }] },
      { type: 'x', tags: 'festes' }, { type: 'x', verified: [{ by: 'human:a' }] }]) {
      expect(validaFitxaOkf(dolent).valida, JSON.stringify(dolent)).toBe(false);
    }
    expect(nivellDeConfianca({ type: 'x', verified: { by: 'process:nit', at: ARA } })).toBe(NIVELLS_CONFIANCA.maquina);
  });

  test('l’index.md arrel (§8, §12) i el registre log.md (§9) de la wiki', () => {
    const tibi = estructuraMemoriaOral('Les festes de Tibi eren les millors de la comarca.');
    const index = indexOkf([r, tibi, estructuraMemoriaOral(''), null]);
    const { yaml, cos } = parteix(index);
    expect(load(yaml, { schema: CORE_SCHEMA })).toEqual({ okf_version: OKF_VERSIO });
    // Cada grup és una secció H1, com a l'exemple del §8 (Gauntlet 261101, B2-12).
    expect(cos.match(/^#+ .+$/gm)).toEqual(['# La Torre de les Maçanes', '# Tibi']);
    expect(cos).toContain(`# La Torre de les Maçanes\n\n* [${r.titol}](/${r.okf.cami}) - ${r.descripcio}\n`);
    expect(cos).toContain(`# Tibi\n\n* [${tibi.titol}](/${tibi.okf.cami}) - ${tibi.descripcio}\n`);
    expect(parteix(indexOkf([])).cos).toBe('\n# Memòria oral\n\nEncara no hi ha cap relat.\n');
    expect(entradaLog(r, { ara: '2026-11-01T00:30:00+01:00' })).toBe(
      `## 2026-11-01\n* **Proposta**: [${r.titol}](/${r.okf.cami}), esborrany de ${ACTOR_ESTRUCTURADOR} pendent de revisió humana.\n`);
    const revisada = marcaRevisioHumana(r, { persona: 'javi', ara: ARA });
    expect(entradaLog(revisada, { ara: ARA })).toMatch(/^## \d{4}-\d{2}-\d{2}\n\* \*\*Revisió\*\*: .+, revisada per human:javi\.\n$/);
    expect(() => entradaLog(r, {})).toThrow(TypeError);
  });
});

describe('memoriaOral · determinisme', () => {
  afterEach(() => { vi.useRealTimers(); });

  test('la mateixa entrada dona la mateixa fitxa, siga l’hora que siga, i l’entrada no es toca', () => {
    const nota = Object.freeze({ title: '', subtitle: '', lead: '', content: `<p>${RELAT.split('\n\n').join('</p><p>')}</p>` });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    const a = estructuraMemoriaOral(nota);
    vi.setSystemTime(new Date('2031-07-15T12:34:56Z'));
    const b = estructuraMemoriaOral(nota);
    expect(b).toEqual(a);
    expect(b.okf.markdown).toBe(a.okf.markdown);
    expect(Object.isFrozen(a) && Object.isFrozen(a.etiquetes[0].proves) && Object.isFrozen(a.okf.frontmatter.sources[0])).toBe(true);
  });

  test('la nota en HTML i el mateix relat en text pla donen les mateixes etiquetes, poble i resum', () => {
    const html = estructuraMemoriaOral({ content: `<p>${RELAT.split('\n\n').join('</p><p>')}</p>` });
    const pla = estructuraMemoriaOral(RELAT);
    expect([html.etiquetes, html.municipi, html.resum, html.okf.cami]).toEqual([pla.etiquetes, pla.municipi, pla.resum, pla.okf.cami]);
  });
});

describe('memoriaOral · notes del Bloc (HTML)', () => {
  test('el títol de la persona mana; l’entradilla és relat; script, comentaris i imatges no són text', () => {
    const r = estructuraMemoriaOral({
      title: 'Fira &amp; mercat',
      subtitle: '',
      lead: '<p>La iaia ho contava així.</p>',
      content: '<h2>Tibi</h2><p>Hi havia <strong>festes</strong> &amp; balls.<br>I la banda de música.</p>'
        + '<script>festes festes festes</script><img src="data:image/png;base64,AAAA" alt="festes festes"><!-- festes --><p>Fi.</p>'
    });
    expect(r.titol).toBe('Fira & mercat');
    expect(r.okf.frontmatter.title).toBe('Fira & mercat');
    expect(r.municipi.id).toBe('tibi');
    expect(r.etiquetes.find((e) => e.id === 'festes')).toEqual(expect.objectContaining({ coincidencies: 2, proves: ['festes', 'balls'] }));
    // «contava» no fa rondalles: també és comptar (Gauntlet 261101, B2-02).
    expect(ids(r)).toEqual(['festes', 'cancons']);
    expect(r.okf.cos).toContain('\nLa iaia ho contava així.\n\nTibi\n\nHi havia festes \\& balls.\n\nI la banda de música.\n\nFi.\n');
  });
});

describe('memoriaOral · text buit, curt o llavor', () => {
  test('sense relat: motiu «buit» i cap fitxa OKF', () => {
    for (const entrada of ['', '   \n\n ', null, undefined, 42, {}, { content: '<p></p><p><br></p>' }, { title: 'Només el títol', content: '' }, '<<<>>>', '&#&#']) {
      const r = estructuraMemoriaOral(entrada);
      expect([r.motiu, r.okf, r.etiquetes, r.municipi], JSON.stringify(entrada)).toEqual([MOTIUS_MEMORIA.buit, null, [], null]);
    }
  });

  test('la plantilla verge del Bloc no és relat de ningú', () => {
    expect(estructuraMemoriaOral({ title: '', content: LLAVOR_NOTA }).motiu).toBe(MOTIUS_MEMORIA.llavor);
  });

  test('un relat curt dona una fitxa orientativa (motiu «curt») amb el seu avís', () => {
    const r = estructuraMemoriaOral('Festes de Tibi.');
    expect([r.motiu, r.municipi?.id, ids(r), r.titol]).toEqual([MOTIUS_MEMORIA.curt, 'tibi', ['festes'], 'Les festes a Tibi']);
    expect(r.avisos).toEqual([`El relat té menys de ${MIN_PARAULES} paraules: la fitxa és orientativa.`]);
    expect(validaFitxaOkf(r.okf.frontmatter).valida).toBe(true);
    const onze = Array.from({ length: MIN_PARAULES - 1 }, (_, i) => `paraula${i}`).join(' ');
    expect(estructuraMemoriaOral(onze).motiu).toBe(MOTIUS_MEMORIA.curt);
    expect(estructuraMemoriaOral(`${onze} una`).motiu).toBe(MOTIUS_MEMORIA.proposta);
  });
});

describe('memoriaOral · entrada maliciosa llarga en temps fitat', () => {
  const MB = 1024 * 1024;
  const omple = (tros) => tros.repeat(Math.ceil(MB / tros.length)).slice(0, MB);
  const casos = {
    'una sola paraula d’1 MB': 'a'.repeat(MB),
    'mig milió de frases': omple('a. '),
    'primeres paraules d’expressions': omple('li mal els ens '),
    'inicis del nom d’un poble': omple('la torre de les '),
    'accents i punts volats': omple('àèéíòóúç·l l·l '),
    'xifres amb punt': omple('1234567890.'),
    'relat repetit': omple(`${RELAT}\n\n`),
    'HTML: obertures soltes': { content: omple('<') },
    'HTML: cometa sense tancar': { content: `<a "${'x'.repeat(MB)}` },
    'HTML: script sense tancar': { content: omple('<script>x</scrip') },
    /* L'entitat numèrica fora de rang es compon en temps d'execució: escrita
       sencera, design_guard la llig com un color cru. */
    'HTML: entitats': { content: omple(`&#x41;&amp;&#${'9'.repeat(8)};`) },
    'HTML: paràgrafs': { content: omple('<p>Festes de Tibi amb la banda de música.</p>') }
  };
  for (const [nom, entrada] of Object.entries(casos)) {
    test(`${nom}: menys de 2,5 s i una fitxa coherent`, () => {
      const t0 = performance.now();
      const r = estructuraMemoriaOral(entrada, { ara: ARA });
      expect(performance.now() - t0).toBeLessThan(2500);
      expect(Object.values(MOTIUS_MEMORIA)).toContain(r.motiu);
      if (r.okf) expect(validaFitxaOkf(r.okf.frontmatter).valida).toBe(true);
    });
  }

  test('una paraula d’un mega que dispara un tema no es copia sencera com a prova', () => {
    const r = estructuraMemoriaOral(`fest${'a'.repeat(MB)}`);
    expect(ids(r)).toEqual(['festes']);
    expect(r.etiquetes[0].proves).toEqual([`fest${'a'.repeat(36)}…`]);
    expect(r.okf.cos.length).toBeLessThan(MB + 4000);
  });

  test(`més de MIDA_MAXIMA_TEXT caràcters de relat: «massa-llarg», sense analitzar, de pressa`, () => {
    const t0 = performance.now();
    const r = estructuraMemoriaOral('festes '.repeat(Math.ceil(MIDA_MAXIMA_TEXT / 7) + 1));
    expect(performance.now() - t0).toBeLessThan(2500);
    expect([r.motiu, r.okf, r.etiquetes]).toEqual([MOTIUS_MEMORIA.massaLlarg, null, []]);
    expect(r.avisos[0]).toContain(String(MIDA_MAXIMA_TEXT));
  });
});

/* Gauntlet 261101 · carril B2 (memòria oral OKF): les troballes B2-01, B2-02 i
   B2-04 a B2-13, cadascuna amb el cas que la reproduïa. Els relats estan
   escrits per a esta prova: no són el testimoni de cap persona real. */
describe('memoriaOral · Gauntlet 261101 (B2)', () => {
  test('B2-01 · «la sella» de la mula i «el relleu» del terreny no són cap poble; Sella i Relleu, sí', () => {
    const casos = [
      ['Posàvem la sella a la mula i anàvem al camp de matinada.', null],
      ['Mon pare li posava la sella al cavall cada matí abans de llaurar.', null],
      ['Vaig nàixer a Sella un dia de pluja.', 'sella'],
      ['VAIG NÀIXER A SELLA.', 'sella'],
      // A l'inici de frase o tot en majúscules, la majúscula no diu res: cal la preposició.
      ['Relleu del terreny: era tot muntanya i barranc, i costava molt de pujar.', null],
      ['EL RELLEU DEL TERRENY ERA MOLT ABRUPTE I COSTAVA PUJAR AMB LA MULA.', null],
      ['A Relleu hi havia una bassa molt gran.', 'relleu']
    ];
    for (const [text, id] of casos) expect(estructuraMemoriaOral(text).municipi?.id ?? null, text).toBe(id);
    // La mateixa regla per a «França»: tot en majúscules, només amb la preposició.
    expect(ids(estructuraMemoriaOral('ERA UNA PERSONA MOLT FRANCA I MOLT TREBALLADORA.'))).not.toContain('emigracio');
    expect(ids(estructuraMemoriaOral('MON GERMÀ SE’N VA ANAR A FRANÇA.'))).toContain('emigracio');
  });

  test('B2-01 · una llista de pobles marca l’homonímia per poble (`ambMajuscula`)', () => {
    const pobles = [{ id: 'aigues', title: 'Aigües', comarca: "L'Alacantí", provincia: 'Alacant', ambMajuscula: true }];
    const corrent = estructuraMemoriaOral('Les aigües del barranc baixaven netes tot l’hivern.', { pobles });
    expect([corrent.municipi, ids(corrent)]).toEqual([null, ['aigua']]);
    expect(estructuraMemoriaOral('Vaig nàixer a Aigües l’any cinquanta.', { pobles }).municipi?.id).toBe('aigues');
    // Sense la marca, el nom del poble guanya, com sempre.
    expect(estructuraMemoriaOral('Les aigües del barranc.', { pobles: [{ id: 'aigues', title: 'Aigües' }] }).municipi?.id).toBe('aigues');
  });

  test('B2-02 · el verb dir, «no hi havia més remei», el patró, riure i comptar no fan cap etiqueta', () => {
    const relat = `Quan acabà la guerra no hi havia més remei que buscar faena fora. Mon pare li deia a ma mare que tornaria prompte, i ella li deia que no se n'anara.
El patró de la fàbrica de Xixona ens pagava molt poc, i el patró del magatzem encara menys. Ens deien que a Alemanya es guanyava més, i també ens diuen hui que va ser veritat.
La tia Remei, que vivia al costat, sempre deia que no hi havia remei per a la pobresa. Mon germà riu quan ho recorda, i jo també me'n riu, però aleshores no fèiem res més que comptar els cèntims: ma mare els contava cada nit, i els contava dues voltes.`;
    const r = estructuraMemoriaOral(relat);
    expect(r.paraules).toBeGreaterThanOrEqual(PARAULES_TEXT_LLARG);
    // Guerra i emigració hi apareixen una sola volta: en un relat llarg no arriben al llindar.
    expect(ids(r)).toEqual([]);
    const sense = [
      'Ma mare li deia que tornara prompte a casa.', 'Ens deien que no isquérem al carrer de nit.',
      'La tia Remei vivia al costat de casa.', 'No hi havia més remei.', 'Quin remei, tornar a començar.',
      'Vicent era el patró del magatzem.', 'Els patrons pagaven poc.', 'Van processar el meu oncle.',
      'Mon germà riu quan ho recorda.', 'La iaia contava els cèntims un per un.'
    ];
    for (const text of sense) expect(ids(estructuraMemoriaOral(text)), text).toEqual([]);
    const amb = [
      ['Li deien en Pep de la Font.', 'malnoms'], ["A ma tia li deien l'Escolana.", 'malnoms'],
      ['Era un remei de la iaia per a la tos.', 'remeis'], ['Remei de la iaia per a la tos.', 'remeis'],
      ["La processó eixia de l'església.", 'festes'], ['Les festes patronals duraven una setmana.', 'festes'],
      ['Anàvem al riu a llavar la roba.', 'aigua'], ['La iaia contava rondalles.', 'rondalles']
    ];
    for (const [text, id] of amb) expect(ids(estructuraMemoriaOral(text)), text).toContain(id);
  });

  test('B2-07 · el títol i el subtítol compten per al límit de mida', () => {
    const t0 = performance.now();
    const r = estructuraMemoriaOral({ title: 'a '.repeat(MIDA_MAXIMA_TEXT), content: '<p>Hola.</p>' });
    expect(performance.now() - t0).toBeLessThan(2500);
    expect([r.motiu, r.okf]).toEqual([MOTIUS_MEMORIA.massaLlarg, null]);
    expect(estructuraMemoriaOral({ subtitle: 'b '.repeat(MIDA_MAXIMA_TEXT), content: '<p>Hola.</p>' }).motiu).toBe(MOTIUS_MEMORIA.massaLlarg);
  });

  test('B2-08 · la llavor al cos i el relat a l’entradilla: fitxa de l’entradilla, sense la llavor', () => {
    const lead = '<p>La iaia ens contava rondalles de bruixes a la vora del foc cada nit d’hivern a Tibi.</p>';
    const r = estructuraMemoriaOral({ title: '', lead, content: LLAVOR_NOTA });
    expect([r.motiu, r.municipi?.id, ids(r)]).toEqual([MOTIUS_MEMORIA.proposta, 'tibi', ['rondalles']]);
    expect(r.okf.cos).not.toContain('plantilla de format');
    expect(estructuraMemoriaOral({ title: 'Només el títol', lead: '', content: LLAVOR_NOTA }).motiu).toBe(MOTIUS_MEMORIA.llavor);
  });

  test('B2-09 · un relat sense puntuació: les frases de paràgrafs diferents no s’enganxen al resum', () => {
    const r = estructuraMemoriaOral('Mon pare era llaurador a Tibi\n\n- Anàvem a la font a per aigua\n\nLa iaia contava rondalles de bruixes');
    expect(r.resum).toBe('Mon pare era llaurador a Tibi\n\n- Anàvem a la font a per aigua\n\nLa iaia contava rondalles de bruixes');
    const { cos } = parteix(r.okf.markdown);
    // Cada frase, en el seu paràgraf i escapada línia a línia; la nota a peu, darrere de l'última.
    expect(cos).toContain('\nMon pare era llaurador a Tibi\n\n\\- Anàvem a la font a per aigua\n\nLa iaia contava rondalles de bruixes[^relat]\n');
    expect(cos).not.toMatch(/^- /m);
    expect(r.resum.length).toBeLessThanOrEqual(MAX_RESUM);
    // Amb puntuació, com sempre: un espai.
    expect(estructuraMemoriaOral('Mon pare era llaurador a Tibi.\n\nLa iaia contava rondalles de bruixes.').resum)
      .toBe('Mon pare era llaurador a Tibi. La iaia contava rondalles de bruixes.');
  });

  test('B2-06 · dates de veres: el 29 de febrer d’un any de traspàs, un fus amb mitja hora', () => {
    const r = estructuraMemoriaOral(RELAT, { ara: '2028-02-29T12:00:00.5+05:30' });
    expect(r.okf.frontmatter.generated.at).toBe('2028-02-29T12:00:00.5+05:30');
    expect(load(parteix(r.okf.markdown).yaml, { schema: DEFAULT_SCHEMA }).generated.at).toBeInstanceOf(Date);
    for (const dolenta of ['2026-02-30T00:00:00Z', '2026-11-01T03:00Z', '2026-11-01T24:00:00Z']) {
      expect(validaFitxaOkf({ type: 'x', stale_after: dolenta }).valida, dolenta).toBe(false);
    }
  });

  test('B2-10 · validaFitxaOkf: els senyals de credibilitat de les fonts (§5.1) i el runtime d’una Attested Computation (§10.2)', () => {
    const bona = {
      type: 'x',
      sources: [{ id: 'ga4', resource: 'https://exemple.org/esquema', title: 'Esquema', author: 'team:ga4-docs', usage_count: 5000, last_modified: '2026-05-30T00:00:00Z' }],
      usage_window: { from: '2026-06-01T00:00:00Z', to: '2026-06-30T00:00:00Z' }
    };
    expect(validaFitxaOkf(bona)).toEqual({ valida: true, errors: [] });
    for (const dolenta of [
      { type: 'x', sources: [{ resource: 'y', last_modified: 'ahir' }] },
      { type: 'x', sources: [{ resource: 'y', usage_count: 'molts' }] },
      { type: 'x', sources: [{ resource: 'y', usage_count: -1 }] },
      { type: 'x', sources: [{ resource: 'y', author: 'qualsevol cosa' }] },
      { type: 'x', sources: [{ resource: 'y', usage_window: { from: '2026-06-01T00:00:00Z' } }] },
      { type: 'x', sources: [{ resource: 'y', title: '' }] },
      { type: 'x', sources: 'y' },
      { type: 'x', usage_window: 'sempre' },
      { type: 'Attested Computation' }
    ]) {
      expect(validaFitxaOkf(dolenta).valida, JSON.stringify(dolenta)).toBe(false);
    }
    expect(validaFitxaOkf({ type: 'Attested Computation', runtime: 'bigquery' }).valida).toBe(true);
  });

  test('B2-13 · «recurs»: un camí del lloc sí; «//host» i «/\\host», no (a les opcions mal formades)', () => {
    const r = estructuraMemoriaOral(RELAT, { recurs: '/notes?nota=n-1' });
    expect(r.okf.frontmatter.resource).toBe('/notes?nota=n-1');
    expect(() => estructuraMemoriaOral(RELAT, { recurs: '//evil.example/nota' })).toThrow(TypeError);
  });
});

describe('memoriaOral · revisió humana amb correcció (Gauntlet 261101, B2-04 i B2-05)', () => {
  const r = estructuraMemoriaOral(RELAT, { ara: ARA });
  const relatDe = (cos) => cos.slice(cos.indexOf('\n# Relat\n'), cos.indexOf("\n# Com s'ha fet\n"));
  const seccio = (cos, nom) => {
    const inici = cos.indexOf(`\n# ${nom}\n`);
    return cos.slice(inici, cos.indexOf('\n# ', inici + 3));
  };

  test('descarta etiquetes i tria un altre poble: el frontmatter, el cos i el camí ho reflectixen', () => {
    expect(r.titolDeLaPersona).toBe(false);
    const revisada = marcaRevisioHumana(r, { persona: 'javi', ara: '2026-11-01T09:30:00+01:00', etiquetes: ['aigua', 'festes'], municipi: 'xixona' });
    const fm = revisada.okf.frontmatter;
    expect(fm.tags).toEqual(['aigua', 'festes']);
    expect(fm.municipi).toBe('xixona');
    expect(fm.title).toBe("L'aigua i les festes a Xixona");
    expect(fm.description).toBe("Relat de memòria oral sobre l'aigua i les festes (poble: Xixona).");
    expect([fm.status, fm.verified]).toEqual(['stable', [{ by: 'human:javi', at: '2026-11-01T09:30:00+01:00' }]]);
    expect(nivellDeConfianca(fm)).toBe(NIVELLS_CONFIANCA.huma);
    expect(validaFitxaOkf(fm)).toEqual({ valida: true, errors: [] });
    expect(load(parteix(revisada.okf.markdown).yaml, { schema: CORE_SCHEMA })).toEqual(fm);
    // El camí: el poble triat i el títol nou, amb la mateixa empremta del relat.
    const empremta = r.okf.cami.slice(-12);
    expect(revisada.okf.cami).toBe(`memoria-oral/xixona/l-aigua-i-les-festes-a-xixona${empremta}`);
    // La fitxa: el que es pinta.
    expect([revisada.titol, revisada.municipi.id, revisada.etiquetes.map((e) => e.id)]).toEqual([fm.title, 'xixona', ['aigua', 'festes']]);
    // El cos: cada secció ho diu, el relat no es toca i el resum tampoc.
    const { cos } = parteix(revisada.okf.markdown);
    expect(cos).toBe(`\n${revisada.okf.cos}`);
    expect(cos.match(/^# .+$/gm)).toEqual(['# Resum', '# Etiquetes', '# Poble', '# Relat', "# Com s'ha fet"]);
    expect(seccio(cos, 'Resum')).toContain(fm.description);
    expect(cos).toContain(`${r.resum}[^relat]`);
    const etiquetes = seccio(cos, 'Etiquetes');
    expect(etiquetes).toContain('i revisades per una persona.');
    expect(etiquetes.match(/^\* \*\*.+$/gm).map((l) => /`(\w+)`/.exec(l)[1])).toEqual(['aigua', 'festes']);
    expect(etiquetes).toContain('Descartades en la revisió: Collita i camp, Cançons i música, Oficis i treballs.');
    expect(seccio(cos, 'Poble')).toContain('Poble triat en la revisió: Xixona.');
    expect(cos).toContain("En la revisió humana s'han corregit les etiquetes i el poble.");
    expect(relatDe(cos)).toBe(relatDe(r.okf.cos));
    // L'esborrany de la màquina no canvia.
    expect([r.okf.frontmatter.status, r.okf.frontmatter.tags.length, r.municipi.id]).toEqual(['draft', 5, 'la-torre-de-les-macanes']);
  });

  test('cap poble: fora `municipi`, camí «sense-poble» i el cos ho diu; una etiqueta que la màquina no proposava, afegida', () => {
    const revisada = marcaRevisioHumana(r, { persona: 'javi', ara: ARA, etiquetes: ['collita', 'guerra'], municipi: null });
    const fm = revisada.okf.frontmatter;
    expect(fm).not.toHaveProperty('municipi');
    expect(revisada.municipi).toBeNull();
    expect(fm.tags).toEqual(['collita', 'guerra']);
    expect(fm.title).toBe('La collita i la guerra');
    expect(revisada.okf.cami).toMatch(/^memoria-oral\/sense-poble\/la-collita-i-la-guerra-[0-9a-f]{8}\.md$/);
    expect(revisada.okf.cos).toContain("En la revisió, cap d'estos pobles no s'ha triat com a poble del relat.");
    expect(revisada.okf.cos).toMatch(/^\* \*\*Guerra i postguerra\*\* \(`guerra`\): .+ Afegida en la revisió humana\.$/m);
    expect(revisada.etiquetes.find((e) => e.id === 'guerra')).toEqual(expect.objectContaining({ coincidencies: 0, proves: [] }));
    expect(load(parteix(revisada.okf.markdown).yaml, { schema: CORE_SCHEMA })).toEqual(fm);
  });

  test('un poble que la màquina s’equivoca (una llista sense la marca d’homonímia): la persona en tria cap i el segell no cau damunt de l’error', () => {
    // Mula és un poble de Múrcia; esta llista no el marca amb `ambMajuscula`.
    const pobles = [{ id: 'mula', title: 'Mula', comarca: 'Río Mula', provincia: 'Múrcia' }];
    const fitxa = estructuraMemoriaOral('Posàvem la sella a la mula i anàvem al camp de matinada amb el pare.', { pobles });
    expect(fitxa.municipi?.id).toBe('mula');
    expect(fitxa.titol).toContain('Mula');
    const revisada = marcaRevisioHumana(fitxa, { persona: 'javi', ara: ARA, municipi: null });
    expect([revisada.municipi, revisada.okf.frontmatter.municipi]).toEqual([null, undefined]);
    expect(revisada.titol).not.toContain('Mula');
    expect(revisada.okf.frontmatter.description).not.toContain('Mula');
    expect(revisada.okf.cami).toMatch(/^memoria-oral\/sense-poble\//);
    expect(revisada.okf.cos).toContain("En la revisió humana s'ha corregit el poble.");
  });

  test('sense cap canvi (o les mateixes tries de la màquina), només l’estat i `verified`', () => {
    const sense = marcaRevisioHumana(r, { persona: 'javi', ara: ARA });
    const iguals = marcaRevisioHumana(r, { persona: 'javi', ara: ARA, etiquetes: r.etiquetes.map((e) => e.id), municipi: r.municipi.id });
    for (const revisada of [sense, iguals]) {
      expect([revisada.okf.cos, revisada.okf.cami, revisada.titol, revisada.okf.frontmatter.tags]).toEqual([r.okf.cos, r.okf.cami, r.titol, r.okf.frontmatter.tags]);
    }
    expect(iguals.okf.markdown).toBe(sense.okf.markdown);
  });

  test('el títol de la persona no el toca la correcció', () => {
    const nota = estructuraMemoriaOral({ title: 'Records de la iaia', content: `<p>${RELAT.split('\n\n').join('</p><p>')}</p>` }, { ara: ARA });
    expect(nota.titolDeLaPersona).toBe(true);
    const revisada = marcaRevisioHumana(nota, { persona: 'javi', ara: ARA, etiquetes: ['aigua'], municipi: 'xixona' });
    expect(revisada.okf.frontmatter.title).toBe('Records de la iaia');
    expect(revisada.okf.cami).toMatch(/^memoria-oral\/xixona\/records-de-la-iaia-[0-9a-f]{8}\.md$/);
  });

  test('una segona revisió parteix de la primera i hi afig la seua firma', () => {
    const primera = marcaRevisioHumana(r, { persona: 'javi', ara: ARA, etiquetes: ['aigua', 'festes'], municipi: 'xixona' });
    const segona = marcaRevisioHumana(primera, { persona: 'maria', ara: '2026-11-02T10:00:00Z', etiquetes: ['aigua'] });
    expect(segona.okf.frontmatter.verified.map((v) => v.by)).toEqual(['human:javi', 'human:maria']);
    expect([segona.okf.frontmatter.tags, segona.okf.frontmatter.municipi, segona.titol]).toEqual([['aigua'], 'xixona', "L'aigua a Xixona"]);
    expect(relatDe(segona.okf.cos)).toBe(relatDe(r.okf.cos));
  });

  test('les correccions mal formades fallen amb TypeError, sense fitxa a mitges', () => {
    for (const opcions of [{ etiquetes: 'festes' }, { etiquetes: ['inventada'] }, { etiquetes: [42] }, { municipi: 'alcoi' }, { municipi: '' }, { municipi: 7 }]) {
      expect(() => marcaRevisioHumana(r, { persona: 'javi', ara: ARA, ...opcions }), JSON.stringify(opcions)).toThrow(TypeError);
    }
  });

  test('B2-05 · una fitxa rehidratada amb una data o un estat colats no arriba al YAML; un `verified` en mapa compta com una llista', () => {
    const rehidrata = () => JSON.parse(JSON.stringify(r));
    const neta = rehidrata();
    expect(marcaRevisioHumana(neta, { persona: 'javi', ara: ARA }).okf.markdown).toBe(marcaRevisioHumana(r, { persona: 'javi', ara: ARA }).okf.markdown);
    const colada = rehidrata();
    colada.okf.frontmatter.generated.at = '2026-11-01T03:00:00Z\nresource: https://evil.example/';
    expect(() => marcaRevisioHumana(colada, { persona: 'javi', ara: ARA })).toThrow(TypeError);
    const estat = rehidrata();
    estat.okf.frontmatter.status = 'draft\nresource: https://evil.example/';
    expect(() => marcaRevisioHumana(estat, { persona: 'javi', ara: ARA })).toThrow(TypeError);
    const mapa = rehidrata();
    mapa.okf.frontmatter.verified = { by: 'process:nit', at: '2026-06-25T09:00:00Z' };
    const revisada = marcaRevisioHumana(mapa, { persona: 'javi', ara: ARA });
    expect(revisada.okf.frontmatter.verified).toEqual([{ by: 'process:nit', at: '2026-06-25T09:00:00Z' }, { by: 'human:javi', at: ARA }]);
    expect(load(parteix(revisada.okf.markdown).yaml, { schema: CORE_SCHEMA })).toEqual(revisada.okf.frontmatter);
    // Una fitxa que no ha fet este motor no es pot corregir (no se'n pot refer el cos).
    const aliena = rehidrata();
    aliena.okf.cos = '# Un altre cos\n';
    expect(() => marcaRevisioHumana(aliena, { persona: 'javi', ara: ARA, etiquetes: ['aigua'] })).toThrow(TypeError);
  });
});

/* Gauntlet 2 (261101) · carril Y-OKF: G2-MO-01, G2-MO-04, G2-MO-05, G2-MO-07 i
   G2-MO-10, cadascuna amb el relat que la reproduïa. Els relats estan escrits
   per a esta prova: no són el testimoni de cap persona real. */
describe('memoriaOral · Gauntlet 2 (G2-MO)', () => {
  const comEsFet = (cos) => cos.slice(cos.indexOf("\n# Com s'ha fet\n"));

  test('G2-MO-01 · «Relat» porta el text sencer; el subtítol de la nota no es perd del fitxer i no fa marca', () => {
    const nota = {
      title: 'Records de la iaia',
      subtitle: 'Penàguila, # fals [^relat]: x *1950*',
      lead: '',
      content: '<p>Ma iaia Pepa va nàixer a Penàguila l’any trenta-dos.</p><p>De xicoteta guardava les cabres del tio Vicent.</p>'
    };
    const r = estructuraMemoriaOral(nota, { ara: ARA });
    expect(r.subtitol).toBe('Penàguila, # fals [^relat]: x *1950*');
    const { cos } = parteix(r.okf.markdown);
    expect(cos).toContain('\n# Relat\n\nMa iaia Pepa va nàixer a Penàguila l’any trenta-dos.\n\nDe xicoteta guardava les cabres del tio Vicent.\n');
    expect(comEsFet(cos)).toContain("El relat no s'ha modificat: «Relat» en porta el text sencer, sense format.");
    expect(comEsFet(cos)).toContain('El subtítol de la nota, que no és relat i només ha comptat per a les etiquetes i el poble, és: «Penàguila, # fals \\[^relat\\]: x \\*1950\\*».');
    // Cap encapçalament ni nota a peu de més.
    expect(cos.match(/^# .+$/gm)).toEqual(['# Resum', '# Etiquetes', '# Poble', '# Relat', "# Com s'ha fet"]);
    expect(cos.match(/^\[\^relat\]:/gm)).toEqual(['[^relat]:']);
    // Sense subtítol, cap frase del subtítol.
    const sense = estructuraMemoriaOral({ ...nota, subtitle: '' }, { ara: ARA });
    expect([sense.subtitol, sense.okf.cos.includes('subtítol')]).toEqual(['', false]);
    // La revisió amb correcció refà el cos i el conserva.
    const revisada = marcaRevisioHumana(r, { persona: 'javi', ara: ARA, municipi: null });
    expect(revisada.okf.cos).toContain('és: «Penàguila, # fals \\[^relat\\]: x \\*1950\\*».');
  });

  test('G2-MO-04 · els cognoms i noms de pila que comencen com una arrel no fan etiqueta amb majúscula a mitjan frase', () => {
    const cognoms = `Ma mare es deia Amparo Ferrer i mon pare Vicent Oliver. El tio Ferrer vivia al carrer de dalt i cada vesprada passava a vore la iaia. Els Oliver eren cosins nostres per part de mare. La mestra, la senyora Pastor, ens renyia si arribàvem tard. Al costat vivia la família Guerrero, que havien vingut de Múrcia, i la xicoteta Hortènsia era la meua millor amiga. Quan Hortènsia es va casar, el senyor Pastor va fer el dinar a sa casa i tot el veïnat hi va anar. Ningú no se'n recorda ja de res d'allò.`;
    const r = estructuraMemoriaOral(cognoms);
    expect(r.paraules).toBeGreaterThanOrEqual(PARAULES_TEXT_LLARG);
    expect(ids(r)).not.toContain('oficis');
    expect(ids(r)).not.toContain('collita');
    expect(r.titol).not.toMatch(/oficis|collita/i);
    for (const text of ['El senyor Ballester vivia al carrer de dalt.', 'La família Ferrer tenia la casa gran.', 'En Pep Fuster i la Maria Moliner es van casar.',
      'La xicoteta Olivia vivia al costat de casa.', 'Mon cosí Cavaller tenia una moto.']) {
      expect(ids(estructuraMemoriaOral(text)), text).toEqual([]);
    }
    // En minúscula, a l'inici de la frase o tot en majúscules, compten com sempre.
    expect(ids(estructuraMemoriaOral('El ferrer del poble ferrava les mules.'))).toContain('oficis');
    expect(ids(estructuraMemoriaOral('Ferrer era l’ofici de mon iaio.'))).toContain('oficis');
    expect(ids(estructuraMemoriaOral('MON PARE ERA PASTOR.'))).toContain('oficis');
    expect(ids(estructuraMemoriaOral('Anàvem a collir olives a l’hort.'))).toEqual(['collita']);
    // «la Guerra Civil» amb majúscula sí que és la guerra.
    expect(ids(estructuraMemoriaOral('Mon pare va fer la Guerra Civil.'))).toEqual(['guerra']);
    // Cada una és una arrel del vocabulari.
    const arrels = new Set(VOCABULARI_RURAL.flatMap((t) => t.arrels.map((a) => a.normalize('NFKD').replace(/\p{M}/gu, ''))));
    for (const a of ARRELS_QUE_SON_NOMS) expect(arrels.has(a), a).toBe(true);
    expect(ARRELS_QUE_SON_NOMS).not.toContain('guerr');
  });

  test('G2-MO-05 · «ni jota», la recepta del metge, una cosa dita i «que no ho conte» no fan etiqueta', () => {
    const idiomes = 'No entenia ni jota del que deia el metge. Em va fer una recepta per a la farmàcia i ma mare la va guardar en el calaix. Una cosa dita és una cosa feta, deia sempre. Que ningú no ho conte, que és un secret.';
    const r = estructuraMemoriaOral(idiomes);
    expect(ids(r)).toEqual([]);
    expect(r.titol).toBe('No entenia ni jota del que deia el metge');
    for (const text of ['Dita la missa, tornàvem a casa.', 'La recepta del metge era per a la tos.']) {
      expect(ids(estructuraMemoriaOral(text)), text).not.toContain(text.startsWith('Dita') ? 'rondalles' : 'cuina');
    }
    // La jota que es balla, els contes i les dites, com sempre.
    expect(ids(estructuraMemoriaOral('A la plaça ballaven una jota.'))).toContain('cancons');
    expect(ids(estructuraMemoriaOral('La iaia contava contes i dites a la vora del foc.'))).toEqual(['rondalles']);
  });

  test('G2-MO-07 · cada avís porta el seu codi (codisAvis), i el text és el d’AVISOS_MEMORIA', () => {
    const curt = estructuraMemoriaOral('Vaig nàixer a Tibi i em vaig casar a Xixona.');
    expect(curt.codisAvis).toEqual(['curt', 'diversosPobles']);
    expect(curt.avisos).toEqual([AVISOS_MEMORIA.curt, AVISOS_MEMORIA.diversosPobles]);
    expect(AVISOS_MEMORIA.curt).toBe(`El relat té menys de ${MIN_PARAULES} paraules: la fitxa és orientativa.`);
    expect(estructuraMemoriaOral(RELAT).codisAvis).toEqual(['diversosPobles']);
    const llarg = estructuraMemoriaOral({ title: 'a '.repeat(MIDA_MAXIMA_TEXT), content: '<p>Hola.</p>' });
    expect([llarg.codisAvis, llarg.avisos]).toEqual([['massaLlarg'], [AVISOS_MEMORIA.massaLlarg]]);
    expect(estructuraMemoriaOral('').codisAvis).toEqual([]);
    // La revisió els conserva.
    expect(marcaRevisioHumana(curt, { persona: 'javi', ara: ARA }).codisAvis).toEqual(curt.codisAvis);
  });

  test('G2-MO-10 · amb un empat de mencions, «primer poble esmentat» i no «el més esmentat»', () => {
    expect(estructuraMemoriaOral('Vaig nàixer a Tibi i em vaig casar a Xixona.').descripcio).toBe('Relat de memòria oral (primer poble esmentat: Tibi).');
    const real = estructuraMemoriaOral("Ma iaia era de Penàguila i el iaio d'Alcoleja. Es van conéixer a la fira de Xixona, l'any que va ploure tant. Ell portava les mules a vendre i ella venia torrons.");
    expect(real.candidats.map((c) => c.mencions)).toEqual([1, 1, 1]);
    expect(real.descripcio).toMatch(/ \(primer poble esmentat: Penàguila\)\.$/);
    // Sense empat, com sempre.
    expect(estructuraMemoriaOral(RELAT).descripcio).toMatch(/\(poble més esmentat: la Torre de les Maçanes\)\.$/);
    expect(estructuraMemoriaOral('Les festes de Tibi eren les millors de la comarca.').descripcio).toMatch(/\(poble esmentat: Tibi\)\.$/);
  });
});

/* T2 · D04/D10 (assalt 261101) · markdownOkf: el paquet Open Data escriu cada
   fitxa a data/okf/ amb el mateix serialitzador que la fitxa, i el restaurador
   en comprova els bytes. Import dinàmic a posta: el carril T6a toca la llista
   d'imports de dalt alhora. */
describe('T2 · markdownOkf', () => {
  test('dona els mateixos bytes que fitxa.okf.markdown, en esborrany i revisada', async () => {
    const { markdownOkf } = await import('./memoriaOral.js');
    const esborrany = estructuraMemoriaOral(RELAT, { ara: ARA, autor: 'sense-identificador' });
    const revisada = marcaRevisioHumana(esborrany, { persona: 'sense-identificador', ara: '2026-11-01T04:00:00Z' });
    for (const fitxa of [esborrany, revisada]) {
      expect(markdownOkf(fitxa.okf.frontmatter, fitxa.okf.cos)).toBe(fitxa.okf.markdown);
    }
    expect(revisada.okf.frontmatter.status).toBe('stable');
    // Un estat que no és d'OKF no arriba al YAML.
    expect(() => markdownOkf({ ...revisada.okf.frontmatter, status: 'publicada' }, revisada.okf.cos)).toThrow(TypeError);
  });
});
