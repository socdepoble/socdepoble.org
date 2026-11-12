import { describe, expect, test, beforeEach } from 'vitest';
import {
  transformaHtmlEditorialPedraSeca,
  transformaPostWpRestApi,
  parsejaWordPressWxrXml,
  parsejaBloggerAtomXml,
  lligArticlesImportatsAmbRevisio,
  desaRevisioArticleImportat,
  estadistiquesRevisioImportacio,
  desaDestinacioArticleImportat,
  fontReferenciaArticleImportat,
  LIMIT_BYTES_IMPORTACIO_EDITORIAL,
} from './transformadorEditorialWpBlogger.js';

describe('transformadorEditorialWpBlogger (AH-28 / IDEA-88)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('transformaHtmlEditorialPedraSeca elimina comentaris Gutenberg, detecta galeries, vídeos, PDFs, substitueix iframes externs i reescriu enllaços interns de socdepoble.net', () => {
    const rawHtml = `
      <!-- wp:paragraph --><p>Crònica del <a href="https://socdepoble.net/2022/11/17/manifest-de-poble/">Manifest de Poble</a> i l'<a href="https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/">Aplec</a>.</p><!-- /wp:paragraph -->
      <div class="wp-block-gallery">
        <img src="https://socdepoble.net/wp-content/uploads/foto1.jpg" alt="Foto 1" />
        <img src="https://socdepoble.net/wp-content/uploads/foto2.jpg" alt="Foto 2" />
      </div>
      <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
      <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSc/viewform?embedded=true" height="9100"></iframe>
      <p><a href="https://socdepoble.net/wp-content/uploads/programa.pdf">Programa en PDF</a></p>
    `;
    const res = transformaHtmlEditorialPedraSeca(rawHtml, { poblesDetectats: ['benillup', 'la-torre-de-les-macanes'] });

    expect(res.htmlNet).not.toContain('<!-- wp:paragraph -->');
    expect(res.htmlNet).toContain('href="/mur/manifest-de-poble"');
    expect(res.htmlNet).toContain('href="/events/aplec-2023"');
    expect(res.htmlNet).toContain('class="sdp-embed-video"');
    expect(res.htmlNet).toContain('class="sdp-targeta-enllac-extern"');
    expect(res.casosUsDetectats).toEqual(expect.arrayContaining([
      'galeria_fotos',
      'video_youtube_vimeo',
      'pdf_drive_docs',
      'iframe_extern_substituit',
      'enllacos_interns_reescrits',
      'pobles_etiquetats',
    ]));
    expect(res.totalEnllacosReescrits).toBeGreaterThanOrEqual(2);
    expect(res.totalImatges).toBe(2);
  });

  test('transformaPostWpRestApi converteix un post JSON de WP REST API a format Pedra Seca amb ruta canònica', () => {
    const wpPost = {
      id: 16893,
      slug: 'manifest-de-poble',
      link: 'https://socdepoble.net/2022/11/17/manifest-de-poble/',
      title: { rendered: 'Manifest de Poble' },
      content: { rendered: '<p>Contingut amb <a href="https://socdepoble.net/projecte/">El Projecte</a></p>' },
      poblesDetectats: ['la-torre-de-les-macanes'],
    };
    const transformat = transformaPostWpRestApi(wpPost);
    expect(transformat.id).toBe(16893);
    expect(transformat.rutaDestiCanonica).toBe('/mur/manifest-de-poble');
    expect(transformat.htmlNet).toContain('href="/page/projecte"');
    expect(transformat.estat_revisio).toBe('pendent_admin');
  });

  test('parsejaWordPressWxrXml i parsejaBloggerAtomXml extreuen articles, etiquetes i rutes canòniques', () => {
    const wxr = `<?xml version="1.0" encoding="UTF-8"?>
      <rss><channel>
        <item>
          <title><![CDATA[Trobada de Pedra en Sec]]></title>
          <link>https://socdepoble.net/2024/05/10/trobada-pedra-sec/</link>
          <wp:post_name>trobada-pedra-sec</wp:post_name>
          <wp:post_type>post</wp:post_type>
          <wp:post_date>2024-05-10 10:00:00</wp:post_date>
          <category domain="category"><![CDATA[Fageca]]></category>
          <category domain="post_tag"><![CDATA[Pedra en sec]]></category>
          <content:encoded><![CDATA[<p>Crònica de Fageca amb <a href="https://socdepoble.net/contacte/">contacte</a>.</p>]]></content:encoded>
        </item>
      </channel></rss>`;
    const itemsWxr = parsejaWordPressWxrXml(wxr);
    expect(itemsWxr).toHaveLength(1);
    expect(itemsWxr[0].slug).toBe('trobada-pedra-sec');
    expect(itemsWxr[0].poblesDetectats).toContain('Fageca');
    expect(itemsWxr[0].etiquetes).toContain('Pedra en sec');
    expect(itemsWxr[0].htmlNet).toContain('href="/page/contacte"');

    const atom = `<?xml version="1.0" encoding="UTF-8"?>
      <feed>
        <entry>
          <title> jornada el rentonar </title>
          <published>2021-04-12T09:00:00Z</published>
          <link rel="alternate" href="https://elrentonar.blogspot.com/2021/04/jornada-el-rentonar.html" />
          <category term=" Patrimoni " />
          <content>&lt;p&gt; Recuperació de marges &lt;/p&gt;</content>
        </entry>
      </feed>`;
    const itemsAtom = parsejaBloggerAtomXml(atom);
    expect(itemsAtom).toHaveLength(1);
    expect(itemsAtom[0].slug).toBe('jornada-el-rentonar');
    expect(itemsAtom[0].rutaDestiCanonica).toBe('/mur/jornada-el-rentonar');
  });

  test('lligArticlesImportatsAmbRevisio i desaRevisioArticleImportat gestionen els 425 articles de socdepoble.net', () => {
    const inicials = lligArticlesImportatsAmbRevisio();
    expect(inicials).toHaveLength(425);
    const primer = inicials[0];
    expect(primer.estat_revisio).toBe('pendent_admin');

    desaRevisioArticleImportat(primer.wp_id, { estat: 'aprovat', nota: 'Validat pel Mestre' });
    const actualitzats = lligArticlesImportatsAmbRevisio();
    const primerActualitzat = actualitzats.find((a) => a.wp_id === primer.wp_id);
    expect(primerActualitzat.estat_revisio).toBe('aprovat');
    expect(primerActualitzat.nota_revisio).toBe('Validat pel Mestre');

    const stats = estadistiquesRevisioImportacio();
    expect(stats.total).toBe(425);
    expect(stats.aprovats).toBe(21);
    expect(stats.pendents).toBe(404);
  });

  test('la destinació es desa en el mateix registre i les revisions de sempre la conserven', () => {
    const article = lligArticlesImportatsAmbRevisio().find(a => a.wp_id === 619);
    expect(article.destinacio_workspace).toBe('arbres-monumentals');
    for (const destinacio of ['mur', 'arbres-monumentals', 'herbari', 'receptes', 'pagina']) {
      desaDestinacioArticleImportat(619, destinacio);
      desaRevisioArticleImportat(619, { estat: 'amb_observacions', nota: 'Revisió del mateix original' });
      const revisat = lligArticlesImportatsAmbRevisio().find(a => a.wp_id === 619);
      expect(revisat).toMatchObject({ wp_id: 619, destinacio_workspace: destinacio,
        estat_revisio: 'amb_observacions', nota_revisio: 'Revisió del mateix original' });
      expect(fontReferenciaArticleImportat(revisat)).toEqual({ font: 'importacio-wp', id: '619',
        title: article.title, subtitle: 'socdepoble.net · WP #619', lead: article.date });
    }
  });

  test('les destinacions importades només admeten les cinc claus primitives', () => {
    for (const destinacio of [null, {}, [], 'constructor', 'notes', 'https://extern.test']) {
      expect(() => desaDestinacioArticleImportat(619, destinacio)).toThrow(TypeError);
    }
    expect(() => desaDestinacioArticleImportat('__proto__', 'mur')).toThrow(TypeError);
    const bloquejat = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(() => desaDestinacioArticleImportat(619, 'herbari', bloquejat)).toThrow('No s’ha pogut desar');
    const contaminat = { getItem: () => JSON.stringify({ destinacions: { 619: 'constructor', 620: {}, 621: 'receptes' } }) };
    expect(lligArticlesImportatsAmbRevisio(contaminat).find(a => a.wp_id === 619).destinacio_workspace).toBe('arbres-monumentals');
  });

  test('el transformador conserva la destinació vàlida i usa els valors inicials del format', () => {
    expect(transformaPostWpRestApi({ id: 7, type: 'page', title: 'Una pàgina' }).destinacio_workspace).toBe('pagina');
    expect(transformaPostWpRestApi({ id: 7, title: 'Un article', destinacio_workspace: 'herbari' }).destinacio_workspace).toBe('herbari');
    expect(transformaPostWpRestApi({ id: 7, title: 'Un article', destinacio_workspace: {} }).destinacio_workspace).toBe('mur');
    const wxr = '<rss><channel><item><title>Arbre</title><wp:post_type>page</wp:post_type></item></channel></rss>';
    expect(parsejaWordPressWxrXml(wxr)[0].destinacio_workspace).toBe('pagina');
    expect(parsejaWordPressWxrXml(wxr, { destinacio_workspace: 'arbres-monumentals' })[0].destinacio_workspace).toBe('arbres-monumentals');
    const atom = '<feed><entry><title>Arbre</title><content>Text</content></entry></feed>';
    expect(parsejaBloggerAtomXml(atom, { destinacio_workspace: 'receptes' })[0].destinacio_workspace).toBe('receptes');
  });

  test('els parsers limiten bytes UTF-8 abans de buscar etiquetes i recorren obertures sense tancar', () => {
    const massaBytes = 'é'.repeat(LIMIT_BYTES_IMPORTACIO_EDITORIAL / 2 + 1);
    for (const parseja of [parsejaWordPressWxrXml, parsejaBloggerAtomXml]) {
      expect(() => parseja(massaBytes)).toThrow('8 MiB');
    }
    expect(parsejaWordPressWxrXml('<item>'.repeat(50000))).toEqual([]);
    expect(parsejaBloggerAtomXml('<entry>'.repeat(50000))).toEqual([]);
    expect(transformaHtmlEditorialPedraSeca('<img '.repeat(50000)).totalImatges).toBe(0);
    expect(transformaHtmlEditorialPedraSeca('<iframe src="https://segur.test">'.repeat(10000)).totalImatges).toBe(0);
  });

  test('els atributs XML conserven cites i categories quan canvia l’ordre o hi ha > entre cometes', () => {
    const wxr = '<rss><item><title><![CDATA[Arbre & poble]]></title><wp:post_name>arbre</wp:post_name>'
      + '<category nicename="poble" domain="category"><![CDATA[La Torre]]></category>'
      + '<content:encoded><![CDATA[<p>Text amb <img alt="a > b" src="https://socdepoble.net/a.jpg"></p>]]></content:encoded></item></rss>';
    const [article] = parsejaWordPressWxrXml(wxr);
    expect(article.title).toBe('Arbre & poble');
    expect(article.poblesDetectats).toEqual(['La Torre']);
    expect(article.htmlNet).toContain('alt="a > b"');
    const atom = '<feed><entry data-prova="a > b"><title>Prova</title><link href="https://poble.blogspot.com/prova.html" rel="alternate"/>'
      + '<category term="Patrimoni"/><content>&lt;p&gt;Text&lt;/p&gt;</content></entry></feed>';
    expect(parsejaBloggerAtomXml(atom)[0]).toMatchObject({ slug: 'prova', etiquetes: ['Patrimoni'], htmlNet: '<p>Text</p>' });
  });

  test('els índexs Unicode i els tancaments literals dins de CDATA no tallen el document', () => {
    const xml = '<rss>İrem<item><title><![CDATA[İrem i l’arbre]]></title><wp:post_name>arbre</wp:post_name>'
      + '<content:encoded><![CDATA[<p>Exemple literal: &lt;/item&gt; i </content:encoded>.</p>]]></content:encoded></item></rss>';
    const [article] = parsejaWordPressWxrXml(xml);
    expect(article.title).toBe('İrem i l’arbre');
    expect(article.htmlNet).toContain('Exemple literal: &lt;/item&gt; i </content:encoded>.');
  });
});
