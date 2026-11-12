/* Ordre del Mestre, 261001 · Les targetes del Mur, pures: les pàgines del
   sistema, l'instant de cada targeta i l'ordre. Les compartixen el Mur i la
   pàgina /calendari. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { clauDeLaTargeta, esTargetaDelMur, momentDeLaTargeta, momentEditorial, perMomentDescendent, targetesDeSistema } from './targetesMur.js';
import { acteAEsdeveniment } from './agendaMur.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { resolveAsset } from '../../config/assetResolver.js';
import { resolvePageSlugPath } from '../../config/navigation.js';
import { APP_SEED } from '../../data/appSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { paginaDeRuta, pageKeyDeRuta } from '../text/paginaDeText.js';
import { entradesDelCalendari, rutaDeLaTargeta } from '../calendari/calendariGlobal.js';

/* P0-51 · El Mur no filtra cap bandera `hidden`/`isPublished` de la llavor:
   l'invariant inclou TOTES les publicacions i les pàgines que realment genera.
   Una imatge local amb URL absoluta, escapada o amb paràmetres és el mateix
   recurs. El digest també troba còpies idèntiques amb noms de fitxer diferents.
   Per a les notícies conservem els paràmetres d'identitat (?p=…), llevant només
   els de seguiment; el mateix títol, slug, origen o destí tampoc es pot repetir. */
const ORIGEN_SEED = 'https://socdepoble.org';
function recursCanonic(valor, { senseConsulta = false } = {}) {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const url = new URL(valor.trim(), ORIGEN_SEED);
  url.hash = '';
  for (const clau of [...url.searchParams.keys()]) {
    if (senseConsulta || /^(utm_|fbclid$|gclid$)/i.test(clau)) url.searchParams.delete(clau);
  }
  url.searchParams.sort();
  const cami = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
  return `${url.origin}${cami}${url.search}`;
}

function identitatsDeTargeta(item) {
  const claus = new Set();
  const ruta = rutaDeLaTargeta(item);
  const url = new URL(ruta, ORIGEN_SEED);
  const slug = url.origin === ORIGEN_SEED ? /^\/page\/([^/]+)\/?$/.exec(url.pathname)?.[1] : null;
  const desti = slug ? resolvePageSlugPath(decodeURIComponent(slug)) || ruta : ruta;
  const pagina = pageKeyDeRuta(desti);
  claus.add(`desti:${pagina ? `pagina:${pagina}` : recursCanonic(desti, { senseConsulta: true })}`);
  const titol = item.title?.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  if (titol) claus.add(`titol:${titol}`);
  if (item.slug) claus.add(`slug:${item.slug}`);
  if (item.source_url) claus.add(`font:${recursCanonic(item.source_url)}`);
  if (item.wp_id) claus.add(`wp:${new URL(item.source_url || 'https://socdepoble.net').hostname}:${item.wp_id}`);
  const imatges = [item.image, item.image_url, item.imageSrc, item.images].flat(Infinity);
  for (const valor of imatges.flatMap((font) => typeof font === 'string' ? [font, resolveAsset(font)] : [])) {
    const recurs = recursCanonic(valor, { senseConsulta: true });
    if (!recurs) continue;
    claus.add(`imatge:${recurs}`);
    const url = new URL(recurs);
    if (url.origin === ORIGEN_SEED && url.pathname.startsWith('/assets/')) {
      const fitxer = path.join(process.cwd(), 'public', decodeURIComponent(url.pathname));
      if (existsSync(fitxer)) claus.add(`imatge-sha256:${createHash('sha256').update(readFileSync(fitxer)).digest('hex')}`);
    }
  }
  return claus;
}

function duplicatsDeTargetes(targetes) {
  const vistos = new Map();
  const duplicats = [];
  for (const [index, item] of targetes.entries()) {
    const nom = `${index}:${item.id}`;
    for (const clau of identitatsDeTargeta(item)) {
      if (vistos.has(clau)) duplicats.push({ clau, targetes: [vistos.get(clau), nom] });
      else vistos.set(clau, nom);
    }
  }
  return duplicats;
}

const targetesReals = (nativa) => [...APP_SEED.events, ...APP_SEED.feedPosts, ...APP_SEED.marketItems, ...targetesDeSistema(PAGE_COPY, { nativa })];

describe('P0-51 · invariant antiduplicats del Mur i del Calendari', () => {
  test.each([false, true])('la llavor visible no repetix cap imatge ni notícia (nativa=%s)', (nativa) => {
    expect(duplicatsDeTargetes(targetesReals(nativa))).toEqual([]);
  });

  test('Anatomia és un àlies de l’article complet, l’única targeta del pou al Mur i al Calendari', () => {
    const ruta = '/page/anatomia-rural';
    expect(paginaDeRuta(ruta)).toBeNull();
    expect(resolvePageSlugPath('anatomia-rural')).toBe('/mur/noves-tecnologies-aplicades-a-la-cultura-rural');
    for (const nativa of [false, true]) {
      const mur = targetesReals(nativa);
      expect(mur.filter((item) => item.id === 'noves-tecnologies-aplicades-a-la-cultura-rural')).toHaveLength(1);
      expect(mur.some((item) => item.id === 'anatomia-rural' || item.mainHref === ruta)).toBe(false);
      const calendari = entradesDelCalendari(mur);
      expect(calendari.filter(({ item }) => item.id === 'noves-tecnologies-aplicades-a-la-cultura-rural' && item.image_url)).toHaveLength(1);
      expect(calendari.some(({ item }) => item.id === 'anatomia-rural')).toBe(false);
    }
  });

  test.each([
    ['imatge absoluta amb query i fragment', { id: 'copia', title: 'Un altre títol', image: 'https://socdepoble.org/assets/uploads/patrimoni/%61natomia-rural-pou-neu-ibanez.webp?v=2#foto' }],
    ['mateixa notícia amb una altra portada i id', { id: 'copia', title: APP_SEED.feedPosts[0].title, image: '/assets/una-altra.webp' }],
    ['mateix destí amb un altre títol', { id: 'copia', title: 'Un altre títol', mainHref: '/mur/noves-tecnologies-aplicades-a-la-cultura-rural' }],
    ['mateix article amb una consulta i fragment diferents', { id: 'copia', title: 'Un altre títol', mainHref: '/mur/noves-tecnologies-aplicades-a-la-cultura-rural?from=calendari#cos' }],
    ['àlies de l’article amb consulta i fragment diferents', { id: 'copia', title: 'Un altre títol', mainHref: '/page/anatomia-rural?from=calendari#cos' }],
    ['mateix slug amb un altre id', { id: 'copia', title: 'Un altre títol', slug: APP_SEED.feedPosts[0].slug }],
    ['mateixa font amb paràmetre de seguiment', { id: 'copia', title: 'Un altre títol', source_url: `${APP_SEED.feedPosts[1].source_url}?utm_source=prova#cos` }],
    ['la visibilitat privada tampoc els amaga', { ...APP_SEED.feedPosts[0], id: 'copia', visibility: 'private' }],
    ['la bandera hidden no amaga duplicats', { ...APP_SEED.feedPosts[0], id: 'copia', hidden: true, isPublished: false }]
  ])('la guarda detecta una regressió: %s', (_, copia) => {
    expect(duplicatsDeTargetes([...targetesReals(false), copia]).length).toBeGreaterThan(0);
  });

  test('l’àlies només es resol per al nostre origen; una web externa amb el mateix camí és un altre recurs', () => {
    expect(duplicatsDeTargetes([
      { id: 'local', title: 'Article local', mainHref: '/mur/noves-tecnologies-aplicades-a-la-cultura-rural' },
      { id: 'extern', title: 'Article extern', mainHref: 'https://example.org/page/anatomia-rural' }
    ])).toEqual([]);
  });

  test.each(['events', 'marketItems'])('la guarda també veu les imatges de %s, part real del Mur', (font) => {
    const original = APP_SEED[font][0];
    const imatge = original.image || original.image_url || original.imageSrc || original.images;
    expect(imatge).toBeTruthy();
    const copia = { id: 'copia-imatge', title: 'Imatge repetida amb altre destí', image: imatge };
    expect(duplicatsDeTargetes([...targetesReals(false), copia]).some(({ clau }) => clau.startsWith('imatge:'))).toBe(true);
  });

  test('les rutes curta i /page de la mateixa pàgina no creen dues notícies', () => {
    expect(duplicatsDeTargetes([
      { id: 'curta', title: 'Un títol', mainHref: '/projecte#cos' },
      { id: 'slug', title: 'Un altre títol', mainHref: '/page/projecte?from=mur' }
    ]).map(({ clau }) => clau)).toContain('desti:pagina:projecte');
  });

  test('dos articles WordPress amb ?p= diferents no són la mateixa notícia', () => {
    const originals = [1, 2].map((id) => ({ id: `p-${id}`, title: `Article ${id}`, source_url: `https://socdepoble.net/?p=${id}` }));
    expect(duplicatsDeTargetes(originals)).toEqual([]);
  });
});


describe('targetesDeSistema', () => {
  /* R16b · «Què dinem?» entra al Mur com a pàgina de patrimoni, amb la portada de la pàgina (pageContent.patrimoniR14.js).
     R16-AA4 + P0-117 · /page/receptes és ara l'enciclopèdia de receptaris i porta la seua portada pròpia
     (receptes-ibanez.webp, fixada a ReceptesQueDinem.test.jsx); la targeta del Mur seguix la de la pàgina. */
  test('la targeta de «Què dinem?» porta a /page/receptes i du la portada de la pàgina', () => {
    const targeta = targetesDeSistema(PAGE_COPY, { nativa: false }).find((t) => t.id === 'receptes');
    expect(targeta?.mainHref).toBe('/page/receptes');
    expect(targeta?.image).toBe(PAGE_COPY.receptes.image);
    expect(targeta?.image).toBe('/assets/uploads/patrimoni/receptes-ibanez.webp');
  });

  test('cada pàgina del copy és una targeta del sistema amb la data de CREACIÓ, mai com a dia d’acte', () => {
    const [primera] = targetesDeSistema({ projecte: { title: 'El projecte', date: '2026-08-20T00:00:00.000Z' } });
    expect(primera).toMatchObject({
      title: 'El projecte', created_at: '2026-08-20T00:00:00.000Z', id: 'projecte', isSystem: true,
      mainHref: '/projecte', type: 'sistema'
    });
    expect(primera.date).toBeUndefined();
  });

  test('una pàgina declarada i absent no es pinta i ho diu a qui la demana', () => {
    const quanFalta = vi.fn();
    expect(targetesDeSistema({}, { quanFalta })).toEqual([]);
    // PRODUCCIO-02 (R15b) · Sense la bandera de curadoria, La IAIA Sabuda no és cap targeta: no falta, i no avisa.
    expect(quanFalta.mock.calls.map(([clau]) => clau)).toEqual(SYSTEM_PAGES.map((p) => p.key).filter((clau) => clau !== 'la-iaia-sabuda'));
    expect(targetesDeSistema(undefined)).toEqual([]);
  });

  /* PRODUCCIO-02 (revisió R15b) · Sense VITE_SDP_CURADORIA_CULTURAL=1 (producció), /page/la-iaia-sabuda no recull res:
     la pàgina no és cap targeta del Mur, del Calendari ni del Bloc de l'entitat, encara que la seua data de creació
     (9-11-2026) siga la més nova. La ruta i SYSTEM_PAGES no canvien. Amb la bandera exacta '1', hi torna. */
  describe('PRODUCCIO-02 · La IAIA Sabuda, només amb la curadoria encesa', () => {
    afterEach(() => vi.unstubAllEnvs());
    const claus = () => targetesDeSistema(PAGE_COPY, { nativa: false }).map((targeta) => targeta.id);

    test.each([[undefined], [''], ['0'], ['true'], [' 1']])('bandera %j: cap targeta de Nodrir, cap avís de falta, i la ruta continua', (valor) => {
      if (valor !== undefined) vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', valor);
      expect(esTargetaDelMur('la-iaia-sabuda')).toBe(false);
      expect(claus()).not.toContain('la-iaia-sabuda');
      const quanFalta = vi.fn();
      targetesDeSistema({}, { quanFalta, nativa: false });
      expect(quanFalta.mock.calls.flat()).not.toContain('la-iaia-sabuda');
      expect(SYSTEM_PAGES.find((pagina) => pagina.key === 'la-iaia-sabuda')).toMatchObject({ href: '/page/la-iaia-sabuda' });
      expect(PAGE_COPY['la-iaia-sabuda'].date).toBe('2026-11-09T14:40:43.030Z');
      // La resta de pàgines del sistema, totes.
      for (const { key } of SYSTEM_PAGES.filter((pagina) => pagina.key !== 'la-iaia-sabuda')) expect(esTargetaDelMur(key)).toBe(true);
    });

    test('bandera «1»: la targeta hi és, amb la seua ruta i la data de creació real', () => {
      vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', '1');
      expect(esTargetaDelMur('la-iaia-sabuda')).toBe(true);
      const targeta = targetesDeSistema(PAGE_COPY, { nativa: false }).find((element) => element.id === 'la-iaia-sabuda');
      expect(targeta).toMatchObject({ mainHref: '/page/la-iaia-sabuda', created_at: '2026-11-09T14:40:43.030Z', isSystem: true });
      const amb = claus();
      vi.unstubAllEnvs();
      // Només hi entra Nodrir: la resta, igual i en el mateix ordre.
      expect(amb.filter((clau) => clau !== 'la-iaia-sabuda')).toEqual(claus());
      expect(amb).toHaveLength(claus().length + 1);
    });

    test('el literal és el que Vite plega, com la capacitat de data/supabase/index.js', () => {
      const font = readFileSync(path.join(process.cwd(), 'src/sections/mur/targetesMur.js'), 'utf8');
      expect(font).toContain("import.meta.env.VITE_SDP_CURADORIA_CULTURAL === '1'");
      expect(readFileSync(path.join(process.cwd(), 'src/data/supabase/index.js'), 'utf8')).toContain("import.meta.env.VITE_SDP_CURADORIA_CULTURAL === '1'");
    });
  });

  /* Ordre del Mestre (261027; auditoria Gauntlet R5, G1-01 i G5-01) · Dins de
     l'app nativa, «Descàrregues i Aplicacions» no és cap targeta: ni al Mur, ni
     al Calendari, ni a usePaginesDelSistema, que passen tots per ací. No falta:
     no avisa. Per defecte ho decidix el pont de Capacitor (esAppNativa). */
  test('dins de l’app nativa, Descàrregues no és cap targeta, i no falta', () => {
    const copy = { descarregues: { title: 'Descàrregues i Aplicacions' }, projecte: { title: 'El projecte' } };
    const claus = (llista) => llista.map((targeta) => targeta.id);
    expect(claus(targetesDeSistema(copy))).toEqual(['projecte', 'descarregues']);
    const quanFalta = vi.fn();
    expect(claus(targetesDeSistema(copy, { quanFalta, nativa: true }))).toEqual(['projecte']);
    expect(quanFalta.mock.calls.map(([clau]) => clau)).not.toContain('descarregues');
    window.Capacitor = { isNativePlatform: () => true };
    try {
      expect(claus(targetesDeSistema(copy))).toEqual(['projecte']);
    } finally {
      delete window.Capacitor;
    }
  });

  /* Pla 261027_0845 (Guarda Nocturna), T1-06 · Dins de l'app nativa, el copy
     de la targeta passa per paginaPerAppNativa: la frase que nomena una altra
     plataforma mòbil se'n va i la resta es queda. A la web, el mateix text. */
  test('dins de l’app nativa, la targeta no nomena cap altra plataforma mòbil; a la web, el text tal qual', () => {
    const lead = 'Baixa-la de Google Play. La web, sempre.';
    const copy = { projecte: { title: 'El projecte', lead } };
    const [web] = targetesDeSistema(copy, { nativa: false });
    expect(web.lead).toBe(lead);
    const [nativa] = targetesDeSistema(copy, { nativa: true });
    expect(nativa).toMatchObject({ id: 'projecte', title: 'El projecte', lead: 'La web, sempre.' });
  });
});

describe('momentDeLaTargeta i perMomentDescendent', () => {
  test('un acte s’ordena pel seu inici (el de la pastilla), no per la publicació', () => {
    const item = { id: 'a', type: 'event', title: 'Aplec', date: '2026-10-03', time: '18:00', created_at: '2026-09-01T10:00:00Z' };
    expect(momentDeLaTargeta(item, acteAEsdeveniment(item))).toBe(new Date(2026, 9, 3, 18, 0).getTime());
  });

  test('la resta, per la data de la seua pastilla; sense cap data real, null', () => {
    expect(momentDeLaTargeta({ id: 'p', created_at: '2026-09-29T10:00:00.000Z' }, null)).toBe(Date.parse('2026-09-29T10:00:00.000Z'));
    expect(momentDeLaTargeta({ id: 'p' }, null)).toBeNull();
  });

  test('de més nova a més vella; les que no tenen data, al final i en l’ordre en què han arribat', () => {
    const llista = [
      { id: 'x', moment: null }, { id: 'a', moment: 1 }, { id: 'y', moment: null }, { id: 'b', moment: 3 }, { id: 'c', moment: 2 }
    ];
    expect([...llista].sort(perMomentDescendent).map((e) => e.id)).toEqual(['b', 'c', 'a', 'x', 'y']);
  });
});

/* R51 (P0-49 / IDEA-180) · L'instant editorial del Mur: publish_date i, si és
   absent, null o buit, created_at. updated_at no puja cap peça. Un valor
   present però invàlid no cau a created_at: va al final. Empat per la clau
   `${type}-${id}`, en ordre de codi. */
describe('R51 · momentEditorial i l’empat per clau', () => {
  test('publish_date mana sobre created_at, i updated_at no hi compta', () => {
    const item = { id: 'p', type: 'feed', publish_date: '2026-06-01T09:00:00.000Z', created_at: '2026-07-01T10:00:00Z', updated_at: '2099-01-01T00:00:00Z' };
    expect(momentEditorial(item)).toBe(Date.parse('2026-06-01T09:00:00.000Z'));
    expect(momentDeLaTargeta(item, null)).toBe(Date.parse('2026-06-01T09:00:00.000Z'));
    expect(momentEditorial({ created_at: '2026-08-01T10:00:00.000Z', updated_at: '2026-09-10T10:00:00.000Z' })).toBe(Date.parse('2026-08-01T10:00:00.000Z'));
  });

  test.each([undefined, null, ''])('publish_date absent (%j): la de creació', (publish_date) => {
    expect(momentEditorial({ publish_date, created_at: '2026-01-01T10:00:00Z' })).toBe(Date.parse('2026-01-01T10:00:00Z'));
  });

  test('els sis decimals de PostgREST es retallen als mil·lisegons; un Date vàlid és el seu instant', () => {
    expect(momentEditorial({ created_at: '2026-07-01T10:00:00.183412+00:00' })).toBe(Date.parse('2026-07-01T10:00:00.183Z'));
    expect(momentEditorial({ publish_date: new Date(Date.UTC(2026, 6, 1, 10)) })).toBe(Date.UTC(2026, 6, 1, 10));
  });

  /* R51V-05 · El retall és només per a created_at (la columna del servidor):
     un publish_date de quatre decimals és invàlid, com diu el contracte, i no
     cau a created_at. */
  test('un publish_date amb més de tres decimals no es retalla: invàlid, al final', () => {
    const avisa = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(momentEditorial({ id: 'q', type: 'feed', publish_date: '2026-11-07T10:00:00.1234Z', created_at: '2026-01-01T10:00:00Z' })).toBeNull();
      expect(momentEditorial({ id: 'q2', type: 'feed', publish_date: '2026-11-07T10:00:00.123Z', created_at: '2026-01-01T10:00:00.123456+00:00' }))
        .toBe(Date.parse('2026-11-07T10:00:00.123Z'));
    } finally {
      avisa.mockRestore();
    }
  });

  test('un valor present però invàlid no cau a created_at i no llança: null, al final', () => {
    const avisa = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const publish_date of ['demà', '2026-10-05', '2026-09-01T09:00:00', '2026-02-30T10:00Z', 42, {}, [], new Date('x')]) {
        expect(momentEditorial({ id: 'x', type: 'feed', publish_date, created_at: '2026-01-01T10:00:00Z' }), String(publish_date)).toBeNull();
      }
      expect(momentEditorial({ created_at: 'demà' })).toBeNull();
      expect(avisa).toHaveBeenCalled();
      expect(String(avisa.mock.calls[0][0])).toContain('R51_PUBLICATION_DATE_INVALID');
    } finally {
      avisa.mockRestore();
    }
    for (const brossa of [null, undefined, 0, 'text', true]) expect(momentEditorial(brossa)).toBeNull();
    expect(momentEditorial({})).toBeNull();
  });

  test('un acte continua amb el seu inici; un acte amb la boina de publicació, amb l’instant editorial', () => {
    const acte = { id: 'a', type: 'event', title: 'Aplec', date: '2026-10-03', time: '18:00', created_at: '2026-09-01T10:00:00Z' };
    expect(momentDeLaTargeta(acte, acteAEsdeveniment(acte))).toBe(new Date(2026, 9, 3, 18, 0).getTime());
    const ambBoina = { ...acte, boinaDataPublicacio: true, publish_date: '2026-09-15T08:00:00.000Z' };
    expect(momentDeLaTargeta(ambBoina, acteAEsdeveniment(ambBoina))).toBe(Date.parse('2026-09-15T08:00:00.000Z'));
  });

  test('empat: per clau ascendent en ordre de codi, també entre les que no porten data; sense clau, estable', () => {
    const entrades = [
      { clau: 'sistema-rutes-de-poble', moment: 5 }, { clau: 'sistema-banc-de-llavors', moment: 5 },
      { clau: 'feed-z', moment: null }, { clau: 'sistema-arbres-monumentals', moment: 5 },
      { clau: 'feed-B', moment: null }, { clau: 'feed-a', moment: 9 }
    ];
    expect([...entrades].sort(perMomentDescendent).map((e) => e.clau)).toEqual([
      'feed-a', 'sistema-arbres-monumentals', 'sistema-banc-de-llavors', 'sistema-rutes-de-poble', 'feed-B', 'feed-z'
    ]);
    const senseClau = [{ id: 'y', moment: 1 }, { id: 'x', moment: 1 }];
    expect([...senseClau].sort(perMomentDescendent).map((e) => e.id)).toEqual(['y', 'x']);
    expect(clauDeLaTargeta({ type: 'sistema', id: 'herbari' })).toBe('sistema-herbari');
  });

  test('l’ordre del Mur amb publish_date i created_at barrejats: la data triada mana, l’edició no', () => {
    const items = [
      { id: 'vella', type: 'feed', created_at: '2026-08-15T10:00:00Z' },
      { id: 'editada', type: 'feed', created_at: '2026-08-01T10:00:00Z', updated_at: '2026-09-10T10:00:00Z' },
      { id: 'triada', type: 'feed', created_at: '2026-06-01T10:00:00Z', publish_date: '2026-10-05T08:30:00.000Z' },
      { id: 'sense', type: 'feed' },
      { id: 'dolenta', type: 'feed', publish_date: '2026-10-05', created_at: '2026-12-01T10:00:00Z' }
    ];
    const avisa = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const ordre = items.map((item) => ({ item, clau: clauDeLaTargeta(item), moment: momentDeLaTargeta(item, null) }))
        .sort(perMomentDescendent).map(({ item }) => item.id);
      expect(ordre).toEqual(['triada', 'vella', 'editada', 'dolenta', 'sense']);
    } finally {
      avisa.mockRestore();
    }
  });
});
