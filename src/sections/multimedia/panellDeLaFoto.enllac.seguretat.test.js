// @vitest-environment node
/* Ordre del Mestre (30-10-2026, B3) · Gauntlet 261030, f4b
   (f4b-fronteres-fora-del-precommit) · La frontera de privacitat de «Copiar
   l’enllaç de la imatge» (enllacPublicDe i la fila «Enllaç de la imatge» de
   panellDeLaFoto.js): mai un arxiu local (ids opacs __lf_ i __lc_, blob:,
   data:, file:, camins del disc), mai una referència opaca del port
   (sdp-media://) ni la seua URL signada (token=), mai un altre origen ni un
   camí fora de /assets/; sense origen de la pàgina, o amb un resolutor que no
   torna una URL http(s), cap enllaç. Estos casos vivien a
   panellDeLaFoto.test.js, que el pre-commit (vitest.precommit.config.js) no
   executa: sense la guarda dels ids locals, la de l'origen o la de /assets/,
   `npm run test:precommit` continuava verd. Són purs, tarden mil·lisegons i
   entren al pre-commit pel nom (*.seguretat.test.js); la guarda
   src/config/precommit.cobertura.seguretat.test.js vigila que no en tornen a
   eixir. La URL bona i la fila traduïda es queden a panellDeLaFoto.test.js, i
   el botó del visor (VisorDeLArxiu.test.jsx), a la suite sencera. */
import { describe, expect, test } from 'vitest';
import { fixaBaseRecursos, fixaPoliticaDeMitjans, resolRecursPropi } from '../../config/assetResolver.js';
import { enllacPublicDe, filesDelPanell } from './panellDeLaFoto.js';

const ORIGEN = 'http://localhost:3340';
const SENSE_ENLLAC = 'No té cap enllaç públic d’este lloc';

describe('enllacPublicDe (B3) · privacitat', () => {
  test('privacitat: cap arxiu local, cap camí del disc, cap blob:, cap referència opaca ni URL signada, cap altre origen', () => {
    const SIGNADA = 'https://abc.supabase.co/storage/v1/object/sign/mitjans_privats/t/u/avatars/a.webp?token=SECRET';
    const casos = [
      [{ id: '__lf_9x7k2', src: '/assets/img/pi.jpg' }, '__lf_ (id opac d’un arxiu local)'],
      [{ id: '__lc_4p', src: '/assets/img/pi.jpg' }, '__lc_ (id opac d’una carpeta local)'],
      [{ id: 'x', src: 'blob:http://localhost:3340/3f2a9c1e-8b7d-4e21-9a0f-0c5d6e7f8a9b' }, 'blob:'],
      [{ id: 'x', src: 'data:image/png;base64,iVBORw0KGgo=' }, 'data:'],
      [{ id: 'x', src: 'file:///Users/javi/Pictures/IMG_0001.jpg' }, 'file:'],
      [{ id: 'x', src: '/Users/javi/Pictures/IMG_0001.jpg' }, 'camí del disc (macOS)'],
      [{ id: 'x', src: 'C:\\Users\\javi\\Pictures\\IMG_0001.jpg' }, 'camí del disc (Windows)'],
      [{ id: 'x', src: '\\\\servidor\\fotos\\IMG_0001.jpg' }, 'camí de xarxa'],
      [{ id: 'x', src: 'Pictures/IMG_0001.jpg' }, 'camí relatiu'],
      [{ id: 'x', src: 'sdp-media://mitjans_privats/t/u/avatars/a.webp', srcDelPort: SIGNADA }, 'bucket privat amb URL signada'],
      [{ id: 'x', src: 'sdp-media://mitjans/t/u/avatars/a.webp', srcDelPort: 'https://abc.supabase.co/storage/v1/object/public/mitjans/t/u/avatars/a.webp' }, 'bucket públic'],
      [{ id: 'x', src: ' SDP-MEDIA://mitjans/t/u/a.webp' }, 'referència opaca en majúscules'],
      [{ id: 'x', src: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Tibi.jpg' }, 'un altre origen'],
      [{ id: 'x', src: 'https://altre.example/assets/x.jpg' }, 'un altre origen dins de /assets/'],
      [{ id: 'x', src: 'https://abc.supabase.co/storage/v1/object/public/mitjans/t/u/a.webp' }, 'el Storage'],
      [{ id: 'x', src: 'http://localhost:3340/api/privat/x.jpg' }, 'el mateix origen fora de /assets/'],
      [{ id: 'x', src: 'http://usuari:clau@localhost:3340/assets/x.jpg' }, 'credencials'],
      [{ id: 'x', src: '//altre.example/assets/x.jpg' }, 'protocol relatiu'],
      [{ id: 'x', src: '/\\altre.example/assets/x.jpg' }, 'barra inversa'],
      [{ id: 'x', src: '/assets/../Users/javi/x.jpg' }, '.. que ix de /assets/'],
      [{ id: 'x', src: '/assets/%2e%2e/privat/x.jpg' }, '%2e%2e que ix de /assets/'],
      [{ id: 'x', src: '/assets/\tx.jpg' }, 'caràcter de control'],
      [{ id: 'x', src: 'javascript:alert(1)' }, 'javascript:'],
      [{ id: 'x' }, 'sense src'],
      [null, 'sense element']
    ];
    for (const [item, motiu] of casos) {
      expect([motiu, enllacPublicDe(item, { origen: ORIGEN })]).toEqual([motiu, null]);
      if (!item) continue;
      /* Ordre del Mestre (30-10-2026, prompt 2208, T4.2) · A l'Arxiu (avisSenseEnllac), el text; fora, cap fila. */
      const fila = filesDelPanell(item, { origenPagina: ORIGEN, avisSenseEnllac: true }).find((f) => f.clau === 'enllac');
      expect([motiu, fila]).toEqual([motiu, { clau: 'enllac', etiqueta: 'Enllaç de la imatge', valor: SENSE_ENLLAC }]);
      expect([motiu, filesDelPanell(item, { origenPagina: ORIGEN }).some((f) => f.clau === 'enllac')]).toEqual([motiu, false]);
      for (const avisSenseEnllac of [false, true]) {
        const text = JSON.stringify(filesDelPanell(item, { origenPagina: ORIGEN, avisSenseEnllac }));
        for (const fuga of ['blob:', 'file:', '/Users/', 'C:\\\\', 'token=', 'supabase.co', 'sdp-media', 'SDP-MEDIA', 'wikimedia']) {
          expect([motiu, avisSenseEnllac, fuga, text.includes(fuga)]).toEqual([motiu, avisSenseEnllac, fuga, false]);
        }
      }
    }
  });

  test('sense origen de la pàgina (o un que no és http/https), cap enllaç; un resolutor que no torna una URL http(s), tampoc', () => {
    const item = { id: 'x', src: '/assets/img/pi.jpg' };
    for (const origen of [null, '', 'capacitor://localhost', 'null', 'file:///Users/javi/', 'http://usuari:clau@localhost:3340']) {
      expect([origen, enllacPublicDe(item, { origen })]).toEqual([origen, null]);
    }
    for (const resolt of ['blob:http://localhost:3340/u', 'data:image/png;base64,AAAA', 'capacitor://localhost/assets/img/pi.webp', '', '  ', null, 42, '/assets/\nx.jpg']) {
      expect([resolt, enllacPublicDe(item, { origen: ORIGEN, resol: () => resolt })]).toEqual([resolt, null]);
    }
    // Un src amb caràcters de control o barra inversa no passa, encara que el resolutor el torne net.
    for (const src of ['/assets/\tx.jpg', '/assets/x\n.jpg', '/assets\\x.jpg']) {
      expect([src, enllacPublicDe({ id: 'x', src }, { origen: ORIGEN, resol: () => '/assets/x.jpg' })]).toEqual([src, null]);
    }
  });

  test('la guarda distingix: un recurs públic de /assets/ del mateix origen sí que porta l’enllaç', () => {
    expect(enllacPublicDe({ id: 'x', src: '/assets/img/pi.jpg' }, { origen: ORIGEN })).toBe(`${ORIGEN}/assets/img/pi.jpg`);
    const fila = filesDelPanell({ id: 'x', src: '/assets/img/pi.jpg' }, { origenPagina: ORIGEN }).find((f) => f.clau === 'enllac');
    expect(fila).toEqual({ clau: 'enllac', etiqueta: 'Enllaç de la imatge', valor: `${ORIGEN}/assets/img/pi.jpg`, enllac: `${ORIGEN}/assets/img/pi.jpg` });
  });

  /* Gauntlet 261030 (f4b, B3-AMFITRIO-FALS-NEGATIU) · Dins d'un amfitrió, la
     forma ja resolta d'un recurs propi (resolRecursPropi de veres, amb la base
     del paquet o la política de mitjans) porta el mateix enllaç que la crua, i
     res més: la resta de la frontera no es mou. */
  test('dins d’un amfitrió, només la forma resolta exacta d’un /assets/ propi; cap altre origen, camí ni arxiu local', () => {
    const PAGINA = 'https://poble.example';
    const PAQUET = 'https://poble.example/wp-content/plugins/soc-de-poble/dist';
    const CAMI = '/wp-content/plugins/soc-de-poble/dist';
    const FUGUES = ['blob:', '/Users/', 'token=', 'sdp-media', 'wp-config', 'wp-admin', 'privat', 'altre.example'];
    const comprova = (casos) => {
      for (const [item, motiu] of casos) {
        expect([motiu, enllacPublicDe(item, { origen: PAGINA, resol: resolRecursPropi })]).toEqual([motiu, null]);
        const text = JSON.stringify(filesDelPanell(item, { origenPagina: PAGINA, resol: resolRecursPropi }));
        for (const fuga of FUGUES) expect([motiu, fuga, text.includes(fuga)]).toEqual([motiu, fuga, false]);
      }
    };
    try {
      fixaBaseRecursos(PAQUET);
      expect(enllacPublicDe({ id: 'x', src: `${PAQUET}/assets/a.jpg` }, { origen: PAGINA, resol: resolRecursPropi })).toBe(`${PAQUET}/assets/a.jpg`);
      comprova([
        [{ id: '__lf_9x7k2', src: `${PAQUET}/assets/img/pi.jpg` }, 'id opac d’un arxiu local'],
        [{ id: 'x', src: `${PAQUET}/wp-config.php` }, 'el paquet fora de /assets/'],
        [{ id: 'x', src: `${PAQUET}/assets/../../../../wp-admin/x.jpg` }, '.. que ix de <base>/assets/'],
        [{ id: 'x', src: `${PAQUET}/assets/%2e%2e/%2e%2e/wp-admin/x.jpg` }, '%2e%2e que ix de <base>/assets/'],
        [{ id: 'x', src: `${PAQUET}x/assets/a.jpg` }, 'una carpeta germana que comença igual'],
        [{ id: 'x', src: 'https://poble.example/wp-content/uploads/privat/assets/a.jpg' }, 'una altra carpeta /assets/ del mateix origen'],
        [{ id: 'x', src: 'https://altre.example/wp-content/plugins/soc-de-poble/dist/assets/a.jpg' }, 'un altre origen amb el mateix camí'],
        [{ id: 'x', src: 'https://usuari:clau@poble.example/wp-content/plugins/soc-de-poble/dist/assets/a.jpg' }, 'credencials'],
        [{ id: 'x', src: 'https://abc.supabase.co/storage/v1/object/sign/mitjans_privats/a.webp?token=SECRET' }, 'URL signada'],
        [{ id: 'x', src: 'sdp-media://mitjans/t/u/a.webp', srcDelPort: `${PAQUET}/assets/a.webp` }, 'referència opaca del port'],
        [{ id: 'x', src: `blob:${PAGINA}/3f2a9c1e` }, 'blob:'],
        [{ id: 'x', src: '/Users/javi/Pictures/IMG_0001.jpg' }, 'camí del disc']
      ]);
      fixaBaseRecursos(CAMI);
      expect(enllacPublicDe({ id: 'x', src: `${CAMI}/assets/a.jpg` }, { origen: PAGINA, resol: resolRecursPropi })).toBe(`${PAGINA}${CAMI}/assets/a.jpg`);
      comprova([
        [{ id: 'x', src: `${CAMI}/../privat/assets/a.jpg` }, 'un camí que ix de la base'],
        [{ id: 'x', src: '/wp-content/uploads/privat/assets/a.jpg' }, 'una altra carpeta /assets/ del lloc'],
        [{ id: 'x', src: `https://altre.example${CAMI}/assets/a.jpg` }, 'un altre origen amb el camí de la base']
      ]);
      fixaBaseRecursos('/');
      fixaPoliticaDeMitjans({ origen: 'https://socdepoble.org', externs: ['assets/uploads/'], bessones: [] });
      expect(enllacPublicDe({ id: 'x', src: 'https://socdepoble.org/assets/uploads/a.jpg' }, { origen: PAGINA, resol: resolRecursPropi })).toBe('https://socdepoble.org/assets/uploads/a.jpg');
      comprova([
        [{ id: 'x', src: 'https://socdepoble.org/assets/privat/a.jpg' }, 'l’origen extern fora de les carpetes externes'],
        [{ id: 'x', src: 'https://socdepoble.org/privat/assets/uploads/a.jpg' }, 'l’origen extern amb /assets/ al mig']
      ]);
    } finally {
      fixaBaseRecursos('/');
      fixaPoliticaDeMitjans(null);
    }
  });
});
