import { describe, expect, test, vi } from 'vitest';
import {
  transformaHtmlEditorialPedraSeca,
  transformaPostWpRestApi,
  parsejaWordPressWxrXml,
  parsejaBloggerAtomXml,
} from './transformadorEditorialWpBlogger.js';

function fragment(html) {
  return new DOMParser().parseFromString(html, 'text/html').body;
}

describe('R32.5 · fidelitat de la importació editorial', () => {
  test.each([['alignleft', 'esquerra', 'left'], ['alignright', 'dreta', 'right'], ['aligncenter', 'centre', null]])(
    'la miniatura %s manté dimensions i semàntica Pedra Seca', (classe, desti, align) => {
      const html = `<p>Abans &amp; després</p><img class="${classe} size-thumbnail" src="https://socdepoble.net/foto.jpg?a=1&amp;b=2" width="128" height="96" alt="A &quot;B&quot; &amp; C"><p>Text del costat</p>`;
      const resultat = transformaHtmlEditorialPedraSeca(html);
      const dom = fragment(resultat.htmlNet);
      const img = dom.querySelector('img');
      expect(img.classList.contains('sdp-media-mida-propia')).toBe(true);
      expect(img.classList.contains(`sdp-media-${desti}`)).toBe(true);
      expect(img.closest(`.sdp-media-${desti}`)).not.toBeNull();
      expect(img.getAttribute('width')).toBe('128');
      expect(img.getAttribute('height')).toBe('96');
      expect(img.getAttribute('src')).toBe('https://socdepoble.net/foto.jpg?a=1&b=2');
      expect(img.getAttribute('alt')).toBe('A "B" & C');
      expect(img.getAttribute('align')).toBe(align);
      expect(dom.textContent).toContain('Abans & després');
      expect(transformaHtmlEditorialPedraSeca(resultat.htmlNet).htmlNet).toBe(resultat.htmlNet);
    },
  );

  test('Blogger conserva galeria, peus, ordre, enllaços d’imatge i entitats de CDATA', () => {
    const cos = '<div class="separator"><a href="https://blogger.googleusercontent.com/s1600/a.jpg"><img align="left" src="https://blogger.googleusercontent.com/s320/a.jpg" width=320 height=200 alt="L’&agrave;lber"></a><p>Peu &amp; memòria &#x1F333;</p></div>'
      + '<table class="tr-caption-container"><tr><td><img class="alignright" src="https://blogger.googleusercontent.com/b.jpg" width="128" height="96"></td></tr><tr><td class="tr-caption">Segona foto</td></tr></table>'
      + '<p>Exemple segur: &lt;script&gt; &amp;lt;literal&amp;gt;</p>';
    const xml = `<feed><entry><title>El Rentonar &amp; la memòria</title><published>2009-02-03T10:11:12.123+01:00</published><updated>2026-11-17T00:00:00Z</updated><link rel="alternate" href="https://elrentonar.blogspot.com/2009/02/memoria.html?m=1&amp;prova=2"/><content type="html"><![CDATA[${cos}]]></content></entry></feed>`;
    const [article] = parsejaBloggerAtomXml(xml);
    expect(article.slug).toBe('memoria');
    expect(article.title).toBe('El Rentonar & la memòria');
    expect(article.date).toBe('2009-02-03T10:11:12.123+01:00');
    expect(article.dataPublicacioOriginal).toBe(article.date);
    expect(article.linkOriginal).toContain('?m=1&prova=2');
    expect(article.casosUsDetectats).toContain('galeria_fotos');
    expect(article.htmlNet).toContain('&lt;script&gt; &amp;lt;literal&amp;gt;');
    const dom = fragment(article.htmlNet);
    expect(dom.querySelector('script')).toBeNull();
    expect([...dom.querySelectorAll('img')].map(img => img.width)).toEqual([320, 128]);
    expect(dom.querySelector('a').href).toContain('/s1600/a.jpg');
    expect(dom.textContent).toContain('Peu & memòria 🌳');
    expect(dom.textContent).toContain('Segona foto');
    expect(dom.querySelector('img').alt).toBe('L’àlber');
  });

  test('Blogger hereta float del seu enllaç i la miniatura nua manté la mida sense CSS de WP', () => {
    const resultat = transformaHtmlEditorialPedraSeca('<div class="separator"><a style="float: right; margin-left: 1em" href="https://blogger.googleusercontent.com/gran.jpg"><img style="width: 300px" src="https://blogger.googleusercontent.com/petita.jpg" width="300" height="200"></a></div><img src="https://example.test/segona.jpg" width="128" height="96">');
    const dom = fragment(resultat.htmlNet);
    const [dreta, nua] = dom.querySelectorAll('img');
    expect(dreta.getAttribute('align')).toBe('right');
    expect(dreta.classList.contains('sdp-media-dreta')).toBe(true);
    expect(nua.className).toBe('sdp-media-mida-propia');
    expect(nua.width).toBe(128);
    expect(nua.getAttribute('align')).toBeNull();
    expect(resultat.totalImatges).toBe(2);
    expect(transformaHtmlEditorialPedraSeca(resultat.htmlNet).htmlNet).toBe(resultat.htmlNet);
  });

  test('un atribut class escrit dins d’alt/title és text, no l’atribut de la imatge', () => {
    const original = '<img alt="Memòria class=\'vella\' &amp; lloc" title="Mida class=\'exemple\'" class="alignright" src="https://example.test/foto.jpg" width="120">';
    const resultat = transformaHtmlEditorialPedraSeca(original);
    const img = fragment(resultat.htmlNet).querySelector('img');
    expect(img.alt).toBe("Memòria class='vella' & lloc");
    expect(img.title).toBe("Mida class='exemple'");
    expect(img.classList.contains('alignright')).toBe(true);
    expect(img.classList.contains('sdp-media-dreta')).toBe(true);
    expect(img.classList.contains('sdp-media-mida-propia')).toBe(true);
    expect([...img.attributes].filter(attr => attr.name === 'class')).toHaveLength(1);
    expect(transformaHtmlEditorialPedraSeca(resultat.htmlNet).htmlNet).toBe(resultat.htmlNet);
  });

  test('Atom HTML escapat lleva exactament una capa XML i no activa les entitats del cos', () => {
    const xml = '<feed><entry><title>Arbre &#x26; poble</title><published>2007-05-01T12:30:00-03:00</published>'
      + '<content type="html">&lt;p&gt;A &amp;amp; B &amp;lt;script&amp;gt; &amp;#xE9; &amp;nbsp;&lt;/p&gt;</content></entry></feed>';
    const [article] = parsejaBloggerAtomXml(xml);
    expect(article.htmlNet).toBe('<p>A &amp; B &lt;script&gt; &#xE9; &nbsp;</p>');
    expect(article.title).toBe('Arbre & poble');
    expect(fragment(article.htmlNet).querySelector('script')).toBeNull();
  });

  test('Atom text no és HTML: conserva entitats literals i etiquetes escrites com a text', () => {
    const [text] = parsejaBloggerAtomXml('<feed><entry><title type="text">A &amp;lt;b&amp;gt;</title><content type="text">&lt;script&gt;Text &amp;amp; memòria&lt;/script&gt;</content></entry></feed>');
    expect(text.title).toBe('A &lt;b&gt;');
    expect(text.htmlNet).toBe('&lt;script&gt;Text &amp;amp; memòria&lt;/script&gt;');
    expect(fragment(text.htmlNet).querySelector('script')).toBeNull();
    const [html] = parsejaBloggerAtomXml('<feed><entry><title type="html">&lt;b&gt;A &amp;amp; B&lt;/b&gt;</title></entry></feed>');
    expect(html.title).toBe('A & B');
  });

  test('updated no es presenta com una publicació original quan published falta', () => {
    const [article] = parsejaBloggerAtomXml('<feed><entry><title>Memòria</title><updated>2026-11-17T10:00:00Z</updated></entry></feed>');
    expect(article.date).toBe('2026-11-17T10:00:00Z');
    expect(article.dataPublicacioOriginal).toBe('');
    expect(article.dataActualitzacioOriginal).toBe('2026-11-17T10:00:00Z');
  });

  test('les entrades citades dins comentaris, CDATA o atributs no es converteixen en articles', () => {
    const fantasma = '<entry><title>Fantasma</title></entry>';
    expect(parsejaBloggerAtomXml(`<feed><!-- ${fantasma} --><![CDATA[${fantasma}]]><x title="${fantasma}"></x></feed>`)).toEqual([]);
    expect(parsejaWordPressWxrXml('<rss><!-- <item><title>Fantasma</title></item> --><![CDATA[<item><title>Fantasma</title></item>]]></rss>')).toEqual([]);
    const [real] = parsejaBloggerAtomXml(`<feed><!-- ${fantasma} --><entry><title>Real</title><content type="html"><![CDATA[<p>Conserva &amp; memòria</p><!-- comentari editorial -->]]></content></entry></feed>`);
    expect(real.title).toBe('Real');
    expect(real.htmlNet).toContain('<!-- comentari editorial -->');
  });

  test('WXR conserva data publicada amb fus, data local i GMT sense substituir-les per ara', () => {
    const xml = '<rss><item><title><![CDATA[Memòria &amp; poble &#xE9;]]></title><pubDate>Tue, 03 Feb 2009 09:11:12 +0000</pubDate>'
      + '<wp:post_date>2009-02-03 10:11:12</wp:post_date><wp:post_date_gmt>2009-02-03 09:11:12</wp:post_date_gmt>'
      + '<wp:post_name>memoria</wp:post_name><content:encoded><![CDATA[<p>Text &amp; memòria</p>]]></content:encoded></item></rss>';
    const [article] = parsejaWordPressWxrXml(xml);
    expect(article).toMatchObject({ title: 'Memòria & poble é', date: 'Tue, 03 Feb 2009 09:11:12 +0000',
      dataLocalOriginal: '2009-02-03 10:11:12', date_gmt: '2009-02-03 09:11:12', htmlNet: '<p>Text &amp; memòria</p>' });
  });

  test('REST sense data és repetible entre dos rellotges i no inventa història', () => {
    vi.useFakeTimers();
    try {
      const original = { id: 7, slug: 'memoria', title: { rendered: 'El &#x52;entonar &amp; poble' }, content: { rendered: '<p>Text</p>' } };
      vi.setSystemTime(new Date('2000-01-01T00:00:00Z'));
      const primer = transformaPostWpRestApi(original);
      vi.setSystemTime(new Date('2035-01-01T00:00:00Z'));
      expect(transformaPostWpRestApi(original)).toEqual(primer);
      expect(primer.date).toBe('');
      expect(primer.title).toBe('El Rentonar & poble');
      expect(original.title.rendered).toBe('El &#x52;entonar &amp; poble');
      expect(transformaPostWpRestApi({ ...original, date: '2007-05-01T12:30:00+02:00', date_gmt: '2007-05-01T10:30:00' })).toMatchObject({
        date: '2007-05-01T12:30:00+02:00', date_gmt: '2007-05-01T10:30:00', dataPublicacioOriginal: '2007-05-01T12:30:00+02:00',
      });
    } finally { vi.useRealTimers(); }
  });

  test('el cos conserva entitats numèriques impossibles sense activar HTML i el títol no llança', () => {
    const article = transformaPostWpRestApi({ title: '&#xD800; &#0; &#x110000;', content: '<p>&#xD800; &lt;img&gt;</p>' });
    expect(article.title).toBe('� � �');
    expect(article.htmlNet).toBe('<p>&#xD800; &lt;img&gt;</p>');
  });

  test('el títol rendered resol accents, puntuació i numèriques sense perdre entitats desconegudes', () => {
    expect(transformaPostWpRestApi({ title: { rendered: 'L&rsquo;&agrave;lber &middot; &eacute;s mem&ograve;ria &mdash; &copy; &#x1F333; &desconeguda;' } }).title)
      .toBe('L’àlber · és memòria — © 🌳 &desconeguda;');
    expect(transformaPostWpRestApi({ title: { rendered: '&amp;#xE9; &amp;lt;b&amp;gt;' } }).title).toBe('&#xE9; &lt;b&gt;');
  });
});
