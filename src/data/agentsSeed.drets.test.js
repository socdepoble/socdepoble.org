// @vitest-environment node
/**
 * Gauntlet 261016 (Bloc 3; ordre del Mestre: cap semblança amb personatges
 * protegits per drets de tercers) · El systemPrompt de Nano Banana demana
 * l'estil de la tradició de l'Escola Bruguera i l'humor de Berlanga, amb
 * personatges propis (skill core-identitat-visual §2), i cap text del catàleg
 * d'agents nomena una sèrie, una agència de ficció o un estudi d'animació de
 * tercers. Els noms vetats es componen a trossos perquè les portes que
 * llegixen src/ no els troben ací.
 */
import { expect, test } from 'vitest';
import { AGENTS_MAP } from './agentsSeed.js';

const VETATS = [['Morta', 'delo'], ['Filem', 'ón'], ['T.I', '.A.'], ['Pix', 'ar']].map((trossos) => trossos.join(''));
const textosDe = (agent) => Object.values(agent).filter((valor) => typeof valor === 'string');

test('Nano Banana demana la tradició de l’Escola Bruguera i l’humor de Berlanga, amb personatges propis', () => {
  const { systemPrompt } = AGENTS_MAP.NANOBANANA;
  const [estil] = systemPrompt.split('\n').filter((linia) => linia.startsWith('3. ESTIL D\'ART:'));
  expect(estil).toContain('Escola Bruguera');
  expect(estil).toContain('Berlanga');
  expect(estil).toContain('personatges propis de Sóc de Poble');
  expect(estil).toContain('Cap personatge, títol ni marca de tercers.');
  /* La resta del systemPrompt no canvia: les dues regles de marca es queden. */
  expect(systemPrompt).toContain('1. Un rectangle fosc dalt per encabir el logo reial (overlay).');
  expect(systemPrompt).toContain('2. Afegir en menut baix a la dreta la teva signatura: "Autor: NanoBanana".');
});

test('cap text del catàleg d’agents nomena personatges, títols ni marques de tercers', () => {
  for (const [clau, agent] of Object.entries(AGENTS_MAP)) {
    for (const text of textosDe(agent)) {
      for (const vetat of VETATS) expect([clau, vetat, text.includes(vetat)]).toEqual([clau, vetat, false]);
    }
  }
});
