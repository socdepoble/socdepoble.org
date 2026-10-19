/* Pla 261018_1605 (Tasca 3, D6; ordre del Mestre, 18-10-2026) ·
   esAvatarDeProveidorOAuth, el classificador únic de la foto d'un proveïdor
   d'entrada. No és cap filtre: esFontImatgeSegura i esFontImatgePropia diuen
   el mateix que abans per a estes fonts. */
import { describe, expect, it } from 'vitest';
import { esAvatarDeProveidorOAuth, esFontImatgePropia, esFontImatgeSegura } from './sanitize.js';

const DE_PROVEIDOR = [
  'https://lh3.googleusercontent.com/a/ACg8ocJ-foto=s96-c',
  'https://lh5.googleusercontent.com/-abc/photo.jpg',
  'https://yt3.ggpht.com/ytc/foto',
  'https://www.gravatar.com/avatar/0bc83cb571cd1c50ba6f3e8a78ef1346',
  'https://secure.gravatar.com/avatar/0bc83cb571cd1c50ba6f3e8a78ef1346',
  'https://gravatar.com/avatar/0bc83cb571cd1c50ba6f3e8a78ef1346',
  'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1',
  'https://graph.facebook.com/1/picture',
  'https://avatars.githubusercontent.com/u/1?v=4',
  '  https://LH3.GoogleUserContent.com/a/foto  '
];

const QUE_NO = [
  /* Nostres: un camí del mateix lloc, sdp-media, data:image. */
  '/assets/fotos/javi-llinares-perfil-1200px.jpg',
  'sdp-media://mitjans/poble/usuari/avatars/foto.webp',
  'data:image/png;base64,AAAA',
  /* Http pla, un altre port o un host que només s'hi assembla. */
  'http://lh3.googleusercontent.com/a/foto',
  'https://lh3.googleusercontent.com:8443/a/foto',
  'https://googleusercontent.com.atacant.example/a/foto',
  'https://atacantgoogleusercontent.com/a/foto',
  'https://evilgravatar.com/avatar/x',
  'https://fbsbx.com/foto',
  'https://lookaside.fbsbx.com/foto',
  'https://facebook.com/foto',
  'https://githubusercontent.com/u/1',
  'https://raw.githubusercontent.com/u/1',
  'https://exemple.example/foto.png',
  /* Res, o res que siga text. */
  '', '   ', null, undefined, 42, {}, 'no és cap url'
];

describe('esAvatarDeProveidorOAuth', () => {
  it('reconeix la foto de Google, Gravatar, Facebook i GitHub (https, port per defecte)', () => {
    for (const url of DE_PROVEIDOR) expect(esAvatarDeProveidorOAuth(url), url).toBe(true);
  });

  it('no reconeix cap font pròpia, cap http pla, cap altre port ni cap host que només s’hi assembla', () => {
    for (const url of QUE_NO) expect(esAvatarDeProveidorOAuth(url), String(url)).toBe(false);
  });

  it('no canvia els dos filtres: una foto de proveïdor no és pròpia, i les d’ORIGENS_OAUTH continuen sent segures', () => {
    for (const url of DE_PROVEIDOR) expect(esFontImatgePropia(url), url).toBe(false);
    for (const url of [
      'https://lh3.googleusercontent.com/a/foto', 'https://platform-lookaside.fbsbx.com/p',
      'https://graph.facebook.com/1/picture', 'https://avatars.githubusercontent.com/u/1'
    ]) expect(esFontImatgeSegura(url), url).toBe(true);
    /* Les que no són d'ORIGENS_OAUTH no hi entren pel classificador nou. */
    for (const url of ['https://yt3.ggpht.com/ytc/foto', 'https://www.gravatar.com/avatar/x', 'https://lh5.googleusercontent.com/-abc/photo.jpg']) {
      expect(esFontImatgeSegura(url), url).toBe(false);
    }
  });
});
