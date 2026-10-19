import { describe, expect, test } from 'vitest';
import { ICONES_APARTATS, itemsDePerfil } from './perfilModel.js';
import { defecteSafari16 } from '../disseny/cataleg/guardaEmojisSafari16.js';
import { emojiSol } from '../../utils/emoji.js';

/* Pla 261015_1900 (Onada 1.3: «emoticones grans i riques als apartats») ·
   Els apartats de la segona columna del Perfil porten un emoji, com la Wiki
   (iconesWiki.test.js) i Disseny (manifest.icones.test.js), amb la mateixa
   guarda: RGI complet (U+FE0F inclòs), sense ZWJ, Unicode 13 o anterior i cap
   bandera (Baseline 2022, Safari 16). */
describe('Pla 261015 · les icones dels apartats del Perfil', () => {
  test('👁️ Les vistes, 🔐 El compte, 🛡️ Privacitat i dades, 🌐 Els nodes i 🖼️ Multimèdia, tots distints', () => {
    // Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 (🖼️ «Multimèdia», la cinquena icona).
    expect(ICONES_APARTATS).toEqual({
      vistes: '\u{1F441}\u{FE0F}', compte: '\u{1F510}', privacitat: '\u{1F6E1}\u{FE0F}', nodes: '\u{1F310}', multimedia: '\u{1F5BC}\u{FE0F}',
    });
    expect(new Set(Object.values(ICONES_APARTATS)).size).toBe(5);
    expect(Object.isFrozen(ICONES_APARTATS)).toBe(true);
  });

  test.each(Object.entries(ICONES_APARTATS))('%s: un sol emoji que es veu a Safari 16', (_, glif) => {
    expect(defecteSafari16(glif)).toBeNull();
    // emojiSol és el que fa que ItemMedia el pinte XL (sdp-fitxa-emoji-xl).
    expect(emojiSol(glif)).toBe(glif);
  });

  test('itemsDePerfil els posa a `icon` (mai al títol); «La fitxa» es queda amb la icona de la identitat', () => {
    const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: {} };
    const items = Object.fromEntries(itemsDePerfil([jo], { ambPrivacitat: true }).map((item) => [item.id, item]));
    expect(items['jo-vistes']).toMatchObject({ title: 'Les vistes', icon: ICONES_APARTATS.vistes });
    expect(items['jo-compte']).toMatchObject({ title: 'El compte', icon: ICONES_APARTATS.compte });
    expect(items['jo-privacitat']).toMatchObject({ title: 'Privacitat i dades', icon: ICONES_APARTATS.privacitat });
    expect(items['jo-nodes']).toMatchObject({ title: 'Els nodes', icon: ICONES_APARTATS.nodes });
    expect(items['jo-multimedia']).toMatchObject({ title: 'Multimèdia', icon: ICONES_APARTATS.multimedia });
    expect(typeof items['jo-fitxa'].icon).not.toBe('string');
  });

  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · 🖼️ «Multimèdia»
     també a l'organització que la persona pot editar i a l'agent IA. */
  test('🖼️ «Multimèdia» d’una organització i d’un agent IA porta la mateixa icona', () => {
    const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner' } };
    const agent = { id: 'A', mena: 'agent', nom: 'IAIA', dades: {} };
    const items = Object.fromEntries(itemsDePerfil([forn, agent]).map((item) => [item.id, item]));
    expect(items['O-multimedia']).toMatchObject({ title: 'Multimèdia', icon: ICONES_APARTATS.multimedia });
    expect(items['A-multimedia']).toMatchObject({ title: 'Multimèdia', icon: ICONES_APARTATS.multimedia });
  });
});
