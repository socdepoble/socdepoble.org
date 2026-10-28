import { afterEach, describe, expect, test, vi } from 'vitest';

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · El «Diagnòstic
   del Mas» és dada abans que vista: el text del <pre> ix de les mateixes
   funcions pures que pinten les targetes (paritat), no inventa cap número,
   diu el mateix amb les mateixes fonts i el mateix rellotge, porta tots els
   problemes sense retallar i, amb el mode privacitat, amaga el que amaguen
   les targetes (rutes i evidències), ni més ni menys. */
import {
  ETIQUETA_ACCES, ETIQUETA_VERSIO, MASCARA, SENSE_SEMAFOR, TITOL_DIAGNOSI, accesRapid, diagnosiTextual
} from './diagnosiConsola.js';
import { VERSIO_SISTEMA, versioCanonica } from '../../config/versio.js';
import {
  IDS_PAGINES, LLINDAR_REBUTS_RANCIS_DIES, avisosDeVigilancia, copyConsola, estatsPagina, etiquetesPagina,
  paginaConsola, paginesConsola, problemesPagina, resumPagina
} from './consolaPagines.js';
import { cobertesPols, panellsPols } from './polsConsola.js';
import { MAX_PROBLEMES_TARGETA, rutaDelNode } from './problemesConsola.js';
import { xifresDeLaGraella } from './xifresMas.js';
import { TEXTOS_AVIS } from './mapa/grafMapa.js';
import { dataLocal } from './consolaContent.js';

/* El mateix Mapa i la mateixa consola.json de prova que indexConsola.test.js: pinten de tot. */
const aresta = (de, cap, tipus, confianca = 'declarat') => ({ de, a: cap, tipus, confianca, evidencia: null });
const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'agent:codex', tipus: 'agent', font: null, atributs: { arnes: 'Codex' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:core-identitat', tipus: 'skill', font: null, atributs: {} },
    { id: 'hook:claude:PreToolUse', tipus: 'hook', font: null, atributs: { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true } },
    { id: 'script:tooling/gates/hooks-local.mjs', tipus: 'script', font: null, atributs: {} },
    { id: 'document:CLAUDE.md', tipus: 'document', font: null, atributs: {} },
    { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} },
    { id: 'document:.agents/LEDGER.md', tipus: 'document', font: null, atributs: {} },
    { id: 'ruta:acta', tipus: 'ruta', font: null, atributs: {} }
  ],
  arestes: [
    aresta('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
    aresta('hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat'),
    aresta('agent:claude-code', 'document:CLAUDE.md', 'carrega'),
    aresta('document:CLAUDE.md', 'skill:sdp-workflow', 'carrega'),
    aresta('ruta:acta', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    aresta('agent:codex', 'document:_wiki_de_poble/04_escriptori', 'escriu')
  ],
  tasques: [
    { id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: 'tooling/x.mjs', font: null },
    { id: 'setmanal', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 's' }, cadencia: { cron: '0 3 * * 1' }, script: null, font: null },
    { id: 'pre-commit', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: 'x.mjs', font: null },
    { id: 'higiene', estat: 'declarat-sense-llancador', llancador: null, cadencia: null, script: null, font: null }
  ],
  avisos: [
    { node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' },
    { node: 'document:.agents/LEDGER.md', codi: 'ledger-invalid', severitat: 'alta', evidencia: 'signatura del LEDGER no vàlida · 8 segells fòssils' }
  ],
  salut: [metrica('ledger-fossils', { valor: 8, unitat: 'segells fòssils' }), metrica('ledger-mal-formades', { valor: 2, unitat: 'línies mal formades' })]
};
const CONSOLA = {
  generat: '2026-09-25T13:00:00.000Z',
  rebuts: [{ t: '2026-09-20T01:03:39.000Z', peticio: 'ced19fcaab00ffff', protocols: ['a/b.md'], fonts: [{ ruta: 'x', sha256: 'y' }] }],
  consums: [{ agent: 'claude', entrada: 10, eixida: 5 }],
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
  segell: { hash: 'abcdef0123456789', timestamp: '2026-10-02T07:01:17.116Z', filesCount: 2, manifest: { 'a/SKILL.md': '1111', 'b/SKILL.md': '2222' } },
  immunitari: { operacions: 3, ultima: { op: 'OP-3', tipus: 'ADOPTA', fitxer: 'x.md', data: '2026-08-03T13:43:04.716Z' } },
  fonts: { diari: { estat: 'ok', 'línies_descartades': 1 }, immunitari: { estat: 'ok', 'línies_descartades': 0 } },
  termometria: { artefactesActius: 162, abast: 'Escriptori' }
};

/* Les fonts amb la forma de fontsDe (ConsolaSection.jsx). */
const SENSE = { dades: null, estatDades: 'absent', mapa: null, estatMapa: 'absent' };
const AMB = { dades: CONSOLA, estatDades: 'ready', mapa: MAPA, estatMapa: 'ready' };
const ARA = Date.parse('2026-09-25T14:00:00Z');
const linies = (text) => text.split('\n');
const compta = (text, tros) => text.split(tros).length - 1;
/* La línia de cada pàgina, en l'ordre d'IDS_PAGINES: comença per «[nivell] títol · ». */
const liniaDe = (text, id) => linies(text).find((l) => /^\[[^\]]+\] /.test(l) && l.includes(`] ${paginaConsola(id).title} · `));

describe('l’accés ràpid', () => {
  test('les nou pàgines del tauler, en l’ordre d’IDS_PAGINES, amb el títol i la ruta de paginesConsola: cap ruta inventada', () => {
    expect(accesRapid()).toEqual(paginesConsola().map((p) => ({ id: p.id, titol: p.title, ruta: p.ruta })));
    expect(accesRapid().map((p) => p.id)).toEqual(IDS_PAGINES);
    for (const p of accesRapid()) expect(p.ruta).toBe(`/consola/${p.id}`);
  });

  test('els textos fixos del bloc', () => {
    expect(TITOL_DIAGNOSI).toBe('Diagnòstic del Mas');
    expect(ETIQUETA_ACCES).toBe('Accés ràpid a les pàgines de la Consola');
    // La mateixa marca que <Privat> (peces.jsx).
    expect(MASCARA).toBe('••••••');
  });
});

describe('sense cap font', () => {
  const text = diagnosiTextual(SENSE, { ara: ARA });

  test('la capçalera nomena la Consola i diu que no hi ha cap instantània', () => {
    expect(linies(text).slice(0, 3)).toEqual([
      `DIAGNÒSTIC DEL MAS · ${copyConsola().title}`,
      'Instantània del pols: encara no disponible',
      'Instantània del Mapa: encara no disponible'
    ]);
    expect(text).not.toContain('VIGILÀNCIA TRENCADA');
    expect(text).not.toContain('Mode privacitat');
  });

  /* P1-35 (pla 261028_1526 §3.5.2; decisió 6 del Mestre) · La línia 3 diu la
     Versió Canònica del Sistema. A les proves no hi ha segell de build: v1.0.0. */
  test('la línia 3 diu la versió del sistema, darrere de les dues instantànies', () => {
    expect(ETIQUETA_VERSIO).toBe('Versió del sistema');
    expect(linies(text)[3]).toBe(`Versió del sistema: ${versioCanonica()}`);
    expect(linies(text)[3]).toBe(`Versió del sistema: v${VERSIO_SISTEMA}`);
    expect(linies(diagnosiTextual(SENSE, { ara: ARA, versio: 'v1.0.0 (build 261028)' }))[3]).toBe('Versió del sistema: v1.0.0 (build 261028)');
  });

  describe('amb el build segellat', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    /* El segell que posa Vite en compilar (import.meta.env.SDP_BUILD): la
       línia 3 el diu sense passar `versio`, perquè ve de config/versio.js. */
    test('la línia 3 porta el build de config/versio.js', async () => {
      vi.stubEnv('SDP_BUILD', '261028');
      vi.resetModules();
      const { diagnosiTextual: ambSegell } = await import('./diagnosiConsola.js');
      expect(linies(ambSegell(SENSE, { ara: ARA }))[3]).toBe(`Versió del sistema: v${VERSIO_SISTEMA} (build 261028)`);
      expect(linies(ambSegell(SENSE, { ara: ARA, privat: true }))[3]).toBe(`Versió del sistema: v${VERSIO_SISTEMA} (build 261028)`);
    });
  });

  test('nou línies de pàgina, en ordre, amb «Sense font» i el per què de la targeta; cap número inventat', () => {
    const deLesPagines = linies(text).filter((l) => /^\[[^\]]+\] /.test(l));
    expect(deLesPagines).toEqual(paginesConsola().map((p) => `[Sense font] ${p.title} · ${resumPagina(p.id, SENSE)}`));
    expect(compta(text, 'Dades no disponibles en este entorn')).toBe(1);
    expect(compta(text, 'Mapa no disponible en este entorn')).toBe(8);
    expect(text).not.toMatch(/\b0 (rebuts|registres|operacions)\b/);
    expect(text).not.toMatch(/estat: |problema: /);
  });

  test('el pols diu per què cap panell no té mesura, amb el text de la seua coberta', () => {
    const cobertes = cobertesPols(null, 'absent');
    for (const p of panellsPols()) expect(linies(text)).toContain(`    ${p.titol}: ${cobertes[p.id].senseMesura}`);
  });

  test('«El Mas en xifres»: les deu xifres pel nom, en l’ordre de la graella', () => {
    const inici = linies(text).indexOf('EL MAS EN XIFRES');
    expect(inici).toBeGreaterThan(0);
    expect(linies(text).slice(inici + 1)).toEqual(xifresDeLaGraella().map((x) => `- ${x.titol} · ${x.subtitol}`));
    expect(linies(text).slice(inici + 1)).toHaveLength(10);
  });

  test('sense estat declarat és el mateix que «absent», com diu el resum de la targeta', () => {
    expect(diagnosiTextual({}, { ara: ARA })).toBe(text);
    expect(diagnosiTextual(undefined, { ara: ARA })).toBe(text);
  });
});

describe('mentre es llig i quan la lectura falla', () => {
  test('llegint: cap semàfor (les targetes no en porten cap) i el «Llegint…» de la targeta', () => {
    const fonts = { ...SENSE, estatDades: 'loading', estatMapa: 'loading' };
    const text = diagnosiTextual(fonts, { ara: ARA });
    expect(liniaDe(text, 'pols')).toBe(`[${SENSE_SEMAFOR}] ${paginaConsola('pols').title} · Llegint les dades…`);
    expect(liniaDe(text, 'salut')).toBe(`[${SENSE_SEMAFOR}] ${paginaConsola('salut').title} · Llegint el Mapa…`);
    expect(linies(text)).toContain(`    ${panellsPols()[1].titol}: Llegint…`);
  });

  test('una lectura fallida diu «Cal reparar» i per què, mai un zero', () => {
    const fonts = { ...SENSE, estatDades: 'error', estatMapa: 'error' };
    const text = diagnosiTextual(fonts, { ara: ARA });
    expect(liniaDe(text, 'explorador')).toBe(`[Cal reparar] ${paginaConsola('explorador').title} · No s’ha pogut llegir el Mapa`);
    expect(liniaDe(text, 'pols')).toBe(`[Cal reparar] ${paginaConsola('pols').title} · No s’han pogut llegir les dades`);
    expect(text).not.toMatch(/\b0 (rebuts|registres|operacions)\b/);
  });
});

describe('amb el Mapa i consola.json de prova: paritat amb les targetes', () => {
  const text = diagnosiTextual(AMB, { ara: ARA });

  test('les dues instantànies, en hora local, com el peu de les pàgines', () => {
    expect(linies(text)[1]).toBe(`Instantània del pols: ${dataLocal(CONSOLA.generat, 'ca-ES')}`);
    expect(linies(text)[2]).toBe(`Instantània del Mapa: ${dataLocal(MAPA.generat, 'ca-ES')}`);
    // P1-35 · I, darrere, la versió del sistema: la mateixa amb fonts o sense.
    expect(linies(text)[3]).toBe(`Versió del sistema: ${versioCanonica()}`);
  });

  test('cada pàgina porta l’etiqueta de nivell i el resum de la seua targeta, en l’ordre del tauler', () => {
    const ordre = [];
    for (const id of IDS_PAGINES) {
      const nivell = etiquetesPagina(id, AMB, undefined, ARA)[0]?.text ?? SENSE_SEMAFOR;
      const linia = liniaDe(text, id);
      expect(linia, id).toBe(`[${nivell}] ${paginaConsola(id).title} · ${resumPagina(id, AMB)}`);
      ordre.push(linies(text).indexOf(linia));
    }
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  });

  test('cada estat i cada problema de cada pàgina hi són, davall de la seua pàgina', () => {
    const totes = linies(text);
    for (const [i, id] of IDS_PAGINES.entries()) {
      const des = totes.indexOf(liniaDe(text, id));
      const fins = i + 1 < IDS_PAGINES.length ? totes.indexOf(liniaDe(text, IDS_PAGINES[i + 1])) : totes.indexOf('EL MAS EN XIFRES');
      const bloc = totes.slice(des + 1, fins);
      for (const e of estatsPagina(id, AMB, ARA) ?? []) expect(bloc, id).toContain(`    estat: ${e.text}`);
      for (const p of problemesPagina(id, AMB) ?? []) {
        const esperat = `${p.marca ? `${p.marca} ` : ''}${p.text}${p.text && p.ruta ? ' · ' : ''}${p.ruta ?? ''}`;
        expect(bloc, id).toContain(`    problema: ${esperat}`);
      }
    }
    // El que la targeta ja diu, també: l'orfe de l'Explorador i les tasques que no consten vives.
    expect(text).toContain('    problema: mitjana core-identitat · orfe');
    expect(text).toContain('    problema: mort setmanal');
  });

  test('el pols porta les mètriques de les tres cobertes', () => {
    const cobertes = cobertesPols(CONSOLA, 'ready');
    for (const p of panellsPols()) expect(linies(text)).toContain(`    ${p.titol}: ${cobertes[p.id].metriques.join(' · ')}`);
    expect(text).toContain('    Càrrega documental: 162 artefactes actius · avís per damunt de 150');
  });

  test('la vigilància trencada, dalt de les pàgines: el text de l’avís, on mirar i l’evidència, i on és el detall', () => {
    const totes = linies(text);
    const vigilancia = totes.indexOf('VIGILÀNCIA TRENCADA');
    expect(vigilancia).toBeGreaterThan(2);
    expect(vigilancia).toBeLessThan(totes.indexOf('PÀGINES'));
    const [avis] = avisosDeVigilancia(MAPA);
    expect(totes[vigilancia + 1]).toBe(`- ${TEXTOS_AVIS['ledger-invalid']} On: .agents/LEDGER.md · Evidència: ${avis.evidencia}`);
    expect(totes[vigilancia + 2]).toBe(`El detall i què cal reparar són a la pàgina ${paginaConsola('salut').title}.`);
  });

  test('«El Mas en xifres»: el títol i el subtítol de cada targeta de la graella', () => {
    const inici = linies(text).indexOf('EL MAS EN XIFRES');
    expect(linies(text).slice(inici + 1)).toEqual(xifresDeLaGraella(MAPA).map((x) => `- ${x.titol} · ${x.subtitol}`));
  });

  test('un avís de vigilància sense evidència no diu «Evidència:», com l’alerta del tauler', () => {
    const mapa = { ...MAPA, avisos: [{ node: 'document:x/SEGELL.json', codi: 'segell-trencat', severitat: 'alta', evidencia: '' }] };
    const text2 = diagnosiTextual({ ...AMB, mapa }, { ara: ARA });
    expect(linies(text2)).toContain(`- ${TEXTOS_AVIS['segell-trencat']} On: x/SEGELL.json`);
    expect(text2).not.toContain('Evidència:');
  });

  test('sense cap avís de vigilància no hi ha bloc de vigilància', () => {
    const mapa = { ...MAPA, avisos: MAPA.avisos.filter((a) => a.codi !== 'ledger-invalid') };
    expect(avisosDeVigilancia(mapa)).toEqual([]);
    expect(diagnosiTextual({ ...AMB, mapa }, { ara: ARA })).not.toContain('VIGILÀNCIA TRENCADA');
  });
});

describe('el diagnòstic és complet: cap problema retallat', () => {
  test('amb més problemes dels que cap a la targeta, el text els porta tots', () => {
    const skills = Array.from({ length: MAX_PROBLEMES_TARGETA + 3 }, (_, i) => `skill:prova-${i}`);
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes, ...skills.map((id) => ({ id, tipus: 'skill', font: null, atributs: {} }))],
      avisos: skills.map((node) => ({ node, codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' }))
    };
    const fonts = { ...AMB, mapa };
    const problemes = problemesPagina('salut', fonts);
    expect(problemes.length).toBeGreaterThan(MAX_PROBLEMES_TARGETA);
    const text = diagnosiTextual(fonts, { ara: ARA });
    for (const i of skills.keys()) expect(text).toContain(`    problema: mitjana prova-${i} · orfe`);
    expect(text).not.toMatch(/i \d+ més/);
  });
});

describe('determinisme i rellotge', () => {
  test('mateixes fonts i mateix `ara` ⇒ mateixa cadena', () => {
    expect(diagnosiTextual(AMB, { ara: ARA })).toBe(diagnosiTextual(AMB, { ara: ARA }));
    expect(diagnosiTextual(SENSE, { ara: ARA })).toBe(diagnosiTextual(SENSE, { ara: ARA }));
  });

  test('els rebuts rancis canvien amb `ara` igual que la coberta del pols (LLINDAR_REBUTS_RANCIS_DIES)', () => {
    const dia = 24 * 60 * 60 * 1000;
    const rebut = Date.parse(CONSOLA.rebuts[0].t);
    const fresc = rebut + (LLINDAR_REBUTS_RANCIS_DIES - 2) * dia;
    const ranci = rebut + (LLINDAR_REBUTS_RANCIS_DIES + 3) * dia;
    const textFresc = diagnosiTextual(AMB, { ara: fresc });
    const textRanci = diagnosiTextual(AMB, { ara: ranci });
    expect(textFresc).not.toBe(textRanci);
    for (const [text, ara] of [[textFresc, fresc], [textRanci, ranci]]) {
      const estats = estatsPagina('pols', AMB, ara) ?? [];
      for (const e of estats) expect(text).toContain(`    estat: ${e.text}`);
      const nivell = etiquetesPagina('pols', AMB, undefined, ara)[0]?.text ?? SENSE_SEMAFOR;
      expect(liniaDe(text, 'pols')).toBe(`[${nivell}] ${paginaConsola('pols').title} · ${resumPagina('pols', AMB)}`);
    }
    expect((estatsPagina('pols', AMB, ranci) ?? []).map((e) => e.clau)).toContain('rebuts-rancis');
    expect((estatsPagina('pols', AMB, fresc) ?? []).map((e) => e.clau)).not.toContain('rebuts-rancis');
  });

  test('la data local segueix el locale de la Consola', () => {
    const text = diagnosiTextual(AMB, { ara: ARA, locale: 'en-GB' });
    expect(linies(text)[2]).toBe(`Instantània del Mapa: ${dataLocal(MAPA.generat, 'en-GB')}`);
  });
});

describe('mode privacitat', () => {
  const obert = diagnosiTextual(AMB, { ara: ARA });
  const privat = diagnosiTextual(AMB, { ara: ARA, privat: true });

  test('cap ruta ni cap evidència: les que pinten les targetes en <Mono> o <Privat> hi diuen MASCARA', () => {
    // Totes les rutes i evidències que el diagnòstic pot dir amb estes fonts.
    const rutes = IDS_PAGINES.flatMap((id) => (problemesPagina(id, AMB) ?? []).map((p) => p.ruta).filter(Boolean));
    const vigilancia = avisosDeVigilancia(MAPA).flatMap((a) => [rutaDelNode(a.node), a.evidencia]);
    const amagades = [...new Set([...rutes, ...vigilancia])];
    expect(amagades).toEqual(expect.arrayContaining(['_wiki_de_poble/04_escriptori', '.agents/LEDGER.md']));
    for (const tros of amagades) {
      expect(obert, tros).toContain(tros);
      expect(privat, tros).not.toContain(tros);
    }
    expect(privat).toContain(`On: ${MASCARA} · Evidència: ${MASCARA}`);
    expect(privat).toContain(`    problema: sense lector ${MASCARA}`);
  });

  test('ho diu en una línia, i no lleva ni afig cap altra línia de dades', () => {
    expect(linies(privat)).toContain(`Mode privacitat: les rutes i les evidències diuen ${MASCARA}.`);
    // La versió continua sent la línia 3; l'avís de privacitat va just darrere.
    expect(linies(privat).slice(3, 5)).toEqual([`Versió del sistema: ${versioCanonica()}`, `Mode privacitat: les rutes i les evidències diuen ${MASCARA}.`]);
    expect(linies(privat)).toHaveLength(linies(obert).length + 1);
    // Les pàgines, els estats i les xifres sense ruta es llegixen igual.
    for (const id of IDS_PAGINES) expect(liniaDe(privat, id)).toBe(liniaDe(obert, id));
  });

  test('les xifres del Mas diuen el títol i el subtítol que la seua targeta diu amb el mode privacitat', () => {
    // La regla de TargetaXifra (XifresMas.jsx · textos): la versió privada si la xifra en porta.
    const inici = linies(privat).indexOf('EL MAS EN XIFRES');
    expect(linies(privat).slice(inici + 1)).toEqual(xifresDeLaGraella(MAPA).map((x) => (
      `- ${x.titolPrivat || x.titol} · ${x.subtitolPrivat || x.subtitol}`)));
  });
});
