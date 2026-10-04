import { describe, expect, test } from 'vitest';
import {
  IDS_PAGINES, XIFRES_DE_LES_MESURES, XIFRES_DELS_ESTATS, estatsPagina, mesuresPagina
} from './consolaPagines.js';
import { IDS_PANELLS, XIFRES_DELS_PANELLS, cobertesPols } from './polsConsola.js';
import { targetesDeLaConsola } from './xifresMas.js';

/* Correcció 261004 (verificador de la tercera passada, punt 5) · Ordre del
   Mestre, 261004 (xat: cap xifra solta): tota xifra destacada és una
   targeta amb pàgina pròpia. Les mètriques (h5) i els estats de la coberta de
   cada pàgina del tauler, i les mètriques de la coberta de cada panell del
   pols, resumixen una xifra: cada una nomena la seua targeta
   (XIFRES_DE_LES_MESURES, XIFRES_DELS_ESTATS, XIFRES_DELS_PANELLS), eixa
   targeta existix amb les fonts d'ara i porta el mateix número al títol o al
   subtítol. Una mètrica o un estat nou sense targeta fa roja esta prova. Els
   recomptes són diferents a posta: un número que coincidira per atzar no
   tapa una targeta absent. */

const aresta = (de, cap, tipus, confianca = 'declarat') => ({ de, a: cap, tipus, confianca, evidencia: null });
const avis = (node, codi, severitat) => ({ node, codi, severitat, evidencia: 'x' });
const skill = (nom) => ({ id: `skill:${nom}`, tipus: 'skill', font: null, atributs: {} });
const launchd = (id, estat, cadencia) => ({ id, estat, llancador: { tipus: 'launchd', etiqueta: id }, cadencia, script: null, font: null });

/* Un Mas on cada mètrica i cada estat de les cobertes té alguna cosa a dir. */
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-10-04T08:00:00.000Z', tall: null,
  nodes: [
    ...['a', 'b', 'c', 'd', 'e', 'f'].map(skill),
    { id: 'ruta:acta', tipus: 'ruta', font: '.agents/protocolledge.json', atributs: { tipus_document: 'acta' } },
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'agent:codex', tipus: 'agent', font: null, atributs: { arnes: 'Codex' } },
    { id: 'hook:claude:PreToolUse', tipus: 'hook', font: null, atributs: { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true } },
    { id: 'hook:claude:Stop', tipus: 'hook', font: null, atributs: { arnes: 'Claude Code', esdeveniment: 'Stop', consumidor_acreditat: false } },
    { id: 'hook:codex:PreToolUse', tipus: 'hook', font: null, atributs: { arnes: 'Codex', esdeveniment: 'PreToolUse' } },
    { id: 'script:tooling/s1.mjs', tipus: 'script', font: null, atributs: {} },
    { id: 'script:tooling/s2.mjs', tipus: 'script', font: null, atributs: {} },
    { id: 'document:CLAUDE.md', tipus: 'document', font: null, atributs: {} },
    { id: 'document:x.md', tipus: 'document', font: null, atributs: {} },
    { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} }
  ],
  arestes: [
    aresta('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
    aresta('agent:claude-code', 'hook:claude:Stop', 'dispara'),
    aresta('agent:codex', 'hook:codex:PreToolUse', 'dispara'),
    aresta('hook:claude:PreToolUse', 'script:tooling/s1.mjs', 'dispara', 'derivat'),
    aresta('agent:claude-code', 'document:CLAUDE.md', 'carrega'),
    aresta('document:CLAUDE.md', 'skill:a', 'carrega'),
    aresta('skill:a', 'document:CLAUDE.md', 'llig'),
    aresta('ruta:acta', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    aresta('agent:codex', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    aresta('skill:a', 'skill:b', 'crida', 'inferit'),
    aresta('skill:d', 'skill:e', 'llig', 'inferit')
  ],
  tasques: [
    launchd('plaquetes', 'viu', { cada_segons: 3600 }),
    launchd('setmanal', 'mort', { cron: '0 3 * * 1' }),
    launchd('mensual', 'mort', { cron: '0 3 1 * *' }),
    launchd('nova', 'llancador-sense-declaracio', { cada_segons: 60 }),
    { id: 'pre-commit', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: 'x.mjs', font: null },
    { id: 'higiene', estat: 'declarat-sense-llancador', llancador: null, cadencia: null, script: null, font: null }
  ],
  avisos: [
    avis('skill:a', 'pes', 'baixa'), avis('skill:a', 'fora-index', 'mitjana'), avis('skill:a', 'disparador-decoratiu', 'mitjana'),
    avis('skill:b', 'orfe', 'mitjana'), avis('skill:e', 'orfe', 'mitjana'),
    avis('skill:f', 'orfe', 'mitjana'), avis('skill:f', 'disparador-decoratiu', 'mitjana'),
    avis('skill:c', 'skill-fantasma', 'alta'), avis('skill:d', 'crida-inexistent', 'mitjana'),
    avis('script:tooling/s1.mjs', 'script-absent', 'alta'), avis('script:tooling/s2.mjs', 'script-absent', 'alta'),
    avis('document:CLAUDE.md', 'font-absent', 'alta'), avis('document:x.md', 'fitxer-absent', 'alta')
  ],
  salut: [
    { metrica: 'vigilants-vius', valor: 0.333, unitat: 'fraccio', numerador: 1, denominador: 3, font: 'x', prova: 'p' },
    { metrica: 'ledger-fossils', valor: 8, unitat: 'segells fòssils', numerador: null, denominador: null, font: 'x', prova: 'p' },
    { metrica: 'integritat-contingut', valor: 'N/A', unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: null }
  ]
};

const ARA = Date.now();
const DIA = 24 * 60 * 60 * 1000;
const CONSOLA = {
  generat: new Date(ARA).toISOString(),
  consums: [{ agent: 'claude', entrada: 10, eixida: 5 }, { agent: 'codex', entrada: 1, eixida: 1 }],
  rebuts: [{ t: new Date(ARA - 10 * DIA).toISOString(), peticio: 'p', protocols: ['a/b.md'], fonts: [{ ruta: 'x', sha256: 'y' }] }],
  credits: [{ proveidor: 'Claude', consumit: 6, limit: 100, tipus: 'quota' }, { proveidor: 'Codex', valor: 'DESACTIVADA', tipus: 'ajust', actiu: false },
    { proveidor: 'Gemini', consumit: 1, limit: 8, tipus: 'quota' }],
  skills: [
    { nom: 'a', estat: 'canonic', descripcio: '', core: true, alDisc: true, alManifest: true },
    { nom: 'nova', estat: null, descripcio: '', core: false, alDisc: true, alManifest: false },
    { nom: 'altra', estat: null, descripcio: '', core: false, alDisc: true, alManifest: false },
    { nom: 'perduda', estat: null, descripcio: '', core: false, alDisc: false, alManifest: true }
  ],
  segell: { hash: 'abcdef0123456789', timestamp: '2026-10-02T07:01:17.116Z', filesCount: 2, manifest: {} },
  immunitari: { operacions: 3, ultima: null },
  fonts: { diari: { estat: 'ok', 'línies_descartades': 0 }, immunitari: { estat: 'ok', 'línies_descartades': 0 } },
  termometria: { artefactesActius: 162, abast: 'Escriptori' }
};
const FONTS = { mapa: MAPA, estatMapa: 'ready', dades: CONSOLA, estatDades: 'ready' };
const TARGETES = targetesDeLaConsola(MAPA, CONSOLA);

/* El número (sencer) és al títol o al subtítol de la targeta. */
const porta = (xifra, n) => new RegExp(`(?:^|\\D)${n}(?!\\d)`).test(`${xifra.titol} · ${xifra.subtitol}`);
const numeros = (text) => String(text).match(/\d+/g) ?? [];

function comprova(text, slugs, on) {
  const xifres = slugs.map((slug) => TARGETES.get(slug));
  for (const [i, x] of xifres.entries()) expect(x, `${on} · «${text}»: falta la targeta ${slugs[i]}`).toBeTruthy();
  for (const n of numeros(text)) {
    expect(xifres.some((x) => porta(x, n)), `${on} · «${text}»: cap targeta (${slugs.join(', ')}) diu ${n}`).toBe(true);
  }
}

describe('cap xifra destacada sense targeta', () => {
  test.each(IDS_PAGINES)('la coberta de «%s»: cada mètrica té la seua targeta, amb el mateix número', (id) => {
    const mesures = mesuresPagina(id, FONTS);
    expect(XIFRES_DE_LES_MESURES[id], id).toHaveLength(mesures.length);
    mesures.forEach((m, i) => comprova(m, XIFRES_DE_LES_MESURES[id][i], id));
  });

  test.each(IDS_PAGINES)('la coberta de «%s»: cada estat té la seua targeta, i la prova els exercita tots', (id) => {
    const estats = estatsPagina(id, FONTS, ARA);
    const mapa = XIFRES_DELS_ESTATS[id] ?? {};
    // El Mas de la prova fa saltar tots els estats que el registre nomena, i cap més.
    expect(estats.map((e) => e.clau).sort(), id).toEqual(Object.keys(mapa).sort());
    for (const e of estats) comprova(e.text, [mapa[e.clau]], `${id} · ${e.clau}`);
  });

  /* Un Mas tranquil: cap tasca morta, cap avís, cap candat ni lloc. Les
     mètriques de coberta diuen zeros, que són mesures, i el zero també ha de
     ser a la seua targeta (amb les dades reals, «0 mortes» del Calendari no
     hi era). */
  test.each(IDS_PAGINES)('amb un Mas tranquil, la coberta de «%s» també: cada zero és a la seua targeta', (id) => {
    const tranquil = { ...MAPA, tasques: [MAPA.tasques[0]], avisos: [], arestes: [], salut: [] };
    const totes = targetesDeLaConsola(tranquil, CONSOLA);
    const mesures = mesuresPagina(id, { ...FONTS, mapa: tranquil });
    mesures.forEach((m, i) => {
      const xifres = XIFRES_DE_LES_MESURES[id][i].map((slug) => totes.get(slug));
      for (const x of xifres) expect(x, `${id} · «${m}»`).toBeTruthy();
      for (const n of numeros(m)) expect(xifres.some((x) => porta(x, n)), `${id} · «${m}»: ${n}`).toBe(true);
    });
  });

  test.each(IDS_PANELLS)('la coberta del panell «%s» del pols: cada mètrica té la seua targeta', (id) => {
    const { metriques } = cobertesPols(CONSOLA, 'ready')[id];
    expect(metriques, id).not.toBeNull();
    expect(XIFRES_DELS_PANELLS[id], id).toHaveLength(metriques.length);
    metriques.forEach((m, i) => comprova(m, XIFRES_DELS_PANELLS[id][i], `pols/${id}`));
  });

  test('els recomptes nous diuen el que compten', () => {
    const titol = (slug) => [TARGETES.get(slug).titol, TARGETES.get(slug).subtitol];
    expect(titol('enllacos-trencats')).toEqual(['9 enllaços trencats o peces òrfenes',
      '2 scripts absents · 1 font absent · 1 fitxer absent · 1 skill fantasma · 1 crida a una skill inexistent · 3 peces òrfenes']);
    expect(titol('skills-sense-disparador')).toEqual(['2 skills sense disparador útil', 'El router no les pot triar soles']);
    expect(titol('skills-amb-avisos')).toEqual(['6 skills amb avisos', '1 en roig · 5 en ambre a l’Inventari']);
    expect(titol('rutes-documentals')).toEqual(['1 ruta documental', 'Cada tipus de document, amb la seua plantilla']);
    expect(titol('agents-atomics')).toEqual(['1 agent atòmic', 'Agents que declaren què lligen o què deixen']);
    expect(titol('candats')).toEqual(['4 candats', '1 acreditat · 1 sense consumidor · 2 per acreditar']);
    expect(titol('llocs-del-sol')).toEqual(['2 llocs del sòl', 'Documents i plantilles on treballen · 1 sense lector']);
    expect(titol('proveidors-de-credits')).toEqual(['3 proveïdors de crèdits', '2 quotes · 1 ajust']);
    expect(titol('coses-que-corren-soles')).toEqual(['4 coses que corren soles', 'Tasques que llança launchd · 1 viva · 2 mortes']);
    expect(titol('arestes')[1]).toBe('8 declarades · 1 derivada · 2 inferides de la prosa');
    // «de» s'apostrofa davant d'un 8: el saldo de Gemini.
    expect(TARGETES.get('credit-gemini').subtitol).toBe('Consumit: 1 d’8');
  });
});
