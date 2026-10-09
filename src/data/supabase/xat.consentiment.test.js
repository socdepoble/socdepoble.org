/**
 * B03 (migració 2610081543_xat_consentiment_i_metadades.sql) · crea_fil_directe
 * rebutja un directe NOU amb una persona sense consentiment RGPD amb
 * SDP-XAT-016. XatSection pinta error.message tal qual (el toast de ?amb= i
 * l'avís del diàleg «Nova conversa»): l'adaptador hi ha de posar un text per
 * a la persona, mai el codi cru. El `code` no canvia (la interfície i les
 * proves el continuen reconeixent) i el text del servidor queda a `cause`.
 *
 * Cap xarxa: el client de Supabase és un doble amb la forma real de
 * postgrest-js ({ data, error, status }, l'error com a objecte pla). El
 * runtime, la identitat i el traductor són els reals.
 *
 * Revisió del 261008 · Esta prova és de l'ADAPTADOR. No munta XatSection: el
 * que pinta la interfície (el toast de ?amb= i el diàleg «Nova conversa»,
 * traduït pel `code`) s'ha de provar a src/sections/xat. Que un directe que
 * ja existix es continue retrobant és una garantia del SERVIDOR: la comprova
 * tests/fixtures/xat-entitats/regression.sql, no un doble de l'RPC.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock('./config.js', () => ({ getClient: mock.getClient }));

import { creaFilDirecte } from './xat.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';

const TENANT = '00000000-0000-4000-8000-000000000000';
const PERSONA = '10000000-0000-4000-8000-000000000003';
const REMOT = { dataMode: 'remote', tenantId: TENANT };
const TEXT_SERVIDOR_016 = 'SDP-XAT-016: l\'interlocutor no és disponible al xat.';
const HUMA_016 = 'Esta persona no està disponible al xat.';
const CLAU_016 = 'section.xat.error.noDisponible';
let query;
let rpc;

beforeEach(() => {
  vi.clearAllMocks();
  query = { data: null, error: null, status: 200, abortSignal: vi.fn().mockReturnThis() };
  rpc = vi.fn().mockReturnValue(query);
  mock.getClient.mockResolvedValue({ rpc });
});

const respon = (error, status) => Object.assign(query, { data: null, error, status });

describe('SDP-XAT-016 · persona sense consentiment al xat', () => {
  it('crea_fil_directe el rebutja: text humà, sense el codi cru, i el mateix code', async () => {
    respon({ message: TEXT_SERVIDOR_016, code: '42501', details: null, hint: null }, 403);
    const error = await creaFilDirecte(PERSONA, null, REMOT).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'SDP-XAT-016', retriable: false, message: HUMA_016 });
    expect(error.message).not.toMatch(/SDP-XAT/);
    // El text del servidor no es perd: queda a la causa, per a qui depura.
    expect(error.cause).toMatchObject({ message: TEXT_SERVIDOR_016, status: 403 });
  });

  it('el text de l’adaptador és la reserva valenciana de la clau que la interfície tradueix', async () => {
    respon({ message: TEXT_SERVIDOR_016, code: '42501' }, 403);
    const error = await creaFilDirecte(PERSONA, null, REMOT).catch((e) => e);
    expect(error.message).toBe(createTranslator('ca')(CLAU_016));
    // Cada llengua del selector té el seu text, sense el codi cru.
    for (const { code } of SUPPORTED_LANGUAGES) {
      const text = createTranslator(code)(CLAU_016);
      expect([code, text === CLAU_016, /SDP-XAT/.test(text)]).toEqual([code, false, false]);
      if (code !== 'ca') expect([code, text === error.message]).toEqual([code, false]);
    }
  });

  /* Onada 8 (261009, revisió) · SDP-XAT-004 ja té text humà («En privat» hi
     pot portar des de qualsevol publicació): l'exemple de «la resta» passa a
     ser SDP-XAT-006, que no en té. */
  it('la resta de codis SDP conserven el text del servidor (SDP-XAT-006)', async () => {
    const text = 'SDP-XAT-006: no eres membre actiu del fil.';
    respon({ message: text, code: '42501' }, 403);
    await expect(creaFilDirecte(PERSONA, null, REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-006', retriable: false, message: text });
  });

  it('Onada 8 · SDP-XAT-004 (no és d’este poble): text humà, el mateix code i el text del servidor a la causa', async () => {
    const text = 'SDP-XAT-004: l\'interlocutor no és disponible en aquest poble.';
    respon({ message: text, code: '42501' }, 403);
    const error = await creaFilDirecte(PERSONA, null, REMOT).catch((e) => e);
    expect(error).toMatchObject({ code: 'SDP-XAT-004', retriable: false, message: createTranslator('ca')('section.xat.error.noDelPoble') });
    expect(error.message).not.toMatch(/SDP-XAT/);
    expect(error.cause).toMatchObject({ message: text });
  });

  it('l’adaptador no hi posa cap condició pròpia: una crida a crea_fil_directe i el fil que torne el servidor', async () => {
    Object.assign(query, { data: 'fil-del-servidor', error: null, status: 200 });
    await expect(creaFilDirecte(PERSONA, null, REMOT)).resolves.toBe('fil-del-servidor');
    expect(rpc.mock.calls).toEqual([['crea_fil_directe', { p_tenant_id: TENANT, p_altre_usuari: PERSONA, p_titol: null }]]);
  });
});
