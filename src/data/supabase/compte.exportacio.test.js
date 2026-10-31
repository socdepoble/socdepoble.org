/* P2-08 (pla 261024_1315, T7; auditoria Codex C-04) i P2-09 (Lot 4, D06/D07) ·
   L'adaptador no retalla l'exportació ampliada de la migració 2610241410: el
   format continua sent el v1 i les claus noves (moderacio, seguiments, apple,
   no_inclou i, dins del xat, adjunts_propis i les columnes noves dels missatges)
   arriben tal qual, també l'àudio sense peu, que només té la referència a
   metadades.adjunt. En canvi, a `federacio_no_versionada` (P2-09), l'adaptador
   aplica el contracte explícit de propietat i columnes per recurs (`realms`,
   `user_realms`, `connections`, `posts`) perquè cap fila aliena colada per
   inferència d'UUID ni cap columna fora del contracte puga filtrar-se. */
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => () => {} }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: () => ({ hasSupabaseConfig: true }), rpc: m.rpc }));
vi.mock('./auth.js', () => ({ asseguraUsuari: async () => ({ id: 'A' }), logout: vi.fn() }));
import { exportaLesMeuesDades } from './compte.js';

const AUDIO = '0b6f6a54-6b0e-4b8a-9f3c-6f1d2a3b4c5d';
const AMPLIADA = Object.freeze({
  format: 'socdepoble.exportacio.v1',
  perfil: { id: 'A' },
  xat: {
    adjunts_propis: [{ id: AUDIO, fil_id: 'F', mime: 'audio/webm', bytes: 4096, durada_ms: 3200, versio: 'v1', publicat: true,
      creat_al: '2026-10-24T10:00:00Z', bucket: 'xat_adjunts', nom: AUDIO }],
    converses: [{ fil_id: 'F', titol: null, tipus: 'directe', rol: 'membre', avisos: 'tots', creada_per_mi: true }],
    missatges_propis: [{ fil_id: 'F', text: null, creat_al: '2026-10-24T10:00:01Z', id: AUDIO, seq: 7, tipus: 'veu',
      metadades: { adjunt: { id: AUDIO, bytes: 4096, mime: 'audio/webm', duradaMs: 3200 } }, esborrat_per_mi: false }],
    lectures: []
  },
  moderacio: {
    denuncies_fetes: [{ id: 'D', objecte_tipus: 'missatge', motiu: 'spam_frau', estat: 'pendent', empremta_ip_desada: true }],
    /* Correccions 261024 (R2-02, R3-07): la forma de 2610241410, només les que han acabat amb una mesura. */
    denuncies_rebudes: { amb_mesura: 1 },
    bloquejos: [{ tipus: 'persona', id: 'B', nom: 'Bet', al: '2026-10-20T10:00:00Z' }],
    normes_acceptades: [{ versio: '2026-10-20', acceptada_al: '2026-10-20T10:00:00Z', empremta_ip_desada: false }]
  },
  seguiments: { seguits: [{ tipus: 'entitat', id: 'O', des_de: '2026-10-24T09:00:00Z', reactivat_al: null }], total_seguidors: 3 },
  apple: { autoritzacio_desada_al: '2026-10-24T08:00:00Z' },
  no_inclou: [{ que: 'qui t’ha bloquejat', per_que: 'bloquejar no avisa ningú' }],
  fitxers: [],
  federacio_no_versionada: {}
});

beforeEach(() => { m.rpc.mockReset(); });

test('l’exportació ampliada arriba sencera, amb l’àudio sense peu i la seua referència', async () => {
  m.rpc.mockResolvedValueOnce(structuredClone(AMPLIADA));
  const dades = await exportaLesMeuesDades();
  expect(dades).toEqual(AMPLIADA);
  const [audio] = dades.xat.missatges_propis;
  expect(audio.text).toBeNull();
  expect(audio.metadades.adjunt.id).toBe(dades.xat.adjunts_propis[0].nom);
  expect(m.rpc.mock.calls[0][0]).toBe('exporta_les_meues_dades');
});

test('sense la moderació, els seguiments ni Apple aplicats (claus null), l’exportació continua sent vàlida', async () => {
  const sense = { ...structuredClone(AMPLIADA), moderacio: null, seguiments: null, apple: null };
  m.rpc.mockResolvedValueOnce(sense);
  expect(await exportaLesMeuesDades()).toEqual(sense);
});

test('P2-09 · filtra files alienes colades per inferència d’UUID a federacio_no_versionada i retalla columnes no autoritzades', async () => {
  const ambFederacio = {
    ...structuredClone(AMPLIADA),
    federacio_no_versionada: {
      realms: [
        { id: 'R1', owner_user_id: 'A', slug: 'la-torre', name: 'La Torre', private_key: 'SECRET' },
        { id: 'R2', owner_user_id: 'ALTRE', moderator_id: 'A', slug: 'alie', name: 'Aliè' }
      ],
      user_realms: [
        { id: 'UR1', user_id: 'A', realm_id: 'R1', role: 'member', invited_by: 'ALTRE' },
        { id: 'UR2', user_id: 'ALTRE', realm_id: 'R1', role: 'member', invited_by: 'A' }
      ],
      connections: [
        { id: 'C1', user_id: 'A', target_user_id: 'ALTRE', status: 'active', access_token: 'TOKEN' },
        { id: 'C2', user_id: 'ALTRE', target_user_id: 'A', status: 'active' }
      ],
      posts: [
        { id: 'P1', author_id: 'A', reply_to_user_id: 'ALTRE', content: 'Bon dia poble', ip_hash: 'HASH' },
        { id: 'P2', author_id: 'ALTRE', reply_to_user_id: 'A', content: 'Resposta d’un altre' }
      ],
      taula_desconeguda: [{ id: 'X', user_id: 'A' }]
    }
  };
  m.rpc.mockResolvedValueOnce(ambFederacio);
  const dades = await exportaLesMeuesDades();
  expect(dades.federacio_no_versionada).toEqual({
    realms: [{ id: 'R1', owner_user_id: 'A', slug: 'la-torre', name: 'La Torre' }],
    user_realms: [{ id: 'UR1', user_id: 'A', realm_id: 'R1', role: 'member' }],
    connections: [{ id: 'C1', user_id: 'A', status: 'active' }],
    posts: [{ id: 'P1', author_id: 'A', content: 'Bon dia poble' }]
  });
});
