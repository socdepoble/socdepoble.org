// @vitest-environment node
/**
 * src/data/xifratXat.seguretat.test.js — Proves de conformitat i seguretat del
 * decorador `ambXifratXat`, el predicat pur `ambitDelFil` i la configuració
 * d'orígens `esOrigenDeConfianca` (P1-12 / Tasca T7; `disseny_final_e2ee.md`
 * §3, §8.1-§8.6 i §21.1).
 */

import { describe, expect, test, vi } from 'vitest';
import {
  DATA_TOPALL_F2C,
  E2EE_ACTIU_PER_DEFECTE,
  IAIA_UUID,
  ORIGEN_CONFIANCA,
  esOrigenDeConfianca
} from '../config/xifratXat.js';
import { CAPACITATS, CONTRACTE_NUCLI } from './contracte.js';
import { ambitDelFil } from './xifratXatAbast.js';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';

const B_ID = 'bbbbbbbb-2222-4000-8000-000000000002';
const FIL_DIRECTE = 'dddddddd-3333-4000-8000-000000000003';
const FIL_PUBLIC = 'cccccccc-4444-4000-8000-000000000004';
const FIL_IAIA = 'eeeeeeee-5555-4000-8000-000000000005';

function creaBackendSintetic(extres = {}) {
  const base = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, vi.fn(() => nom)]));
  const multim = Object.fromEntries(CAPACITATS.xatMultimedia.map((nom) => [nom, vi.fn(() => nom)]));
  return { ...base, ...multim, ...extres };
}

function entornSegurFals(extres = {}) {
  return {
    actiu: true,
    modeDades: 'remote',
    isSecureContext: true,
    origen: ORIGEN_CONFIANCA.web,
    dev: false,
    enMarc: false,
    cripto: { subtle: { digest: vi.fn() } },
    indexedDB: { open: vi.fn() },
    ...extres
  };
}

describe('T7 · src/config/xifratXat.js (orígens de confiança i flag)', () => {
  test('el flag E2EE està apagat per defecte i la data topall F2c està definida', () => {
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
    expect(DATA_TOPALL_F2C).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('accepta web, Android i iOS en producció; localhost:3340 només en dev; mai dins d’un iframe', () => {
    expect(esOrigenDeConfianca('https://socdepoble.org')).toBe(true);
    expect(esOrigenDeConfianca('https://socdepoble.org/')).toBe(true);
    expect(esOrigenDeConfianca('https://localhost')).toBe(true);
    expect(esOrigenDeConfianca('capacitor://localhost')).toBe(true);
    expect(esOrigenDeConfianca('http://localhost:3340', { dev: false })).toBe(false);
    expect(esOrigenDeConfianca('http://localhost:3340', { dev: true })).toBe(true);
    expect(esOrigenDeConfianca('https://socdepoble.org', { enMarc: true })).toBe(false);
    expect(esOrigenDeConfianca('http://192.168.1.20:3340', { dev: true })).toBe(false);
    expect(esOrigenDeConfianca('')).toBe(false);
    expect(esOrigenDeConfianca(null)).toBe(false);
  });
});

describe('T7 · src/data/xifratXatAbast.js (polaritat i tancament de rebaixes §3)', () => {
  test('directe 1:1 entre persones humanes i directe amb entitat són xifrats obligatoris', () => {
    const directe = ambitDelFil({
      id: FIL_DIRECTE,
      tipus: 'directe',
      altres: [{ id: B_ID, tipus: 'persona', nom: 'Vicent' }]
    });
    expect(directe).toEqual({
      xifrat: true,
      obligatori: true,
      bloquejat: false,
      apegalos: false,
      motiu: 'directe-persona',
      tipusFil: 'directe'
    });

    const entitat = ambitDelFil({
      id: FIL_DIRECTE,
      tipus: 'directe',
      org_id: '99999999-0000-4000-8000-000000000099',
      altres: []
    });
    expect(entitat).toMatchObject({
      xifrat: true,
      obligatori: true,
      bloquejat: false,
      motiu: 'directe-entitat',
      tipusFil: 'entitat'
    });
  });

  test('directe 1:1 exacte amb la IAIA va en clar, però injectar la IAIA amb una altra persona bloqueja el fil', () => {
    const iaiaNet = ambitDelFil({
      id: FIL_IAIA,
      tipus: 'directe',
      altres: [{ id: IAIA_UUID, tipus: 'persona', nom: 'IAIA MarIA' }]
    });
    expect(iaiaNet).toMatchObject({ xifrat: false, obligatori: false, bloquejat: false, motiu: 'iaia' });

    const iaiaInjectada = ambitDelFil({
      id: FIL_DIRECTE,
      tipus: 'directe',
      altres: [
        { id: B_ID, tipus: 'persona', nom: 'Vicent' },
        { id: IAIA_UUID, tipus: 'persona', nom: 'IAIA MarIA' }
      ]
    });
    expect(iaiaInjectada).toMatchObject({
      xifrat: true,
      obligatori: true,
      bloquejat: true,
      motiu: 'iaia-injectada'
    });
  });

  test('un directe amb subjecte o un fil amb marca apegalosa rebaixat a públic queda bloquejat', () => {
    const directeAmbSubjecte = ambitDelFil({
      id: FIL_DIRECTE,
      tipus: 'directe',
      subjecte_tipus: 'pagina',
      altres: [{ id: B_ID, tipus: 'persona' }]
    });
    expect(directeAmbSubjecte).toMatchObject({ xifrat: true, bloquejat: true, motiu: 'directe-amb-subjecte' });

    const rebaixa = ambitDelFil(
      { id: FIL_PUBLIC, tipus: 'canal' },
      { marcatApegalos: true }
    );
    expect(rebaixa).toMatchObject({ xifrat: true, obligatori: true, bloquejat: true, apegalos: true, motiu: 'rebaixa-apegalos' });
  });

  test('canals, comunitats, fils de pàgina, fils sintètics i mode no remot van en clar', () => {
    expect(ambitDelFil({ id: FIL_PUBLIC, tipus: 'canal' })).toMatchObject({ xifrat: false, bloquejat: false, motiu: 'public' });
    expect(ambitDelFil({ id: FIL_PUBLIC, tipus: 'grup', subjecte_tipus: 'pagina' })).toMatchObject({ xifrat: false, bloquejat: false, motiu: 'public' });
    expect(ambitDelFil({ id: 'fake-demo', tipus: 'directe' })).toMatchObject({ xifrat: false, bloquejat: false, motiu: 'fil-sintetic' });
    expect(ambitDelFil({ id: FIL_DIRECTE, tipus: 'directe' }, { modeDades: 'local' })).toMatchObject({ xifrat: false, bloquejat: false, motiu: 'mode-no-remot' });
  });
});

describe('T7 · ambXifratXat apagat per flag i cicle de vida de les 4 claus (QA-E07)', () => {
  test('apagat per defecte: pass-through literal sense cridar cripto ni IndexedDB i preservant receptor i errors', async () => {
    const errorOriginal = Object.assign(new Error('fallada-transport'), { code: 'ERR_1' });
    const impl = creaBackendSintetic({
      estatIntern: 'ok',
      loadFils: vi.fn(function loadFils() { return [this.estatIntern]; }),
      enviaMissatge: vi.fn(() => Promise.reject(errorOriginal))
    });
    const decorat = ambXifratXat(impl);
    expect(decorat.loadFils()).toEqual(['ok']);
    await expect(decorat.enviaMissatge(FIL_DIRECTE, { text: 'hola' })).rejects.toBe(errorOriginal);
    expect(decorat).toBe(impl);
    expect(serveiXifratXat(decorat)).toBeNull();
  });

  test('4 claus: renovació de JWT conserva RAM; canvi d’actor invalida àmbit però conserva identitat; A -> B -> A cancel·la i neteja', async () => {
    const revocats = [];
    const impl = creaBackendSintetic();
    const decorat = ambXifratXat(impl, { actiu: true, revocaUrl: (u) => revocats.push(u) });
    const servei = serveiXifratXat(decorat);

    const ambitA = { ambitEstable: '["backend:1","jo","persona::jo"]', clauIdentitat: '["supa","https://x","jo"]' };
    const ambitB = { ambitEstable: '["backend:1","jo","entitat::coop"]', clauIdentitat: '["supa","https://x","jo"]' };
    const altraPersona = { ambitEstable: '["backend:1","altra","persona::altra"]', clauIdentitat: '["supa","https://x","altra"]' };

    servei.fixaAmbit(ambitA);
    const tokenAmbit1 = servei.captura('ambit');
    const tokenId1 = servei.captura('identitat');

    // Renovació del JWT: mateix ambitEstable i mateixa clauIdentitat
    servei.fixaAmbit({ ...ambitA });
    expect(servei.vigent(tokenAmbit1)).toBe(true);
    expect(servei.vigent(tokenId1)).toBe(true);
    expect(servei.estatAmbit().genAmbit).toBe(1);
    expect(servei.estatAmbit().genIdentitat).toBe(1);

    // Operació asíncrona iniciada en A abans de fer A -> B -> A
    let resolDesxifrat;
    const secret = Uint8Array.of(9, 8, 7, 6);
    const promesaTardana = servei.guardaAmbit(
      async (exigix, anotaBlob) => {
        anotaBlob('blob:https://socdepoble.org/a-1');
        return await new Promise((r) => { resolDesxifrat = r; });
      }
    );

    // Transició A -> B: invalida àmbit, però conserva identitat!
    servei.fixaAmbit(ambitB);
    expect(servei.vigent(tokenAmbit1)).toBe(false);
    expect(servei.vigent(tokenId1)).toBe(true);

    // Retorn B -> A: mateix ambitEstable que a l'inici, però genAmbit ja val 3
    servei.fixaAmbit(ambitA);
    expect(servei.estatAmbit().genAmbit).toBe(3);
    expect(servei.vigent(tokenAmbit1)).toBe(false);
    expect(servei.vigent(tokenId1)).toBe(true);

    resolDesxifrat(secret);
    await expect(promesaTardana).rejects.toMatchObject({ name: 'AbortError', codi: 'ambit-canviat' });
    expect( Array.from(secret) ).toEqual([0, 0, 0, 0]);
    expect(revocats).toContain('blob:https://socdepoble.org/a-1');

    // Canvi de persona: invalida tant àmbit com identitat
    servei.fixaAmbit(altraPersona);
    expect(servei.vigent(tokenId1)).toBe(false);
  });
});

describe('T7 · ambXifratXat activat: fallar tancat, registre propi de fils i bucle appendChatMessages', () => {
  const filDirecteRemot = {
    id: FIL_DIRECTE,
    tipus: 'directe',
    altres: [{ id: B_ID, tipus: 'persona', nom: 'Maria' }]
  };
  const filPublicRemot = {
    id: FIL_PUBLIC,
    tipus: 'canal',
    nom: 'Bàndol Municipal'
  };

  test('sense fixaAmbit o amb entorn insegur, un fil d’abast falla tancat i no crida mai enviaMissatge en clar', async () => {
    const impl = creaBackendSintetic({
      loadFils: vi.fn(async () => [filDirecteRemot]),
      enviaMissatge: vi.fn(),
      enviaXifratXat: vi.fn()
    });
    const decorat = ambXifratXat(impl, entornSegurFals());

    await expect(decorat.enviaMissatge(FIL_DIRECTE, { id: 'm1', text: 'secret' }))
      .rejects.toMatchObject({ codi: 'sense-ambit' });
    expect(impl.enviaMissatge).not.toHaveBeenCalled();

    // Fixem àmbit però en un entorn sense isSecureContext
    const decoratInsegur = ambXifratXat(impl, entornSegurFals({ isSecureContext: false }));
    decoratInsegur.servei.fixaAmbit({ ambitEstable: 'a1', clauIdentitat: 'c1' });
    await expect(decoratInsegur.enviaMissatge(FIL_DIRECTE, { id: 'm2', text: 'secret' }))
      .rejects.toMatchObject({ codi: 'entorn-insegur' });
    expect(impl.enviaMissatge).not.toHaveBeenCalled();
  });

  test('enviaMissatge classifica pel registre propi del decorador (mai per l’objecte passat) i rebutja clar en fil xifrat', async () => {
    const impl = creaBackendSintetic({
      loadFils: vi.fn(async () => [filDirecteRemot, filPublicRemot]),
      enviaMissatge: vi.fn(async (id, cos) => ({ id: cos.id, filId: id, via: 'clar' })),
      enviaXifratXat: vi.fn(async (id, cos) => ({ id: cos.id, filId: id, via: 'xifrat' }))
    });
    const decorat = ambXifratXat(impl, entornSegurFals());
    decorat.servei.fixaAmbit({ ambitEstable: 'ambit-1', clauIdentitat: 'id-1' });

    // Intent d'enganyar enviant un objecte que es fa passar per 'canal' però amb l'id del directe
    await expect(
      decorat.enviaMissatge({ id: FIL_DIRECTE, tipus: 'canal' }, { id: 'm-atac', text: 'intent en clar' })
    ).rejects.toMatchObject({ codi: 'clar-rebutjat', code: 'SDP-XAT-031', id: 'm-atac' });
    expect(impl.enviaMissatge).not.toHaveBeenCalled();

    // Amb sobre xifrat i text: null, passa per enviaXifratXat
    const sobre = { id: 'm-ok', text: null, xifrat: { v: 1, epoca: 1, iv: 'aa', ct: 'bb', kid: 'cc', tf: 'dd' } };
    await expect(decorat.enviaMissatge(FIL_DIRECTE, sobre)).resolves.toEqual({
      id: 'm-ok',
      filId: FIL_DIRECTE,
      via: 'xifrat'
    });
    expect(impl.enviaXifratXat).toHaveBeenCalledOnce();

    // Un canal públic real sí que passa per enviaMissatge
    await expect(decorat.enviaMissatge(FIL_PUBLIC, { id: 'm-pub', text: 'bon dia poble' })).resolves.toEqual({
      id: 'm-pub',
      filId: FIL_PUBLIC,
      via: 'clar'
    });
    expect(impl.enviaMissatge).toHaveBeenCalledOnce();
  });

  test('canvi d’actor just abans de la RPC d’enviament avorta i no crida enviaXifratXat; appendChatMessages usa el decorador', async () => {
    const impl = creaBackendSintetic({
      loadFils: vi.fn(async () => [filDirecteRemot]),
      enviaMissatge: vi.fn(),
      enviaXifratXat: vi.fn(async (id, paquet) => ({ id: paquet.id, filId: id }))
    });
    let decorat;
    const entorn = entornSegurFals({
      preparaSobreXifrat: async ({ cos }) => {
        if (cos.id === 'm-canvi-actor') {
          decorat.servei.fixaAmbit({ ambitEstable: 'ambit-actor-B', clauIdentitat: 'id-1' });
        }
        return { id: cos.id, text: null, xifrat: { v: 1 } };
      }
    });
    decorat = ambXifratXat(impl, entorn);
    decorat.servei.fixaAmbit({ ambitEstable: 'ambit-actor-A', clauIdentitat: 'id-1' });

    await decorat.loadFils();
    await expect(decorat.enviaMissatge(FIL_DIRECTE, { id: 'm-canvi-actor', text: 'no ha d’eixir' }))
      .rejects.toMatchObject({ name: 'AbortError', codi: 'ambit-canviat', reintentable: true });
    expect(impl.enviaXifratXat).not.toHaveBeenCalled();

    // Ara a l'actor B, appendChatMessages delega en l'enviaMissatge decorat
    await decorat.loadFils();
    const res = await decorat.appendChatMessages([
      { id: 'm-b1', threadId: FIL_DIRECTE, text: 'missatge 1' },
      { id: 'm-b2', threadId: FIL_DIRECTE, text: 'missatge 2' }
    ]);
    expect(res).toEqual([
      { id: 'm-b1', filId: FIL_DIRECTE },
      { id: 'm-b2', filId: FIL_DIRECTE }
    ]);
    expect(impl.enviaXifratXat).toHaveBeenCalledTimes(2);
    expect(impl.enviaMissatge).not.toHaveBeenCalled();
  });
});
