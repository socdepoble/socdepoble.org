// @vitest-environment node
/* R22.1 (Gauntlet, P2 del Node 0) · El vídeo principal de capçalera
   (hero_video_url) no és una capacitat del Node 0. La Postgres del Node 0 ja
   porta la columna quan s'hi aplica 20261113060000 (el backend llig amb
   SELECT *), però el backend privat no l'admet en escriure (llistes blanques
   PROFILE i ORGANIZATION: unsupported_field). Abans, la fila arribava a
   l'editor amb la columna, admetVideoDeCapcalera donava true, s'oferia
   «Vincular vídeo» i cada desat fallava. Ara el client del Node 0:
   · no propaga la columna en cap lectura (getProfile, updateProfile,
     listMyOrganizations, createOrganization, updateOrganization), i el panell
     del vídeo no ix;
   · rebutja abans de la xarxa una escriptura que la porte ('sense-capacitat').
   La paritat amb el backend (tooling/node0, que no es toca): si un dia el
   backend l'admet, la prova de paritat falla i cal llevar-la de la llista. */
import { describe, expect, test } from 'vitest';
import { creaAdaptadorNodeZeroHttp } from './adaptadorNodeZeroHttp.js';
import { preparaClientPrivatNodeZero } from './clientPrivatNodeZero.js';
import { compilaOperacioNodeZero } from '../../../tooling/node0/backend-node0.mjs';
import { admetVideoDeCapcalera } from '../../sections/profile/perfilCamps.js';

const TOWN = 'ac3bec76-255b-5ca2-8886-28fcceab4267';
const PERSONA = Object.freeze({ id: '11111111-1111-4111-8111-111111111111', email: 'persona@example.invalid',
  email_confirmed_at: '2026-11-13T00:00:00Z', user_metadata: { full_name: 'Persona sintètica' } });
const ORG = '22222222-2222-4222-8222-222222222222';
const VIDEO = 'https://socdepoble.cat/media/video-sintetic.mp4';

/* El servidor de prova torna el que tornaria la Postgres del Node 0 amb la
   migració aplicada: la fila sencera, també hero_video_url. */
function fixture() {
  const crides = [];
  const status = { node: 'node0', postgresql: { ok: true }, capabilities: { userSessions: true, actorBinding: true, roleRead: true, createOrganization: true } };
  const publicAdapter = creaAdaptadorNodeZeroHttp({
    endpoint: 'https://socdepoble.cat/api/v1/node0', tenantId: TOWN,
    fetchImpl: async (url) => new Response(JSON.stringify(url.endsWith('/status') ? status : { towns: [], pages: [], agents: [] }),
      { headers: { 'Content-Type': 'application/json' } })
  });
  const perfil = { id: PERSONA.id, full_name: 'Persona sintètica', hero_url: '', hero_video_url: null };
  const org = { id: ORG, name: 'Forn sintètic', slug: 'forn-sintetic', kind: 'company', hero_url: '', hero_video_url: VIDEO };
  const transport = {
    async demanaAuth(action) {
      if (action === 'session') return { user: PERSONA };
      throw Object.assign(new Error('operation_unavailable'), { status: 501 });
    },
    async demanaPrivat(action, body) {
      crides.push(action);
      if (action === 'getProfile') return { ...perfil };
      if (action === 'updateProfile') return { ...perfil, ...body.updates };
      if (action === 'listMyOrganizations') return [{ ...org, role: 'gestor' }];
      if (action === 'createOrganization') return { ...org, ...body.organization };
      if (action === 'updateOrganization') return { ...org, ...body.updates };
      throw Object.assign(new Error('operation_unavailable'), { status: 501 });
    },
    destroy() {}
  };
  return { crides, opcions: { publicAdapter, transport, habilitaPrivat: true, emetCanvi: () => {} } };
}

describe('Node 0 · el vídeo de capçalera no s’oferix mentre el backend no el desa', () => {
  test('cap lectura propaga hero_video_url, i l’editor no ix amb el panell del vídeo', async () => {
    const { opcions } = fixture();
    const { adapter, privatActiu } = await preparaClientPrivatNodeZero(opcions);
    expect(privatActiu).toBe(true);

    const perfil = await adapter.getProfile();
    expect(perfil).toMatchObject({ id: PERSONA.id, full_name: 'Persona sintètica', hero_url: '' });
    expect(Object.hasOwn(perfil, 'hero_video_url')).toBe(false);
    expect(admetVideoDeCapcalera({ mena: 'persona', dades: perfil })).toBe(false);

    const [org] = await adapter.listMyOrganizations();
    expect(org).toMatchObject({ id: ORG, name: 'Forn sintètic', role: 'gestor' });
    expect(Object.hasOwn(org, 'hero_video_url')).toBe(false);
    expect(admetVideoDeCapcalera({ mena: 'empresa', dades: org })).toBe(false);

    for (const fila of [
      await adapter.updateProfile({ bio: 'Text sintètic' }),
      await adapter.updateOrganization(ORG, { lema: 'Lema sintètic' }),
      await adapter.createOrganization({ name: 'Grup sintètic', slug: 'grup-sintetic', kind: 'group', town_name: 'Poble sintètic' })
    ]) {
      expect(Object.hasOwn(fila, 'hero_video_url')).toBe(false);
    }
    adapter.destroy();
  });

  test('una escriptura amb hero_video_url es rebutja abans de la xarxa amb sense-capacitat', async () => {
    const { opcions, crides } = fixture();
    const { adapter } = await preparaClientPrivatNodeZero(opcions);
    await expect(adapter.updateProfile({ hero_video_url: VIDEO })).rejects.toMatchObject({ codi: 'sense-capacitat', retriable: false });
    await expect(adapter.updateOrganization(ORG, { hero_video_url: null })).rejects.toMatchObject({ codi: 'sense-capacitat' });
    expect(crides).toEqual([]);
    /* La resta de camps es desen com sempre. */
    await adapter.updateOrganization(ORG, { hero_url: '' });
    expect(crides).toEqual(['updateOrganization']);
    adapter.destroy();
  });

  test('paritat amb el backend privat: hero_video_url hi és unsupported_field (si l’admet, cal llevar-la de la llista del client)', () => {
    expect(() => compilaOperacioNodeZero('updateProfile', { updates: { hero_video_url: VIDEO } }, TOWN)).toThrow('unsupported_field');
    expect(() => compilaOperacioNodeZero('updateOrganization', { id: ORG, updates: { hero_video_url: VIDEO } }, TOWN)).toThrow('unsupported_field');
    /* Control: el camí de la foto de capçalera sí que hi és. */
    expect(() => compilaOperacioNodeZero('updateProfile', { updates: { hero_url: 'https://socdepoble.cat/media/portada.webp' } }, TOWN)).not.toThrow();
  });
});
