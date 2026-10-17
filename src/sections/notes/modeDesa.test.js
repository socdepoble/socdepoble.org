/* T7C (P1) · modeDesa.js: el Snippet Curador a la URL del Bloc, i el
   bookmarklet que construïx el mòdul (amb l'origen de l'app, Model B),
   executat. Dades sintètiques. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  APP_LECTOR, CLAUS_BLOC, CLAUS_DESA, CLAUS_DESTI, DESTINS, MODE_DESA, bookmarkletDesa, carpetaDeDesa, entradaDeDesa, entradaDeFont,
  esModeDesa, escriuDesa, escriuDesti, llegixDesa, llegixDesti, nomProposat, origenDelSnippet, paramsDeLaNota
} from './modeDesa.js';
import { CARPETA_CONNECTATS } from './carpetes.js';

const CARPETES = Object.freeze([
  { id: 'f-mur', nom: 'Mur', parentId: null },
  { id: 'f-tic', nom: 'TIC', parentId: null },
  { id: 'f-foto', nom: 'Foto', parentId: 'f-tic' }
]);
const URL_PROVA = 'https://exemple.org/article';

describe('les claus', () => {
  test('mode=desa obri el snippet; la nota del Bloc es diu «nota»', () => {
    expect(MODE_DESA).toBe('desa');
    expect(CLAUS_DESA).toEqual({ mode: 'mode', categoria: 'categoria', etiqueta: 'etiqueta', emoticona: 'emoticona' });
    expect(CLAUS_BLOC).toEqual({ item: 'nota' });
  });

  test('esModeDesa: només amb mode=desa, i accepta text o URLSearchParams', () => {
    expect(esModeDesa(new URLSearchParams('mode=desa&url=x'))).toBe(true);
    expect(esModeDesa('mode=desa')).toBe(true);
    expect(esModeDesa('mode=entrar')).toBe(false);
    expect(esModeDesa('nota=n1')).toBe(false);
    expect(esModeDesa(null)).toBe(false);
  });
});

describe('carpetaDeDesa', () => {
  test('la de la URL si és del Bloc (també niada); si no, la Safata d’Entrada', () => {
    expect(carpetaDeDesa('mode=desa&carpeta=f-foto', CARPETES)).toBe('f-foto');
    expect(carpetaDeDesa('mode=desa&carpeta=f-inventada', CARPETES)).toBe(CARPETA_CONNECTATS);
    expect(carpetaDeDesa('mode=desa', CARPETES)).toBe(CARPETA_CONNECTATS);
    expect(carpetaDeDesa('mode=desa&carpeta=', CARPETES)).toBe(CARPETA_CONNECTATS);
  });
});

describe('llegixDesa', () => {
  test('el contingut de fora amb les regles de /connectar, i la tria', () => {
    const lectura = llegixDesa(`mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=Un+article&categoria=Sistema&categoria=+Hort+&categoria=Sistema&etiqueta=Reg&emoticona=%F0%9F%8D%85`);
    expect(lectura.contingut).toEqual({
      ok: true,
      valor: { url: URL_PROVA, lloc: 'exemple.org', titol: 'Un article', subtitol: '', entradilla: '' }
    });
    expect(lectura.categories).toEqual(['Sistema', 'Hort']);
    expect(lectura.etiquetes).toEqual(['Reg']);
    expect(lectura.emoticona).toBe('🍅');
  });

  test('sense adreça, cap contingut; una adreça que no és web, el motiu', () => {
    expect(llegixDesa('mode=desa').contingut).toBeNull();
    const dolenta = llegixDesa('mode=desa&url=javascript%3Aalert(1)').contingut;
    expect(dolenta.ok).toBe(false);
    expect(dolenta.errors.url).toMatch(/http o https/);
  });

  test('una emoticona que no és un sol emoji no compta', () => {
    expect(llegixDesa('mode=desa&emoticona=hola').emoticona).toBe('');
    expect(llegixDesa('mode=desa&emoticona=%F0%9F%8D%85%F0%9F%8D%85').emoticona).toBe('');
    expect(llegixDesa('mode=desa').emoticona).toBe('');
  });
});

describe('escriuDesa', () => {
  const BASE = `mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=T`;

  test('escriu cada camp i conserva la resta de la consulta', () => {
    const next = escriuDesa(BASE, { carpeta: 'f-foto', categories: ['Sistema', 'Hort'], etiquetes: ['Reg'], emoticona: '🍅' });
    expect(next.get('mode')).toBe('desa');
    expect(next.get('url')).toBe(URL_PROVA);
    expect(next.get('titol')).toBe('T');
    expect(next.get('carpeta')).toBe('f-foto');
    expect(next.getAll('categoria')).toEqual(['Sistema', 'Hort']);
    expect(next.getAll('etiqueta')).toEqual(['Reg']);
    expect(next.get('emoticona')).toBe('🍅');
  });

  test('undefined no toca; una llista substituïx o, buida, esborra; una emoticona buida s’esborra', () => {
    const abans = escriuDesa(BASE, { carpeta: 'f-mur', categories: ['Sistema'], etiquetes: ['Reg', 'Hort'], emoticona: '🍅' });
    const despres = escriuDesa(abans, { etiquetes: [], emoticona: '' });
    expect(despres.get('carpeta')).toBe('f-mur');
    expect(despres.getAll('categoria')).toEqual(['Sistema']);
    expect(despres.has('etiqueta')).toBe(false);
    expect(despres.has('emoticona')).toBe(false);
    expect(escriuDesa(abans, { emoticona: 'text' }).has('emoticona')).toBe(false);
    expect(escriuDesa(abans, {}).toString()).toBe(abans.toString());
  });

  test('anada i tornada: el que s’escriu és el que es llig', () => {
    const tria = { categories: ['Sistema'], etiquetes: ['Reg', 'Hort'], emoticona: '🍅' };
    const lectura = llegixDesa(escriuDesa(BASE, { carpeta: 'f-foto', ...tria }));
    expect({ categories: lectura.categories, etiquetes: lectura.etiquetes, emoticona: lectura.emoticona }).toEqual(tria);
    expect(carpetaDeDesa(escriuDesa(BASE, { carpeta: 'f-foto' }), CARPETES)).toBe('f-foto');
  });
});

describe('paramsDeLaNota', () => {
  test('la consulta del Bloc amb la nota, sense res del snippet', () => {
    expect(paramsDeLaNota({ carpeta: 'f-foto', nota: 'n9' }).toString()).toBe('carpeta=f-foto&nota=n9');
    expect(paramsDeLaNota({ carpeta: 'f-foto' }).toString()).toBe('carpeta=f-foto');
  });
});

describe('entradaDeDesa', () => {
  const valor = llegixDesa(`url=${encodeURIComponent(URL_PROVA)}&titol=Un+article&entradilla=Resum`).contingut.valor;

  test('notaDeContingutExtern a la carpeta triada, amb categories, etiquetes i emoticona', () => {
    const entrada = entradaDeDesa(valor, { carpeta: 'f-foto', categories: ['Sistema'], etiquetes: ['Reg'], emoticona: '🍅' });
    expect(entrada).toMatchObject({
      title: 'Un article',
      lead: 'Resum',
      folderId: 'f-foto',
      categories: ['Sistema'],
      tags: ['Reg'],
      icon: '🍅',
      origen: { tipus: 'extern', url: URL_PROVA, titol: 'Un article' }
    });
    expect(entrada.content).toContain(`href="${URL_PROVA}"`);
  });

  test('sense tria, ni categories, ni etiquetes, ni emoticona; sense carpeta, la Safata', () => {
    const entrada = entradaDeDesa(valor);
    expect(entrada.folderId).toBe(CARPETA_CONNECTATS);
    expect(['categories', 'tags', 'icon'].filter((camp) => camp in entrada)).toEqual([]);
  });

  test('un contingut que no val no fa cap entrada', () => {
    expect(entradaDeDesa({ url: 'ftp://exemple.org', titol: 'X' })).toBeNull();
  });
});

/* SN (261003) · Per a què és l'enllaç: el Bloc (per defecte) o el Lector. */
describe('la destinació', () => {
  const BASE = `mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=T&carpeta=f-mur`;

  test('les claus i els valors', () => {
    expect(DESTINS).toEqual({ bloc: 'bloc', lector: 'lector' });
    expect(CLAUS_DESTI).toEqual({ desti: 'desti', categoriaFont: 'categoria-font' });
    expect(APP_LECTOR).toBe('lector');
  });

  test('llegixDesti: el Lector només amb desti=lector; qualsevol altra cosa és el Bloc', () => {
    expect(llegixDesti(BASE)).toEqual({ desti: 'bloc', categoriaFont: null });
    expect(llegixDesti(`${BASE}&desti=lector&categoria-font=festes`)).toEqual({ desti: 'lector', categoriaFont: 'festes' });
    expect(llegixDesti(`${BASE}&desti=Lector`).desti).toBe('bloc');
    expect(llegixDesti(`${BASE}&desti=bar`).desti).toBe('bloc');
    expect(llegixDesti(`${BASE}&categoria-font=+++`).categoriaFont).toBeNull();
    expect(llegixDesti(null)).toEqual({ desti: 'bloc', categoriaFont: null });
  });

  test('escriuDesti: conserva la resta; el Bloc i una categoria buida s’esborren; undefined no toca', () => {
    const lector = escriuDesti(BASE, { desti: 'lector', categoriaFont: 'festes' });
    expect(lector.get('desti')).toBe('lector');
    expect(lector.get('categoria-font')).toBe('festes');
    expect([lector.get('mode'), lector.get('url'), lector.get('carpeta')]).toEqual(['desa', URL_PROVA, 'f-mur']);
    expect(escriuDesti(lector, {}).toString()).toBe(lector.toString());
    const bloc = escriuDesti(lector, { desti: 'bloc', categoriaFont: null });
    expect(bloc.has('desti')).toBe(false);
    expect(bloc.has('categoria-font')).toBe(false);
    expect(bloc.toString()).toBe(new URLSearchParams(BASE).toString());
    expect(escriuDesti(BASE, { desti: 'inventada' }).has('desti')).toBe(false);
    /* No muta els paràmetres que rep. */
    const original = new URLSearchParams(BASE);
    escriuDesti(original, { desti: 'lector' });
    expect(original.has('desti')).toBe(false);
  });

  test('nomProposat: el títol o, sense títol, el domini sense «www.», tallat sense partir cap emoji', () => {
    const ambTitol = llegixDesa(`url=${encodeURIComponent('https://www.exemple.org/a')}&titol=La+Veu`).contingut.valor;
    expect(nomProposat(ambTitol)).toBe('La Veu');
    const senseTitol = llegixDesa(`url=${encodeURIComponent('https://www.exemple.org/a')}`).contingut.valor;
    expect(senseTitol.titol).toBe('www.exemple.org');
    expect(nomProposat(senseTitol)).toBe('exemple.org');
    const llarg = llegixDesa(`url=${encodeURIComponent(URL_PROVA)}&titol=${encodeURIComponent(`${'a'.repeat(79)}🍅b`)}`).contingut.valor;
    expect(nomProposat(llarg, 80)).toBe('a'.repeat(79));
    expect(nomProposat(llarg, 81)).toBe(`${'a'.repeat(79)}🍅`);
    expect(nomProposat(null)).toBe('');
  });

  test('entradaDeFont: l’adreça validada, el nom net i la categoria o null', () => {
    const { valor } = llegixDesa(`url=${encodeURIComponent(URL_PROVA)}&titol=T`).contingut;
    expect(entradaDeFont(valor, { nom: '  La Veu ', categoriaId: 'festes' })).toEqual({ url: URL_PROVA, nom: 'La Veu', categoriaId: 'festes' });
    expect(entradaDeFont(valor, { nom: 'X', categoriaId: '' })).toEqual({ url: URL_PROVA, nom: 'X', categoriaId: null });
    expect(entradaDeFont(null, { nom: 'X' })).toBeNull();
  });
});

describe('el bookmarklet (Model B: l’origen de l’app que el genera)', () => {
  const font = readFileSync(path.join(process.cwd(), 'src/sections/notes/modeDesa.js'), 'utf8');
  /* Un origen sintètic: el de l'app que genera el bookmarklet. */
  const ORIGEN_APP = 'https://poble.exemple.test';

  /* La pàgina de fora: un document de veres (jsdom), amb el seu títol i els meta que es passen,
     [atribut, nom, contingut] (property="og:title", name="twitter:description"…). Sense HTML cru:
     el querySelector del bookmarklet hi corre tal com correria al navegador. */
  function paginaDeFora(titol = '', metes = []) {
    const pagina = document.implementation.createHTMLDocument('');
    pagina.title = titol;
    for (const [atribut, nom, contingut] of metes) {
      const meta = pagina.createElement('meta');
      meta.setAttribute(atribut, nom);
      meta.setAttribute('content', contingut);
      pagina.head.append(meta);
    }
    return pagina;
  }

  /* L'executa com ho faria el navegador, amb la pàgina de fora simulada. */
  function executa({ href, titol = '', metes = [], seleccio = null, codi = bookmarkletDesa(ORIGEN_APP) }) {
    const oberts = [];
    expect(codi.startsWith('javascript:')).toBe(true);
    const bookmarklet = new Function('location', 'document', 'getSelection', 'open', codi.slice('javascript:'.length));
    bookmarklet({ href }, paginaDeFora(titol, metes), () => seleccio, (url, nom, opcions) => { oberts.push({ url, nom, opcions }); });
    return oberts;
  }

  test('cap domini de producció fixat al mòdul', () => {
    expect(font).not.toMatch(/socdepoble\.org/i);
    expect(font).not.toMatch(/new URL\('\/notes',\s*'https?:/);
  });

  test('per defecte, l’origen de l’app que l’executa (window.location.origin)', () => {
    const origen = globalThis.location.origin;
    expect(bookmarkletDesa()).toBe(bookmarkletDesa(origen));
    const [obert] = executa({ href: URL_PROVA, titol: 'T', codi: bookmarkletDesa() });
    expect(new URL(obert.url).origin).toBe(origen);
  });

  test('origenDelSnippet: només https, o http en local; sense camí, credencials ni esquemes perillosos', () => {
    expect(origenDelSnippet('https://poble.exemple.test/sub/cami?x=1#y')).toBe('https://poble.exemple.test');
    expect(origenDelSnippet('https://poble.exemple.test:8443')).toBe('https://poble.exemple.test:8443');
    for (const local of ['http://localhost:3340', 'http://127.0.0.1:5173', 'http://[::1]:3000', 'http://app.localhost']) {
      expect(origenDelSnippet(local), local).toBe(new URL(local).origin);
    }
    for (const dolent of ['http://poble.exemple.test', 'javascript:alert(1)', 'data:text/html,x', 'file:///etc/hosts',
      'https://usuari:clau@poble.exemple.test', '//poble.exemple.test', '/notes', '', null, undefined, 42]) {
      expect(origenDelSnippet(dolent), String(dolent)).toBeNull();
      expect(bookmarkletDesa(dolent ?? 'cap'), String(dolent)).toBeNull();
    }
  });

  test('obri una finestra amb un snippet vàlid: url, títol i el text seleccionat', () => {
    const [obert, ...resta] = executa({ href: URL_PROVA, titol: 'Un article', seleccio: '  Un tros triat  ' });
    expect(resta).toEqual([]);
    const desti = new URL(obert.url);
    expect(`${desti.origin}${desti.pathname}`).toBe(`${ORIGEN_APP}/notes`);
    expect(obert.nom).toBe('sdp-desa');
    expect(obert.opcions).toBe('width=480,height=720');
    expect(esModeDesa(desti.searchParams)).toBe(true);
    expect(llegixDesa(desti.searchParams).contingut).toEqual({
      ok: true,
      valor: { url: URL_PROVA, lloc: 'exemple.org', titol: 'Un article', subtitol: '', entradilla: 'Un tros triat' }
    });
  });

  test('sense selecció no hi ha entradeta, i un títol llarg es talla al límit i continua sent vàlid', () => {
    const [obert] = executa({ href: URL_PROVA, titol: 'a'.repeat(1000), seleccio: null });
    const desti = new URL(obert.url);
    expect(desti.searchParams.has('entradilla')).toBe(false);
    const { contingut } = llegixDesa(desti.searchParams);
    expect(contingut.ok).toBe(true);
    expect(contingut.valor.titol).toHaveLength(300);
  });

  /* Correcció T7C-R5 · La consulta que obri la finestra arriba al servidor
     de Sóc de Poble abans de cap clic: el fragment (#access_token=… d'una
     tornada OAuth, l'ancoratge d'una pàgina) no hi viatja. La consulta de la
     pàgina sí: sovint és l'adreça mateixa (?v=…). */
  test('el fragment de la pàgina no viatja: l’adreça s’envia sense #, amb la seua consulta', () => {
    const [obert] = executa({ href: `${URL_PROVA}?v=7#access_token=sintetic-no-real&estat=x`, titol: 'T' });
    const desti = new URL(obert.url);
    expect(desti.searchParams.get('url')).toBe(`${URL_PROVA}?v=7`);
    expect(obert.url).not.toContain('access_token');
    expect(llegixDesa(desti.searchParams).contingut.valor.url).toBe(`${URL_PROVA}?v=7`);
  });

  test('una selecció llarga es talla al límit de l’entradeta', () => {
    const [obert] = executa({ href: URL_PROVA, titol: 'T', seleccio: 'b'.repeat(1000) });
    const { contingut } = llegixDesa(new URL(obert.url).searchParams);
    expect(contingut.ok).toBe(true);
    expect(contingut.valor.entradilla).toHaveLength(256);
  });

  /* E1 del Gauntlet (ordre del Mestre, 261016, I05/I07: «hidrata títol, subtítol, entradeta,
     URL») · El títol i el subtítol, d'OpenGraph (og:title, og:description), amb Twitter de
     reserva i, per al títol, el de la pàgina. Cap imatge: og:image no viatja (doctrina de
     privacitat de contingutExtern.js; canviar-la és decisió del Mestre). */
  describe('la hidratació OpenGraph (E1, 261016)', () => {
    const OG = (nom, contingut) => ['property', `og:${nom}`, contingut];
    const TWITTER = (nom, contingut) => ['name', `twitter:${nom}`, contingut];

    test('og:title i og:description passen davant del títol de la pàgina; l’entradeta, la selecció', () => {
      const [obert] = executa({
        href: `${URL_PROVA}#seccio`,
        titol: 'Un article | El diari del poble',
        metes: [OG('title', 'Un article'), OG('description', '  La descripció de la pàgina.  '), OG('image', `${URL_PROVA}/portada.webp`)],
        seleccio: 'Un tros'
      });
      const desti = new URL(obert.url);
      expect(llegixDesa(desti.searchParams).contingut).toEqual({
        ok: true,
        valor: { url: URL_PROVA, lloc: 'exemple.org', titol: 'Un article', subtitol: 'La descripció de la pàgina.', entradilla: 'Un tros' }
      });
      /* La imatge no viatja: cap clau de més a la consulta. */
      expect([...desti.searchParams.keys()].sort()).toEqual(['entradilla', 'mode', 'subtitol', 'titol', 'url']);
      expect(obert.url).not.toContain('portada');
    });

    test('Twitter de reserva (també amb property) i, sense cap meta, el títol de la pàgina i cap subtítol', () => {
      const [ambTwitter] = executa({
        href: URL_PROVA, titol: 'El títol de la pàgina',
        metes: [TWITTER('title', 'El títol de Twitter'), ['property', 'twitter:description', 'La de Twitter']]
      });
      expect(llegixDesa(new URL(ambTwitter.url).searchParams).contingut.valor).toMatchObject({ titol: 'El títol de Twitter', subtitol: 'La de Twitter' });
      /* OpenGraph mana sobre Twitter, també si Twitter va primer al document. */
      const [ambTots] = executa({
        href: URL_PROVA, metes: [TWITTER('title', 'Twitter'), OG('title', 'OpenGraph'), TWITTER('description', 'T'), ['name', 'og:description', 'OG']]
      });
      expect(llegixDesa(new URL(ambTots.url).searchParams).contingut.valor).toMatchObject({ titol: 'OpenGraph', subtitol: 'OG' });
      /* Un og:title buit o només d'espais no tapa el títol de la pàgina. */
      const [senseRes] = executa({ href: URL_PROVA, titol: 'El títol de la pàgina', metes: [OG('title', '   '), OG('description', '')] });
      const desti = new URL(senseRes.url);
      expect(desti.searchParams.has('subtitol')).toBe(false);
      expect(llegixDesa(desti.searchParams).contingut.valor).toMatchObject({ titol: 'El títol de la pàgina', subtitol: '' });
    });

    test('una og:description enorme es talla a 300 punts de codi (mai un emoji partit) i el snippet continua sent vàlid', () => {
      /* validaContingutExtern rebutja (no talla) el que passa de 300: sense el tall, el Curador
         donaria un error de camp en lloc d'hidratar-lo. */
      const llarga = '🌾'.repeat(400);
      const [obert] = executa({ href: URL_PROVA, titol: 'T', metes: [OG('description', llarga), OG('title', `${'🍅'.repeat(299)}a🍅🍅`)] });
      const { contingut } = llegixDesa(new URL(obert.url).searchParams);
      expect(contingut.ok).toBe(true);
      expect(Array.from(contingut.valor.subtitol)).toHaveLength(300);
      expect(contingut.valor.subtitol).toBe('🌾'.repeat(300));
      expect(contingut.valor.titol).toBe(`${'🍅'.repeat(299)}a`);
      /* I sense el tall, el mateix text el rebutjaria. */
      expect(llegixDesa(new URLSearchParams({ url: URL_PROVA, subtitol: llarga })).contingut.ok).toBe(false);
    });
  });

  /* Ordre del Mestre, 261016 (prompt 261016_0015, Bloc 0) · «L'usuari ha de poder capturar
     contingut i decidir fàcilment si el destí és el Bloc de notes o el Lector RSS»: el
     bookmarklet pot portar la destinació. Sense, o amb 'bloc', el de sempre. */
  describe('la destinació opcional (desti)', () => {
    /* El bookmarklet d'abans de la hidratació OpenGraph (E1 del Gauntlet, 261016), caràcter a
       caràcter: el que porta instal·lat qui el va arrossegar abans. Ja no es genera, però el
       snippet l'ha de continuar acceptant (prova de davall). */
    const DE_SEMPRE = `javascript:(()=>{const u=new URL('/notes',"${ORIGEN_APP}");const p=u.searchParams;p.set('mode','desa');p.set('url',location.href.split('#')[0]);p.set('titol',document.title.slice(0,300));const s=String(getSelection()||'').trim().slice(0,256);if(s)p.set('entradilla',s);open(u.href,'sdp-desa','width=480,height=720');})();`;
    /* Actualitzada a posta per l'E1 del Gauntlet (ordre del Mestre, 261016: «hidrata títol,
       subtítol, entradeta, URL»): el bookmarklet d'ara, caràcter a caràcter. Fixa el text perquè
       cap canvi involuntari de la plantilla passe sense vore's. */
    const HIDRATAT = `javascript:(()=>{const u=new URL('/notes',"${ORIGEN_APP}");const p=u.searchParams;const m=n=>((document.querySelector('meta[property="'+n+'"],meta[name="'+n+'"]')||{}).content||'').trim();const o=k=>m('og:'+k)||m('twitter:'+k);const c=(t,n)=>[...String(t).trim().slice(0,n*2)].slice(0,n).join('');p.set('mode','desa');p.set('url',location.href.split('#')[0]);p.set('titol',c(o('title')||document.title,300));const d=c(o('description'),300);if(d)p.set('subtitol',d);const s=c(getSelection()||'',256);if(s)p.set('entradilla',s);open(u.href,'sdp-desa','width=480,height=720');})();`;

    test('el bookmarklet d’abans, ja instal·lat, continua obrint un snippet vàlid', () => {
      expect(bookmarkletDesa(ORIGEN_APP)).not.toBe(DE_SEMPRE);
      /* No sap res d'OpenGraph: el títol de la pàgina, com sempre, i cap subtítol. */
      const [obert] = executa({
        href: `${URL_PROVA}#x`, titol: 'Un article', metes: [['property', 'og:title', 'Un altre títol'], ['property', 'og:description', 'D']],
        seleccio: 'Un tros', codi: DE_SEMPRE
      });
      const desti = new URL(obert.url);
      expect(`${desti.origin}${desti.pathname}`).toBe(`${ORIGEN_APP}/notes`);
      expect(llegixDesa(desti.searchParams).contingut).toEqual({
        ok: true,
        valor: { url: URL_PROVA, lloc: 'exemple.org', titol: 'Un article', subtitol: '', entradilla: 'Un tros' }
      });
    });

    test('sense desti, o amb «bloc», el bookmarklet de sempre: obri el Bloc, sense ?desti', () => {
      expect(bookmarkletDesa(ORIGEN_APP)).toBe(HIDRATAT);
      expect(bookmarkletDesa(ORIGEN_APP, {})).toBe(HIDRATAT);
      expect(bookmarkletDesa(ORIGEN_APP, { desti: DESTINS.bloc })).toBe(HIDRATAT);
      expect(bookmarkletDesa(ORIGEN_APP, { desti: undefined })).toBe(HIDRATAT);
      const [obert] = executa({ href: URL_PROVA, titol: 'T', codi: bookmarkletDesa(ORIGEN_APP, { desti: 'bloc' }) });
      const desti = new URL(obert.url);
      expect(desti.searchParams.has('desti')).toBe(false);
      expect(llegixDesti(desti.searchParams)).toEqual({ desti: 'bloc', categoriaFont: null });
    });

    test('amb «lector»: el snippet s’obri amb el Lector ja triat (?desti=lector) i el mateix contingut', () => {
      const codi = bookmarkletDesa(ORIGEN_APP, { desti: DESTINS.lector });
      expect(codi).not.toBe(HIDRATAT);
      expect(codi.replace("p.set('desti','lector');", '')).toBe(HIDRATAT);
      const [obert, ...resta] = executa({ href: `${URL_PROVA}#ancora`, titol: 'Un article', seleccio: 'Un tros', codi });
      expect(resta).toEqual([]);
      const desti = new URL(obert.url);
      expect(`${desti.origin}${desti.pathname}`).toBe(`${ORIGEN_APP}/notes`);
      expect(esModeDesa(desti.searchParams)).toBe(true);
      expect(llegixDesti(desti.searchParams)).toEqual({ desti: 'lector', categoriaFont: null });
      expect(llegixDesa(desti.searchParams).contingut).toEqual({
        ok: true,
        valor: { url: URL_PROVA, lloc: 'exemple.org', titol: 'Un article', subtitol: '', entradilla: 'Un tros' }
      });
      /* L'origen continua sent el de l'app que el genera. */
      expect(bookmarkletDesa(undefined, { desti: 'lector' })).toBe(bookmarkletDesa(globalThis.location.origin, { desti: 'lector' }));
    });

    test('una destinació que no existix (o un origen que no val): cap bookmarklet', () => {
      for (const dolenta of ['Lector', 'bar', '', null, 0, true, {}, ['lector']]) {
        expect(bookmarkletDesa(ORIGEN_APP, { desti: dolenta }), String(dolenta)).toBeNull();
      }
      expect(bookmarkletDesa('http://poble.exemple.test', { desti: 'lector' })).toBeNull();
      expect(bookmarkletDesa('javascript:alert(1)', { desti: 'lector' })).toBeNull();
    });
  });
});
