// @vitest-environment node
/* Revisió adversarial 13-10-2026, troballa ORD-2 · VERSIO_CATALEG és la data
   que pinta la pastilla de cada espècimen (DesignSection.jsx), i la regla del
   260928 (capçalera de versio.js) diu que qui toca el catàleg la posa al dia
   en el mateix canvi. EspecimenCamp.jsx es va tocar (front D, la fila
   CampFitxer.nomsVisibles) després de la versió del front B, i cap prova ho
   veia: editorial.test.js només mira el format i que no vinga del futur.
   Les dates de modificació dels fitxers no servixen per a una prova (un clon o
   un canvi de branca les reescriu), però la marca escrita sí: el fitxer que
   cita una ordre del dia de la versió vigent («13-10-2026», «pla 261013_») ha
   d'estar nomenat a les notes de versió d'eixe dia. Sense la posada al dia,
   la prova troba EspecimenCamp.jsx fora de les notes i cau.
   També fixa el format de les notes: una sola «Darrera posada al dia», la
   primera, amb la data de la constant, i les «Versió anterior» amb data ISO
   de la més nova a la més vella.
   Gauntlet 261016 · Els fitxers del catàleg d'esta nit no citen «16-10-2026»
   ni «pla 261016_»: diuen «Gauntlet 261016», «del Gauntlet (261016)» i
   «Pla 261016 (Bloc…», i la guarda no els veia. Ara reconeix també «gauntlet
   aammdd» i «pla aammdd», sense distingir majúscules, amb el parèntesi
   opcional davant de la data i sense exigir el «_»: cobrix més, mai menys
   («pla 261013_» continua casant). */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { VERSIO_CATALEG } from './versio.js';

const CATALEG = path.join(process.cwd(), 'src/sections/disseny/cataleg');
const FONT = readFileSync(path.join(CATALEG, 'versio.js'), 'utf8');
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/;

/** El comentari de capçalera de versio.js, en una sola línia. */
const CAPCALERA = FONT.slice(FONT.indexOf('/**') + 3, FONT.indexOf('*/'))
  .split('\n')
  .map((linia) => linia.replace(/^\s*\*\s?/, '').trim())
  .join(' ');

/** Les notes de versió, en l'ordre del fitxer: { tipus, text, iso }. */
const NOTES = CAPCALERA.split(/(?=Darrera posada al dia:|Versió anterior:)/)
  .filter((tros) => /^(Darrera posada al dia|Versió anterior):/.test(tros))
  .map((text) => ({
    tipus: text.startsWith('Darrera') ? 'darrera' : 'anterior',
    text,
    iso: (text.match(ISO) || [null])[0]
  }));

/** Els fitxers que la regla compta: el catàleg i detalls/, sense proves ni versio.js. */
function fitxersDelCataleg() {
  return [CATALEG, path.join(CATALEG, 'detalls')].flatMap((carpeta) => readdirSync(carpeta)
    .filter((nom) => /\.jsx?$/.test(nom) && !nom.includes('.test.') && nom !== 'versio.js')
    .map((nom) => path.join(carpeta, nom)));
}

const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nomenat = (nom, text) => new RegExp(`(^|[^A-Za-z0-9_])${escapa(nom)}([^A-Za-z0-9_]|$)`).test(text);

/** Les marques d'una ordre del dia `dia` ('AAAA-MM-DD'): «dd-mm-aaaa» i, sense
 *  distingir majúscules, «pla aammdd» o «gauntlet aammdd», amb el parèntesi opcional. */
function marquesDelDia(dia) {
  const [any, mes, diaDelMes] = dia.split('-');
  const aammdd = `${any.slice(2)}${mes}${diaDelMes}`;
  return [
    new RegExp(escapa(`${diaDelMes}-${mes}-${any}`)),
    new RegExp(`(^|[^A-Za-z0-9_])(pla|gauntlet)\\s*\\(?${aammdd}`, 'i')
  ];
}
const citaElDia = (codi, dia) => marquesDelDia(dia).some((marca) => marca.test(codi));

describe('les notes de versió de versio.js', () => {
  test('una sola «Darrera posada al dia», la primera nota, amb la data i l’hora de VERSIO_CATALEG', () => {
    expect(NOTES.filter((n) => n.tipus === 'darrera')).toHaveLength(1);
    expect(NOTES[0].tipus).toBe('darrera');
    expect(NOTES[0].iso).toBe(VERSIO_CATALEG);
  });

  test('les notes amb data ISO van de la més nova a la més vella: la vigent és la més nova', () => {
    const dates = NOTES.map((n) => n.iso).filter(Boolean);
    expect(dates.length).toBeGreaterThan(2);
    for (let i = 1; i < dates.length; i += 1) {
      expect(Date.parse(dates[i]), `${dates[i]} darrere de ${dates[i - 1]}`).toBeLessThan(Date.parse(dates[i - 1]));
    }
  });
});

describe('la versió arreplega el que s’ha tocat el seu dia', () => {
  /* Gauntlet 261016 · Les formes que la guarda reconeix, les d'abans i les d'esta nit, i les que no. */
  test.each([
    ['ordre del Mestre del 16-10-2026', true],
    ['(pla 261016_0015, Bloc 1)', true],
    ['Gauntlet 261016 (Bloc 1, Llei del Quadrat)', true],
    ['Bloc 3.4 del Gauntlet (261016) · Cap editor', true],
    ['/* Pla 261016 (Bloc 3.1; ordre del Mestre)', true],
    ['GAUNTLET 261016', true],
    ['Gauntlet 261015 (Bloc 1)', false],
    ['pla 261013_1405', false],
    ['la plantilla 261016', false],
    ['Templa 261016', false]
  ])('el 2026-10-16, «%s» cita el dia: %s', (codi, cita) => {
    expect(citaElDia(codi, '2026-10-16')).toBe(cita);
  });

  test('cada fitxer del catàleg que cita una ordre del dia de la versió vigent és nomenat a les notes d’eixe dia', () => {
    const dia = VERSIO_CATALEG.slice(0, 10);
    const notesDelDia = NOTES.filter((n) => n.iso && n.iso.slice(0, 10) === dia).map((n) => n.text).join(' ');
    expect(notesDelDia).not.toBe('');
    const citen = fitxersDelCataleg()
      .filter((fitxer) => citaElDia(readFileSync(fitxer, 'utf8'), dia))
      .map((fitxer) => path.basename(fitxer));
    expect(citen.length).toBeGreaterThan(0);
    expect(citen.filter((nom) => !nomenat(nom, notesDelDia))).toEqual([]);
  });
});
