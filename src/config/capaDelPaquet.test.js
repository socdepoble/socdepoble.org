// @vitest-environment node
/* Model B (decisions A1 i A3 del Mestre, 261003) · la capa del paquet
   (capaDelPaquet.js): la via interna per la qual només el paquet declara el
   backend i el tenant, i el descart amb avís de les capes de l'amfitrió. La
   conducta a l'element és a src/PedraSecaEmbed.config.test.jsx; la de
   configura(), a tests/host.test.js. Totes les dades són sintètiques. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CONTRACTE_AMFITRIO_V1 as C, validaDeclaracioAmfitrio } from './contracteAmfitrio.js';

/* Les VITE_* de compilació es fixen abans d'avaluar el mòdul: la prova no
   depén del .env de qui l'executa. Amb blancs i una de buida, a propòsit. */
const ENTORN = vi.hoisted(() => {
  const entorn = {
    VITE_SUPABASE_URL: '  https://paquet.supabase.test ',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_del_paquet',
    VITE_DATA_MODE: '',
    VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111',
    VITE_SNIPPET_CHROME_URL: ' https://extensions.paquet.test/snippet '
  };
  for (const [variable, valor] of Object.entries(entorn)) vi.stubEnv(variable, valor);
  return entorn;
});

const UUID_DE_L_AMFITRIO = '22222222-2222-4222-8222-222222222222';
const CLAUS_DEL_MODEL_B = [...C.modelB.clausDeBackend, ...C.modelB.clausDeTenant];
/* Correcció de l'A1: també els serveis propis de Sóc de Poble (el relé d'OAuth,
   el bot, l'emissor i la clau morta version). */
const SERVEIS_PROPIS = C.clausDeConfig.propiesDeSdP.filter((clau) => !CLAUS_DEL_MODEL_B.includes(clau));
const CLAUS_FORA_DE_L_AMFITRIO = [...CLAUS_DEL_MODEL_B, ...SERVEIS_PROPIS];

/** Un mòdul nou a cada prova: la capa fixada i els avisos ja donats són estat del mòdul. */
async function fresc() {
  vi.resetModules();
  return import('./capaDelPaquet.js');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('la capa del paquet', () => {
  test('la de compilació: només les VITE_* de text no buit, sense blancs als extrems, i congelada', async () => {
    const { CAPA_DE_COMPILACIO, capaDelPaquet } = await fresc();
    expect(CAPA_DE_COMPILACIO).toEqual({
      supabaseUrl: 'https://paquet.supabase.test',
      supabaseAnonKey: ENTORN.VITE_SUPABASE_ANON_KEY,
      tenantId: ENTORN.VITE_TENANT_ID,
      snippetChromeUrl: 'https://extensions.paquet.test/snippet'
    });
    expect(Object.isFrozen(CAPA_DE_COMPILACIO)).toBe(true);
    // Sense cap entrada que la fixe, mana la de compilació.
    expect(capaDelPaquet()).toBe(CAPA_DE_COMPILACIO);
  });

  test('fixaCapaDelPaquet: la via interna mana sobre la de compilació i és immutable', async () => {
    const m = await fresc();
    const capa = m.fixaCapaDelPaquet({
      supabaseUrl: 'https://altre.supabase.test', tenantId: UUID_DE_L_AMFITRIO, dataMode: 'seed', supabaseAnonKey: '   ', backendId: undefined
    });
    expect(capa).toEqual({ supabaseUrl: 'https://altre.supabase.test', tenantId: UUID_DE_L_AMFITRIO, dataMode: 'seed' });
    expect(Object.isFrozen(capa)).toBe(true);
    expect(m.capaDelPaquet()).toBe(capa);
    // Els mateixos valors, en un altre ordre: la mateixa capa. Uns altres: llança, i la capa no canvia.
    expect(m.fixaCapaDelPaquet({ dataMode: 'seed', tenantId: UUID_DE_L_AMFITRIO, supabaseUrl: 'https://altre.supabase.test' })).toBe(capa);
    expect(() => m.fixaCapaDelPaquet({ supabaseUrl: 'https://tercer.supabase.test' })).toThrow('immutable');
    expect(() => m.fixaCapaDelPaquet({})).toThrow('immutable');
    expect(m.capaDelPaquet()).toBe(capa);
  });

  test('fixaCapaDelPaquet només admet les claus del paquet: una clau de l’amfitrió o un valor que no és un objecte llancen sense fixar res', async () => {
    const m = await fresc();
    expect(() => m.fixaCapaDelPaquet({ tenantId: UUID_DE_L_AMFITRIO, nomPoble: 'Sella' })).toThrow('nomPoble');
    for (const valor of [null, 'text', ['supabaseUrl']]) expect(() => m.fixaCapaDelPaquet(valor), JSON.stringify(valor)).toThrow(TypeError);
    expect(m.capaDelPaquet()).toBe(m.CAPA_DE_COMPILACIO);
    expect([...m.CLAUS_DEL_PAQUET].sort()).toEqual(['backendId', 'dataMode', 'snippetChromeUrl', 'supabaseAnonKey', 'supabaseUrl', 'tenantId']);
  });

  /* CU (Onada 3) · l'adreça d'instal·lació de l'extensió del Snippet: la fixa
     l'entrada pròpia com el backend, i la capa fixada mana (FitxaSnippet la llig). */
  test('snippetChromeUrl: la capa fixada la pot portar, sense blancs, i mana sobre la de compilació', async () => {
    const m = await fresc();
    const capa = m.fixaCapaDelPaquet({ tenantId: UUID_DE_L_AMFITRIO, snippetChromeUrl: '  https://extensions.altre.test/snippet ' });
    expect(capa).toEqual({ tenantId: UUID_DE_L_AMFITRIO, snippetChromeUrl: 'https://extensions.altre.test/snippet' });
    expect(m.capaDelPaquet().snippetChromeUrl).toBe('https://extensions.altre.test/snippet');
  });

  test('un tenant del paquet que no és UUID es descarta amb un avís «paquet»; el backend es queda', async () => {
    const m = await fresc();
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.fixaCapaDelPaquet({ supabaseUrl: 'https://paquet.supabase.test', tenantId: 'tenant-de-desenvolupament' });
    expect(m.capaDelPaquet()).toEqual({ supabaseUrl: 'https://paquet.supabase.test' });
    expect(avis.mock.calls.flat().join(' ')).toContain('«paquet»');
  });
});

describe('les capes de l’amfitrió, sense el paquet', () => {
  test('separaClausDelPaquet lleva cada forma del Model B i cada servei propi del contracte, i només eixes', async () => {
    const { separaClausDelPaquet } = await fresc();
    expect([...SERVEIS_PROPIS].sort()).toEqual(['botApiUrl', 'oauthRelayUrl', 'snippetChromeUrl', 'sollutiaIssuer', 'version']);
    for (const clau of CLAUS_FORA_DE_L_AMFITRIO) {
      const { neta, descartades } = separaClausDelPaquet(Object.freeze({ [clau]: 'x', nomPoble: 'Sella' }));
      expect(neta, clau).toEqual({ nomPoble: 'Sella' });
      expect(descartades, clau).toEqual([clau]);
    }
    // Les claus que el contracte dona a l'amfitrió passen totes, i la capa és la mateixa.
    const amfitrio = Object.fromEntries(C.clausDeConfig.amfitrio.map((clau) => [clau, 'valor']));
    const resultat = separaClausDelPaquet(amfitrio);
    expect(resultat.neta).toBe(amfitrio);
    expect(resultat.descartades).toEqual([]);
  });

  test('no muta la capa, posa el prefix, i un valor buit se’n va sense comptar com a descartat', async () => {
    const { separaClausDelPaquet } = await fresc();
    const capa = Object.freeze({ tenantId: UUID_DE_L_AMFITRIO, supabaseUrl: '  ', dataMode: null, backend: undefined, poble: 'sella' });
    expect(separaClausDelPaquet(capa, 'config.')).toEqual({ neta: { poble: 'sella' }, descartades: ['config.tenantId'] });
    expect(capa.tenantId).toBe(UUID_DE_L_AMFITRIO);
    for (const valor of [null, undefined, 'text', 42, ['tenantId']]) {
      expect(separaClausDelPaquet(valor), JSON.stringify(valor)).toEqual({ neta: {}, descartades: [] });
    }
  });

  test('avisaClausDescartades: un sol avís per canal i clau, amb l’id del contracte; _reiniciaAvisos els oblida', async () => {
    const { avisaClausDescartades, _reiniciaAvisos } = await fresc();
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(avisaClausDescartades('atributs', ['tenantId'])).toEqual(['tenantId']);
    expect(avisaClausDescartades('atributs', ['tenantId'])).toEqual([]);
    expect(avisaClausDescartades('atributs', [])).toEqual([]);
    expect(avisaClausDescartades('atributs', ['tenantId', 'supabaseUrl'])).toEqual(['supabaseUrl']);
    expect(avisaClausDescartades('config', ['tenantId'])).toEqual(['tenantId']);
    expect(avis).toHaveBeenCalledTimes(3);
    expect(avis.mock.calls[0][0]).toContain(C.id);
    expect(avis.mock.calls[0][0]).toContain('el canal «atributs» porta tenantId.');
    _reiniciaAvisos();
    expect(avisaClausDescartades('atributs', ['tenantId'])).toEqual(['tenantId']);
    expect(avis).toHaveBeenCalledTimes(4);
  });

  test('nomesDeLAmfitrio torna la capa neta i avisa una sola vegada', async () => {
    const { nomesDeLAmfitrio } = await fresc();
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const capa = { tenant_id: UUID_DE_L_AMFITRIO, backend_url: 'https://backend.amfitrio.test', language: 'es' };
    expect(nomesDeLAmfitrio(capa, 'propietat')).toEqual({ language: 'es' });
    expect(nomesDeLAmfitrio(capa, 'propietat')).toEqual({ language: 'es' });
    expect(avis).toHaveBeenCalledTimes(1);
    expect(avis.mock.calls[0][0]).toContain('«propietat» porta tenant_id, backend_url');
  });
});

describe('paritat amb el contracte (sdp.amfitrio.v1)', () => {
  /* Cada canal que jutja el validador, amb una sola clau. Són els mateixos
     que descarta el nucli: el global (PedraSecaEmbed.jsx avisa), l'arrel i el
     config de configura() per l'API o la cua (host.js), la propietat JS i les
     opcions de sessió (host.js:injectaSessio). */
  const CANALS = Object.freeze([
    ['propietat', (clau) => ({ propietats: [{ [clau]: 'x' }] })],
    ['configura, config.', (clau) => ({ configura: [{ config: { [clau]: 'x' } }] })],
    ['configura, arrel', (clau) => ({ configura: [{ [clau]: 'x' }] })],
    ['cua configura, config.', (clau) => ({ cua: [['configura', { config: { [clau]: 'x' } }]] })],
    ['cua configura, arrel', (clau) => ({ cua: [['configura', { [clau]: 'x' }]] })],
    ['global', (clau) => ({ global: { [clau]: 'x' } })],
    ['opcions de sessio', (clau) => ({ cua: [['sessio', { access_token: 'sintetic' }, { [clau]: 'x' }]] })]
  ]);

  test('el que el nucli descarta del Model B, el validador ho rebutja com a backend o tenant en tots els canals', () => {
    for (const [canal, declaracio] of CANALS) {
      for (const clau of CLAUS_DEL_MODEL_B) {
        const { errors, net } = validaDeclaracioAmfitrio(declaracio(clau));
        expect(errors.map((e) => e.codi), `${canal}: ${clau}`).toEqual([C.modelB.clausDeTenant.includes(clau) ? 'tenant' : 'backend']);
        expect(JSON.stringify(net), `${canal}: ${clau}`).not.toContain(`"${clau}"`);
      }
    }
    // configura({backend | backend_url | tenant_id}) és el mateix conjunt.
    for (const clau of C.configura.prohibides) expect(CLAUS_DEL_MODEL_B).toContain(clau);
  });

  test('els serveis propis que el nucli descarta, el validador tampoc no els admet en cap canal', () => {
    for (const [canal, declaracio] of CANALS) {
      for (const clau of SERVEIS_PROPIS) {
        const resultat = validaDeclaracioAmfitrio(declaracio(clau));
        expect(resultat.ok, `${canal}: ${clau}`).toBe(false);
        expect(JSON.stringify(resultat.net), `${canal}: ${clau}`).not.toContain(`"${clau}"`);
      }
    }
  });

  test('el nucli descarta exactament eixes claus, i cap de les que el contracte dona a l’amfitrió', async () => {
    const { separaClausDelPaquet } = await fresc();
    const tot = Object.fromEntries([...CLAUS_FORA_DE_L_AMFITRIO, ...C.clausDeConfig.amfitrio].map((clau) => [clau, 'x']));
    const { neta, descartades } = separaClausDelPaquet(tot);
    expect([...descartades].sort()).toEqual([...CLAUS_FORA_DE_L_AMFITRIO].sort());
    expect(Object.keys(neta).sort()).toEqual([...C.clausDeConfig.amfitrio].sort());
  });

  test('les claus de la capa del paquet són del Model B o serveis propis, de Sóc de Poble, mai de l’amfitrió', async () => {
    const { CLAUS_DEL_PAQUET } = await fresc();
    // L'única que no és del Model B és l'adreça de l'extensió del Snippet (CU).
    expect(CLAUS_DEL_PAQUET.filter((clau) => !CLAUS_DEL_MODEL_B.includes(clau))).toEqual(['snippetChromeUrl']);
    for (const clau of CLAUS_DEL_PAQUET) {
      expect([...CLAUS_DEL_MODEL_B, ...SERVEIS_PROPIS], clau).toContain(clau);
      expect(C.clausDeConfig.propiesDeSdP, clau).toContain(clau);
      expect(C.clausDeConfig.amfitrio, clau).not.toContain(clau);
    }
  });
});
