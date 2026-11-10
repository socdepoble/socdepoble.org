// @vitest-environment node
/**
 * Gauntlet 261016 (Bloc 3; ordre del Mestre: cap semblança amb personatges
 * protegits per drets de tercers) · Cap text del catàleg d'agents nomena una
 * sèrie, una agència de ficció o un estudi d'animació de tercers. Els noms
 * vetats es componen a trossos perquè les portes que llegixen src/ no els
 * troben ací.
 * P0-72 / IDEA-203 · Fora la prova del systemPrompt de Nano Banana: el
 * personatge ja no és al catàleg (agentsSeed.purga.test.js). L'escaneig de
 * tots els camps de text de cada agent es queda sencer.
 */
import { expect, test } from 'vitest';
import { AGENTS_MAP } from './agentsSeed.js';

const VETATS = [['Morta', 'delo'], ['Filem', 'ón'], ['T.I', '.A.'], ['Pix', 'ar']].map((trossos) => trossos.join(''));
const textosDe = (agent) => Object.values(agent).filter((valor) => typeof valor === 'string');

test('cap text del catàleg d’agents nomena personatges, títols ni marques de tercers', () => {
  for (const [clau, agent] of Object.entries(AGENTS_MAP)) {
    for (const text of textosDe(agent)) {
      for (const vetat of VETATS) expect([clau, vetat, text.includes(vetat)]).toEqual([clau, vetat, false]);
    }
  }
});
