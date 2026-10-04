/* Ordre del Mestre del 261004 (prompt 261004_0515, T5) · El contingut de la
   vista «Contingut multimèdia»: les tres pestanyes de la captura 19.41.58,
   el mateix classificador que la cerca global, enllaços sense duplicats amb
   el domini i l'avís de punycode, i res que no s'haja compartit de veres. */
import { describe, expect, test } from 'vitest';
import { PESTANYES_MULTIMEDIA, agrupaPerMes, contingutMultimedia, titolDeMes } from './multimediaXat.js';
import { classificaMissatge } from './cercaXat.js';

const FILS = [
  { id: 'a', name: 'Comissió de Festes' },
  { id: 'b', name: 'Vicent' }
];

const MISSATGES = {
  a: [
    { id: 'a1', seq: 1, text: 'Mireu https://socdepoble.org/festes i https://socdepoble.org/festes.', creatAl: '2026-09-12T10:00:00Z' },
    { id: 'a2', seq: 2, tipus: 'imatge', text: 'La foto', creatAl: '2026-10-02T10:00:00Z' },
    { id: 'a3', seq: 3, tipus: 'imatge', metadades: { mime: 'image/gif' }, text: '', creatAl: '2026-10-02T11:00:00Z' },
    { id: 'a4', seq: 4, tipus: 'document', text: 'acta.pdf', creatAl: '2026-10-03T09:00:00Z' },
    { id: 'a5', seq: 5, tipus: 'veu', text: '', creatAl: '2026-10-03T09:30:00Z' },
    { id: 'a6', seq: 6, tipus: 'sistema', text: 'https://no-ix.example', creatAl: '2026-10-03T10:00:00Z' },
    { id: 'a7', seq: 7, esborrat: true, text: 'https://esborrat.example', creatAl: '2026-10-03T10:30:00Z' }
  ],
  b: [
    { id: 'b1', seq: 1, text: 'Compte: https://xn--pple-43d.com/entra', creatAl: '2026-10-04T08:00:00Z' },
    { id: 'b2', seq: 2, text: 'No ha eixit: https://error.example', estatEnviament: 'error', creatAl: '2026-10-04T08:05:00Z' },
    { id: 'tmp', text: 'Encara no: https://pendent.example', estatEnviament: 'pendent', creatAl: '2026-10-04T08:06:00Z' },
    { id: 'b3', seq: 3, text: 'Ja confirmat: https://confirmat.example', estatEnviament: 'pendent', creatAl: '2026-10-04T08:07:00Z' }
  ]
};

describe('contingutMultimedia', () => {
  test('les tres pestanyes, en l’ordre de la captura', () => {
    expect(PESTANYES_MULTIMEDIA).toEqual(['fitxers', 'enllacos', 'documents']);
  });

  test('Enllaços: una entrada per URL i missatge, amb domini i avís, del més recent al més antic', () => {
    const enllacos = contingutMultimedia({ fils: FILS, missatgesPerFil: MISSATGES, pestanya: 'enllacos' });
    expect(enllacos.map((e) => [e.fil.id, e.missatge.id, e.enllac.href, e.enllac.host, e.enllac.sospitos])).toEqual([
      ['b', 'b3', 'https://confirmat.example/', 'confirmat.example', false],
      ['b', 'b1', 'https://xn--pple-43d.com/entra', 'xn--pple-43d.com', true],
      ['a', 'a1', 'https://socdepoble.org/festes', 'socdepoble.org', false]
    ]);
    expect(enllacos.every((e) => e.tipus === 'enllac')).toBe(true);
    /* El text de l'enllaç és el del missatge, sense la puntuació del final. */
    expect(enllacos[2].enllac.text).toBe('https://socdepoble.org/festes');
    /* Les claus són úniques: servixen de clau de React. */
    expect(new Set(enllacos.map((e) => e.clau)).size).toBe(enllacos.length);
  });

  test('fora les làpides, el sistema, els errors i els pendents sense seq', () => {
    const hrefs = contingutMultimedia({ fils: FILS, missatgesPerFil: MISSATGES, pestanya: 'enllacos' }).map((e) => e.enllac.host);
    for (const fora of ['no-ix.example', 'esborrat.example', 'error.example', 'pendent.example']) expect(hrefs).not.toContain(fora);
  });

  test('Fitxers: fotos, GIF i vídeos; Documents: documents; l’àudio, enlloc', () => {
    const ambVideo = { ...MISSATGES, b: [{ id: 'b9', seq: 9, tipus: 'nota_video', text: '', creatAl: '2026-08-01T10:00:00Z' }] };
    const fitxers = contingutMultimedia({ fils: FILS, missatgesPerFil: ambVideo, pestanya: 'fitxers' });
    expect(fitxers.map((f) => [f.missatge.id, f.tipus])).toEqual([['a3', 'gif'], ['a2', 'fotos'], ['b9', 'videos']]);
    const documents = contingutMultimedia({ fils: FILS, missatgesPerFil: ambVideo, pestanya: 'documents' });
    expect(documents.map((d) => [d.missatge.id, d.tipus])).toEqual([['a4', 'documents']]);
    expect([...fitxers, ...documents].some((x) => x.missatge.id === 'a5')).toBe(false);
  });

  test('el mateix classificador que la cerca global: cap missatge canvia de calaix', () => {
    for (const missatge of MISSATGES.a) {
      const filtres = classificaMissatge(missatge);
      const aFitxers = contingutMultimedia({ fils: [FILS[0]], missatgesPerFil: { a: [missatge] }, pestanya: 'fitxers' }).length > 0;
      expect([missatge.id, aFitxers]).toEqual([missatge.id, ['fotos', 'gif', 'videos'].some((f) => filtres.has(f))]);
    }
  });

  test('F0 només envia text: amb els missatges de sempre, Fitxers i Documents són buits', () => {
    const nomesText = { a: [{ id: 'x', seq: 1, text: 'Hola', creatAl: '2026-10-04T08:00:00Z' }] };
    expect(contingutMultimedia({ fils: FILS, missatgesPerFil: nomesText, pestanya: 'fitxers' })).toEqual([]);
    expect(contingutMultimedia({ fils: FILS, missatgesPerFil: nomesText, pestanya: 'documents' })).toEqual([]);
  });

  test('la font pot ser un objecte, un Map o getThreadMessages; res sense fils ni pestanya coneguda', () => {
    const perObjecte = contingutMultimedia({ fils: FILS, missatgesPerFil: MISSATGES, pestanya: 'enllacos' });
    const perMap = contingutMultimedia({ fils: FILS, missatgesPerFil: new Map(Object.entries(MISSATGES)), pestanya: 'enllacos' });
    const perFuncio = contingutMultimedia({ fils: FILS, missatgesPerFil: (id) => MISSATGES[id], pestanya: 'enllacos' });
    expect(perMap.map((e) => e.clau)).toEqual(perObjecte.map((e) => e.clau));
    expect(perFuncio.map((e) => e.clau)).toEqual(perObjecte.map((e) => e.clau));
    expect(contingutMultimedia()).toEqual([]);
    expect(contingutMultimedia({ fils: FILS, missatgesPerFil: MISSATGES, pestanya: 'trucades' })).toEqual([]);
    expect(contingutMultimedia({ fils: [{ name: 'sense id' }, null], missatgesPerFil: MISSATGES, pestanya: 'enllacos' })).toEqual([]);
  });

  test('dos missatges sense id amb la mateixa URL no es fusionen', () => {
    const senseId = { a: [
      { seq: 1, text: 'https://u.example', creatAl: '2026-10-01T10:00:00Z' },
      { seq: 2, text: 'https://u.example', creatAl: '2026-10-01T11:00:00Z' }
    ] };
    expect(contingutMultimedia({ fils: [FILS[0]], missatgesPerFil: senseId, pestanya: 'enllacos' })).toHaveLength(2);
  });
});

describe('agrupaPerMes', () => {
  test('grups de mes en l’ordre d’arribada, amb títol d’Intl i la inicial en majúscula', () => {
    const enllacos = contingutMultimedia({ fils: FILS, missatgesPerFil: MISSATGES, pestanya: 'enllacos' });
    const grups = agrupaPerMes(enllacos, { locale: 'en-US' });
    expect(grups.map((g) => [g.clau, g.titol, g.items.length])).toEqual([
      ['2026-10', 'October 2026', 2],
      ['2026-09', 'September 2026', 1]
    ]);
    const [octubre] = agrupaPerMes(enllacos, { locale: 'ca-ES' });
    expect(octubre.titol.charAt(0)).toBe(octubre.titol.charAt(0).toLocaleUpperCase('ca-ES'));
    expect(octubre.titol.toLocaleLowerCase('ca-ES')).toContain('octubre');
    expect(octubre.titol).toContain('2026');
  });

  test('sense data, un grup de títol buit al final', () => {
    const items = [
      { clau: '1', missatge: { creatAl: null } },
      { clau: '2', missatge: { creatAl: '2026-10-04T08:00:00Z' } }
    ];
    expect(agrupaPerMes(items, { locale: 'en-US' }).map((g) => [g.clau, g.titol])).toEqual([['2026-10', 'October 2026'], ['', '']]);
    expect(titolDeMes('no és una data')).toBe('');
    expect(agrupaPerMes(null)).toEqual([]);
  });
});
