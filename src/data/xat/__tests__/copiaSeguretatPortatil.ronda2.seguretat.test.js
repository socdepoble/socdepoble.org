/**
 * Ronda 2 del Gauntlet R26 (carril de Claude) · residus del verificador i
 * port a Vitest dels casos del pegat FINAL de Codex R26
 * (checkpoints 261114_1959_r26_backup_arbitratge_final_prova.mjs i
 * 261114_1944_r26_backup_prova.mjs). WebCrypto real de Node; cap xarxa ni
 * backend. Cada negativa comprova el `codi` i el `motiu`, perquè no passe per
 * una altra causa.
 *
 * Reconciliació amb Codex (cap garantia perduda):
 *   · `ultimSeqInclosa` no existix al v2: cap cursor global, ni tan sols nul.
 *   · `__proto__` i `constructor` com a id de fil: Codex els tracta com a dades
 *     sense contaminar prototips; el v2 els rebutja per la forma d'id (més
 *     estricte) i tampoc contamina res.
 *   · Un fil que el tall exclou sencer queda sense cursor (0 implícit), no {a:0}.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { midaBlobAdjunt } from '../../xatMultimediaXifrat.js';
import {
  CODI_CLAU_FEBLE,
  CODI_COPIA_CORRUPTA,
  CODI_IDENTITAT_DIVERGENT,
  CODI_LIMIT_SUPERAT,
  CODI_MATERIAL_SENSIBLE,
  CODI_QR_INVALID,
  creaOfertaTraspasLocalQr,
  creaRespostaTraspasLocalQr,
  derivaSasTraspasLocalQr,
  exportaCopiaSeguretatXat,
  exportaCopiaSeguretatXatAmbRebut,
  fusionaRevisioMissatge,
  generaParellaEfimeraTraspas,
  importaCopiaSeguretatXat,
  validaOfertaTraspasLocalQr,
} from '../copiaSeguretatPortatil.js';

const U = 'usr-javi';
const T = 'la-torre';
const CLAU = 'olivera-centenaria-2026!';
const ambitPla = { usuariId: U, tenantId: T, permetSenseXifrar: true };
const ambitXifrat = { usuariId: U, tenantId: T, contrasenya: CLAU };
const opcionsImport = (extra = {}) => ({ usuariIdEsperat: U, tenantIdEsperat: T, contrasenya: CLAU, ...extra });
const opcionsPla = (extra = {}) => ({ usuariIdEsperat: U, tenantIdEsperat: T, permetSenseXifrar: true, ...extra });
const pla = async (opcions) => JSON.parse(await exportaCopiaSeguretatXat({ ...ambitPla, ...opcions })).pla;
const fils = (...ids) => ids.map((id) => ({ id }));
/* Missatge amb la forma del DTO real (mapejaMissatge: `creatAl`). */
const msg = (id, filId, seq, creatAl = '2026-11-13T12:00:00.000Z', extra = {}) => ({ id, filId, seq, creatAl, ...extra });
/* La mateixa forma amb l'àlies `createdAt` (proves de Codex). */
const msgCa = (id, filId, seq, createdAt = '2026-11-13T12:00:00.000Z') => ({ id, filId, seq, createdAt });
const rebutja = (codi, motiu) => expect.objectContaining(motiu ? { codi, motiu } : { codi });

const canon = (v) => (v === null || typeof v !== 'object' ? JSON.stringify(v)
  : Array.isArray(v) ? `[${v.map(canon).join(',')}]`
    : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`);
const sha = (v) => createHash('sha256').update(canon(v)).digest('hex');

/* Una còpia sense xifrar (mode de proves) reescrita amb els hashes refets. */
function reescriuPla(text, muta) {
  const sobre = JSON.parse(text);
  muta(sobre.pla, sobre);
  for (const lot of Object.keys(sobre.pla.dades)) {
    sobre.pla.manifest.lots[lot] = { total: sobre.pla.dades[lot].length, sha256: sha(sobre.pla.dades[lot]) };
  }
  return JSON.stringify(sobre);
}

/* Magatzem en memòria que aplica la regla de `aplica-si-mes-nou` del motor. */
function creaMagatzemMemoria(inicial = []) {
  const confirmat = new Map(inicial);
  return {
    confirmat,
    async obriTransaccio() {
      const staging = [];
      return {
        async escriu(op) {
          staging.push(op);
        },
        async confirma() {
          for (const op of staging) {
            const clau = `${op.tipus}:${op.id}`;
            if (op.mode === 'insereix-si-absent') {
              if (!confirmat.has(clau)) confirmat.set(clau, op.valor);
            } else if (op.mode === 'aplica-si-mes-nou') {
              confirmat.set(clau, fusionaRevisioMissatge(confirmat.get(clau) ?? null, op.valor));
            } else {
              throw new Error(`mode no admés: ${op.mode}`);
            }
          }
        },
        async avorta() {
          staging.length = 0;
        },
      };
    },
  };
}

/* ── Port de Codex R26 (cursors per fil i tall de data) ─────────────────── */

describe('Codex R26 · cursors per fil i tall de data (port a Vitest)', () => {
  it('dos fils: conserva seq2 de B i el cursor d’un tercer fil buit', async () => {
    const p = await pla({ fils: fils('a', 'b', 'c'), missatges: [msgCa('a101', 'a', 101), msgCa('b2', 'b', 2)], desDeSeqPerFil: { a: 100, b: 1, c: 19 } });
    expect(p.dades.missatges.map((x) => x.id)).toEqual(['a101', 'b2']);
    expect(p.manifest.cursors.ultimSeqPerFil).toEqual({ a: 101, b: 2, c: 19 });
  });

  it('incremental buit: reté tots els cursors i no muta el mapa', async () => {
    const cursors = Object.freeze({ a: 100, b: 2 });
    const p = await pla({ fils: fils('a', 'b'), missatges: [msgCa('a100', 'a', 100), msgCa('b2', 'b', 2)], desDeSeqPerFil: cursors });
    expect(p.dades.missatges).toEqual([]);
    expect(p.manifest.cursors.ultimSeqPerFil).toEqual({ a: 100, b: 2 });
    expect(cursors).toEqual({ a: 100, b: 2 });
  });

  it('un fil sense cursor comença en 0 i el cursor zero no oculta la seq 1', async () => {
    const p = await pla({ fils: fils('a', 'b'), missatges: [msgCa('a1', 'a', 1), msgCa('b1', 'b', 1)], desDeSeqPerFil: { a: 0 } });
    expect(p.dades.missatges.map((x) => x.id)).toEqual(['a1', 'b1']);
    expect(p.manifest.cursors.ultimSeqPerFil).toEqual({ a: 1, b: 1 });
  });

  it('__proto__ i constructor no contaminen cap prototip (el v2 els rebutja com a id)', async () => {
    const abans = Object.getOwnPropertyNames(Object.prototype).sort().join(',');
    const cursors = JSON.parse('{"__proto__":2,"constructor":1}');
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, missatges: [msgCa('p3', '__proto__', 3)], desDeSeqPerFil: cursors }))
      .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'cursor-invalid'));
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, fils: [{ id: '__proto__' }], missatges: [msgCa('p3', '__proto__', 3)] }))
      .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'fil-id'));
    expect({}.polluted).toBeUndefined();
    expect(Object.getOwnPropertyNames(Object.prototype).sort().join(',')).toBe(abans);
  });

  it('cursor global rebutjat amb un fil extra buit, i en text', async () => {
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a', 'b'), missatges: [msgCa('a101', 'a', 101)], desDeSeq: 100 }))
      .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'cursor-ambigu'));
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a'), missatges: [], desDeSeq: '100' }))
      .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'cursor-invalid'));
  });

  it('mapa i escala alhora són ambigus; cursor per fil negatiu, fraccionari, text, NaN, Infinity o insegur rebutjat', async () => {
    const casos = [{ desDeSeq: 0, desDeSeqPerFil: {} }, ...[-1, 1.5, '2', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map((v) => ({ desDeSeqPerFil: { a: v } }))];
    for (const cas of casos) {
      await expect(exportaCopiaSeguretatXat({ ...ambitPla, ...cas })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'cursor-invalid'));
    }
  });

  it('el tall de data no avança el cursor per un missatge exclòs superior', async () => {
    const p = await pla({ fils: fils('a'), missatges: [msgCa('a1', 'a', 1), msgCa('a2', 'a', 2, '2026-11-15T12:00:00Z')], desDeSeqPerFil: { a: 0 }, finsAlDia: '2026-11-13' });
    expect(p.manifest.cursors.ultimSeqPerFil).toEqual({ a: 1 });
  });

  it('dates no monòtones: el cursor no salta el forat de seq i la següent el recupera', async () => {
    const tots = [msgCa('a2', 'a', 2, '2026-11-15T12:00:00Z'), msgCa('a3', 'a', 3, '2026-11-13T12:00:00Z')];
    const p = await pla({ fils: fils('a'), missatges: tots, desDeSeqPerFil: { a: 1 }, finsAlDia: '2026-11-13' });
    expect(p.dades.missatges.map((x) => x.id)).toEqual(['a3']);
    expect(p.manifest.cursors.ultimSeqPerFil).toEqual({ a: 1 });
    const seguent = await pla({ fils: fils('a'), missatges: tots, desDeSeqPerFil: p.manifest.cursors.ultimSeqPerFil });
    expect(seguent.dades.missatges.map((x) => x.id)).toEqual(['a2', 'a3']);
  });

  it('permetSenseXifrar és opt-in explícit en importar', async () => {
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a'), missatges: [msgCa('a1', 'a', 1)] });
    await expect(importaCopiaSeguretatXat(text, { usuariIdEsperat: U, tenantIdEsperat: T })).rejects.toEqual(rebutja(CODI_CLAU_FEBLE, 'sense-xifrar'));
    let escrits = 0;
    await importaCopiaSeguretatXat(text, opcionsPla({ aplicaImportacio: () => { escrits += 1; } }));
    expect(escrits).toBe(1);
  });

  it('FIX Codex: el tall llig creatAl del DTO real (un missatge posterior queda fora)', async () => {
    const p = await pla({ fils: fils('a'), finsAlDia: '2026-11-13', missatges: [msg('futur', 'a', 1, '2026-11-15T12:00:00Z')] });
    expect(p.dades.missatges).toEqual([]);
    const d = await pla({ fils: fils('a'), desDeData: '2026-11-14', missatges: [msg('vell', 'a', 1, '2026-11-13T12:00:00Z'), msg('nou', 'a', 2, '2026-11-15T12:00:00Z')] });
    expect(d.dades.missatges.map((x) => x.id)).toEqual(['nou']);
  });

  it('dates equivalents en dos camps acceptades; absents, invàlides, contradictòries i dies impossibles rebutjats', async () => {
    const tots2 = { id: 'a1', filId: 'a', seq: 1, creatAl: '2026-11-13T12:00:00Z', createdAt: '2026-11-13T13:00:00+01:00' };
    expect((await pla({ fils: fils('a'), missatges: [tots2], finsAlDia: '2026-11-13' })).dades.missatges).toHaveLength(1);
    for (const dates of [{}, { creatAl: 'invàlida' }, { creatAl: '2026-11-13T00:00:00Z', createdAt: '2026-11-14T00:00:00Z' }]) {
      await expect(exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a'), missatges: [{ id: 'a1', filId: 'a', seq: 1, ...dates }], finsAlDia: '2026-11-13' }))
        .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-data'));
    }
    for (const dia of ['2026-99-99', '2026-02-31', '2026-02-29', '2026-13-45']) {
      await expect(exportaCopiaSeguretatXat({ ...ambitPla, missatges: [], finsAlDia: dia })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
    }
    expect((await pla({ missatges: [], finsAlDia: '2028-02-29' })).manifest.cursors.finsAlDia).toBe('2028-02-29T23:59:59.999Z');
  });

  it('un tall que ho exclou tot deixa el fil sense avançar i la següent sense tall ho recupera tot', async () => {
    const tots = [msgCa('a2', 'a', 2, '2026-11-15T12:00:00Z'), msgCa('a3', 'a', 3, '2026-11-15T12:00:00Z')];
    const p = await pla({ fils: fils('a'), missatges: tots, finsAlDia: '2026-11-13' });
    expect(p.dades.missatges).toEqual([]);
    expect(p.manifest.cursors.ultimSeqPerFil.a ?? 0).toBe(0);
    const seguent = await pla({ fils: fils('a'), missatges: tots, desDeSeqPerFil: p.manifest.cursors.ultimSeqPerFil });
    expect(seguent.dades.missatges.map((x) => x.id)).toEqual(['a2', 'a3']);
  });

  it('preserva el cursor de partida encara que seq antigues caiguen fora del tall', async () => {
    const p = await pla({ fils: fils('a'), missatges: [msgCa('a2', 'a', 2, '2026-11-15T12:00:00Z'), msgCa('a11', 'a', 11)], desDeSeqPerFil: { a: 10 }, finsAlDia: '2026-11-13' });
    expect(p.manifest.cursors.ultimSeqPerFil).toEqual({ a: 11 });
  });

  it('cap cursor global al manifest, ni tan sols nul (més estricte que ultimSeqInclosa: null)', async () => {
    const p = await pla({ fils: fils('a', 'b'), missatges: [msgCa('a101', 'a', 101), msgCa('b2', 'b', 2)] });
    expect(p.manifest.cursors).not.toHaveProperty('ultimSeqInclosa');
    expect(Object.keys(p.manifest.cursors).sort()).toEqual(['desDeData', 'desDeSeqPerFil', 'finsAlDia', 'ultimSeqPerFil']);
  });

  it('1944 · el cursor no salta una seq exclosa per data amb el DTO real (creatAl)', async () => {
    const dades = [msg('a1', 'a', 1, '2026-11-13T00:00:00Z'), msg('a2', 'a', 2, '2026-11-15T00:00:00Z'), msg('a3', 'a', 3, '2026-11-14T00:00:00Z')];
    const p = await pla({ fils: fils('a'), missatges: dades, finsAlDia: '2026-11-14' });
    expect(p.dades.missatges.map((x) => x.id)).toEqual(['a1', 'a3']);
    expect(p.manifest.cursors.ultimSeqPerFil.a).toBe(1);
    const seguent = await pla({ fils: fils('a'), missatges: dades, desDeSeqPerFil: p.manifest.cursors.ultimSeqPerFil });
    expect(seguent.dades.missatges.map((x) => x.id)).toEqual(['a2', 'a3']);
  });

  it('1944 · dates absents o contradictòries (dies sense hora) amb tall, i un tall impossible, no passen', async () => {
    for (const dates of [{}, { creatAl: 'x' }, { creatAl: '2026-11-13', createdAt: '2026-11-14' }]) {
      await expect(exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a'), missatges: [{ id: 'a', filId: 'a', seq: 1, ...dates }], finsAlDia: '2026-11-14' }))
        .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-data'));
    }
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, finsAlDia: '2026-02-31' })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
  });
});

/* ── Residus de la ronda 1 ─────────────────────────────────────────────── */

describe('dates del tall i del missatge', () => {
  it('desDeData tampoc no deixa passar el cursor per damunt d’un missatge exclòs (garantia de Codex)', async () => {
    const tots = [msg('a1', 'a', 1, '2026-11-12T08:00:00Z'), msg('a2', 'a', 2, '2026-11-10T08:00:00Z'), msg('a3', 'a', 3, '2026-11-12T09:00:00Z')];
    const { rebut } = await exportaCopiaSeguretatXatAmbRebut({ ...ambitPla, fils: fils('a'), missatges: tots, desDeData: '2026-11-11' });
    expect(rebut.ultimSeqPerFil).toEqual({ a: 1 });
    const seguent = await pla({ fils: fils('a'), missatges: tots, desDeSeqPerFil: rebut.ultimSeqPerFil });
    expect(seguent.dades.missatges.map((x) => x.id)).toEqual(['a2', 'a3']);
  });

  it('amb tall, una data de missatge impossible, sense fus horari o sense seq es rebutja', async () => {
    const base = { ...ambitPla, fils: fils('a'), finsAlDia: '2026-11-14' };
    await expect(exportaCopiaSeguretatXat({ ...base, missatges: [msg('a1', 'a', 1, '2026-02-31T10:00:00Z')] })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-data'));
    await expect(exportaCopiaSeguretatXat({ ...base, missatges: [msg('a1', 'a', 1, '2026-11-13T10:00:00')] })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-data'));
    await expect(exportaCopiaSeguretatXat({ ...base, missatges: [msg('a1', 'a', null, '2026-11-15T10:00:00Z')] })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-seq'));
    // Sense tall, una data present i discordant també es rebutja; absent, no.
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a'), missatges: [{ id: 'a1', filId: 'a', seq: 1, creatAl: '2026-11-13T00:00:00Z', createdAt: '2026-11-14T00:00:00Z' }] }))
      .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-data'));
    expect((await pla({ fils: fils('a'), missatges: [{ id: 'a1', filId: 'a', seq: 1 }] })).dades.missatges).toHaveLength(1);
    // desDeData amb un dia impossible.
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, desDeData: '2026-02-30' })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
  });

  it('un tall sense fus horari, amb un any de sis xifres o d’un tipus estrany es rebutja; un Date vàlid es restaura', async () => {
    for (const finsAlDia of ['2026-11-13T10:00:00', new Date(Date.UTC(10000, 0, 1)), new Date(Number.NaN), 1794528000000, 'Nov 13 2026']) {
      await expect(exportaCopiaSeguretatXat({ ...ambitPla, finsAlDia })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
    }
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a'), missatges: [msg('a1', 'a', 1)], finsAlDia: new Date('2026-11-13T23:00:00.000Z') });
    const res = await importaCopiaSeguretatXat(text, opcionsPla());
    expect(res.manifest.cursors.finsAlDia).toBe('2026-11-13T23:00:00.000Z');
    expect(res.missatges.map((m) => m.id)).toEqual(['a1']);
    const ambDesplacament = await pla({ fils: fils('a'), missatges: [msg('a1', 'a', 1)], finsAlDia: '2026-11-14T00:30:00+01:00' });
    expect(ambDesplacament.manifest.cursors.finsAlDia).toBe('2026-11-13T23:30:00.000Z');
  });

  it('en importar, les dates dels cursors i de la capçalera han de ser instants reals', async () => {
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a'), missatges: [msg('a1', 'a', 1)], finsAlDia: '2026-11-14' });
    for (const fals of ['2026-13-45T23:59:59.999Z', '2026-02-31T23:59:59.999Z']) {
      const forjat = reescriuPla(text, (p) => { p.manifest.cursors.finsAlDia = fals; });
      await expect(importaCopiaSeguretatXat(forjat, opcionsPla())).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'cursors'));
    }
    const capcalera = reescriuPla(text, (_p, s) => { s.capcalera.creatAt = '2026-02-31T10:00:00.000Z'; });
    await expect(importaCopiaSeguretatXat(capcalera, opcionsPla())).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
  });
});

describe('incrementals amb làpides i edicions', () => {
  const m1 = msg('m1', 'f1', 1, '2026-11-10T08:00:00.000Z', { text: 'açò s’esborrarà per a tothom', editatAl: null, esborratAl: null });
  const m2 = msg('m2', 'f1', 2, '2026-11-10T09:00:00.000Z', { text: 'versió primera', editatAl: null, esborratAl: null });
  const m1Esborrat = { ...m1, text: null, esborratAl: '2026-11-14T09:00:00.000Z' };
  const m2Editat = { ...m2, text: 'versió editada', editatAl: '2026-11-14T09:30:00.000Z' };
  const m3 = msg('m3', 'f1', 3, '2026-11-14T10:00:00.000Z', { text: 'nou', editatAl: null, esborratAl: null });

  async function cadena() {
    const A = await exportaCopiaSeguretatXatAmbRebut({ ...ambitXifrat, fils: fils('f1'), missatges: [m1, m2] });
    const B = await exportaCopiaSeguretatXatAmbRebut({ ...ambitXifrat, fils: fils('f1'), missatges: [m1Esborrat, m2Editat, m3], base: A.rebut });
    return { A, B };
  }

  it('A+B en un aparell nou: la làpida viatja i guanya, i l’edició substituïx la versió de la base', async () => {
    const { A, B } = await cadena();
    const magatzem = creaMagatzemMemoria();
    const resA = await importaCopiaSeguretatXat(A.text, opcionsImport({ magatzem }));
    const resB = await importaCopiaSeguretatXat(B.text, opcionsImport({ magatzem, estatLocal: { copies: { [A.rebut.backupId]: resA.rebut } } }));
    expect(resB.missatges.map((m) => m.id)).toEqual(['m3']);
    expect(resB.revisions.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(resB.operacions.filter((o) => o.mode === 'aplica-si-mes-nou').map((o) => o.id)).toEqual(['m1', 'm2']);
    expect(magatzem.confirmat.get('missatge:m1')).toMatchObject({ text: null, esborratAl: '2026-11-14T09:00:00.000Z' });
    expect(magatzem.confirmat.get('missatge:m2')).toMatchObject({ text: 'versió editada', editatAl: '2026-11-14T09:30:00.000Z' });
    expect(magatzem.confirmat.get('missatge:m3')).toMatchObject({ text: 'nou' });
    expect(B.rebut.ultimSeqPerFil).toEqual({ f1: 3 });
  });

  it('un magatzem que ja té la làpida no la perd en restaurar A i després B', async () => {
    const { A, B } = await cadena();
    const magatzem = creaMagatzemMemoria([['missatge:m1', m1Esborrat]]);
    const resA = await importaCopiaSeguretatXat(A.text, opcionsImport({ magatzem }));
    expect(magatzem.confirmat.get('missatge:m1')).toEqual(m1Esborrat);
    await importaCopiaSeguretatXat(B.text, opcionsImport({ magatzem, estatLocal: { copies: { [A.rebut.backupId]: resA.rebut } } }));
    expect(magatzem.confirmat.get('missatge:m1')).toEqual(m1Esborrat);
  });

  it('fusionaRevisioMissatge: la làpida guanya sempre, una edició vella no en tapa una de nova, i cap revisió canvia fil ni seq', () => {
    expect(fusionaRevisioMissatge(null, m1Esborrat)).toEqual(m1Esborrat);
    expect(fusionaRevisioMissatge(m1, m1Esborrat)).toEqual(m1Esborrat);
    expect(fusionaRevisioMissatge(m1Esborrat, { ...m1, text: 'ressuscitat', editatAl: '2026-12-01T00:00:00.000Z' })).toEqual(m1Esborrat);
    const nova = { ...m2, text: 'v3', editatAl: '2026-11-15T00:00:00.000Z' };
    expect(fusionaRevisioMissatge(nova, m2Editat)).toEqual(nova);
    expect(fusionaRevisioMissatge(m2Editat, nova)).toEqual(nova);
    expect(fusionaRevisioMissatge(m2, { ...m2Editat, filId: 'altre' })).toEqual(m2);
    expect(fusionaRevisioMissatge(m2, { ...m2Editat, seq: 9 })).toEqual(m2);
    expect(fusionaRevisioMissatge(m2, { ...m2, editatAl: 'no-es-una-data' })).toEqual(m2);
  });

  it('una revisió fora de lloc, fora de la base, buida o duplicada es rebutja', async () => {
    const plaA = await exportaCopiaSeguretatXatAmbRebut({ ...ambitPla, fils: fils('f1'), missatges: [m1, m2] });
    const plaB = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('f1'), missatges: [m1Esborrat, m2Editat, m3], base: plaA.rebut });
    const local = opcionsPla({ estatLocal: { copies: { [plaA.rebut.backupId]: plaA.rebut } } });
    expect((await importaCopiaSeguretatXat(plaB, local)).revisions).toHaveLength(2);
    const casos = [
      [(p) => { p.dades.revisions[0].seq = 7; }, 'revisio-fora-de-base'],
      [(p) => { p.dades.revisions[0].filId = 'f9'; }, 'revisio-fora-de-base'],
      [(p) => { p.dades.revisions[0] = { ...p.dades.revisions[0], esborratAl: null, editatAl: null }; }, 'revisio-buida'],
      [(p) => { p.dades.revisions[1] = { ...p.dades.revisions[0] }; }, 'revisio-duplicada'],
      [(p) => { p.dades.revisions.push({ ...p.dades.missatges[0], esborratAl: '2026-11-14T11:00:00.000Z' }); }, 'revisio-duplicada'],
    ];
    for (const [muta, motiu] of casos) {
      await expect(importaCopiaSeguretatXat(reescriuPla(plaB, muta), local)).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, motiu));
    }
    // Una còpia completa no pot portar revisions.
    const complet = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('f1'), missatges: [m1] });
    const forjat = reescriuPla(complet, (p) => { p.dades.revisions.push(m2Editat); });
    await expect(importaCopiaSeguretatXat(forjat, opcionsPla())).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'revisio-fora-de-lloc'));
  });
});

describe('adjunts xifrats i en clar', () => {
  const ambM1 = { ...ambitXifrat, fils: fils('f1'), missatges: [msg('m1', 'f1', 1)] };
  const blobXifrat = (bytesEnClar, primers = []) => {
    const blob = Buffer.alloc(midaBlobAdjunt(bytesEnClar), 0x42);
    primers.forEach((b, i) => { blob[i] = b; });
    return blob;
  };

  it('un blob E2EE que comença per 1f 8b (IV aleatori) es copia i es restaura', async () => {
    for (const primers of [[0x1f, 0x8b], [0x50, 0x4b, 0x03, 0x04], [0x7b, 0x22]]) {
      const blob = blobXifrat(1000, primers);
      const text = await exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'x1', missatgeId: 'm1', mime: 'application/octet-stream', nom: 'x1', dadesBase64: blob.toString('base64') }] });
      const res = await importaCopiaSeguretatXat(text, opcionsImport());
      expect(res.adjunts[0]).toMatchObject({ id: 'x1', mime: 'application/octet-stream', bytes: blob.length });
    }
  });

  it('el blob E2EE ha de tindre una mida Padmé vàlida i dins del bucket', async () => {
    for (const bytes of [1, 2, 255, 256, 1_999_999, 2_000_000]) {
      const blob = blobXifrat(bytes);
      if (blob.length > 2_100_000) continue;
      await expect(exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'x1', missatgeId: 'm1', mime: 'application/octet-stream', dadesBase64: blob.toString('base64') }] })).resolves.toBeTypeOf('string');
    }
    const fals = Buffer.concat([blobXifrat(1000), Buffer.from([0])]);
    await expect(exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'x1', missatgeId: 'm1', mime: 'application/octet-stream', dadesBase64: fals.toString('base64') }] }))
      .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'adjunt-blob'));
  });

  it('en clar: la màgia ha de ser la del MIME declarat (cap ZIP, gzip ni HTML disfressat)', async () => {
    const valids = {
      'image/jpeg': Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]),
      'image/webp': Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x24, 0, 0, 0]), Buffer.from('WEBPVP8 ')]),
      'video/mp4': Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(8)]),
      'video/quicktime': Buffer.concat([Buffer.from([0, 0, 0, 0x14]), Buffer.from('ftypqt  '), Buffer.alloc(8)]),
      'video/webm': Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42]),
      'audio/webm': Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42]),
      'audio/mp4': Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypM4A '), Buffer.alloc(8)]),
      'audio/ogg': Buffer.concat([Buffer.from('OggS'), Buffer.alloc(10)]),
    };
    for (const [mime, cap] of Object.entries(valids)) {
      const bytes = Buffer.concat([cap, Buffer.alloc(64, 3)]);
      const text = await exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'c1', missatgeId: 'm1', mime, nom: 'c1', dadesBase64: bytes.toString('base64') }] });
      expect((await importaCopiaSeguretatXat(text, opcionsImport())).adjunts[0].mime).toBe(mime);
    }
    for (const [mime, bytes] of [['image/jpeg', Buffer.from('<html><script>x</script></html>')], ['audio/ogg', valids['image/jpeg']], ['image/webp', Buffer.alloc(64, 7)]]) {
      await expect(exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'c1', missatgeId: 'm1', mime, dadesBase64: bytes.toString('base64') }] }))
        .rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'adjunt-contingut'));
    }
  });

  it('sostre per classe: imatge 2 MB i veu 3 MB, en exportar i en importar', async () => {
    const jpeg = (n) => { const b = Buffer.alloc(n, 1); b[0] = 0xff; b[1] = 0xd8; b[2] = 0xff; return b; };
    const ogg = (n) => { const b = Buffer.alloc(n, 1); b.write('OggS', 0); return b; };
    await expect(exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'g1', missatgeId: 'm1', mime: 'image/jpeg', dadesBase64: jpeg(2_000_000).toString('base64') }] })).resolves.toBeTypeOf('string');
    await expect(exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'g1', missatgeId: 'm1', mime: 'image/jpeg', dadesBase64: jpeg(2_000_001).toString('base64') }] }))
      .rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'adjunt-mida'));
    await expect(exportaCopiaSeguretatXat({ ...ambM1, adjunts: [{ id: 'g1', missatgeId: 'm1', mime: 'audio/ogg', dadesBase64: ogg(3_000_001).toString('base64') }] }))
      .rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'adjunt-mida'));
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('f1'), missatges: [msg('m1', 'f1', 1)], adjunts: [{ id: 'g1', missatgeId: 'm1', mime: 'image/jpeg', dadesBase64: jpeg(100).toString('base64') }] });
    const forjat = reescriuPla(text, (p) => {
      const b = jpeg(3_000_000);
      p.dades.adjunts[0] = { ...p.dades.adjunts[0], bytes: b.length, dadesBase64: b.toString('base64'), sha256: createHash('sha256').update(b).digest('hex') };
    });
    await expect(importaCopiaSeguretatXat(forjat, opcionsPla())).rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'adjunt-mida'));
  });
});

describe('material de sessió: llista blanca per àmbit i heurística de valor', () => {
  const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItamF2aSJ9.c2lnbmF0dXJhLWZhbHNh';
  const PKCS8 = 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgOk4bGYJ0m1Y2W7m3sV1y3Hn8oPZ5kq4l0q2f6w8hW7ahRANCAAQ';
  const PUSH = JSON.stringify({ endpoint: 'https://push.example/abc', keys: { p256dh: 'BNc', auth: 'tBH' } });
  const exporta = (extra) => exportaCopiaSeguretatXat({ ...ambitXifrat, fils: fils('f1'), missatges: [], ...extra });

  it('S4 del verificador: JWT, sessió, pkcs8, JWK sense kty i Push serialitzat no entren mai', async () => {
    const casos = [
      { fils: [{ id: 'f1', token: JWT }] },
      { fils: [{ id: 'f1', sessio: { access: JWT, refresh: 'rt-secret' } }] },
      { missatges: [msg('m1', 'f1', 1, undefined, { sigPriv: PKCS8 })] },
      { missatges: [msg('m1', 'f1', 1, undefined, { metadades: { sigPriv: PKCS8 } })] },
      { missatges: [msg('m1', 'f1', 1, undefined, { metadades: { clauEc: { crv: 'P-256', x: 'xx', y: 'yy', d: 'PRIVAT' } } })] },
      { missatges: [msg('m1', 'f1', 1, undefined, { metadades: { clau: { kty: 'oct', k: 'c2VjcmV0' } } })] },
      { missatges: [msg('m1', 'f1', 1, undefined, { metadades: { subscripcio: PUSH } })] },
      { missatges: [msg('m1', 'f1', 1, undefined, { metadades: { sessio: JSON.stringify({ access_token: 'opac' }) } })] },
      { missatges: [msg('m1', 'f1', 1, undefined, { metadades: { capcalera: `Bearer ${JWT}` } })] },
      { missatges: [msg('m1', 'f1', 1, undefined, { metadades: { pem: `-----BEGIN ${'PRIVATE'} KEY-----\nMIGHAgEA\n-----END ${'PRIVATE'} KEY-----` } })] },
      { fils: [{ id: 'f1', altres: [{ id: 'u2', nom: 'Pepa', sessio: JWT }] }] },
    ];
    for (const cas of casos) {
      await expect(exporta(cas)).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
    }
  });

  it('un camp fora del model del xat (encara que no semble un secret) no entra en la còpia', async () => {
    for (const cas of [
      { fils: [{ id: 'f1', sessio: { refresh: 'rt-secret' } }] },
      { fils: [{ id: 'f1', refresh: 'rt-secret' }] },
      { missatges: [msg('m1', 'f1', 1, undefined, { cos: 'fila crua del servidor' })] },
    ]) {
      await expect(exporta(cas)).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'camp-no-admes'));
    }
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('f1'), missatges: [msg('m1', 'f1', 1)] });
    const forjat = reescriuPla(text, (p) => { p.dades.fils[0].token = 'opac'; });
    await expect(importaCopiaSeguretatXat(forjat, opcionsPla())).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'camp-no-admes'));
    const forjatMissatge = reescriuPla(text, (p) => { p.dades.missatges[0].refresh = 'opac'; });
    await expect(importaCopiaSeguretatXat(forjatMissatge, opcionsPla())).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'camp-no-admes'));
  });

  it('cap fals positiu: el DTO real sencer, el text lliure i un sobre xifrat passen intactes', async () => {
    const fil = {
      id: 'f1', canalClau: 'beta', canalBetaTesters: true, esPropi: true, epocaActual: 2, e2eeDesDeSeq: 1, capEpoca: 'abc', tipus: 'grup',
      titol: 'Forn', altresNoms: ['Pepa'], altres: [{ id: 'u2', nom: 'Pepa', tipus: 'persona', avatarUrl: null }], entitatId: null,
      entitatNom: null, comEntitat: false, imatgeUrl: null, actualitzatAl: '2026-11-13T12:00:00.000Z', ultimText: JWT, ultimTipus: 'text',
      ultimAl: '2026-11-13T12:00:00.000Z', ultimAutorId: 'u2', ultimSeq: 1, llegitFinsSeq: 1, rebutFinsSeq: 1, llegitPelsAltresFinsSeq: 0,
      rebutPelsAltresFinsSeq: 0, noLlegits: 0, arxivatAl: null, fixatAl: null, silenciatFinsAl: null, preferitAl: null, noLlegitManual: false,
      comunitatId: null, subjecte: { tipus: 'pagina', id: 'p1', ruta: '/p1', titol: 'Pàgina' }, rol: 'membre', participants: 2, participant: true,
    };
    const sobre = { v: 1, epoca: 2, kid: 'AAAAAAAAAAAAAAAAAAAAAA', ct: Buffer.alloc(180, 0x30).toString('base64url') };
    const missatge = {
      id: 'm1', xifrat: sobre, filId: 'f1', seq: 1, usuariId: 'u2', autorNom: 'Pepa', text: `mira: ${PUSH} ${JWT}`, tipus: 'text', respostaA: null,
      editatAl: null, esborratAl: null, metadades: { adjunt: { id: 'a1', bytes: 10, mime: 'image/webp', duradaMs: null } }, esIA: false,
      comOrgId: null, creatAl: '2026-11-13T12:00:00.000Z',
    };
    const jwtSol = { ...missatge, id: 'm2', seq: 2, xifrat: null, text: JWT };
    const text = await exportaCopiaSeguretatXat({ ...ambitXifrat, fils: [fil], missatges: [missatge, jwtSol] });
    const res = await importaCopiaSeguretatXat(text, opcionsImport());
    expect(res.fils[0]).toEqual(fil);
    expect(res.missatges).toEqual([missatge, jwtSol]);
  });
});

describe('QR: l’àmbit esperat i el de l’oferta són obligatoris', () => {
  const ARA = 1_790_000_000_000;
  const empremta = (n) => Array.from({ length: 32 }, () => n.toString(16).padStart(2, '0').toUpperCase()).join(':');
  const sdp = (n) => `v=0\r\no=- ${n} 2 IN IP4 192.168.1.${n}\r\na=fingerprint:sha-256 ${empremta(n)}\r\n`;
  const refaEmpremta = (o) => {
    const camps = { ...o };
    delete camps.empremtaSha256;
    return { ...o, empremtaSha256: sha(camps) };
  };

  it('S5: una oferta forjada amb identitat nul·la o buida no casa amb un àmbit esperat nul o buit', async () => {
    const nou = await generaParellaEfimeraTraspas();
    const vell = await generaParellaEfimeraTraspas();
    const oferta = await creaOfertaTraspasLocalQr({ usuariId: U, tenantId: T, sdpOffer: sdp(10), clauPublicaEfimeraJwk: nou.clauPublicaJwk, araMs: ARA });
    for (const buit of [null, '', '  ']) {
      const forjada = refaEmpremta({ ...oferta, usuariId: buit, tenantId: buit });
      await expect(validaOfertaTraspasLocalQr(forjada, { usuariIdEsperat: buit, tenantIdEsperat: buit, araMs: ARA + 1000, sessionsConsumides: new Set() }))
        .rejects.toEqual(rebutja(CODI_IDENTITAT_DIVERGENT, 'ambit'));
      await expect(validaOfertaTraspasLocalQr(forjada, { usuariIdEsperat: U, tenantIdEsperat: T, araMs: ARA + 1000, sessionsConsumides: new Set() }))
        .rejects.toEqual(rebutja(CODI_QR_INVALID, 'ambit'));
      await expect(creaRespostaTraspasLocalQr(forjada, { usuariId: buit, tenantId: buit, sdpAnswer: sdp(20), clauPublicaEfimeraJwk: vell.clauPublicaJwk, araMs: ARA + 1000, sessionsConsumides: new Set() }))
        .rejects.toEqual(rebutja(CODI_IDENTITAT_DIVERGENT, 'ambit'));
    }
    // La legítima, validada amb un àmbit esperat nul, tampoc no passa.
    await expect(validaOfertaTraspasLocalQr(oferta, { usuariIdEsperat: null, tenantIdEsperat: null, araMs: ARA + 1000, sessionsConsumides: new Set() }))
      .rejects.toEqual(rebutja(CODI_IDENTITAT_DIVERGENT, 'ambit'));
    // Amb espais sobrers a l'oferta (refeta) no és la identitat canònica.
    const ambEspais = refaEmpremta({ ...oferta, usuariId: ` ${U} ` });
    await expect(validaOfertaTraspasLocalQr(ambEspais, { usuariIdEsperat: U, tenantIdEsperat: T, araMs: ARA + 1000, sessionsConsumides: new Set() }))
      .rejects.toEqual(rebutja(CODI_QR_INVALID, 'ambit'));
  });

  it('derivaSas: identitats buides o diferents de l’àmbit esperat avorten abans del secret', async () => {
    const nou = await generaParellaEfimeraTraspas();
    const vell = await generaParellaEfimeraTraspas();
    const oferta = await creaOfertaTraspasLocalQr({ usuariId: U, tenantId: T, sdpOffer: sdp(10), clauPublicaEfimeraJwk: nou.clauPublicaJwk, araMs: ARA });
    const resposta = await creaRespostaTraspasLocalQr(oferta, { usuariId: U, tenantId: T, sdpAnswer: sdp(20), clauPublicaEfimeraJwk: vell.clauPublicaJwk, araMs: ARA + 1000, sessionsConsumides: new Set() });
    const forjada = refaEmpremta({ ...oferta, usuariId: null, tenantId: null });
    const respostaForjada = { ...resposta, usuariId: null, tenantId: null, empremtaOferta: forjada.empremtaSha256 };
    await expect(derivaSasTraspasLocalQr({ oferta: forjada, resposta: respostaForjada, clauPrivadaEfimera: vell.clauPrivada, rol: 'responent', araMs: ARA + 2000 }))
      .rejects.toEqual(rebutja(CODI_QR_INVALID, 'ambit'));
    await expect(derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: vell.clauPrivada, rol: 'responent', araMs: ARA + 2000, usuariIdEsperat: 'usr-intrus', tenantIdEsperat: T }))
      .rejects.toEqual(rebutja(CODI_IDENTITAT_DIVERGENT, 'ambit'));
    await expect(derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: vell.clauPrivada, rol: 'responent', araMs: ARA + 2000, usuariIdEsperat: U, tenantIdEsperat: T }))
      .resolves.toMatchObject({ codiVerificacioSas: expect.stringMatching(/^\d{6}$/) });
  });
});

describe('seq única per fil', () => {
  it('S8: dos missatges del mateix fil amb la mateixa seq es rebutgen en exportar i en importar', async () => {
    const dup = [msg('m1', 'f1', 5), msg('m2', 'f1', 5)];
    await expect(exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('f1'), missatges: dup })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'seq-duplicada'));
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('f1', 'f2'), missatges: [msg('m1', 'f1', 5), msg('m2', 'f2', 5)] });
    expect((await importaCopiaSeguretatXat(text, opcionsPla())).missatges).toHaveLength(2);
    const forjat = reescriuPla(text, (p) => { p.dades.missatges[1].filId = 'f1'; });
    await expect(importaCopiaSeguretatXat(forjat, opcionsPla())).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'seq-duplicada'));
  });
});
