import { describe, it, expect } from 'vitest';
import { importaEditorial, sanejaHtmlEditorial, parsejaXmlEditorialSegur, verificaAdjuntsEditorials } from './index.js';

const wxr = `<rss xmlns:wp="http://wordpress.org/export/1.2/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>La memòria</title><link>https://socdepoble.net/memoria/</link><dc:creator>El Rentonar</dc:creator><wp:post_date_gmt>2026-11-19 12:30:00</wp:post_date_gmt><wp:post_type>post</wp:post_type><category domain="category">Patrimoni</category><category domain="post_tag">Pedra</category><content:encoded><![CDATA[<p>Text <strong>històric</strong>.</p><script>alert(1)</script><img src="https://socdepoble.net/foto.jpg" onerror="alert(1)" width="300" class="alignright">]]></content:encoded></item></channel></rss>`;
const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>tag:blogger.com,1999:blog-1.post-2</id><title>La memòria</title><published>2026-11-19T13:30:00+01:00</published><author><name>El Rentonar</name></author><category term="Patrimoni"/><link rel="alternate" href="https://elrentonar.blogspot.com/2026/11/memoria.html"/><content type="html">&lt;p&gt;Text històric.&lt;/p&gt;</content></entry></feed>`;

describe('R32.16 importació editorial segura', () => {
  it('WXR preserva data UTC, autoria, categories i mitjans nets amb revisió humana', async () => {
    const result = await importaEditorial(wxr, { format: 'wordpress-wxr' });
    expect(result.articles).toHaveLength(1);
    const a = result.articles[0];
    expect(a.publish_date).toBe('2026-11-19T12:30:00.000Z');
    expect(a.autors).toEqual(['El Rentonar']);
    expect(a.categories).toEqual(['Patrimoni']);
    expect(a.etiquetes).toEqual(['Pedra']);
    expect(a.estat_revisio).toBe('pendent_admin');
    expect(a.htmlNet).not.toMatch(/script|onerror|alert\(/i);
    expect(a.mitjans[0]).toMatchObject({ url: 'https://socdepoble.net/foto.jpg', width: 300, alineacio: 'dreta' });
    expect(a.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it('Atom XML i Blogger JSON convergixen en les metadades canòniques', async () => {
    const xml = await importaEditorial(atom, { format: 'blogger-atom' });
    const json = await importaEditorial(JSON.stringify({ feed: { entry: [{ id: { $t: 'tag:blogger.com,1999:blog-1.post-2' }, title: { $t: 'La memòria' }, published: { $t: '2026-11-19T13:30:00+01:00' }, author: [{ name: { $t: 'El Rentonar' } }], category: [{ term: 'Patrimoni' }], link: [{ rel: 'alternate', href: 'https://elrentonar.blogspot.com/2026/11/memoria.html' }], content: { type: 'html', $t: '<p>Text històric.</p>' } }] } }), { format: 'blogger-json' });
    expect(json.articles).toEqual(xml.articles);
  });
  it('WP REST JSON és estricte i deduplica copies per SHA preservant fonts', async () => {
    const p = { id: 3, title: { rendered: 'Títol' }, content: { rendered: '<p>Cos.</p>' }, date_gmt: '2026-11-19T12:30:00', author: 7, categories: [2], tags: [4], link: 'https://socdepoble.net/cos/' };
    const result = await importaEditorial(JSON.stringify([p, { ...p, link: 'https://socdepoble.com/cos/' }]), { format: 'wordpress-json' });
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].fontsOriginals).toEqual(['https://socdepoble.com/cos/', 'https://socdepoble.net/cos/']);
    expect(result.deduplicats).toBe(1);
    await expect(importaEditorial(JSON.stringify([{ ...p, title: { rendered: {} } }]), { format: 'wordpress-json' })).rejects.toThrow();
  });
  it('refusa DTD, XXE, entitats desconegudes, XML truncat i profunditat excessiva', () => {
    for (const value of ['<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss>&x;</rss>', '<rss>&evil;</rss>', '<rss><x></rss>', '<rss><x>', '<rss a="1" a="2"/>', '<x>'.repeat(70) + '</x>'.repeat(70)]) expect(() => parsejaXmlEditorialSegur(value)).toThrow();
  });
  it('HTML només emet vocabulari segur i escapa Markdown adversarial', () => {
    const html = '<p>&lt;script&gt; [x](javascript:alert(1))</p><svg><a href="javascript:x">x</a></svg><a href="jav&#x61;script:alert(1)">mal</a><a href="https://socdepoble.net/a" onclick="x">bo</a><img src="data:text/html,x"><iframe srcdoc="x">x</iframe>';
    const clean = sanejaHtmlEditorial(html);
    expect(clean.htmlNet).not.toMatch(/<script|<svg|<iframe|onclick|(?:href|src)="(?:javascript:|data:)/i);
    expect(clean.htmlNet).toContain('href="https://socdepoble.net/a"');
    expect(clean.markdown).toContain('\\[x\\]');
    expect(clean.markdown).not.toContain('<script>');
    expect(clean.mitjans).toEqual([]);
  });
  it('adjunts es dedupliquen pels bytes, amb SHA conegut, mai només per URL', async () => {
    const bytes = new TextEncoder().encode('abc');
    const result = await verificaAdjuntsEditorials([{ url: 'https://socdepoble.net/a.jpg', bytes }, { url: 'https://socdepoble.com/b.jpg', bytes }]);
    expect(result).toHaveLength(1);
    expect(result[0].sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(result[0].fontsOriginals).toHaveLength(2);
    await expect(verificaAdjuntsEditorials([{ url: 'https://socdepoble.net/a.jpg', sha256: '0'.repeat(64) }])).rejects.toThrow();
  });
});

describe('R32.16 propietats i mutants adversarials', () => {
  it('el sanititzador és idempotent i no recupera codi amb entitats ni atributs mutants', () => {
    // El nombre 106 del següent espècimen és una referència HTML decimal a «j», mai un color CSS.
    const payloads = ['<img src=x onerror=alert(1)>', '<svg/onload=alert(1)>', '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">', /* ALLOW_RAW_COLOR */ '<a href="&#106;avascript:alert(1)">x</a>', '<a href="java\tscript:alert(1)">x</a>', '<img src="https://example.org/a" srcset="x 1x" style="x" onerror="x">', '<scr<script>ipt>alert(1)</scr</script>ipt>', '<p>&amp;lt;script&amp;gt;</p>', '<p>&constructor; &toString;</p>'];
    for (const payload of payloads) {
      const clean = sanejaHtmlEditorial(payload);
      expect(clean.htmlNet).not.toMatch(/<(?:script|svg|math|iframe|style|object)\b|\son[a-z]+=|(?:src|href)="(?:data|javascript|vbscript):/i);
      expect(sanejaHtmlEditorial(clean.htmlNet).htmlNet).toBe(clean.htmlNet);
    }
  });
  it('no depén de l’ordre dels articles i detecta una font amb dos continguts', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: i, title: { rendered: `Títol ${i}` }, content: { rendered: `<p>Text ${i}</p>` }, date_gmt: '2024-02-29T12:30:00', link: `https://socdepoble.net/article-${i}/`, author: 4, categories: [3], tags: [] }));
    const a = await importaEditorial(JSON.stringify(rows), { format: 'wordpress-json' });
    for (let shift = 1; shift < 6; shift++) {
      const shuffled = rows.slice(shift).concat(rows.slice(0, shift)).reverse();
      expect(await importaEditorial(JSON.stringify(shuffled), { format: 'wordpress-json' })).toEqual(a);
    }
    await expect(importaEditorial(JSON.stringify([rows[0], { ...rows[0], content: 'altre' }]), { format: 'wordpress-json' })).rejects.toThrow(/divergents/);
  });
  it('refusa primitives falses, dates impossibles, hosts i rutes malicioses', async () => {
    const p = { id: 1, title: 'Títol', content: '<p>Text</p>', date_gmt: '2024-02-29T00:00:00', link: 'https://socdepoble.net/text/' };
    for (const patch of [{ title: {} }, { content: { rendered: [] } }, { categories: {} }, { author: {} }, { date_gmt: '2025-02-29T00:00:00' }, { date_gmt: '2026-11-19T99:00:00' }, { link: 'https://socdepoble.net@evil.test/text' }, { link: 'https://socdepoble.net/a/../text' }, { link: 'https://socdepoble.net/%2Ftext' }, { link: 'https://socdepoble.net/text/?next=https://evil.test' }]) await expect(importaEditorial(JSON.stringify([{ ...p, ...patch }]), { format: 'wordpress-json' })).rejects.toThrow();
    const unknown = await importaEditorial(JSON.stringify([{ ...p, date_gmt: '', date: '2026-11-19T12:30:00' }]), { format: 'wordpress-json' });
    expect(unknown.articles[0].publish_date).toBe(null);
    expect(unknown.articles[0].dataRequerixRevisio).toBe(true);
    expect(unknown.articles[0].procedencia[0].dataPublicacioOriginal).toBe('2026-11-19T12:30:00');
  });
  it('Atom prefixat i XHTML es convertixen a estructura segura sense perdre text', async () => {
    const input = '<a:feed xmlns:a="http://www.w3.org/2005/Atom"><a:entry><a:title>Títol</a:title><a:published>2026-11-19T12:00:00Z</a:published><a:link rel="alternate" href="https://elrentonar.blogspot.com/2026/11/titol.html"/><a:content type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>Un &lt; signe</p><img src="https://socdepoble.net/a.jpg" onerror="x"/></div></a:content></a:entry></a:feed>';
    const result = await importaEditorial(input, { format: 'blogger-atom' });
    expect(result.articles[0].htmlNet).toContain('<p>Un &lt; signe</p>');
    expect(result.articles[0].htmlNet).not.toContain('onerror');
    expect(result.adjuntsPendents).toEqual(['https://socdepoble.net/a.jpg']);
  });
  it('límits de bytes, profunditat, entitats i namespace fallen tancats', async () => {
    for (const input of ['<x>&constructor;</x>', '<x>&toString;</x>', '<x>&#0;</x>', '<x a="1" b="2" xmlns:p="n" xmlns:q="n" p:a="3" q:a="4"/>', '<x:feed/>', '<x>]]></x>', '<x:/>']) expect(() => parsejaXmlEditorialSegur(input)).toThrow();
    expect(() => sanejaHtmlEditorial('x'.repeat(512 * 1024 + 1))).toThrow();
    await expect(importaEditorial('x'.repeat(8 * 1024 * 1024 + 1), { format: 'wordpress-wxr' })).rejects.toThrow();
    const sample = '<p>'.repeat(100000);
    const start = performance.now();
    expect(() => sanejaHtmlEditorial(sample)).toThrow();
    expect(performance.now() - start).toBeLessThan(1000);
  });
  it('els adjunts diverging amb URL igual o SHA declarat erroni es refusen', async () => {
    const bytes = new Uint8Array([1, 2]);
    for (const input of [[{ url: 'https://socdepoble.net/a', bytes, sha256: '0'.repeat(64) }], [{ url: 'https://socdepoble.net/a', bytes }, { url: 'https://socdepoble.net/a', bytes: new Uint8Array([3]) }], [{ url: 'javascript:alert(1)', bytes }]]) await expect(verificaAdjuntsEditorials(input)).rejects.toThrow();
  });
});

it('R32.16 exports Blogger ometen settings/comentaris/esborranys amb traça i conserven adjunts WXR inherit', async () => {
  const input = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app"><entry><category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/blogger/2008/kind#template"/></entry><entry><app:control><app:draft>yes</app:draft></app:control></entry></feed>';
  const result = await importaEditorial(input, { format: 'blogger-atom' });
  expect(result.articles).toEqual([]);
  expect(result.omesos).toBe(2);
  const attachment = '<rss xmlns:wp="http://wordpress.org/export/1.2/"><channel><item><wp:post_type>attachment</wp:post_type><wp:status>inherit</wp:status><wp:attachment_url>https://socdepoble.net/image.jpg</wp:attachment_url></item></channel></rss>';
  expect((await importaEditorial(attachment, { format: 'wordpress-wxr' })).adjuntsPendents).toEqual(['https://socdepoble.net/image.jpg']);
  const duplicated = atom.replace('<title>La memòria</title>', '<title>La memòria</title><title>Altra cosa</title>');
  await expect(importaEditorial(duplicated, { format: 'blogger-atom' })).rejects.toThrow(/ambigu/);
});

it('R32.16 namespaces tenen pressupost abans de crear arbres amb amplificació de memòria', () => {
  const attrs = Array.from({ length: 100 }, (_, i) => `xmlns:p${i}="urn:${i}"`).join(' ');
  const xml = `<x ${attrs}>`.repeat(60) + '<leaf/>'.repeat(5000) + '</x>'.repeat(60);
  expect(() => parsejaXmlEditorialSegur(xml)).toThrow(/namespaces/);
  const root = parsejaXmlEditorialSegur('<x xmlns:p="urn:p"><a><p:b/></a></x>');
  expect(root).not.toHaveProperty('ns');
  expect(root.parts[0].parts[0].uri).toBe('urn:p');
  expect(root.parts[0].parts[0]).not.toHaveProperty('ns');
});

it('R32.16 accessors d’adjunts no es consulten i l’iterador TypedArray no altera els bytes', async () => {
  let reads = 0;
  const item = { url: 'https://socdepoble.net/a' };
  Object.defineProperty(item, 'bytes', { get() { reads++; return new Uint8Array(1); } });
  await expect(verificaAdjuntsEditorials([item])).rejects.toThrow(/accessors/);
  expect(reads).toBe(0);
  const bytes = new Uint8Array([97, 98, 99]);
  bytes[Symbol.iterator] = () => { throw new Error('attacker iterator'); };
  Object.defineProperty(bytes, 'byteLength', { get() { throw new Error('attacker byteLength'); } });
  const verified = await verificaAdjuntsEditorials([{ url: 'https://socdepoble.net/a', bytes }]);
  expect(verified[0].sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

it('R32.16 procedència duplicada amb URL igual conserva ordre total determinista', async () => {
  const a = { id: 1, title: 'Article', content: '<p>Cos</p>', date_gmt: '2026-11-19T12:00:00', date: '2026-11-19T13:00:00', link: 'https://socdepoble.net/article/' };
  const b = { ...a, id: 2, date: '2026-11-19T14:00:00' };
  expect(await importaEditorial(JSON.stringify([a, b]), { format: 'wordpress-json' })).toEqual(await importaEditorial(JSON.stringify([b, a]), { format: 'wordpress-json' }));
});
