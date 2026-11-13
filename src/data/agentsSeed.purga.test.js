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
import { AGENTS, AGENTS_MAP, tipusDAgent, DATA_CATALEG_FUNDACIONAL } from './agentsSeed.js';
import { AGENTS_CANONICS, IDS_FICCIO_LEGACY, hidrataCatalegAgents, MAXIM_AGENTS_CATALEG, MAXIM_BYTES_CATALEG } from './catalegAgents.js';
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

test('R21.5 technical creation date, canonical town/bio/name and cleaned IAIA reach the generated seed exactly', () => {
  expect(DATA_CATALEG_FUNDACIONAL).toBe('2026-09-08T00:00:00.000Z');
  expect(AGENTS.every(agent => agent.created_at === DATA_CATALEG_FUNDACIONAL && agent.town_name === 'La Torre de les Maçanes')).toBe(true);
  expect(Object.values(AGENTS_MAP).every(agent => agent.created_at === DATA_CATALEG_FUNDACIONAL)).toBe(true);
  const agentsSembrats = filaDelSeedSql('agents').map(agent => {
    const canonical = { ...agent };
    delete canonical.sectionId;
    delete canonical.searchText;
    return canonical;
  });
  expect(agentsSembrats).toEqual(AGENTS_CANONICS);
  expect(AGENTS_MAP.IAIA.systemPrompt).not.toMatch(/L'Ull|El Rebost|Jutjat de Trellat|Archon|clic clic/);
  expect(AGENTS_MAP.IAIA).not.toHaveProperty('public_album');
  expect(AGENTS_MAP.IAIA).not.toHaveProperty('private_album');
});

test('R21.5 canonical replacement is by ID, collapses stale canonical duplicates and never keeps their unknown private fields', () => {
  const output = hidrataCatalegAgents([
    { id: ENTITAT, name: { invalid: true }, town_name: 'Sóc de Poble', private_album: ['stale'] },
    { id: ENTITAT, name: 'Duplicate' }, { id: IAIA, name: 'Cocinera de Rebost', type: 'ANIMAL' }
  ]);
  expect(output).toEqual(AGENTS_CANONICS);
  expect(output[0]).not.toBe(AGENTS_CANONICS[0]);
});

test('R21.5 exact historical IDs and AI/ANIMAL are removed while additional real people/entities and duplicate rows survive', () => {
  const real = [
    { id: 'person-andreu', name: 'Andreu Soler', type: 'PERSON', custom: { keep: true } },
    { id: 'person-vicent', name: 'Vicent Ferris', type: 'person', personaKey: 'AGRONOM' },
    { id: 'person-pepica', name: 'Pepica la Vall', type: 'PERSON' },
    { id: 'extra-company', name: 'Empresa real', type: 'COMPANY' },
    { id: 'extra-system', name: 'Registre propi', type: 'SYSTEM' }
  ];
  const legacy = IDS_FICCIO_LEGACY.map(id => ({ id, name: 'legacy', type: 'PERSON' }));
  const input = [...legacy, { id: 'other-bot', name: 'Nano Banana', type: ' aI ' }, { id: 'other-animal', name: 'Gall', type: 'ANIMAL' }, ...real, real[0]];
  const snapshot = structuredClone(input);
  expect(hidrataCatalegAgents(input)).toEqual([...AGENTS_CANONICS, ...real, real[0]]);
  expect(input).toEqual(snapshot);
});

test('R21.5 malformed and oversized catalogues fail safely for display without converting hostile JSON into text', () => {
  for (const payload of [null, {}, 'bad', Array(MAXIM_AGENTS_CATALEG + 1).fill(null), [{ id: 'large', name: 'x'.repeat(MAXIM_BYTES_CATALEG) }]]) {
    expect(hidrataCatalegAgents(payload)).toEqual(AGENTS_CANONICS);
  }
  expect(hidrataCatalegAgents([
    null, [], 2, { id: 'name-object', name: { toString: 0 } },
    { id: 'type-object', name: 'bad', type: {} }, { id: 'town-object', name: 'bad', town_name: [] }
  ])).toEqual(AGENTS_CANONICS);
});

test('R21.5 UUID comparison handles casing/whitespace without normalizing real extra identities; type trim includes NBSP', () => {
  const real = { id: ' UNKNOWN-SLUG ', name: 'Andreu real', type: 'PERSON' };
  expect(hidrataCatalegAgents([
    { id: ` ${IDS_FICCIO_LEGACY[0].toUpperCase()} `, name: 'stale', type: 'PERSON' },
    { id: `\u00a0${IAIA.toUpperCase()}\u00a0`, name: 'old IAIA', type: 'PERSON' },
    { id: 'unknown-bot-nbsp', name: 'stale', type: '\u00a0aI\u00a0' }, real
  ])).toEqual([...AGENTS_CANONICS, real]);
});
