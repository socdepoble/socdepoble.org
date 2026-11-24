/**
 * r3287SeguretatClient.test.js — Verificació quirúrgica Lot 2 (Peix 1 i Peix 2 · R32.87):
 *   1. validaUrl (mapejadorSeccions.js): bloqueig de data:image/svg+xml, /\\evil.com i controls
 *      en mur (inclòs baseItem.image) i en mercat (variations).
 *   2. adoptaSessioExterna (identitat.js): sense spread cru `...user`, validació d'avatar_url
 *      i conservació d'entradaSessio() en reinjecció horària del mateix `sub` per l'amfitrió.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { adoptaSessioExterna, entradaSessio, esborraSessio, usuariDeSessio } from './identitat.js';
import { setRuntimePolicy } from '../config/runtimePolicy.js';

function jwtSintetic(payload) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signatura-test`;
}

describe('R32.87 Lot 2 · Seguretat client i Model B', () => {
  beforeAll(() => {
    setRuntimePolicy({
      auth: {
        issuer: 'https://auth.sollutia.example',
        audiences: ['authenticated'],
      },
    });
  });

  beforeEach(() => {
    esborraSessio();
  });

  it('mapejadorSeccions bloqueja data:image/svg+xml, barres inverses i caràcters de control en mur i mercat', () => {
    const mur = mapSectionSubmissionToItem({
      id: 'pub-svg-1',
      sectionId: 'mur',
      title: 'Prova seguretat mur',
      payload: {
        image: 'data:image/svg+xml,<svg onload=alert(1)>',
        video_url: '/\\evil.example/video.mp4',
      },
    });

    expect(mur.image).toBeNull();
    expect(mur.imageSrc).toBeNull();
    expect(mur.image_url).toBeNull();
    expect(mur.video_url).toBeUndefined();

    const mercat = mapSectionSubmissionToItem({
      id: 'pub-svg-2',
      sectionId: 'mercat',
      title: 'Prova seguretat mercat',
      payload: {
        variations: [
          { name: 'V1', image: 'data:image/svg+xml;base64,PHN2Zy8+' },
          { name: 'V2', image: '/assets/bo.webp\u0000' },
          { name: 'V3', image: 'data:image/png;base64,iVBORw0KGgo=' },
        ],
      },
    });

    expect(mercat.variations[0].image).toBeNull();
    expect(mercat.variations[1].image).toBeNull();
    expect(mercat.variations[2].image).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('adoptaSessioExterna descarta propietats top-level alienes i avatar_url maliciós', () => {
    const sub = '11111111-1111-4111-8111-111111111111';
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = jwtSintetic({ iss: 'https://auth.sollutia.example', aud: 'authenticated', sub, exp, email: 'vei@poble.cat' });

    const ok = adoptaSessioExterna({
      access_token: token,
      user: {
        id: sub,
        email: 'vei@poble.cat',
        role: 'service_role',
        app_metadata: { is_superadmin: true },
        avatar_url: 'javascript:alert(1)',
        user_metadata: {
          full_name: 'Maria del Mas',
          avatar_url: 'data:image/svg+xml,<svg onload=alert(1)>',
          extra_malicios: 'no-ha-de-passar',
        },
      },
    });

    expect(ok).toBe(true);
    const u = usuariDeSessio();
    expect(u.id).toBe(sub);
    expect(u.role).toBeUndefined();
    expect(u.app_metadata).toBeUndefined();
    expect(u.avatar_url).toBeUndefined();
    expect(u.user_metadata.full_name).toBe('Maria del Mas');
    expect(u.user_metadata.avatar_url).toBeUndefined();
    expect(u.user_metadata.extra_malicios).toBeUndefined();
  });

  it('adoptaSessioExterna conserva entradaSessio en refrescar JWT del mateix sub i l’incrementa si canvia de persona', () => {
    const subA = '22222222-2222-4222-8222-222222222222';
    const subB = '33333333-3333-4333-8333-333333333333';
    const exp = Math.floor(Date.now() / 1000) + 3600;

    const tokA1 = jwtSintetic({ iss: 'https://auth.sollutia.example', aud: 'authenticated', sub: subA, exp });
    const tokA2 = jwtSintetic({ iss: 'https://auth.sollutia.example', aud: 'authenticated', sub: subA, exp: exp + 1800 });
    const tokB1 = jwtSintetic({ iss: 'https://auth.sollutia.example', aud: 'authenticated', sub: subB, exp });

    expect(adoptaSessioExterna({ access_token: tokA1, user: { id: subA } })).toBe(true);
    const genInicial = entradaSessio();

    // Reinjecció horària del mateix sub per Sollutia: no ha de pujar la generació
    expect(adoptaSessioExterna({ access_token: tokA2, user: { id: subA } })).toBe(true);
    expect(entradaSessio()).toBe(genInicial);

    // Canvi real de persona: SÍ ha d'incrementar la generació
    expect(adoptaSessioExterna({ access_token: tokB1, user: { id: subB } })).toBe(true);
    expect(entradaSessio()).toBe(genInicial + 1);
  });
});
