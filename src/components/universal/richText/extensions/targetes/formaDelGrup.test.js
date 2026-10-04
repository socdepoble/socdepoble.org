/* T7 (ordre del Mestre, prompt 261004_0515) · Les regles pures de les
   targetes incrustades: forma del grup, clau, neteja de la instantània,
   entrades de la cerca, props de la targeta i la lectura hidratada. */
import { describe, expect, test } from 'vitest';
import {
  TIPUS_INCRUSTABLES, alineacioValida, attrsDeEntrada, clauDe, esTargetaValida, formaDe, llegeixClau,
  netejaAtributs, objecteDeTargeta, propsDeTargetaIncrustada, segmentsAmbTargetes, teAutoriaCompleta
} from './formaDelGrup.js';

const PUBLICACIO = Object.freeze({
  clau: 'publicacions:42', tipus: 'publicacions', id: '42', titol: 'La festa de la Torre',
  extracte: 'Música, coca i dansa a la plaça.', imatge: { src: '/assets/mur/festa.webp', alt: '' },
  href: '/mur/42', privada: false, subtitol: 'Agost', autor: 'Pep', autorRuta: '/perfil/persona/pep', poble: 'La Torre'
});

describe('formaDe · les regles del Mestre', () => {
  test('1 sola, 2 parella, 3 o més graella; res sense targetes', () => {
    expect([0, 1, 2, 3, 4, 12].map(formaDe)).toEqual([null, 'sola', 'parella', 'graella', 'graella', 'graella']);
    expect(formaDe(-1)).toBeNull();
    expect(formaDe(1.5)).toBeNull();
    expect(formaDe('2')).toBe('parella');
  });

  test('l’alineació és esquerra o dreta; la resta cau a esquerra', () => {
    expect(alineacioValida('dreta')).toBe('dreta');
    expect(alineacioValida('esquerra')).toBe('esquerra');
    expect(alineacioValida('centre')).toBe('esquerra');
    expect(alineacioValida(null)).toBe('esquerra');
  });
});

describe('la clau «tipus:id»', () => {
  test('només tipus públics: cap nota, persona ni conversa', () => {
    expect(TIPUS_INCRUSTABLES).toEqual(['publicacio', 'esdeveniment', 'producte', 'poble', 'pagina']);
    expect(clauDe('publicacio', 42)).toBe('publicacio:42');
    expect(clauDe('nota', 'n1')).toBe('');
    expect(clauDe('persona', 'pep')).toBe('');
    expect(clauDe('publicacio', '')).toBe('');
    expect(clauDe('publicacio', 'a b')).toBe('');
  });

  test('es parteix pel PRIMER «:»: un id amb dos punts es conserva sencer', () => {
    expect(llegeixClau('pagina:projecte:qui-som')).toEqual({ tipus: 'pagina', id: 'projecte:qui-som' });
    expect(llegeixClau('nota:n1')).toBeNull();
    expect(llegeixClau(':42')).toBeNull();
    expect(llegeixClau('publicacio')).toBeNull();
    expect(llegeixClau(null)).toBeNull();
    expect(esTargetaValida({ clau: 'poble:7' })).toBe(true);
    expect(esTargetaValida({ clau: '' })).toBe(false);
  });
});

describe('netejaAtributs · la instantània que es desa', () => {
  test('rutes: només de l’app, mai javascript:, «//» ni amb cometes', () => {
    for (const ruta of ['javascript:alert(1)', '//evil.example/x', 'https://evil.example/', '/mur/"x', 'mur/1', ' /mur/1']) {
      expect(netejaAtributs({ clau: 'publicacio:1', ruta }).ruta, ruta).toBe('');
    }
    expect(netejaAtributs({ clau: 'publicacio:1', ruta: '/mur/1?item=2' }).ruta).toBe('/mur/1?item=2');
  });

  /* Revisió del front «editor» (261004) · Les que el sanejador pintaria: el
     mateix origen, data:image i els orígens de mitjans admesos (els avatars
     de Google, Facebook i GitHub, que sí que són de tercers i es demanen
     sense referent). Cap altre origen i cap mitjà privat. */
  test('imatges: les que el sanejador pintaria, també els orígens de mitjans admesos; cap altre origen ni cap mitjà privat', () => {
    expect(netejaAtributs({ imatge: 'https://tracker.example/pixel.gif' }).imatge).toBe('');
    expect(netejaAtributs({ imatge: 'sdp-media://mitjans_privats/a.webp' }).imatge).toBe('');
    expect(netejaAtributs({ imatge: 'javascript:alert(1)' }).imatge).toBe('');
    expect(netejaAtributs({ imatge: 'sdp-media://mitjans/a.webp' }).imatge).toBe('sdp-media://mitjans/a.webp');
    expect(netejaAtributs({ imatge: '/assets/mur/festa.webp' }).imatge).toBe('/assets/mur/festa.webp');
    expect(netejaAtributs({ imatge: 'data:image/png;base64,AAAA' }).imatge).toBe('data:image/png;base64,AAAA');
    for (const deMitjans of ['https://lh3.googleusercontent.com/a.jpg', 'https://platform-lookaside.fbsbx.com/a.jpg', 'https://graph.facebook.com/1/picture', 'https://avatars.githubusercontent.com/u/1']) {
      expect(netejaAtributs({ imatge: deMitjans }).imatge, deMitjans).toBe(deMitjans);
    }
  });

  test('text d’una línia, sense < ni > (el sanejador esborraria l’atribut sencer)', () => {
    const net = netejaAtributs({ titol: '  Hola\n  <b>món</b> --> ', autor: 'x'.repeat(500) });
    expect(net.titol).toBe('Hola ‹b›món‹/b› --›');
    expect(net.autor).toHaveLength(120);
    expect(netejaAtributs({ titol: { mal: 1 } }).titol).toBe('');
  });

  test('una clau no vàlida es queda buida (el normalitzador i la lectura la descarten)', () => {
    expect(netejaAtributs({ clau: 'nota:n1' }).clau).toBe('');
    expect(netejaAtributs({ clau: 'publicacio:1' }).clau).toBe('publicacio:1');
  });
});

describe('attrsDeEntrada · d’una entrada de /cerca al node', () => {
  test('cada tipus públic de la cerca passa al tipus d’objecte', () => {
    const tipus = { publicacions: 'publicacio', agenda: 'esdeveniment', mercat: 'producte', pobles: 'poble', pagines: 'pagina' };
    for (const [deCerca, objecte] of Object.entries(tipus)) {
      expect(attrsDeEntrada({ ...PUBLICACIO, tipus: deCerca })?.clau, deCerca).toBe(`${objecte}:42`);
    }
  });

  test('la instantània completa d’una publicació', () => {
    expect(attrsDeEntrada(PUBLICACIO)).toEqual({
      clau: 'publicacio:42', ruta: '/mur/42', titol: 'La festa de la Torre', subtitol: 'Agost',
      entradilla: 'Música, coca i dansa a la plaça.', imatge: '/assets/mur/festa.webp',
      autor: 'Pep', autorRuta: '/perfil/persona/pep', poble: 'La Torre'
    });
  });

  test('mai una nota, una conversa, una persona, una entitat ni res privat', () => {
    for (const tipus of ['notes', 'converses', 'persones', 'entitats', 'multimedia', 'desconegut']) {
      expect(attrsDeEntrada({ ...PUBLICACIO, tipus }), tipus).toBeNull();
    }
    expect(attrsDeEntrada({ ...PUBLICACIO, privada: true })).toBeNull();
    expect(attrsDeEntrada({ ...PUBLICACIO, titol: '' })).toBeNull();
    expect(attrsDeEntrada(null)).toBeNull();
  });
});

describe('propsDeTargetaIncrustada', () => {
  const attrs = attrsDeEntrada(PUBLICACIO);

  test('edició: previsualització sense enllaç de targeta, i cada acció del peu avisa', () => {
    const avisa = () => 'avisat';
    const props = propsDeTargetaIncrustada(attrs, { mode: 'edicio', avisa });
    expect(props.mainHref).toBeUndefined();
    // Regla d'or 1 (261004): la boina porta l'autor enllaçat també en edició (el NodeView en para el clic).
    expect(props.authorHref).toBe('/perfil/persona/pep');
    expect(props.objecte).toBeUndefined();
    for (const accio of ['onConnect', 'onTranslate', 'onComment', 'onShare', 'onDateTime']) expect(props[accio], accio).toBe(avisa);
    expect(props).toMatchObject({ title: 'La festa de la Torre', subtitle: 'Agost', body: 'Música, coca i dansa a la plaça.', author: 'Pep', location: 'La Torre', hasFooter: true, showPin: false, telemetria: { mode: 'previsualitzacio' } });
  });

  test('lectura: la targeta del Mur, amb la ruta, l’autor enllaçat i l’objecte tipat', () => {
    const props = propsDeTargetaIncrustada(attrs, { mode: 'lectura' });
    expect(props.mainHref).toBe('/mur/42');
    expect(props.authorHref).toBe('/perfil/persona/pep');
    expect(props.objecte).toEqual({ tipus: 'publicacio', id: '42', titol: 'La festa de la Torre', seccio: 'mur', ruta: '/mur/42', autor: null });
    expect(props.onConnect).toBeUndefined();
    expect(objecteDeTargeta({ clau: 'nota:1' })).toBeNull();
  });

  /* Revisió del front «editor» (261004) · La imatge de la instantània passa
     pel filtre privat de les apps (fontSegura) i es demana sense referent,
     com un <img> del cos que pinta el sanejador: a l'editor i a la lectura. */
  test('la imatge, amb el filtre privat i sense referent, en els dos modes', () => {
    expect(propsDeTargetaIncrustada(attrs, { mode: 'lectura' }).imatgePrivada).toBe(true);
    expect(propsDeTargetaIncrustada(attrs, { mode: 'edicio', avisa: () => {} }).imatgePrivada).toBe(true);
  });

  /* Regla d'or 1 del Mestre (261004) · La boina porta sempre l'autor real
     enllaçat a la seua pàgina; el sistema és l'entitat Sóc de Poble i porta
     al projecte. Un nom sense pàgina coneguda no s'endevina. */
  test('sense autor a la instantània (un poble, una pàgina), signa Sóc de Poble i la boina porta a /projecte', () => {
    const poble = attrsDeEntrada({ tipus: 'pobles', id: '7', titol: 'La Torre de les Maçanes', href: '/pobles/7', poble: 'L’Alacantí' });
    for (const mode of ['lectura', 'edicio']) {
      expect(propsDeTargetaIncrustada(poble, { mode, avisa: () => {} }), mode).toMatchObject({ author: 'Sóc de Poble', authorHref: '/projecte', location: 'L’Alacantí' });
    }
  });

  test('un autor amb nom i sense la seua pàgina es pinta sense enllaç: no s’endevina pel nom', () => {
    const props = propsDeTargetaIncrustada({ ...attrs, autorRuta: '' }, { mode: 'lectura' });
    expect(props.author).toBe('Pep');
    expect(props.authorHref).toBeUndefined();
  });

  /* Revisió del front «editor» (261004) · Cap boina buida (regla d'or 1).
     La ruta del projecte sense nom és l'entitat Sóc de Poble: la signa. La
     ruta d'una altra persona o entitat sense el seu nom no s'endevina: la
     instantània no entra (attrsDeEntrada i inserirTargeta). */
  test('la ruta del projecte sense nom signa Sóc de Poble, en els dos modes', () => {
    const delProjecte = attrsDeEntrada({ ...PUBLICACIO, autor: '', autorRuta: '/projecte' });
    expect(delProjecte).toMatchObject({ autor: '', autorRuta: '/projecte' });
    for (const mode of ['lectura', 'edicio']) {
      expect(propsDeTargetaIncrustada(delProjecte, { mode, avisa: () => {} }), mode).toMatchObject({ author: 'Sóc de Poble', authorHref: '/projecte' });
    }
  });

  test('una ruta d’autor sense el seu nom, que no és la del projecte, no entra', () => {
    expect(attrsDeEntrada({ ...PUBLICACIO, autor: '', autorRuta: '/perfil/persona/pep' })).toBeNull();
    expect(attrsDeEntrada({ ...PUBLICACIO, autor: '   ', autorRuta: '/perfil/persona/pep' })).toBeNull();
    expect(teAutoriaCompleta({ autor: '', autorRuta: '/perfil/persona/pep' })).toBe(false);
    expect(teAutoriaCompleta({ autor: 'Pep', autorRuta: '/perfil/persona/pep' })).toBe(true);
    expect(teAutoriaCompleta({ autor: 'Pep', autorRuta: '' })).toBe(true);
    expect(teAutoriaCompleta({ autor: '', autorRuta: '/projecte' })).toBe(true);
    expect(teAutoriaCompleta({ autor: '', autorRuta: '' })).toBe(true);
    // Una ruta que la neteja descarta no compta: és com si no n'hi haguera.
    expect(teAutoriaCompleta({ autor: '', autorRuta: 'javascript:alert(1)' })).toBe(true);
  });
});

describe('segmentsAmbTargetes · la lectura hidratada', () => {
  const targeta = (id, extra = '') => `<div data-sdp-targeta="publicacio:${id}" class="sdp-targeta" data-ruta="/mur/${id}" data-titol="T${id}"${extra}><a href="/mur/${id}" rel="noopener noreferrer nofollow">T${id}</a></div>`;
  const grup = (...fills) => `<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">${fills.join('')}</div>`;

  test('sense grups, un sol tros amb l’HTML tal qual', () => {
    expect(segmentsAmbTargetes('<p>Hola</p>')).toEqual([{ tipus: 'html', html: '<p>Hola</p>' }]);
  });

  test('trossos i grups en l’ordre del document; la forma es recalcula pel nombre', () => {
    const segments = segmentsAmbTargetes(`<h3>Abans</h3><p>Un &amp; dos</p>${grup(targeta(1), targeta(2))}<p>Després</p>`);
    expect(segments.map((s) => s.tipus)).toEqual(['html', 'targetes', 'html']);
    expect(segments[0].html).toBe('<h3>Abans</h3><p>Un &amp; dos</p>');
    expect(segments[1]).toMatchObject({ forma: 'parella', alineacio: 'dreta' });
    expect(segments[1].targetes.map((t) => t.clau)).toEqual(['publicacio:1', 'publicacio:2']);
    expect(segments[2].html).toBe('<p>Després</p>');
  });

  test('una targeta sense clau vàlida no compta, i un grup sense cap de vàlida desapareix', () => {
    const segments = segmentsAmbTargetes(`${grup('<div data-sdp-targeta="nota:1"></div>')}<p>Text</p>${grup(targeta(3), '<div data-sdp-targeta=""></div>')}`);
    expect(segments.map((s) => s.tipus)).toEqual(['html', 'targetes']);
    expect(segments[1].targetes).toHaveLength(1);
    expect(segments[1].forma).toBe('sola');
  });

  test('un grup dins d’una llista no s’hidrata: es queda l’enllaç de reserva', () => {
    const segments = segmentsAmbTargetes(`<ul><li>${grup(targeta(4))}</li></ul>`);
    expect(segments).toHaveLength(1);
    expect(segments[0].tipus).toBe('html');
    expect(segments[0].html).toContain('href="/mur/4"');
  });

  test('la instantània del DOM també es neteja: una ruta externa no hi arriba', () => {
    const [segment] = segmentsAmbTargetes(grup('<div data-sdp-targeta="producte:9" data-ruta="https://evil.example" data-titol="Mel"></div>'));
    expect(segment.targetes[0]).toMatchObject({ clau: 'producte:9', ruta: '', titol: 'Mel' });
  });
});
