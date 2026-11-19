// @vitest-environment node
/* Notícies del Poble · IDEA-265 (261118) · la carpeta «Observatori I+D · Mestres» amb el client de
   notícies de veres (el que dona fontServeis.js en producció), sense xarxa: el client només demana
   els ids del seu catàleg i rebutja la resta abans d'eixir. Mentre el seu catàleg no declara la
   font de l'observatori, ni un superadmin veu la carpeta, ni se'n fa cap petició, ni ix cap font
   caiguda per ella. Ací i no al Lector, perquè el Lector no pot importar data/adaptadors. */
import { describe, expect, test, vi } from 'vitest';
import { creaServeiNoticies } from '../../data/adaptadors/noticies/client.js';
import { creaAdaptadorRemot } from '../lector/fontRemota.js';
import { CARPETA_OBSERVATORI, FONT_OBSERVATORI } from '../lector/observatori.js';

describe('l’observatori amb el client de notícies de veres', () => {
  test('superadmin: sense carpeta, sense petició i sense caiguda falsa', async () => {
    const adreces = [];
    const fetchImpl = vi.fn(async (url) => {
      adreces.push(String(url));
      throw new TypeError('sense xarxa a la prova');
    });
    const servei = creaServeiNoticies({ apiOrigin: 'https://api.example.org', fetchImpl, enLinia: () => true });
    const adaptador = creaAdaptadorRemot({ servei, observatori: () => true });
    const { categories, fonts } = await adaptador.llistaFonts();
    expect(categories.some((categoria) => categoria.id === CARPETA_OBSERVATORI)).toBe(false);
    expect(fonts.some((font) => font.id === FONT_OBSERVATORI)).toBe(false);
    await adaptador.llistaArticles();
    expect((await adaptador.salut()).caigudes.some((caiguda) => caiguda.fontId === FONT_OBSERVATORI)).toBe(false);
    expect(adreces.some((adreca) => adreca.includes(FONT_OBSERVATORI))).toBe(false);
    /* El motiu: el client rebutja l'id abans d'eixir a la xarxa. */
    await expect(servei.feed(FONT_OBSERVATORI)).rejects.toMatchObject({ motiu: 'font' });
  });
});
