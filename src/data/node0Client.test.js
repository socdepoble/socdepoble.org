import { describe, expect, test, vi } from 'vitest';
import {
  ORIGEN_NODE_ZERO_DEFECTE,
  REL_NODEINFO_2_1,
  consultaEstatNode0,
  consultaNodeInfoNode0,
  consultaPublicacionsNode0,
  creaNode0Client,
  normalitzaEstatNode0,
  normalitzaOrigenNode0,
  sanejaPublicacioNode0
} from './node0Client.js';

const respostaJson = (body, { status = 200, redirected = false, contentType = 'application/json; charset=utf-8', contentLength = null } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  redirected,
  headers: {
    get(nom) {
      const k = String(nom).toLowerCase();
      if (k === 'content-type') return contentType;
      if (k === 'content-length') return contentLength;
      return null;
    }
  },
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
});

describe('node0Client · Connexió verificada opt-in de la SPA amb l’API del Node 0 (Fediversity)', () => {
  test('importar o crear el client no dispara cap petició de xarxa automàtica', () => {
    const fetchSpy = vi.fn();
    const client = creaNode0Client({ fetchImpl: fetchSpy });
    expect(client.origin).toBe(ORIGEN_NODE_ZERO_DEFECTE);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('normalitzaOrigenNode0 valida protocols, credencials i rutes', () => {
    expect(normalitzaOrigenNode0('https://socdepoble.cat')).toBe('https://socdepoble.cat');
    expect(normalitzaOrigenNode0('https://socdepoble.cat/')).toBe('https://socdepoble.cat');
    expect(normalitzaOrigenNode0('http://127.0.0.1:4120')).toBe('http://127.0.0.1:4120');
    expect(normalitzaOrigenNode0('http://localhost:3340')).toBe('http://localhost:3340');

    for (const invalid of [
      'http://socdepoble.cat',
      'https://user:pass@socdepoble.cat',
      'https://socdepoble.cat/api',
      'https://socdepoble.cat?x=1',
      'https://socdepoble.cat#hash',
      'javascript:alert(1)',
      ' https://socdepoble.cat ',
      ''
    ]) {
      expect(() => normalitzaOrigenNode0(invalid)).toThrow(TypeError);
    }
  });

  test('getStatus llig i normalitza /api/v1/node0/status amb PostgreSQL 17.11, 40 taules i 32 documents', async () => {
    const fetchMock = vi.fn(async (url, opts) => {
      expect(url).toBe('https://socdepoble.cat/api/v1/node0/status');
      expect(opts).toMatchObject({
        method: 'GET',
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      });
      return respostaJson({
        node: 'node0',
        postgresql: { ok: true, version: 'PostgreSQL 17.11', tables: 40, publicDocuments: 32, latencyMs: 4 },
        resilience: { ok: true, encryptedMirrorConfigured: true, status: 'ready' },
        activitypub: { active: true, signatureProfile: 'rfc9421-ed25519', remoteInteropVerified: false },
        ed25519: { fingerprint: 'abc123fingerprint' },
        mastodon: { account: '@depoble@mastodont.cat', outboundConfigured: true, outboundPublication: 'manual-confirmation' },
        capabilities: { publicRead: true, adminPublish: false, possePrepared: true, possePublish: false, userSessions: false }
      });
    });

    const estat = await consultaEstatNode0({ fetchImpl: fetchMock });
    expect(estat).toEqual({
      ok: true,
      offline: false,
      node: 'node0',
      postgresql: { ok: true, version: 'PostgreSQL 17.11', tables: 40, publicDocuments: 32, latencyMs: 4 },
      resilience: { ok: true, encryptedMirrorConfigured: true, status: 'ready' },
      activitypub: { active: true, signatureProfile: 'rfc9421-ed25519', remoteInteropVerified: false },
      ed25519: { fingerprint: 'abc123fingerprint' },
      mastodon: { account: '@depoble@mastodont.cat', outboundConfigured: true, outboundPublication: 'manual-confirmation' },
      capabilities: { publicRead: true, adminPublish: false, possePrepared: true, possePublish: false, userSessions: false }
    });
    expect(Object.isFrozen(estat)).toBe(true);
    expect(Object.isFrozen(estat.postgresql)).toBe(true);
  });

  test('getStatus fa fallback determinista davant error de xarxa, timeout, redirecció o esquema invàlid', async () => {
    const fetchOffline = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const offline = await consultaEstatNode0({ fetchImpl: fetchOffline });
    expect(offline.ok).toBe(false);
    expect(offline.offline).toBe(true);
    expect(offline.error).toBe('NODE0_UNREACHABLE');
    expect(offline.postgresql.ok).toBe(false);

    const fetchRedirect = vi.fn(async () => respostaJson({ node: 'node0' }, { redirected: true }));
    const redir = await consultaEstatNode0({ fetchImpl: fetchRedirect });
    expect(redir.ok).toBe(false);
    expect(redir.error).toBe('NODE0_REDIRECT_REJECTED');

    const fetchSlow = vi.fn((_url, { signal }) => new Promise((_res, rej) => {
      signal.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')));
    }));
    const timeoutRes = await consultaEstatNode0({ fetchImpl: fetchSlow, timeoutMs: 60 });
    expect(timeoutRes.ok).toBe(false);
    expect(timeoutRes.error).toBe('NODE0_TIMEOUT');
  });

  test('getPosts llig /api/v1/node0/posts, fa fallback a /api/v1/node0/mur en 404 i filtra claus privades o no públiques', async () => {
    const crides = [];
    const fetchMock = vi.fn(async (url) => {
      crides.push(url);
      if (url.endsWith('/api/v1/node0/posts')) {
        return respostaJson({ error: 'not_found' }, { status: 404 });
      }
      return respostaJson({
        feedPosts: [
          {
            id: 'post-manifest',
            title: 'Manifest de Poble',
            summary: 'Crònica fundacional',
            town_name: 'La Torre de les Maçanes',
            visibility: 'public',
            tags: ['Comunitat', 'Territori'],
            email: 'secret@example.com',
            privateKeyPem: 'PRIVATE'
          },
          {
            id: 'post-privat',
            title: 'Esborrany privat',
            visibility: 'private'
          }
        ],
        events: [
          {
            id: 'ev-aplec-2023',
            title: '2n Aplec pel Territori',
            date: '2023-09-29',
            visibility: 'public'
          }
        ],
        marketItems: []
      });
    });

    const resultat = await consultaPublicacionsNode0({ fetchImpl: fetchMock });
    expect(crides).toEqual([
      'https://socdepoble.cat/api/v1/node0/posts',
      'https://socdepoble.cat/api/v1/node0/mur'
    ]);
    expect(resultat.ok).toBe(true);
    expect(resultat.fallback).toBe(false);
    expect(resultat.posts).toHaveLength(2);
    expect(resultat.feedPosts).toHaveLength(1);
    expect(resultat.events).toHaveLength(1);
    expect(resultat.feedPosts[0]).toEqual({
      id: 'post-manifest',
      title: 'Manifest de Poble',
      summary: 'Crònica fundacional',
      town_name: 'La Torre de les Maçanes',
      visibility: 'public',
      tags: ['Comunitat', 'Territori']
    });
    expect(resultat.feedPosts[0].email).toBeUndefined();
    expect(resultat.feedPosts[0].privateKeyPem).toBeUndefined();
  });

  test('getPosts torna fallbackPosts quan el Node 0 no respon', async () => {
    const fallbackPosts = [{ id: 'local-1', title: 'Publicació de reserva', visibility: 'public' }];
    const resultat = await consultaPublicacionsNode0({
      fetchImpl: async () => { throw new Error('offline'); },
      fallbackPosts
    });
    expect(resultat).toEqual({
      ok: false,
      fallback: true,
      error: 'NODE0_UNREACHABLE',
      posts: [{ id: 'local-1', title: 'Publicació de reserva', visibility: 'public' }],
      feedPosts: [{ id: 'local-1', title: 'Publicació de reserva', visibility: 'public' }],
      events: [],
      marketItems: []
    });
  });

  test('getNodeInfo verifica /.well-known/nodeinfo i el document NodeInfo 2.1 del mateix origen', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === 'https://socdepoble.cat/.well-known/nodeinfo') {
        return respostaJson({
          links: [{ rel: REL_NODEINFO_2_1, href: 'https://socdepoble.cat/nodeinfo/2.1.json' }]
        });
      }
      if (url === 'https://socdepoble.cat/nodeinfo/2.1.json') {
        return respostaJson({
          version: '2.1',
          software: { name: 'socdepoble', version: '1.1.12' },
          protocols: ['activitypub'],
          openRegistrations: false
        });
      }
      return respostaJson({}, { status: 404 });
    });

    const info = await consultaNodeInfoNode0({ fetchImpl: fetchMock });
    expect(info).toEqual({
      ok: true,
      offline: false,
      href: 'https://socdepoble.cat/nodeinfo/2.1.json',
      nodeInfo: {
        version: '2.1',
        software: { name: 'socdepoble', version: '1.1.12' },
        protocols: ['activitypub'],
        openRegistrations: false
      }
    });

    const crossOriginFetch = vi.fn(async () => respostaJson({
      links: [{ rel: REL_NODEINFO_2_1, href: 'https://evil.example/nodeinfo/2.1.json' }]
    }));
    const cross = await consultaNodeInfoNode0({ fetchImpl: crossOriginFetch });
    expect(cross.ok).toBe(false);
    expect(cross.error).toBe('NODE0_CROSS_ORIGIN_NODEINFO');
  });

  test('sanejaPublicacioNode0 i normalitzaEstatNode0 rebutgen objectes amb prototip alterat o sense id', () => {
    expect(sanejaPublicacioNode0(null)).toBeNull();
    expect(sanejaPublicacioNode0({})).toBeNull();
    expect(sanejaPublicacioNode0(Object.create({ id: 'heretat' }))).toBeNull();
    expect(normalitzaEstatNode0(null)).toBeNull();
    expect(normalitzaEstatNode0({ node: 'altre' })).toBeNull();
  });
});
