/**
 * Pla 261027_0845 (Guarda Nocturna), T1-06 · El text de les pàgines dins de
 * l'app nativa (perAppNativa.js), sense cap altra plataforma mòbil (regla
 * 2.3.10 de l'App Store).
 *
 *  · la peça pura: què nomena una altra plataforma i què no, els comentaris,
 *    els atributs, les adaptacions declarades i la xarxa (el bloc, el tros
 *    de línia i la comprovació final), i que del que torna no n'ix cap;
 *  · el contingut real: el Full de ruta i l'Avís legal s'adapten sense que
 *    la xarxa hi lleve cap bloc, i la resta de pàgines no canvien;
 *  · les superfícies que no passen per TextSection: el lector de connexions
 *    (paginaDeRuta), la targeta del Mur (targetesDeSistema) i la cerca
 *    (indexCerca.js · dePagina, sobre la pàgina que useCercaGlobal passa per
 *    paginaPerAppNativa; la cerca pintada és a SearchSection.test.jsx).
 * La pàgina pintada sencera (TextSection, cos i capçalera) és a
 * TextSection.appNativa.test.jsx.
 */
import { afterEach, describe, expect, test } from 'vitest';
import {
  ADAPTACIONS, PLATAFORMA_ALIENA, adaptaHtml, htmlPerAppNativa, nomenaPlataformaAliena, paginaPerAppNativa, textPerAppNativa
} from './perAppNativa.js';
import { PAGE_COPY } from './pageContent.js';
import { paginaDeRuta } from './paginaDeText.js';
import { llevaEtiquetes } from '../../config/contentHelpers.js';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { dePagina } from '../search/indexCerca.js';

/* La regla de la prova (T1-06): cap d'estes paraules dins de l'app nativa,
   tampoc amb un guió baix o un guionet (google_play, com en un nom de fitxer). */
const PROHIBIDES = /Google[\s_-]*Play|Android|Play[\s_-]*Store|APK/i;

/* Tot el que es llig o se sent d'un HTML: el text com el pinta el navegador
   (jsdom), el de llevaEtiquetes i els atributs que es lligen. */
function lectures(html) {
  const caixa = document.createElement('div');
  caixa.innerHTML = html;
  const atributs = [...caixa.querySelectorAll('*')]
    .flatMap((el) => ['title', 'alt', 'aria-label', 'aria-description', 'placeholder'].map((nom) => el.getAttribute(nom) || ''));
  return [caixa.textContent, llevaEtiquetes(html), ...atributs].join(' | ');
}

afterEach(() => {
  delete window.Capacitor;
});

describe('què nomena una altra plataforma mòbil', () => {
  test('les altres plataformes i botigues, també amb un espai dur o en plural', () => {
    for (const text of ['Google Play', 'Google&nbsp;Play', 'google  play', 'la Play Store', 'Android', "l'app d'Android", 'un APK', 'els APKs',
      'F-Droid', 'AppGallery', 'Galaxy Store', 'HarmonyOS', 'acta_botigues_google_play', 'Google-Play', 'GooglePlay', 'play_store']) {
      expect(nomenaPlataformaAliena(text), text).toBe(true);
    }
  });

  test('Apple, Google sol, els navegadors, «androide» (el robot) i «display store» no en són cap', () => {
    for (const text of ['App Store', "l'iPhone i l'iPad", 'iOS i iPadOS', 'TestFlight', 'entrar amb Google', 'Google Analytics',
      'Chrome i Edge', 'un androide de llauna', 'un display store', 'Apple', '']) {
      expect(nomenaPlataformaAliena(text), text).toBe(false);
    }
    expect(nomenaPlataformaAliena(null)).toBe(false);
    expect(PLATAFORMA_ALIENA.flags).not.toContain('g');
  });
});

describe('htmlPerAppNativa · la peça pura', () => {
  test('fora els comentaris, també el que no es tanca; la resta, igual', () => {
    expect(htmlPerAppNativa('<p>a</p><!-- <p>Google Play</p> --><p>b</p>')).toBe('<p>a</p><p>b</p>');
    expect(htmlPerAppNativa('<p>a</p><!-- sense tancar <p>Android</p>')).toBe('<p>a</p>');
  });

  test('l’adaptació de l’Avís legal: la frase es queda i només perd la llista de dispositius', () => {
    expect(htmlPerAppNativa("<p>(el web i l'aplicació Sóc de Poble per a Android i iPhone) quan vulgues</p>"))
      .toBe("<p>(el web i l'aplicació Sóc de Poble) quan vulgues</p>");
    expect(htmlPerAppNativa('<p>l’app per a iPhone, iPad o Android.</p>')).toBe('<p>l’app.</p>');
    // Una llista només d'Apple es queda: la regla parla de les ALTRES plataformes.
    expect(htmlPerAppNativa('<p>la versió per a iPhone i iPad (TestFlight)</p>')).toBe('<p>la versió per a iPhone i iPad (TestFlight)</p>');
    for (const { motiu, patro, canvi } of ADAPTACIONS) {
      expect(motiu).toMatch(/\S/);
      expect(patro.flags).toContain('g');
      expect(typeof canvi).toBe('function');
    }
  });

  test('la xarxa: fora el bloc més menut que en nomena alguna, i res més', () => {
    const { html, retirats } = adaptaHtml([
      '<h3>Mòbil</h3>',
      '<h4>Google Play</h4>',
      "<p>Abans. Està previst el fitxer d'instal·lació (<strong>APK</strong>). Després.</p>",
      '<ul><li>Safari a l’iPhone: Compartir.</li><li>Chrome a Android: el menú.</li></ul>',
      '<blockquote><p>Una cita sense cap plataforma.</p></blockquote>',
      '<table><tr><td>Web</td><td>Galaxy Store</td></tr></table>'
    ].join(''));
    expect(html).toBe([
      '<h3>Mòbil</h3>',
      '<ul><li>Safari a l’iPhone: Compartir.</li></ul>',
      '<blockquote><p>Una cita sense cap plataforma.</p></blockquote>',
      '<table><tr><td>Web</td><td></td></tr></table>'
    ].join(''));
    expect(retirats).toEqual([
      'Google Play',
      "Abans. Està previst el fitxer d'instal·lació ( APK ). Després.",
      'Chrome a Android: el menú.',
      'Galaxy Store'
    ]);
  });

  test('el tros de línia: el text solt fora de cap bloc, o al costat d’una llista niuada', () => {
    expect(htmlPerAppNativa('Baixa-la de Google Play<p>Hola</p>')).toBe('<p>Hola</p>');
    expect(htmlPerAppNativa('<ul><li>Per a Android: <ul><li>Neta</li></ul></li></ul>'))
      .toBe('<ul><li><ul><li>Neta</li></ul></li></ul>');
    // Un salt de línia també talla: les línies del costat es queden.
    expect(htmlPerAppNativa('Línia 1<br>Baixa-la de Google Play<br>Línia 3')).toBe('Línia 1<br><br>Línia 3');
  });

  /* La revisió adversarial (261027): una menció partida per una etiqueta de
     línia, fora d'un bloc fulla, passava sencera; cada tros de text, a soles,
     no en nomenava cap. */
  test('el tros de línia: també quan una etiqueta de línia parteix la menció; les etiquetes buides, fora', () => {
    expect(adaptaHtml('<ul><li>Baixa-la de <em>Google</em> Play: <ul><li>Neta</li></ul></li></ul>'))
      .toEqual({ html: '<ul><li><ul><li>Neta</li></ul></li></ul>', retirats: ['Baixa-la de Google Play:'] });
    expect(htmlPerAppNativa('Baixa-la de <b>Google</b> Play<p>Hola</p>')).toBe('<p>Hola</p>');
    expect(htmlPerAppNativa('<div>Text <a href="/x"><em>Google</em> Play</a> fi<ul><li>a</li></ul></div>'))
      .toBe('<div><ul><li>a</li></ul></div>');
    // Dins d'un paràgraf, el bloc sencer; també partida a mitja paraula o amb un guionet de partició.
    expect(htmlPerAppNativa('<p>Hola</p><p>La versió per a <b>Andr</b>oid.</p>')).toBe('<p>Hola</p>');
    expect(htmlPerAppNativa('<p>Andr&shy;oid</p><p>ok</p>')).toBe('<p>ok</p>');
  });

  test('la comprovació final: una menció partida entre dos blocs buida els trossos de text que la formen', () => {
    expect(adaptaHtml('<div><p>Baixa-la de Google</p><p>Play ara</p></div>'))
      .toEqual({ html: '<div><p></p><p></p></div>', retirats: ['Baixa-la de Google', 'Play ara'] });
    expect(htmlPerAppNativa('<table><tr><td>Google</td><td>Play</td><td>Web</td></tr></table>'))
      .toBe('<table><tr><td></td><td></td><td>Web</td></tr></table>');
  });

  test('els atributs que es lligen o se senten (title, aria-label…) i en nomenen alguna, fora; els altres, igual', () => {
    expect(adaptaHtml('<p><a href="https://example.org" title="Disponible a Google Play">la web</a> i <span aria-label="Android">un robot</span>'
      + ' <abbr title="Sóc de Poble">SdP</abbr></p>')).toEqual({
      html: '<p><a href="https://example.org">la web</a> i <span>un robot</span> <abbr title="Sóc de Poble">SdP</abbr></p>',
      retirats: ['Disponible a Google Play', 'Android']
    });
    expect(htmlPerAppNativa("<p data-title='Android'>Hola</p>")).toBe("<p data-title='Android'>Hola</p>");
  });

  test('del que torna, cap lectura ni cap atribut que es llig no en nomena cap', () => {
    for (const html of [
      '<ul><li>Baixa-la de <em>Google</em> Play: <ul><li>Neta</li></ul></li></ul>',
      'Baixa-la de <b>Google</b> Play<p>Hola</p>',
      '<p><a href="https://example.org" title="Disponible a Google Play">la web</a></p><span aria-label="F-Droid">x</span>',
      '<div><p>Baixa-la de Google</p><p>Play ara</p></div>',
      '<p>La versió per a <b>Andr</b>oid.</p><section><h2>Galaxy</h2><p>Store</p></section>',
      '<div>Text <a href="/x"><em>Google</em> Play</a> fi<ul><li>a</li></ul></div><img alt="Logo d’Android" src="/x.png">',
      '<p>acta_botigues_google_play</p><p>Hola</p>',
      'a < b Android',
      '<p title="x>Android">ok</p>'
    ]) {
      expect(lectures(htmlPerAppNativa(html)), html).not.toMatch(PROHIBIDES);
    }
  });

  test('les imatges amb el nom o el distintiu fora; els enllaços a una altra botiga, desfets', () => {
    expect(adaptaHtml('<p>Hola <img src="/x/google-play-badge.png" alt="Disponible"> <img src="/x/logo.png" alt="Logo"></p>'))
      .toEqual({ html: '<p>Hola  <img src="/x/logo.png" alt="Logo"></p>', retirats: ['Disponible'] });
    expect(htmlPerAppNativa('<p>Mira-la <a href="https://play.google.com/store/apps/details?id=x">ací</a> o <a href="/legal">ací</a>.</p>'))
      .toBe('<p>Mira-la ací o <a href="/legal">ací</a>.</p>');
  });

  test('idempotent, i sense HTML, tal qual', () => {
    for (const html of [PAGE_COPY.legal.html, PAGE_COPY.roadmap.html, PAGE_COPY.descarregues.html]) {
      const una = htmlPerAppNativa(html);
      expect(htmlPerAppNativa(una)).toBe(una);
    }
    expect(htmlPerAppNativa('')).toBe('');
    expect(htmlPerAppNativa(undefined)).toBeUndefined();
    expect(adaptaHtml(null)).toEqual({ html: null, retirats: [] });
  });
});

describe('textPerAppNativa · un text pla', () => {
  test('les adaptacions; si encara en nomena alguna, fora la frase sencera', () => {
    expect(textPerAppNativa("L'aplicació per a Android i iPhone. Ja la pots provar.")).toBe("L'aplicació. Ja la pots provar.");
    expect(textPerAppNativa("Baixa-la de Google Play. L'app de l'iPhone va bé! Fi")).toBe("L'app de l'iPhone va bé! Fi");
    expect(textPerAppNativa('Només Android')).toBe('');
    expect(textPerAppNativa('Res a dir.')).toBe('Res a dir.');
    expect(textPerAppNativa(undefined)).toBeUndefined();
  });

  /* La revisió adversarial (261027): el punt d'una versió o d'un domini no
     acaba la frase, i les frases que es queden no s'apeguen. */
  test('un punt que no va davant d’un espai no talla la frase; les que es queden, amb el seu espai', () => {
    expect(textPerAppNativa('Sóc de Poble v2.0 a Android: prova-la. La web, sempre.')).toBe('La web, sempre.');
    expect(textPerAppNativa('Versió 1.2 de la web. Baixa-la de Google Play.')).toBe('Versió 1.2 de la web.');
    expect(textPerAppNativa('socdepoble.org és la web. Android no! Fins aviat...')).toBe('socdepoble.org és la web. Fins aviat...');
    expect(textPerAppNativa('Primera.\nSegona a Android.\nTercera.')).toBe('Primera. Tercera.');
  });
});

describe('paginaPerAppNativa · la pàgina sencera', () => {
  test('fora de l’app nativa, o sense res a adaptar, el MATEIX objecte', () => {
    expect(paginaPerAppNativa(PAGE_COPY.legal, { nativa: false })).toBe(PAGE_COPY.legal);
    expect(paginaPerAppNativa(PAGE_COPY.roadmap)).toBe(PAGE_COPY.roadmap);
    expect(paginaPerAppNativa(PAGE_COPY.xat, { nativa: true })).toBe(PAGE_COPY.xat);
    expect(paginaPerAppNativa(null, { nativa: true })).toBeNull();
  });

  test('dins de l’app nativa (el pont de Capacitor), l’HTML i els camps de text, adaptats; la resta, igual', () => {
    window.Capacitor = { isNativePlatform: () => true };
    const legal = paginaPerAppNativa(PAGE_COPY.legal);
    expect(legal).not.toBe(PAGE_COPY.legal);
    expect({ ...legal, html: undefined }).toEqual({ ...PAGE_COPY.legal, html: undefined });
    expect(legal.html).toContain("l'aplicació Sóc de Poble) quan vulgues");
    const cap = paginaPerAppNativa({ title: 'Baixa-la', lead: 'Ara a Google Play. I a la web.', imageAlt: 'Logotip de F-Droid', html: '<p>Hola</p>' });
    expect(cap).toEqual({ title: 'Baixa-la', lead: 'I a la web.', imageAlt: '', html: '<p>Hola</p>' });
  });
});

/* El contingut real. Les adaptacions declarades han de bastar: si un dia el
   Full de ruta o l'Avís legal porten una menció nova sense adaptació, la xarxa
   en llevaria el bloc dins de l'app, i una pàgina legal no pot perdre un
   paràgraf sense que ningú ho decidisca. Esta prova ho diu abans. */
describe('el contingut real de PAGE_COPY', () => {
  test.each(['roadmap', 'legal'])('%s: cap menció dins de l’app, i la xarxa no hi lleva res', (clau) => {
    const { html, retirats } = adaptaHtml(PAGE_COPY[clau].html);
    expect(retirats).toEqual([]);
    expect(html).not.toMatch(PROHIBIDES);
    expect(lectures(html)).not.toMatch(PROHIBIDES);
    expect(html).not.toContain('<!--');
    const pagina = paginaPerAppNativa(PAGE_COPY[clau], { nativa: true });
    expect(JSON.stringify(pagina)).not.toMatch(PROHIBIDES);
  });

  test('control: sense adaptar, el Full de ruta (un comentari) i l’Avís legal sí que en nomenen (la prova no és cega)', () => {
    expect(PAGE_COPY.roadmap.html).toMatch(/<!--[\s\S]*Google Play[\s\S]*-->/);
    expect(PAGE_COPY.legal.html).toContain('per a Android i iPhone');
  });

  test('el que diu d’Apple es queda: Inici de sessió amb Apple, a l’iPhone', () => {
    const legal = htmlPerAppNativa(PAGE_COPY.legal.html);
    expect(legal).toContain("si entres amb Apple a l'aplicació de l'iPhone");
    expect(legal).toContain("a l'iPhone, a <strong>Configuració › el teu nom › Inici de sessió amb Apple</strong>");
  });

  test('cap altra pàgina no canvia (Descàrregues, que no s’obri dins de l’app, a banda)', () => {
    for (const [clau, pagina] of Object.entries(PAGE_COPY)) {
      if (['roadmap', 'legal', 'descarregues'].includes(clau)) continue;
      expect(paginaPerAppNativa(pagina, { nativa: true }), clau).toBe(pagina);
    }
  });

  test('la xarxa, sobre una pàgina de veres: Descàrregues queda sense cap menció', () => {
    const { html, retirats } = adaptaHtml(PAGE_COPY.descarregues.html);
    expect(html).not.toMatch(PROHIBIDES);
    expect(retirats.length).toBeGreaterThan(0);
    expect(html).toContain('<h3>iPhone i iPad</h3>');
  });
});

describe('les superfícies que no passen per TextSection, dins de l’app nativa', () => {
  test.each(['/roadmap', '/legal', '/page/roadmap', '/page/legal'])('el lector de connexions (paginaDeRuta) a %s', (ruta) => {
    const { page } = paginaDeRuta(ruta, { nativa: true });
    expect(JSON.stringify(page)).not.toMatch(PROHIBIDES);
    // Fora de l'app, la pàgina de sempre, el mateix objecte.
    expect(paginaDeRuta(ruta, { nativa: false }).page).toBe(PAGE_COPY[ruta.split('/').pop()]);
  });

  /* targetesDeSistema passa el copy per paginaPerAppNativa (Guarda Nocturna,
     T1-06): dins de l'app, títol, subtítol, entradeta i text alternatiu nets. */
  test('la targeta del Mur pinta títol, subtítol, entradeta i text alternatiu nets', () => {
    const targetes = targetesDeSistema(PAGE_COPY, { nativa: true }).filter((t) => ['roadmap', 'legal'].includes(t.id));
    expect(targetes.map((t) => t.id).sort()).toEqual(['legal', 'roadmap']);
    for (const t of targetes) {
      expect([t.title, t.subtitle, t.lead, t.imageAlt].join(' | ')).not.toMatch(PROHIBIDES);
    }
  });

  /* La cerca indexa amb textPla, que no entén de comentaris: el del Full de
     ruta hi entraria sencer. Per això useCercaGlobal indexa la pàgina passada
     per paginaPerAppNativa (Guarda Nocturna, T1-06): l'entrada crua en
     nomena, i la de la pàgina adaptada (títol, extracte, detall i text plegat)
     queda neta. */
  test.each(['roadmap', 'legal'])('la cerca: l’entrada crua de %s en nomena; la de la pàgina adaptada, no', (clau) => {
    const crua = dePagina({ key: clau, ...PAGE_COPY[clau] });
    expect(`${crua.detall} ${crua.text}`).toMatch(PROHIBIDES);
    const entrada = dePagina(paginaPerAppNativa({ key: clau, ...PAGE_COPY[clau] }, { nativa: true }));
    expect([entrada.titol, entrada.extracte, entrada.detall, entrada.text].join(' | ')).not.toMatch(PROHIBIDES);
  });
});
