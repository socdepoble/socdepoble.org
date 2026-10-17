// @vitest-environment node
/* Pla 261016_1530, Onada 0.5 (mòdul 3) i relleu de Codex 261016_1639 (fila
   I11) · Tres verbs (Valida, Certifica, Retorna amb nota), un registre on
   només s'afig, amb pla, id, decisió, nota, data, actor i l'empremta sha256 de
   la fila; si la fila canvia, «certificació d'una versió anterior». La
   decisió no canvia mai l'estat automàtic. El magatzem de memòria és el de
   les proves; el d'IndexedDB, el patró de tractors/nucli/magatzem.js. */
import { webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
  DECISIONS_GOVERN, SCHEMA_CERTIFICACIO, TEXT_CERTIFICADA_SENSE_FET, TEXT_VERSIO_ANTERIOR, VERB_DECISIO, actorDeLaSessio,
  crearMagatzemCertificacions, crearMagatzemCertificacionsMemoria, empremtaFila, empremtesDe, estatCertificacio, exportaJsonl,
  preimatgeFila, preparaCertificacio, ultimaDecisio, validaCertificacio
} from './certificacions.js';
import { normalitzaMcr, vistaMatriu } from './matriuGovern.js';

const subtle = webcrypto.subtle;
const ARA = Date.parse('2026-10-16T16:00:00.000Z');
const NONCE = (n) => Buffer.from(new Uint8Array(16).fill(n)).toString('base64url');
const fila = (status = '[FET I SEGELLAT]', extra = {}) => ({
  id: 'F04', source: 'O1.1', requirement: 'Persona sense copyright', status, evidence: 'Prova verda.',
  owner: 'Claude implementa; Codex verifica', priority: 'P2', acceptance: 'Prova del flux.', ...extra
});
const MATRIU = (status) => normalitzaMcr({ at: '2026-10-16T15:00:00Z', requirements: [fila(status)] });

describe('l’empremta de cada fila', () => {
  test('és el sha256 del JSON canònic dels camps de Codex, i es pot recalcular fora de la Consola', async () => {
    const [f] = MATRIU('[FET I SEGELLAT]').files;
    expect(preimatgeFila(f)).toBe(JSON.stringify({
      acceptance: 'Prova del flux.', evidence: 'Prova verda.', id: 'F04', owner: 'Claude implementa; Codex verifica',
      priority: 'P2', requirement: 'Persona sense copyright', source: 'O1.1', status: '[FET I SEGELLAT]'
    }));
    const esperada = `sha256:${Buffer.from(await subtle.digest('SHA-256', new TextEncoder().encode(preimatgeFila(f)))).toString('hex')}`;
    expect(await empremtaFila(f, subtle)).toBe(esperada);
  });

  test('canvia si canvia qualsevol camp de la fila (l’estat, l’evidència)', async () => {
    const a = await empremtaFila(MATRIU('[FET I SEGELLAT]').files[0], subtle);
    const b = await empremtaFila(MATRIU('[PARCIAL]').files[0], subtle);
    const c = await empremtaFila(normalitzaMcr({ requirements: [fila('[FET I SEGELLAT]', { evidence: 'Una altra.' })] }).files[0], subtle);
    expect(new Set([a, b, c]).size).toBe(3);
    expect((await empremtesDe(MATRIU('[PARCIAL]'), subtle)).get('F04')).toBe(b);
  });
});

describe('preparaCertificacio i validaCertificacio', () => {
  const empremta = `sha256:${'a'.repeat(64)}`;
  test('un registre porta pla, id, decisió, nota, data, actor, empremta i nonce, i res més', () => {
    const r = preparaCertificacio({ pla: 'pla_261016_1530', id: 'F04', decisio: 'validat', nota: '  ', actor: 'Javi', empremta, ara: ARA, nonce: NONCE(1) });
    expect(r).toEqual({
      schema: SCHEMA_CERTIFICACIO, pla: 'pla_261016_1530', id: 'F04', decisio: 'validat', nota: null,
      data: '2026-10-16T16:00:00.000Z', actor: 'Javi', empremta, nonce: NONCE(1)
    });
    expect(validaCertificacio(r)).toEqual([]);
    expect(validaCertificacio({ ...r, estat: 'fet' })).toEqual(['Camp desconegut: «estat».']);
  });
  test('retornar demana una nota', () => {
    expect(() => preparaCertificacio({ id: 'F04', decisio: 'retornat', empremta, nonce: NONCE(2) })).toThrow(/Retornar una tasca demana una nota/);
    expect(preparaCertificacio({ id: 'F04', decisio: 'retornat', nota: 'Falta la prova', empremta, nonce: NONCE(2) }).nota).toBe('Falta la prova');
  });
  test('cap decisió fora de les tres, cap empremta mal formada, cap nonce que no siga de 16 bytes', () => {
    expect(() => preparaCertificacio({ id: 'F04', decisio: 'aprovat', empremta, nonce: NONCE(3) })).toThrow(/decisio/);
    expect(() => preparaCertificacio({ id: 'F04', decisio: 'validat', empremta: 'sha256:x', nonce: NONCE(3) })).toThrow(/empremta/);
    expect(() => preparaCertificacio({ id: 'F04', decisio: 'validat', empremta, nonce: 'curt' })).toThrow(/nonce/);
    expect(() => preparaCertificacio({ id: ' ', decisio: 'validat', empremta, nonce: NONCE(3) })).toThrow(/id és obligatori/);
  });
  test('sense nonce, en genera un d’aleatori', () => {
    const r = preparaCertificacio({ id: 'F04', decisio: 'validat', empremta });
    expect(validaCertificacio(r)).toEqual([]);
  });
  test('els tres verbs, en l’ordre dels botons', () => {
    expect(DECISIONS_GOVERN.map((d) => VERB_DECISIO[d])).toEqual(['Valida', 'Certifica', 'Retorna amb nota']);
  });
});

/* Revisió adversarial del carril F1 (problema 13) · L'encàrrec diu «tres verbs
   per fila»: ja no hi ha cap fila sense «Certifica» (es pinta per a totes,
   GovernConsola.jsx, DECISIONS_GOVERN). Derogat: «certificar només el que la
   matriu pinta [FET I SEGELLAT]» (decisionsPermeses). La garantia que la
   certificació no falseja l'estat passa a estatCertificacio, davall. */

describe('estatCertificacio: la decisió es pinta al costat de l’estat, i diu si és d’una altra versió', () => {
  test('vigent amb la mateixa empremta; d’una versió anterior si la fila ha canviat', async () => {
    const ara = await empremtaFila(MATRIU('[FET I SEGELLAT]').files[0], subtle);
    const abans = await empremtaFila(MATRIU('[PARCIAL]').files[0], subtle);
    const r = preparaCertificacio({ id: 'F04', decisio: 'certificat', empremta: ara, ara: ARA, nonce: NONCE(4) });
    expect(estatCertificacio([r], { id: 'F04', empremta: ara, estatVist: 'fet' })).toEqual({ registre: r, vigent: true, text: 'Certificada', to: 'exit' });
    expect(estatCertificacio([r], { id: 'F04', empremta: abans, estatVist: 'fet' })).toEqual({ registre: r, vigent: false, text: TEXT_VERSIO_ANTERIOR, to: 'neutre' });
    expect(estatCertificacio([r], { id: 'F01', empremta: ara })).toBeNull();
  });
  /* Revisió adversarial del carril F1 (problema 8) · Mentre l'empremta d'ara no
     se sap (es calcula, o no hi ha WebCrypto), la fila pot ser idèntica: no es
     diu «versió anterior», es diu la decisió en to neutre i vigent: null.
     Derogat: «sense empremta calculada, vigent false» (i «versió anterior»). */
  test('sense l’empremta d’ara, ni vigent ni d’una versió anterior: la decisió, en to neutre', async () => {
    const e = await empremtaFila(MATRIU('[FET I SEGELLAT]').files[0], subtle);
    const r = preparaCertificacio({ id: 'F04', decisio: 'certificat', empremta: e, ara: ARA, nonce: NONCE(12) });
    expect(estatCertificacio([r], { id: 'F04', empremta: null, estatVist: 'fet' })).toEqual({ registre: r, vigent: null, text: 'Certificada', to: 'neutre' });
    expect(estatCertificacio([r], { id: 'F04', estatVist: 'obsolet' })).toEqual({ registre: r, vigent: null, text: TEXT_CERTIFICADA_SENSE_FET, to: 'neutre' });
  });
  test('una certificació d’una fila que la matriu no pinta [FET I SEGELLAT] ho diu, i mai és verda', async () => {
    const parcial = vistaMatriu(MATRIU('[PARCIAL]'), { ara: ARA }).files[0];
    const vella = vistaMatriu(MATRIU('[FET I SEGELLAT]'), { ara: ARA + 48 * 3600000 }).files[0];
    for (const fila of [parcial, vella]) {
      const e = await empremtaFila(fila, subtle);
      const r = preparaCertificacio({ id: 'F04', decisio: 'certificat', empremta: e, ara: ARA, nonce: NONCE(13) });
      expect(estatCertificacio([r], { id: 'F04', empremta: e, estatVist: fila.estatVist }), fila.estatVist)
        .toEqual({ registre: r, vigent: true, text: TEXT_CERTIFICADA_SENSE_FET, to: 'avis' });
    }
    // Sense dir l'estat de la fila, tampoc és verda.
    const e = await empremtaFila(parcial, subtle);
    const r = preparaCertificacio({ id: 'F04', decisio: 'certificat', empremta: e, ara: ARA, nonce: NONCE(14) });
    expect(estatCertificacio([r], { id: 'F04', empremta: e }).to).toBe('avis');
    // Validar o retornar una fila a mitges es diu com sempre.
    const v = preparaCertificacio({ id: 'F04', decisio: 'validat', empremta: e, ara: ARA + 1, nonce: NONCE(15) });
    expect(estatCertificacio([r, v], { id: 'F04', empremta: e, estatVist: 'parcial' })).toMatchObject({ text: 'Validada', to: 'neutre' });
  });
  test('mana l’última decisió de la mateixa fila i del mateix pla', () => {
    const e = `sha256:${'b'.repeat(64)}`;
    const v = preparaCertificacio({ id: 'F04', decisio: 'validat', empremta: e, ara: ARA, nonce: NONCE(5) });
    const t = preparaCertificacio({ id: 'F04', decisio: 'retornat', nota: 'Torna-hi', empremta: e, ara: ARA + 1000, nonce: NONCE(6) });
    const altre = preparaCertificacio({ pla: 'un-altre', id: 'F04', decisio: 'certificat', empremta: e, ara: ARA + 2000, nonce: NONCE(7) });
    expect(ultimaDecisio([t, altre, v], { id: 'F04' })).toBe(t);
    expect(estatCertificacio([t, v], { id: 'F04', empremta: e })).toMatchObject({ text: 'Retornada amb nota', to: 'avis' });
    expect(ultimaDecisio([t, altre, v], { pla: 'un-altre', id: 'F04' })).toBe(altre);
    // Una decisió d'un altre pla no es pinta en una matriu sense pla.
    expect(estatCertificacio([altre], { id: 'F04', empremta: e, estatVist: 'fet' })).toBeNull();
  });

  /* Revisió adversarial del carril F1 (correcció del camp «pla») · Dues matrius
     que no diuen de quin pla són i que reutilitzen F04 per a una altra tasca no
     comparteixen la decisió: cada una porta el seu pla («mcr@» i la seua data).
     La mateixa matriu, oberta una altra vegada, sí: i si la fila ha canviat, és
     «d'una versió anterior». Derogat: les decisions de pla null, compartides
     per totes les matrius de Codex. */
  test('dues matrius amb el mateix id i una altra data no comparteixen la decisió', async () => {
    const dimecres = normalitzaMcr({ at: '2026-10-16T15:00:00Z', requirements: [fila('[FET I SEGELLAT]')] });
    const dijous = normalitzaMcr({ at: '2026-10-17T09:00:00Z', requirements: [fila('[PARCIAL]', { requirement: 'Una altra tasca' })] });
    expect(dimecres.pla).toBe('mcr@2026-10-16T15:00:00.000Z');
    const e = await empremtaFila(dimecres.files[0], subtle);
    const r = preparaCertificacio({ pla: dimecres.pla, id: 'F04', decisio: 'validat', empremta: e, ara: ARA, nonce: NONCE(16) });
    expect(r.pla).toBe('mcr@2026-10-16T15:00:00.000Z');
    // La matriu de dijous, amb un F04 que és una altra tasca: cap decisió, ni «versió anterior».
    const eDijous = await empremtaFila(dijous.files[0], subtle);
    expect(estatCertificacio([r], { pla: dijous.pla, id: 'F04', empremta: eDijous, estatVist: 'parcial' })).toBeNull();
    // La mateixa matriu de dimecres: vigent; amb la fila tocada, d'una versió anterior.
    expect(estatCertificacio([r], { pla: dimecres.pla, id: 'F04', empremta: e, estatVist: 'fet' })).toMatchObject({ vigent: true, text: 'Validada' });
    const tocada = normalitzaMcr({ at: '2026-10-16T15:00:00Z', requirements: [fila('[PARCIAL]')] });
    expect(tocada.pla).toBe(dimecres.pla);
    const eTocada = await empremtaFila(tocada.files[0], subtle);
    expect(estatCertificacio([r], { pla: tocada.pla, id: 'F04', empremta: eTocada, estatVist: 'parcial' }))
      .toMatchObject({ vigent: false, text: TEXT_VERSIO_ANTERIOR });
  });
});

describe('el magatzem on només s’afig', () => {
  const empremta = `sha256:${'c'.repeat(64)}`;
  test('afig, llig en ordre de data i exporta en JSONL canònic', async () => {
    const m = crearMagatzemCertificacionsMemoria();
    expect(m.persistent).toBe(false);
    const segon = preparaCertificacio({ id: 'I09', decisio: 'retornat', nota: 'Falta la prova', empremta, ara: ARA + 1000, nonce: NONCE(8) });
    const primer = preparaCertificacio({ id: 'F04', decisio: 'validat', actor: 'Javi', empremta, ara: ARA, nonce: NONCE(9) });
    await m.afegix(segon);
    await m.afegix(primer);
    expect((await m.registres()).map((r) => r.id)).toEqual(['F04', 'I09']);
    const linies = (await m.exporta()).split('\n');
    expect(linies.at(-1)).toBe('');
    expect(linies.slice(0, -1).map((l) => JSON.parse(l).id)).toEqual(['F04', 'I09']);
    // Claus ordenades i sense espais: el JSON canònic.
    expect(linies[0]).toBe(`{"actor":"Javi","data":"2026-10-16T16:00:00.000Z","decisio":"validat","empremta":"${empremta}","id":"F04","nonce":"${NONCE(9)}","nota":null,"pla":null,"schema":"sdp.certificacio.v1"}`);
    expect(exportaJsonl([])).toBe('');
  });
  test('mai sobreescriu: el mateix nonce es rebutja, i un registre invàlid no entra', async () => {
    const m = crearMagatzemCertificacionsMemoria();
    const r = preparaCertificacio({ id: 'F04', decisio: 'validat', empremta, nonce: NONCE(10) });
    await m.afegix(r);
    await expect(m.afegix({ ...r, decisio: 'certificat' })).rejects.toThrow(/només admet afegir/);
    await expect(m.afegix({ ...r, nonce: NONCE(11), decisio: 'esborrat' })).rejects.toThrow(/Certificació invàlida/);
    expect((await m.registres()).map((x) => x.decisio)).toEqual(['validat']);
    // El que torna és una còpia: tocar-la no toca el registre.
    (await m.registres())[0].decisio = 'certificat';
    expect((await m.registres())[0].decisio).toBe('validat');
  });
  test('sense IndexedDB, la memòria: no es guarda, i ho diu', async () => {
    const m = crearMagatzemCertificacions({ idb: null });
    expect(m.persistent).toBe(false);
    expect(await m.registres()).toEqual([]);
  });
  test('si IndexedDB no s’obri, passa a memòria per a tota la sessió', async () => {
    const idb = {
      open() {
        const peticio = {};
        queueMicrotask(() => { peticio.error = new Error('bloquejada'); peticio.onerror?.(); });
        return peticio;
      }
    };
    const m = crearMagatzemCertificacions({ idb });
    expect(await m.registres()).toEqual([]);
    expect(m.tipus).toBe('memoria');
    expect(m.persistent).toBe(false);
  });
});

describe('actorDeLaSessio', () => {
  test('el nom de la sessió, mai el correu', () => {
    expect(actorDeLaSessio({ email: 'algu@exemple.org', user_metadata: { full_name: ' Javi ' } })).toBe('Javi');
    expect(actorDeLaSessio({ user_metadata: { name: 'Mestre' } })).toBe('Mestre');
    expect(actorDeLaSessio({ email: 'algu@exemple.org' })).toBeNull();
    expect(actorDeLaSessio(null)).toBeNull();
  });
  /* Revisió adversarial del carril F1 (problema 1) · Els noms els escriu
     l'usuari i alguns proveïdors hi posen el correu: un candidat que és un
     correu es descarta i es passa al següent, com nomPublic d'autoriaNota.js. */
  test('un nom que és un correu es descarta: es passa al següent, o null', () => {
    expect(actorDeLaSessio({ user_metadata: { full_name: 'algu@exemple.org', name: 'Javi' } })).toBe('Javi');
    expect(actorDeLaSessio({ user_metadata: { name: 'algu@exemple.org' } })).toBeNull();
    expect(actorDeLaSessio({ user_metadata: { full_name: ' algu@exemple.org ' }, full_name: 'Mestre de prova' })).toBe('Mestre de prova');
    expect(actorDeLaSessio({ user_metadata: { full_name: 'Javi <algu@exemple.org>' } })).toBeNull();
  });
});
