// @vitest-environment node
/**
 * P0-72 / IDEA-203 (ordre del Mestre, 09-11-2026: «només la IAIA MarIA com a
 * IA») · El catàleg d'agents del paquet porta les tres identitats del Mestre
 * i cap bot: l'entitat, la persona pilot i la IAIA, l'única IA del Mas. Les
 * mateixes tres fitxes són la fila `agents` d'app_content que sembra
 * supabase/seed.sql (generat per scripts/generate-supabase-seed.mjs des
 * d'appSeed.js · APP_CONTENT_ROWS): si algú toca el catàleg i no regenera el
 * seed.sql, el directori remot continua pintant els bots i esta prova ho diu.
 * Del seed.sql només es comparen els ids i el tipus de cada fitxa: el
 * repositori no el compara byte a byte amb la llavor, i un retoc d'un lema o
 * d'una bio no ha de bloquejar el commit (R16a).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { AGENTS, AGENTS_MAP, tipusDAgent } from './agentsSeed.js';
import { APP_CONTENT_ROWS } from './appSeed.js';
import { AGENTS_IA_SEED } from './identitatsSeed.js';

/* Els ids de sempre de les tres identitats, escrits a mà: la purga no esborra
   ni reanomena cap persona real ni cap entitat. */
const ENTITAT = 'socdepoble';
const PERSONA_PILOT = '0001';
const IAIA = '11111111-1a1a-0000-0000-000000000000';

/* Cada fila d'app_content: ('tenant', 'clau', '<json amb les cometes doblades>'::jsonb, versio). */
const FILA = /\('[^']*', '([A-Za-z]+)', '((?:[^']|'')*)'::jsonb/g;
const filaDelSeedSql = (clau) => {
  const sql = readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');
  for (const [, nom, json] of sql.matchAll(FILA)) if (nom === clau) return JSON.parse(json.replace(/''/g, "'"));
  return null;
};

test('el catàleg porta l’entitat, la persona pilot i la IAIA, i cap més', () => {
  expect(Object.entries(AGENTS_MAP).map(([clau, agent]) => [clau, agent.id, tipusDAgent(agent)])).toEqual([
    ['SOCDEPOBLE', ENTITAT, 'entitat'],
    ['JAVI', PERSONA_PILOT, 'persona'],
    ['IAIA', IAIA, 'ia']
  ]);
  expect(AGENTS.map((agent) => agent.id)).toEqual([ENTITAT, PERSONA_PILOT, IAIA]);
  /* L'única IA, també al padró d'IA del paquet. */
  expect(AGENTS.filter((agent) => tipusDAgent(agent) === 'ia').map((agent) => agent.name)).toEqual(['IAIA MarIA']);
  expect(AGENTS_IA_SEED.map((agent) => agent.id)).toEqual([IAIA]);
});

test('la fila agents d’app_content i la del seed.sql porten les mateixes fitxes (ids i tipus)', () => {
  const llavor = APP_CONTENT_ROWS.find(({ key }) => key === 'agents').payload;
  expect(llavor.map((agent) => agent.id)).toEqual(AGENTS.map((agent) => agent.id));
  const fitxes = (fila) => fila.map((agent) => [agent.id, tipusDAgent(agent)]);
  expect(fitxes(filaDelSeedSql('agents'))).toEqual(fitxes(llavor));
});
