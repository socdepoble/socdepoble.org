import { afterEach, describe, it, expect, vi } from 'vitest';
import { sanitizeHtml, esFontImatgeSegura, esFontImatgePropia, fontImatgePropia, permetOrigenMitjans } from './sanitize.js';
import { fixaBaseRecursos, resolRecursPropi } from '../config/assetResolver.js';

describe('sanitize.js', () => {
  describe('esFontImatgeSegura', () => {
    it('accepta sdp-media://mitjans_privats/', () => {
      expect(esFontImatgeSegura('sdp-media://mitjans_privats/123/foto.jpg')).toBe(true);
    });

    it('accepta sdp-media://mitjans/', () => {
      expect(esFontImatgeSegura('sdp-media://mitjans/123/foto.jpg')).toBe(true);
    });

    it('rebutja sdp-media://un_altre_bucket/', () => {
      expect(esFontImatgeSegura('sdp-media://un_altre_bucket/foto.jpg')).toBe(false);
    });

    it('rebutja rutes http externes no llistades', () => {
      expect(esFontImatgeSegura('http://evilsite.com/foto.jpg')).toBe(false);
    });

    it('accepta data URIs', () => {
      expect(esFontImatgeSegura('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')).toBe(true);
    });

    /* Decisió 3 del Mestre (261007) · El mode estricte del Mur no canvia el
       filtre de sempre: els avatars OAuth continuen valent per al sanejador,
       Notes, el Perfil i les apps. */
    it('continua acceptant els avatars OAuth (Google, Facebook, GitHub)', () => {
      for (const url of ['https://lh3.googleusercontent.com/a/pepa.png', 'https://platform-lookaside.fbsbx.com/x.jpg',
        'https://graph.facebook.com/1/picture', 'https://avatars.githubusercontent.com/u/1']) {
        expect(esFontImatgeSegura(url), url).toBe(true);
      }
    });
  });

  /* Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
     PROHIBIDES (PRIVACITAT)». El mode estricte: el mateix origen, els orígens
     del nostre servidor de mitjans (permetOrigenMitjans), els recursos del
     paquet, data:image i sdp-media://. Cap servidor de tercers. */
  describe('esFontImatgePropia (mode estricte del Mur)', () => {
    /* Revisió adversarial del 261007 · Els orígens registrats són estat del
       mòdul: cada prova que en registra un en fa servir un de sintètic propi,
       i cap precondició depén de l'ordre de les proves. */
    const STORAGE = 'https://projecte-1.supabase.co';
    const STORAGE_2 = 'https://projecte-2.supabase.co';
    const PAQUET = 'https://wp.example/wp-content/plugins/soc-de-poble/dist';
    afterEach(() => {
      fixaBaseRecursos('/');
      vi.unstubAllGlobals();
    });

    it('rebutja els avatars OAuth i qualsevol servidor de tercers', () => {
      for (const url of ['https://lh3.googleusercontent.com/a/pepa.png', 'https://platform-lookaside.fbsbx.com/x.jpg',
        'https://graph.facebook.com/1/picture', 'https://avatars.githubusercontent.com/u/1',
        'https://rastreig.example/p.gif?campanya=1', 'http://evilsite.com/foto.jpg']) {
        expect(esFontImatgePropia(url), url).toBe(false);
      }
    });

    it('un origen OAuth no es pot registrar com a nostre', () => {
      permetOrigenMitjans('https://lh3.googleusercontent.com/qualsevol');
      expect(esFontImatgePropia('https://lh3.googleusercontent.com/a/pepa.png')).toBe(false);
      expect(esFontImatgeSegura('https://lh3.googleusercontent.com/a/pepa.png')).toBe(true);
    });

    it('rebutja les adreces relatives que el navegador porta a un altre origen', () => {
      for (const url of ['//fora.example/x.png', '/\\fora.example/x.png', ' //fora.example/x.png', 'javascript:alert(1)', 'blob:https://fora.example/1']) {
        expect(esFontImatgePropia(url), url).toBe(false);
      }
    });

    it('accepta el mateix origen, data:image (sense SVG) i sdp-media:// dels dos buckets', () => {
      expect(esFontImatgePropia('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')).toBe(true);
      expect(esFontImatgePropia(`${window.location.origin}/assets/mur/festa.webp`)).toBe(true);
      expect(esFontImatgePropia('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
      expect(esFontImatgePropia('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
      expect(esFontImatgePropia('sdp-media://mitjans/poble/u/general/f.webp')).toBe(true);
      expect(esFontImatgePropia('sdp-media://mitjans_privats/poble/u/notes/f.webp')).toBe(true);
      expect(esFontImatgePropia('sdp-media://un_altre_bucket/f.webp')).toBe(false);
      expect(esFontImatgePropia('')).toBe(false);
      expect(esFontImatgePropia(null)).toBe(false);
    });

    it('accepta el nostre Storage quan la configuració el registra (runtime.js)', () => {
      const foto = `${STORAGE}/storage/v1/object/public/mitjans/f.webp`;
      expect(esFontImatgePropia(foto)).toBe(false);
      permetOrigenMitjans(STORAGE);
      expect(esFontImatgePropia(foto)).toBe(true);
    });

    it('el paquet servit des d’un altre origen (plugin-url de WordPress o Sollutia): els seus /assets/ són propis', () => {
      /* El que fa l'element <soc-de-poble> (PedraSecaEmbed.jsx, _aplicaBaseRecursos):
         fixa la base d'assetResolver i en registra l'origen. */
      fixaBaseRecursos(PAQUET);
      permetOrigenMitjans(PAQUET);
      const resolt = resolRecursPropi('/assets/mur/festa.webp');
      expect(resolt).toBe(`${PAQUET}/assets/mur/festa.webp`);
      expect(esFontImatgePropia(resolt)).toBe(true);
      expect(esFontImatgePropia('https://lh3.googleusercontent.com/a/pepa.png')).toBe(false);
    });

    it('en una pàgina http(s), tot el que admet el mode estricte ho admet també el filtre de sempre (imatgePrivada pinta igual)', () => {
      permetOrigenMitjans(STORAGE_2);
      const mostres = ['/assets/x.png', `${STORAGE_2}/storage/v1/object/public/mitjans/f.webp`, 'data:image/webp;base64,UklGRg==',
        'sdp-media://mitjans/f.webp', 'https://lh3.googleusercontent.com/a/pepa.png', 'https://rastreig.example/p.gif', '//fora.example/x.png',
        'assets/x.png', '/\\fora.example/x.png', '/a\tb.png'];
      for (const url of mostres) {
        if (esFontImatgePropia(url)) expect(esFontImatgeSegura(url), url).toBe(true);
      }
    });

    /* Revisió adversarial del 261007 · A l'app nativa (capacitor://localhost)
       un camí absolut del mateix lloc es resolia contra un origen 'capacitor:'
       i es rebutjava. La regla és la del trigger del servidor: UNA barra
       seguida d'un caràcter que no siga barra ni barra inversa, sense
       caràcters de control ni barres inverses. El filtre de sempre no canvia. */
    it('a l’app nativa (capacitor://localhost), un camí propi continua sent propi; cap altre origen', () => {
      vi.stubGlobal('location', { origin: 'capacitor://localhost', protocol: 'capacitor:', host: 'localhost', hostname: 'localhost',
        href: 'capacitor://localhost/mur', pathname: '/mur', search: '', hash: '' });
      expect(esFontImatgePropia('/assets/mur/festa.webp')).toBe(true);
      expect(esFontImatgePropia(' /assets/mur/festa.webp ')).toBe(true);
      for (const url of ['//fora.example/x.png', '/\\fora.example/x.png', '/\t/fora.example/x.png', '/assets\\..\\x.png',
        '/a\u0000b.png', 'https://lh3.googleusercontent.com/a/pepa.png', 'capacitor://fora/x.png', 'assets/x.png', '/']) {
        expect(esFontImatgePropia(url), JSON.stringify(url)).toBe(false);
      }
      // El filtre dels altres consumidors (sanejador, Notes, Perfil), com abans.
      expect(esFontImatgeSegura('/assets/mur/festa.webp')).toBe(false);
    });

    it('fontImatgePropia torna la mateixa font si és pròpia; si no, null', () => {
      expect(fontImatgePropia('/assets/x.png')).toBe('/assets/x.png');
      expect(fontImatgePropia('https://lh3.googleusercontent.com/a/pepa.png')).toBeNull();
      expect(fontImatgePropia('')).toBeNull();
      expect(fontImatgePropia(undefined)).toBeNull();
    });
  });

  describe('sanitizeHtml', () => {
    it('permet <s> i <u> i class (C15)', () => {
      const html = '<p class="sdp-imatge-cos">text <s>ratllat</s> i <u>subratllat</u></p>';
      expect(sanitizeHtml(html)).toContain('<p class="sdp-imatge-cos">text <s>ratllat</s> i <u>subratllat</u></p>');
    });

    it('sobreviu imatge de sdp-media://mitjans', () => {
      const html = '<img src="sdp-media://mitjans/foto.jpg" alt="foto" />';
      const resultat = sanitizeHtml(html);
      // El ganxo afegirà loading="lazy" i altres atributs
      expect(resultat).toContain('src="sdp-media://mitjans/foto.jpg"');
      expect(resultat).not.toContain('data-sdp-bloquejada');
    });

    it('sobreviu imatge de sdp-media://mitjans_privats', () => {
      const html = '<img src="sdp-media://mitjans_privats/foto.jpg" alt="foto" />';
      const resultat = sanitizeHtml(html);
      expect(resultat).toContain('src="sdp-media://mitjans_privats/foto.jpg"');
      expect(resultat).not.toContain('data-sdp-bloquejada');
    });

    it('bloqueja imatges no segures i lleva el src', () => {
      const html = '<img src="http://evilsite.com/foto.jpg" alt="foto" />';
      const resultat = sanitizeHtml(html);
      expect(resultat).not.toContain('src="');
      expect(resultat).toContain('data-sdp-bloquejada="1"');
    });

    it.each(['docs/guia.md', 'pagina2', 'memoria.md', '#seccio', '/wiki?item=x', 'https://socdepoble.org/x', 'mailto:hola@example.test'])(
      'conserva l’href relatiu o permés %s', (href) => {
        expect(sanitizeHtml(`<a href="${href}">x</a>`)).toContain(`href="${href}"`);
      });

    it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:x', 'data:text/html,x', '//evil.test/x', ' //evil.test/x'])(
      'lleva l’href perillós %s', (href) => {
        expect(sanitizeHtml(`<a href="${href}">x</a>`)).not.toContain('href=');
      });
  });

  /* Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
     PROHIBIDES (PRIVACITAT)») · Relleu 261007 (peça «imatges-detall», punt g)
     · El cos HTML d'una publicació del Mur passa pel mode estricte de les
     <img> amb sanitizeHtml(html, { imatgesPropies: true }). Sense l'opció, el
     filtre de sempre per a tots els altres consumidors, byte a byte. */
  describe('sanitizeHtml amb { imatgesPropies: true } (el cos del Mur)', () => {
    const STORAGE = 'https://cos-1.supabase.test';
    const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa.png';
    const img = (src) => `<p>x<img src="${src}" alt="foto"></p>`;

    it('un avatar OAuth o un servidor de fora perd el src, com qualsevol imatge de fora', () => {
      for (const src of [GOOGLE, 'https://avatars.githubusercontent.com/u/1', 'https://graph.facebook.com/1/picture', 'https://rastreig.example/p.gif']) {
        const net = sanitizeHtml(img(src), { imatgesPropies: true });
        expect(net, src).not.toContain('src=');
        expect(net, src).toContain('data-sdp-bloquejada="1"');
        expect(net, src).toContain('alt="foto"');
      }
    });

    it('les pròpies es conserven igual que amb el filtre de sempre: el mateix lloc, el Storage registrat, sdp-media:// i data:image', () => {
      permetOrigenMitjans(STORAGE);
      for (const src of ['/assets/mur/festa.webp', `${window.location.origin}/assets/a.png`, `${STORAGE}/storage/v1/object/public/mitjans/f.webp`,
        'sdp-media://mitjans/poble/u/general/f.webp', 'data:image/png;base64,iVBORw0KGgo=']) {
        expect(sanitizeHtml(img(src), { imatgesPropies: true }), src).toBe(sanitizeHtml(img(src)));
        expect(sanitizeHtml(img(src), { imatgesPropies: true }), src).toContain(`src="${src}"`);
      }
    });

    it('la marca només dura la crida: la següent sense opcions torna al filtre de sempre (els avatars OAuth, admesos)', () => {
      expect(sanitizeHtml(img(GOOGLE), { imatgesPropies: true })).not.toContain('src=');
      expect(sanitizeHtml(img(GOOGLE))).toContain(`src="${GOOGLE}"`);
    });

    it('sense opcions, o amb qualsevol valor que no siga true, l’eixida de sempre', () => {
      const html = `<h2>Títol</h2>${img(GOOGLE)}${img('https://rastreig.example/p.gif')}<a href="/mur/1" target="_blank">x</a>`;
      const deSempre = sanitizeHtml(html);
      for (const opcions of [undefined, null, {}, { imatgesPropies: false }, { imatgesPropies: 'si' }, 1]) {
        expect(sanitizeHtml(html, opcions), JSON.stringify(opcions)).toBe(deSempre);
      }
      expect(deSempre).toContain(`src="${GOOGLE}"`);
    });

    it('és idempotent: tornar a sanejar el cos estricte amb el filtre de sempre no canvia res', () => {
      const html = `<p>a <strong>b</strong></p>${img('/assets/mur/a.webp')}${img(GOOGLE)}<ul><li>u</li></ul>`;
      const estricte = sanitizeHtml(html, { imatgesPropies: true });
      expect(sanitizeHtml(estricte)).toBe(estricte);
    });

    /* Revisió adversarial del 261008 · La instantània d'una targeta incrustada
       (data-imatge) es pinta quan l'original no es resol, i el seu filtre
       admet els avatars OAuth: el mode estricte també la mira. */
    const targeta = (imatge) => '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="esquerra">'
      + `<div data-sdp-targeta="publicacio:1" class="sdp-targeta" data-ruta="/mur/1" data-titol="La festa" data-imatge="${imatge}">`
      + '<a href="/mur/1" rel="noopener noreferrer nofollow">La festa</a></div></div>';

    it('la instantània d’una targeta amb una imatge de fora perd el data-imatge; la resta de la targeta, intacta', () => {
      for (const src of [GOOGLE, 'https://avatars.githubusercontent.com/u/1', 'https://rastreig.example/p.gif', '//rastreig.example/p.gif']) {
        const net = sanitizeHtml(targeta(src), { imatgesPropies: true });
        expect(net, src).not.toContain('data-imatge');
        expect(net, src).toBe(targeta(src).replace(` data-imatge="${src}"`, ''));
      }
    });

    it('una instantània pròpia, o buida, es queda byte a byte; sense l’opció, també la de fora', () => {
      permetOrigenMitjans(STORAGE);
      for (const src of ['/assets/mur/1.webp', `${STORAGE}/storage/v1/object/public/mitjans/f.webp`, 'sdp-media://mitjans/poble/u/general/f.webp', '']) {
        expect(sanitizeHtml(targeta(src), { imatgesPropies: true }), src).toBe(targeta(src));
      }
      expect(sanitizeHtml(targeta(GOOGLE))).toBe(targeta(GOOGLE));
    });
  });

  /* T7 (ordre del Mestre, 261004) · Les targetes incrustades viatgen com a
     div amb data-* (DOMPurify té ALLOW_DATA_ATTR per defecte i cap prova ho
     fixava). Si mai es tancaren, les targetes desapareixerien sense avís. */
  describe('targetes incrustades (data-*)', () => {
    const TARGETA = '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="esquerra">'
      + '<div data-sdp-targeta="publicacio:1" class="sdp-targeta" data-ruta="/mur/1" data-titol="La festa" data-imatge="/assets/mur/1.webp" data-autor-ruta="/perfil/persona/pep">'
      + '<a href="/mur/1" rel="noopener noreferrer nofollow">La festa</a></div></div>';

    it('data-sdp-targetes, data-sdp-targeta, data-alineacio, data-ruta i la resta sobreviuen, byte a byte', () => {
      expect(sanitizeHtml(TARGETA)).toBe(TARGETA);
    });

    it('style i els on* d’eixos div se’n van; les dades es queden', () => {
      const brut = '<div data-sdp-targetes="" style="position:fixed" onclick="alert(1)"><div data-sdp-targeta="publicacio:1" onmouseover="alert(2)" style="color:red" data-titol="T"></div></div>';
      const net = sanitizeHtml(brut);
      expect(net).not.toMatch(/style=|onclick|onmouseover/);
      expect(net).toContain('data-sdp-targeta="publicacio:1"');
      expect(net).toContain('data-titol="T"');
    });

    it('un atribut amb una seqüència de comentari s’esborra sencer (per això la instantània no porta < ni >)', () => {
      expect(sanitizeHtml('<div data-titol="a --> b">x</div>')).toBe('<div>x</div>');
    });
  });
});
