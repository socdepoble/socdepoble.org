// @vitest-environment node
/* Salut · el full per al metge: les cinc fulles amb les columnes esperades,
   la capçalera amb el nom que es passa (neutra si no n'hi ha), l'avís, una fila
   per jornada i la mitjana, i el model és vàlid per a utils/fulls. */
import { describe, expect, test } from 'vitest';
import { validaModel } from '../../../utils/fulls/index.js';
import { assignaJornades } from './hores.js';
import { AVIS_FULL, NOMS_FULLES, fullDiari, textValorsAdmesos } from './full.js';
import { campDe } from './diccionari.js';

let n = 0;
const uuid = () => { n += 1; return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`; };
const a = (tipus, moment, camps = {}) => ({ id: uuid(), tipus, moment, ofsetMin: 120, ...camps });
const PERSONA = { alias: 'el iaio', horaAlcarHabitual: '07:00', horaGitarHabitual: '22:00' };
const D = '2026-10-05';

const APUNTS = assignaJornades([
  a('son', `${D}T07:00`, { event: 'alcar-se' }),
  a('miccio', `${D}T07:20`, { volumMl: 300, mesura: 'mesurat', lloc: 'vater', urgencia: 2 }),
  a('ingesta', `${D}T08:00`, { volumMl: 200, beguda: 'cafe' }),
  a('ingesta', `${D}T08:30`, { volumMl: 100, beguda: 'aigua', rebutjada: true }),
  a('medicacio', `${D}T09:00`, { nom: 'la de la pressió', dosi: '1', pauta: 'fixa', estat: 'presa', etiqueta: 'altra' }),
  a('conducta', `${D}T18:00`, {
    conductes: ['cridar', 'caminar-sense-parar'], intensitat: 2, duradaMin: 15, antecedents: ['ganes-vater'], antecedentsAltre: 'molta gent',
    accions: ['acompanyar-vater'], resultat: 'es-calma-prompte', nota: '=1+1'
  }),
  a('son', `${D}T22:30`, { event: 'adormir-se' }),
  a('miccio', '2026-10-06T03:00', { mesura: 'no-mesurat', lloc: 'orinal-de-ma' }),
  a('observacio', '2026-10-06T10:00', { que: 'temperatura', temperaturaDecimes: 372 })
], PERSONA);
const JORNADES = new Map([[D, { data: D, completa: true }]]);

describe('fullDiari', () => {
  const { model, periode } = fullDiari({ des: D, dies: 2, apunts: APUNTS, jornades: JORNADES, persona: PERSONA, ofsetDe: () => 120 });
  const fulla = (nom) => model.fulles.find((f) => f.nom === nom);

  test('cinc fulles amb noms vàlids per a Excel i un model sense problemes', () => {
    expect(model.fulles.map((f) => f.nom)).toEqual(NOMS_FULLES);
    expect(validaModel(model)).toEqual([]);
    expect(periode.jornades).toHaveLength(2);
  });

  test('Resum: capçalera (persona, període, avís), una fila per jornada i la mitjana', () => {
    const resum = fulla('Resum');
    expect(resum.columnes.map((c) => c.titol)).toEqual(['Dia', 'Completa', 'Cobertura', 'Vegades de dia', 'Vegades de nit', 'Orina 24 h (ml)',
      'Orina de nit (ml)', 'Part de nit (%)', 'Índex de nit (Ni)', 'Màxim (ml)', 'Mitjana (ml)', 'Begut (ml)', 'Escapaments', 'Absorbents',
      'Deposicions', 'Episodis']);
    expect(resum.files[0][0]).toBe('Persona: la persona');
    expect(resum.files[1][0]).toBe('Període: 05/10/2026 – 06/10/2026 (2 dies)');
    expect(resum.files[2][0]).toBe(AVIS_FULL);
    expect(resum.files[3].slice(0, 5)).toEqual(['dl. 05/10/2026', 'Sí', 'parcial (50 %)', 1, 1]);
    expect(resum.files[3][11]).toBe(200);
    expect(resum.files[4].slice(0, 3)).toEqual(['dt. 06/10/2026', 'No', '—']);
    expect(resum.files[5][0]).toBe('Mitjana de 1 jornada completa');
    expect(resum.files).toHaveLength(6);
  });

  test('Diari: una fila per apunt, cronològica, amb el dia o la nit i les notes', () => {
    const diari = fulla('Diari');
    expect(diari.columnes.map((c) => c.titol)).toEqual(['Data', 'Hora', 'Dia o nit', 'Beguda', 'Begut (ml)', 'Orina (ml)', 'Mesura',
      'Urgència (0–4)', 'Escapament', 'Absorbent', 'Deposició (Bristol)', 'Conducta', 'Medicació', 'Notes']);
    expect(diari.files).toHaveLength(APUNTS.length);
    expect(diari.files[1]).toEqual(['2026-10-05', '07:20', 'Dia', '', null, 300, 'Mesurat', 2, '', '', null, '', '', '']);
    /* La beguda rebutjada no compta com a begut, i ho diu la nota. */
    expect(diari.files[3][3]).toBe('Aigua');
    expect(diari.files[3][4]).toBeNull();
    expect(diari.files[3][13]).toBe('No l’ha volguda');
    expect(diari.files[5][11]).toBe('Moderat · Cridar; Caminar sense parar');
    expect(diari.files[7].slice(0, 3)).toEqual(['2026-10-06', '03:00', 'Nit']);
    expect(diari.files[8][13]).toBe('Altres · 37,2 °C');
  });

  test('Conducta i Medicació porten el registre sencer', () => {
    expect(fulla('Conducta').files[0]).toEqual(['2026-10-05', '18:00', 15, 'Moderat', 'Cridar; Caminar sense parar',
      'Ganes d’orinar o de fer de ventre; molta gent', 'Acompanyar-lo al vàter', 'Es calma prompte', '', '=1+1']);
    expect(fulla('Medicació').files[0]).toEqual(['2026-10-05', '09:00', 'la de la pressió', '1', 'A hora fixa', 'Presa', 'Una altra']);
  });

  test('Diccionari: cada camp amb la seua definició', () => {
    const diccionari = fulla('Diccionari');
    const volum = diccionari.files.find((fila) => fila[0] === 'Micció' && fila[1] === 'Quant (ml)');
    expect(volum).toEqual(['Micció', 'Quant (ml)', 'Orina (ml)', 'nombre sencer', 'ml', '0–1500', campDe('miccio', 'volumMl').definicio,
      campDe('miccio', 'volumMl').perQueImporta]);
    expect(textValorsAdmesos(campDe('observacio', 'temperaturaDecimes'))).toBe('34,0–42,0');
  });

  /* SAL-05: la primera micció de l'endemà de l'últim dia entra a l'orina de
     nit i de 24 h del Resum; el metge l'ha de trobar també al Diari (i al CSV). */
  test('Diari: porta la primera micció del matí següent a l’últim dia, que tanca la nit', () => {
    const apunts = assignaJornades([
      ...APUNTS,
      a('son', '2026-10-06T07:00', { event: 'alcar-se' }),
      a('miccio', '2026-10-06T07:10', { volumMl: 350, mesura: 'mesurat', lloc: 'vater' }),
      a('miccio', '2026-10-06T11:00', { volumMl: 200, mesura: 'mesurat', lloc: 'vater' })
    ], PERSONA);
    const { model, periode } = fullDiari({ des: D, dies: 1, apunts, jornades: JORNADES, persona: PERSONA, ofsetDe: () => 120 });
    const diari = model.fulles.find((f) => f.nom === 'Diari');
    const darrera = diari.files[diari.files.length - 1];
    expect(darrera.slice(0, 3)).toEqual(['2026-10-06', '07:10', 'Matí següent']);
    expect(darrera[5]).toBe(350);
    /* Només eixa: la resta de l'endemà ja és d'un altre dia. */
    expect(diari.files.filter((fila) => fila[0] === '2026-10-06').map((fila) => fila[1])).toEqual(['03:00', '07:10']);
    expect(periode.jornades[0].motiuSenseVolums).toBe('cobertura');
  });

  test('Diari: sense micció l’endemà, no hi ha cap fila de més', () => {
    const { model } = fullDiari({ des: D, dies: 1, apunts: APUNTS, jornades: JORNADES, persona: PERSONA, ofsetDe: () => 120 });
    expect(model.fulles.find((f) => f.nom === 'Diari').files.map((fila) => fila[2])).not.toContain('Matí següent');
  });

  /* SAL-04: l'àlies «només es veu ací»; el fitxer no el porta si no es demana. */
  test('sense nom escrit, la capçalera és neutra: l’àlies desat no ix del dispositiu', () => {
    const senseNom = fullDiari({ des: D, dies: 1, apunts: APUNTS, jornades: JORNADES, persona: PERSONA, ofsetDe: () => 120 });
    expect(senseNom.model.fulles[0].files[0][0]).toBe('Persona: la persona');
    const enBlanc = fullDiari({ des: D, dies: 1, apunts: APUNTS, jornades: JORNADES, persona: PERSONA, nomPersona: '   ', ofsetDe: () => 120 });
    expect(enBlanc.model.fulles[0].files[0][0]).toBe('Persona: la persona');
    expect(JSON.stringify(senseNom.model)).not.toContain(PERSONA.alias);
  });

  test('el nom escrit en el moment substituïx l’àlies a la capçalera', () => {
    const ambNom = fullDiari({ des: D, dies: 1, apunts: APUNTS, jornades: JORNADES, persona: PERSONA, nomPersona: '  Pere  ', ofsetDe: () => 120 });
    expect(ambNom.model.fulles[0].files[0][0]).toBe('Persona: Pere');
    expect(ambNom.model.fulles[0].files[1][0]).toBe('Període: 05/10/2026 – 05/10/2026 (1 dia)');
  });
});
