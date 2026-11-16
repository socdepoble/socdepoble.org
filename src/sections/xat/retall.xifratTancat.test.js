/* Onada R30 · R29-E2EE-02 (retall cap al Bloc de Notes; kit Gemini lot_01, arbitrat per Claude) · Un
   missatge xifrat que este dispositiu no ha pogut obrir, triat per a una nota: es conserva al seu lloc,
   marcat en cursiva amb el text serè de la bombolla segons la causa (conversa.js, textXifratTancat), i mai
   com a paraules de l'autor, ni buit, ni amb el codi tècnic. El recompte de la capçalera és el de la tria. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';
import { mapejaMissatge } from './missatges.js';
import { construeixRetall } from './retall.js';

const TANCAT = Object.freeze({
  ca: 'Missatge xifrat d’extrem a extrem en un altre dispositiu',
  es: 'Mensaje cifrado de extremo a extremo en otro dispositivo',
  en: 'End-to-end encrypted message on another device',
  eu: 'Beste gailu batean muturretik muturrera zifratutako mezua',
  gl: 'Mensaxe cifrada de extremo a extremo noutro dispositivo'
});
const NO_OBERT = Object.freeze({
  ca: 'No s’ha pogut obrir este missatge xifrat',
  es: 'No se ha podido abrir este mensaje cifrado',
  en: 'This encrypted message could not be opened',
  eu: 'Ezin izan da zifratutako mezu hau ireki',
  gl: 'Non se puido abrir esta mensaxe cifrada'
});

const FIL = Object.freeze({ id: 'f-1', name: 'Pepa' });

/** Una bombolla tal com ix de mapejaMissatge (el pipeline tanca el xifrat amb `text: null`). */
const bombolla = (id, seq, extra = {}) => mapejaMissatge({
  id, filId: 'f-1', usuariId: 'pepa', autorNom: 'Pepa', seq, text: null, creatAl: '2026-11-15T10:30:00.000Z', ...extra
}, 'jo');
const tancat = (codi, extra = {}) => bombolla(`m-${codi}`, 7, { seguretat: { xifrat: true, verificat: false, codi }, ...extra });

/** Les cites de la nota, llegides com les llegiria l'editor: el text de cada una i el de la seua cursiva. */
function cites(content) {
  const doc = new DOMParser().parseFromString(`<body>${content}</body>`, 'text/html');
  return [...doc.querySelectorAll('blockquote')].map((cita) => {
    const p = cita.querySelector('p');
    const signatura = p.querySelector('strong')?.textContent ?? '';
    const marca = [...p.querySelectorAll('em')].map((em) => em.textContent);
    const cos = p.textContent.slice(signatura.length);
    return { signatura, marca, cos };
  });
}

describe('R29-E2EE-02 · retall · un xifrat tancat dins de la tria', () => {
  test.each(Object.keys(TANCAT))('%s · marcat amb el text serè de la seua causa, sense codi ni cap resta de text', (llengua) => {
    const t = createTranslator(llengua);
    for (const [codi, textos] of [['sense-context', TANCAT], ['epoca-desconeguda', TANCAT], ['xifrat-manipulat', NO_OBERT], ['clau-nova-sense-confirmar', NO_OBERT]]) {
      /* Un text que no ha verificat el pipeline no ix mai, encara que la bombolla en portara cap. */
      const { content } = construeixRetall({ fil: FIL, missatges: [tancat(codi, { text: 'resta-que-no-ha-d-eixir' })], locale: 'ca-ES', t });
      const [cita] = cites(content);
      expect([codi, cita.marca, cita.cos]).toEqual([codi, [textos[llengua]], textos[llengua]]);
      expect(cita.signatura.startsWith('Pepa · ')).toBe(true);
      expect(content).not.toContain(codi);
      expect(content).not.toContain('resta-que-no-ha-d-eixir');
    }
  });

  test('es conserva al seu lloc: el recompte és el de la tria i els oberts diuen el seu text, sense cursiva', () => {
    const missatges = [
      bombolla('m-1', 5, { text: 'Bon dia, Pepa' }),
      tancat('sense-context'),
      bombolla('m-3', 9, { text: 'A les huit al forn', seguretat: { xifrat: true, verificat: true } })
    ];
    const { content } = construeixRetall({ fil: FIL, missatges, locale: 'ca-ES', t: createTranslator('ca') });
    expect(content).toContain('Pepa · 3 missatges · ');
    expect(cites(content).map(({ marca, cos }) => [marca, cos])).toEqual([
      [[], 'Bon dia, Pepa'],
      [[TANCAT.ca], TANCAT.ca],
      [[], 'A les huit al forn']
    ]);
  });

  test('sense traductor, la reserva valenciana; un esborrat mana, com a la bombolla, i sense seguretat res no canvia', () => {
    expect(cites(construeixRetall({ fil: FIL, missatges: [tancat('xifrat-manipulat')] }).content)[0].marca).toEqual([NO_OBERT.ca]);
    expect(cites(construeixRetall({ fil: FIL, missatges: [tancat('sense-context', { esborratAl: '2026-11-15T11:00:00.000Z' })] }).content)[0].marca).toEqual([]);
    const clar = cites(construeixRetall({ fil: FIL, missatges: [bombolla('m-c', 4, { text: 'Sense xifrar\ni dues línies' })] }).content);
    expect([clar[0].marca, clar[0].cos]).toEqual([[], 'Sense xifrari dues línies']);
  });

  test('el text serè també passa per l’escapament: cap traducció no pot injectar HTML a la nota', () => {
    const t = () => '<img src=x onerror=alert(1)>';
    const { content } = construeixRetall({ fil: FIL, missatges: [tancat('sense-context')], t });
    expect(content).not.toContain('<img');
    expect(cites(content)[0].marca).toEqual(['<img src=x onerror=alert(1)>']);
  });

  test('el Xat li passa el traductor al retall de la tria', () => {
    const font = readFileSync(path.resolve(process.cwd(), 'src/sections/xat/XatSection.jsx'), 'utf8');
    expect(font).toContain('construeixRetall({ fil: activeThread, missatges: triats, locale, t })');
  });
});
