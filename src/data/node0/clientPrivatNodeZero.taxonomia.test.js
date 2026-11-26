// @vitest-environment node
/* v1.2.26 · R2-2 · IDEA-365 (regla 1 de les 21:40: zero peces sense destí) · C26-1 #12 al tercer escriptor.
   El Node 0 aplica la mateixa frontera d'escriptura que Supabase i el port local (utils/publicacioSistema.js):
   · el client (clientPrivatNodeZero.js) normalitza el llegat i refusa una llista buida ABANS de la xarxa;
   · el transport (sessioNodeZeroHttp.js) tradueix el 400 «invalid_system_categories» del backend al mateix
     rebuig, code 'SDP-TAXONOMIA-DESTI'.
   El transport és el real (creaSessioNodeZeroHttp) amb un fetch fals que respon amb el backend privat real
   (tooling/node0/backend-node0.mjs · creaBackendPrivatNodeZero) i una base de dades falsa: cap Postgres, cap xarxa. */
import { describe, expect, test } from 'vitest';
import { creaAdaptadorNodeZeroHttp } from './adaptadorNodeZeroHttp.js';
import { preparaClientPrivatNodeZero } from './clientPrivatNodeZero.js';
import { creaSessioNodeZeroHttp } from './sessioNodeZeroHttp.js';
import { CASOS, contextDeConformitat, executaCas } from '../conformitat/kit.js';
import { creaBackendPrivatNodeZero } from '../../../tooling/node0/backend-node0.mjs';
import { NODE0_AUTH_COOKIE, NODE0_AUTH_TENANT } from '../../../tooling/node0/auth-node0.mjs';

const ORIGIN = 'https://socdepoble.cat';
const ENDPOINT = `${ORIGIN}/api/v1/node0`;
const PERSONA = Object.freeze({ id: '11111111-1111-4111-8111-111111111111', email: 'persona@example.invalid',
  email_confirmed_at: '2026-11-13T00:00:00Z', user_metadata: { full_name: 'Persona sintètica' } });
// Un testimoni de sessió sintètic amb la forma que exigix el backend (43 caràcters base64url); no és de ningú.
const COOKIE = `${NODE0_AUTH_COOKIE}=${'s'.repeat(43)}`;
const TITOL_IDEA_365 = 'IDEA-365: appendSectionSubmissionNetworkOnly rebutja categoriesSistema buida sense publicar';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/* Un fetch que fa de servidor: /status i /auth/session sintètics, i /private/<acció> pel backend privat real.
   `respostaPrivada` permet substituir el backend (p. ex. un servidor amb una regla més estricta). */
function servidor({ respostaPrivada = null, db = null } = {}) {
  const peticions = [], consultes = [];
  const backend = creaBackendPrivatNodeZero({ tenantId: NODE0_AUTH_TENANT, origin: ORIGIN,
    db: db ?? { query: async (sql) => { consultes.push(sql); throw new Error('db-no-esperada'); } } });
  const fetchImpl = async (url, init = {}) => {
    const cami = String(url).slice(ENDPOINT.length);
    if (cami === '/status') return json({ node: 'node0', postgresql: { ok: true },
      capabilities: { userSessions: true, actorBinding: true, roleRead: true, sectionSubmissions: true } });
    if (cami === '/auth/session') return json({ user: PERSONA });
    const privada = /^\/private\/([A-Za-z]+)$/.exec(cami);
    if (!privada) return json({ towns: [], pages: [], agents: [] });
    const body = JSON.parse(init.body);
    peticions.push({ action: privada[1], body });
    if (respostaPrivada) return respostaPrivada(privada[1], body);
    const resposta = await backend.handle(privada[1], { body, headers: { origin: ORIGIN, cookie: COOKIE,
      'x-sdp-expected-actor': init.headers?.['X-SDP-Expected-Actor'] } });
    return json(resposta.body, resposta.status);
  };
  return { fetchImpl, peticions, consultes };
}

async function adaptador(opcions) {
  const { fetchImpl, peticions, consultes } = servidor(opcions);
  const publicAdapter = creaAdaptadorNodeZeroHttp({ endpoint: ENDPOINT, tenantId: NODE0_AUTH_TENANT, fetchImpl });
  const transport = creaSessioNodeZeroHttp({ endpoint: ENDPOINT, origin: ORIGIN, fetchImpl });
  const { adapter, privatActiu } = await preparaClientPrivatNodeZero({ publicAdapter, transport, habilitaPrivat: true, emetCanvi: () => {} });
  expect(privatActiu).toBe(true);
  expect(adapter.operacions.publicacions).toBe(true);
  return { adapter, transport, peticions, consultes };
}

const casIdea365 = () => {
  const cas = CASOS.find((c) => c.titol === TITOL_IDEA_365);
  expect(cas, `falta el cas «${TITOL_IDEA_365}» a conformitat/kit.js`).toBeDefined();
  return cas;
};
const contextAmbEscriptures = () => {
  const ctx = contextDeConformitat({ escriptures: true, escenaris: { publicacioOperativa: true } });
  ctx.ownerUserId = PERSONA.id;
  return ctx;
};

describe('Node 0 · IDEA-365 · zero peces sense destí, com Supabase i el port local', () => {
  test('el cas del kit de conformitat passa sobre l’adaptador del Node 0: rebutja abans de la xarxa', async () => {
    const { adapter, peticions, consultes } = await adaptador();
    const resultat = await executaCas(casIdea365(), adapter, contextAmbEscriptures());
    expect(resultat).toEqual({ estat: 'ok', falles: [], motiu: null });
    // La frontera del client refusa la llista buida: ni petició al backend ni SQL.
    expect(peticions).toEqual([]);
    expect(consultes).toEqual([]);
    adapter.destroy();
  });

  test('el 400 real del backend («invalid_system_categories») arriba al transport com a SDP-TAXONOMIA-DESTI', async () => {
    const { adapter, transport, peticions, consultes } = await adaptador();
    const submission = { id: '33333333-3333-4333-8333-333333333333', sectionId: 'mur', title: 'No es publica', payload: { categoriesSistema: [] } };
    const error = await transport.demanaPrivat('appendSectionSubmissionNetworkOnly', { submission }, { expectedActor: PERSONA.id })
      .then(() => null, (motiu) => motiu);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'SDP-TAXONOMIA-DESTI', codi: 'SDP-TAXONOMIA-DESTI', status: 400,
      serverCode: 'invalid_system_categories', message: 'Cal almenys una Categoria de Sistema vàlida per publicar.' });
    // El mateix oracle del kit accepta este rebuig, i el backend no ha tocat la base de dades.
    expect(casIdea365().comprova(error, contextAmbEscriptures())).toEqual([]);
    expect(peticions.map((p) => p.action)).toEqual(['appendSectionSubmissionNetworkOnly']);
    expect(consultes).toEqual([]);
    adapter.destroy();
  });

  test('si el servidor refusa una publicació que el client ha deixat passar, l’adaptador dona el mateix rebuig', async () => {
    const { adapter, peticions } = await adaptador({
      respostaPrivada: () => json({ error: 'invalid_system_categories' }, 400)
    });
    const id = '44444444-4444-4444-8444-444444444444';
    const error = await adapter.appendSectionSubmissionNetworkOnly({ id, sectionId: 'mur', title: 'Llegat', payload: { title: 'Llegat' } })
      .then(() => null, (motiu) => motiu);
    expect(error).toMatchObject({ code: 'SDP-TAXONOMIA-DESTI', status: 400, requestId: id });
    expect(casIdea365().comprova(error, contextAmbEscriptures())).toEqual([]);
    // El llegat sense camp ix del client amb el destí real de la secció (Mur), com a Supabase i al port local.
    expect(peticions).toHaveLength(1);
    expect(peticions[0].body.submission.payload.categoriesSistema).toEqual(['Mur']);
    adapter.destroy();
  });

  test('només el 400 «invalid_system_categories» es tradueix; cap altre codi ni estat no el fabrica', async () => {
    for (const [status, body, esperat] of [
      [400, { error: 'invalid_fields' }, 'NODE0_HTTP'],
      [500, { error: 'invalid_system_categories' }, 'NODE0_HTTP'],
      [400, { error: 'codi_desconegut' }, 'NODE0_HTTP'],
      [403, { error: 'invalid_system_categories' }, 'sense-permis']
    ]) {
      const { adapter, transport } = await adaptador({ respostaPrivada: () => json(body, status) });
      const error = await transport.demanaPrivat('appendSectionSubmissionNetworkOnly',
        { submission: { sectionId: 'mur', payload: { categoriesSistema: ['Mur'] } } }, { expectedActor: PERSONA.id }).then(() => null, (motiu) => motiu);
      expect(error, `${status} ${body.error}`).toMatchObject({ code: esperat, status });
      expect(error.serverCode, `${status} ${body.error}`).toBe(body.error === 'codi_desconegut' ? undefined : body.error);
      adapter.destroy();
    }
  });

  test('una consulta de nota no publica: no valida destins i arriba al servidor tal com és', async () => {
    const { adapter, peticions } = await adaptador({ respostaPrivada: () => json(null) });
    const consulta = { sectionId: 'mur', noteId: '55555555-5555-4555-8555-555555555555', operationId: '66666666-6666-4666-8666-666666666666',
      expectedNoteRevision: 1, consulta: true, payload: { categoriesSistema: [] } };
    await expect(adapter.appendSectionSubmissionNetworkOnly(consulta)).resolves.toBeNull();
    expect(peticions).toHaveLength(1);
    expect(peticions[0].body.submission.consulta).toBe(true);
    adapter.destroy();
  });
});
