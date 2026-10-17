// @vitest-environment node
/* Pla 261016_1530, Onada 0.5 (mòdul 4) · Resums executius en paraules planes,
   derivats de la matriu i sense inventar res: quants n'hi ha de fets, a
   mitges i pendents per responsable i per prioritat, i les P1 obertes. */
import { describe, expect, test } from 'vitest';
import { LLEGENDA, SENSE_PRIORITAT, SENSE_RESPONSABLE, fraseDeRecompte, responsablesDe, resumsExecutius } from './comunicacioGovern.js';
import { normalitzaMcr, vistaMatriu } from './matriuGovern.js';

const ARA = Date.parse('2026-10-16T16:00:00.000Z');
const fila = (id, status, owner, priority, requirement = `Fer ${id}`) => ({ id, status, owner, priority, requirement, source: 'x', evidence: 'e', acceptance: 'a' });
const MATRIU = () => normalitzaMcr({
  at: '2026-10-16T15:00:00Z',
  requirements: [
    fila('F04', '[FET I SEGELLAT]', 'Codex', 'P2'),
    fila('F01', '[PARCIAL]', 'Claude implementa; Codex verifica', 'P1', 'Erradicar `el nom fantasma antic` del codi.'),
    fila('I09', '[NO FET / PENDENT]', 'Claude implementa; Codex verifica', 'P1'),
    fila('G04', '[NO FET / PENDENT]', 'Codex', null)
  ]
});

describe('resumsExecutius', () => {
  test('la frase general i el trasllat, en paraules planes', () => {
    const r = resumsExecutius(vistaMatriu(MATRIU(), { ara: ARA }));
    expect(r.general).toEqual([
      'La matriu té 4 requeriments: 1 fet i segellat, 1 a mitges i 2 per a la tanda següent.',
      '3 requeriments passen a la tanda següent, cada un amb el seu identificador: cap s’esborra.'
    ]);
  });

  /* Revisió adversarial del carril F1 (problema 12) · Per responsable vol dir
     per IA, no per combinació: una fila amb dos responsables compta per als
     dos. Derogat: el grup pel text sencer de `owner` («Claude implementa;
     Codex verifica» com a un sol responsable). */
  test('per responsable (un grup per nom, una fila compta per a cada un) i per prioritat (P1 abans que P2; sense prioritat, al final)', () => {
    const r = resumsExecutius(vistaMatriu(MATRIU(), { ara: ARA }));
    expect(r.perResponsable.map((g) => [g.nom, g.total, g.fet, g.parcial, g.pendent])).toEqual([
      ['Codex', 4, 1, 1, 2],
      ['Claude', 2, 0, 1, 1]
    ]);
    expect(r.perResponsable[1].frase).toBe('Claude: 2 requeriments, 0 fets i segellats, 1 a mitges i 1 per a la tanda següent.');
    expect(r.perPrioritat.map((g) => g.nom)).toEqual(['P1', 'P2', SENSE_PRIORITAT]);
  });

  test('responsablesDe: els noms de `owner`, tal com els escriu la matriu real', () => {
    expect(responsablesDe('Claude implementa; Gemini arquitectura; Codex verifica')).toEqual(['Claude', 'Gemini', 'Codex']);
    expect(responsablesDe('Gemini i Codex')).toEqual(['Gemini', 'Codex']);
    expect(responsablesDe('Claude; Codex verifica')).toEqual(['Claude', 'Codex']);
    expect(responsablesDe('Codex; Gemini deute global')).toEqual(['Codex', 'Gemini']);
    expect(responsablesDe('MarIA (orquestradora), Codex.')).toEqual(['MarIA', 'Codex']);
    // «verifica» no és cap responsable; sense cap nom propi, la primera paraula.
    expect(responsablesDe('Claude implementa i verifica')).toEqual(['Claude']);
    expect(responsablesDe('codex')).toEqual(['codex']);
    expect(responsablesDe('Codex; Codex verifica')).toEqual(['Codex']);
    expect(responsablesDe('  ')).toEqual([]);
    expect(responsablesDe(null)).toEqual([]);
  });

  test('sense owner, «Sense responsable»', () => {
    const m = normalitzaMcr({ at: '2026-10-16T15:00:00Z', requirements: [fila('A1', '[PARCIAL]', null, 'P2')] });
    expect(resumsExecutius(vistaMatriu(m, { ara: ARA })).perResponsable.map((g) => g.nom)).toEqual([SENSE_RESPONSABLE]);
  });

  /* Revisió adversarial del carril F1 (mètrica de la targeta) · «Sense
     responsable» és un grup, no cap responsable: el recompte de responsables
     només compta els noms, i les files sense owner es compten a banda. */
  test('quants responsables hi ha (sense comptar el grup «Sense responsable») i quantes files no en tenen', () => {
    const m = normalitzaMcr({
      at: '2026-10-16T15:00:00Z',
      requirements: [...MATRIU().files.map((f) => ({ ...f.brut })), fila('A1', '[PARCIAL]', null, 'P2'), fila('A2', '[PARCIAL]', '  ', 'P2')]
    });
    const r = resumsExecutius(vistaMatriu(m, { ara: ARA }));
    expect(r.perResponsable.map((g) => g.nom)).toEqual(['Codex', 'Claude', SENSE_RESPONSABLE]);
    expect(r.responsables).toBe(2);
    expect(r.senseResponsable).toBe(2);
    const tots = resumsExecutius(vistaMatriu(MATRIU(), { ara: ARA }));
    expect([tots.responsables, tots.senseResponsable]).toEqual([2, 0]);
  });

  test('les P1 obertes en frases curtes, sense accents greus', () => {
    const r = resumsExecutius(vistaMatriu(MATRIU(), { ara: ARA }));
    expect(r.p1Oberts).toEqual([
      { id: 'F01', frase: 'F01: Erradicar el nom fantasma antic del codi. Va a mitges. Responsables: Claude implementa; Codex verifica.' },
      { id: 'I09', frase: 'I09: Fer I09. Pendent per a la tanda següent. Responsables: Claude implementa; Codex verifica.' }
    ]);
  });

  test('una matriu obsoleta ho diu abans de cap xifra, i no dona res per fet', () => {
    const r = resumsExecutius(vistaMatriu(MATRIU(), { ara: ARA + 48 * 60 * 60 * 1000 }));
    expect(r.general[0]).toMatch(/^La matriu és obsoleta i no es pot creure tal com està: la matriu es va fer fa 49 hores/);
    expect(r.general[1]).toBe('Deia 4 requeriments: 1 fet i segellat, 1 a mitges i 2 per a la tanda següent. Cal tornar-la a fer abans de donar res per fet.');
    expect(r.perResponsable.every((g) => g.fet === 0)).toBe(true);
    expect(r.p1Oberts.map((p) => p.frase)).toEqual([
      'F01: Erradicar el nom fantasma antic del codi. Cal tornar-ho a comprovar. Responsables: Claude implementa; Codex verifica.',
      'I09: Fer I09. Cal tornar-ho a comprovar. Responsables: Claude implementa; Codex verifica.'
    ]);
  });

  /* Revisió adversarial del carril F1 (problema 5) · El que deia una matriu
     obsoleta quadra amb el total: les files amb un estat que no s'entén es diuen. */
  test('una matriu obsoleta amb una fila d’estat desconegut: el que deia quadra amb el total', () => {
    const m = normalitzaMcr({
      at: '2026-10-16T15:00:00Z',
      requirements: [...MATRIU().files.map((f) => ({ ...f.brut })), fila('X1', '[QUASI]', 'Codex', 'P2')]
    });
    const r = resumsExecutius(vistaMatriu(m, { ara: ARA + 48 * 60 * 60 * 1000 }));
    expect(r.general[1]).toBe('Deia 5 requeriments: 1 fet i segellat, 1 a mitges, 2 per a la tanda següent i 1 per tornar a comprovar. Cal tornar-la a fer abans de donar res per fet.');
  });

  test('cap frase porta rutes ni tipografia de màquina', () => {
    const m = normalitzaMcr({ at: '2026-10-16T15:00:00Z', requirements: [fila('A1', '[PARCIAL]', 'Codex', 'P1', 'Veure [src/a.js](</Users/mestre/x/src/a.js>) i `b`')] });
    const r = resumsExecutius(vistaMatriu(m, { ara: ARA }));
    const tot = JSON.stringify(r);
    expect(tot).not.toMatch(/\/Users\/|`/);
    expect(r.p1Oberts[0].frase).toBe('A1: Veure src/a.js i b. Va a mitges. Responsables: Codex.');
  });

  test('sense matriu, null; la llegenda cobrix els quatre estats', () => {
    expect(resumsExecutius(null)).toBeNull();
    expect(LLEGENDA.map((l) => l.estat)).toEqual(['fet', 'parcial', 'pendent', 'obsolet']);
    expect(fraseDeRecompte({ fet: 2, parcial: 0, pendent: 1, obsolet: 3 })).toBe('2 fets i segellats, 0 a mitges, 1 per a la tanda següent i 3 per tornar a comprovar');
  });
});
