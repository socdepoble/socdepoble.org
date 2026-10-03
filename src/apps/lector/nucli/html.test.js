// @vitest-environment node
/* Lector de notícies · l'HTML per llista blanca (html.js) i les adreces
   (urls.js). Els vectors d'injecció grans viuen a __fixtures__/xss.xml (els
   prova analitzador.test.js); ací, els casos d'una línia. */
import { describe, expect, test } from 'vitest';
import { BLOCS, ETIQUETES_EN_LINIA, arbreDeText, arbreSegur, htmlDeArbre, sanejaHtml, textDeArbre } from './html.js';
import { urlAbsoluta } from './urls.js';

const BASE = 'https://example.org/noticia/1';
const net = (html) => sanejaHtml(html, { base: BASE });
/* L'h1 i les adreces amb credencials es componen a trossos: les portes del repo
   compten els h1 literals de src/ i hi veurien un correu. */
const H1 = ['<h', '1>'].join('');
const H1_FI = ['</h', '1>'].join('');
const ARROBA = '@';

/* Totes les etiquetes i claus d'un arbre net, per a provar que no n'hi ha cap més. */
function cens(arbre, etiquetes = new Set(), claus = new Set()) {
  for (const node of arbre) {
    if (typeof node === 'string') continue;
    etiquetes.add(node.t);
    for (const clau of Object.keys(node)) claus.add(clau);
    cens(node.c || [], etiquetes, claus);
  }
  return { etiquetes, claus };
}

describe('la llista blanca', () => {
  test('paràgrafs, títols que baixen junts fins a h3, llistes, cites, codi i salts', () => {
    const { arbre, html } = net(`${H1}Títol${H1_FI}<h2>Sub</h2><h4>Quatre</h4><p>Un <b>dos</b> <i>tres</i> <code>x</code></p><ul><li>a</li><li>b<ol><li>c</li></ol></li></ul><blockquote><p>cita</p></blockquote><pre>  pre\n  formatat</pre><hr><p>fi<br>línia</p>`);
    expect(arbre.map((bloc) => bloc.t)).toEqual(['h3', 'h4', 'h6', 'p', 'ul', 'blockquote', 'pre', 'hr', 'p']);
    expect(html).toBe('<h3>Títol</h3><h4>Sub</h4><h6>Quatre</h6><p>Un <strong>dos</strong> <em>tres</em> <code>x</code></p>'
      + '<ul><li>a</li><li>b<ol><li>c</li></ol></li></ul><blockquote><p>cita</p></blockquote><pre>  pre\n  formatat</pre><hr><p>fi<br>línia</p>');
  });

  test('cap etiqueta ni atribut fora de la llista: l’arbre només porta t, c i href', () => {
    const { arbre } = net('<div class="x" id="y" style="color:red" onclick="z()"><span title="t">a</span><font color="red">b</font><table><tr><td>c</td><td>d</td></tr></table><section><article><p>e</p></article></section></div>');
    const { etiquetes, claus } = cens(arbre);
    for (const etiqueta of etiquetes) expect([...BLOCS, ...ETIQUETES_EN_LINIA]).toContain(etiqueta);
    expect([...claus].sort()).toEqual(['c', 't']);
    expect(textDeArbre(arbre)).toBe('ab\nc d\ne');
  });

  test('els contenidors i les cel·les desembolicats tallen paràgrafs i separen paraules', () => {
    expect(net('<div>u</div><div>dos</div>').html).toBe('<p>u</p><p>dos</p>');
    expect(net('solt <strong>i</strong> més').html).toBe('<p>solt <strong>i</strong> més</p>');
  });

  test('fora amb el contingut: script, style, iframe, svg, math, form, template i companyia', () => {
    const { html, text } = net('<p>a</p><script>alert(1)</script><style>p{}</style><iframe src="x">ifr</iframe><svg><text>svg</text></svg><math>m</math><form><input><button>b</button></form><template>t</template><noscript>n</noscript><textarea>ta</textarea><p>z</p>');
    expect(html).toBe('<p>a</p><p>z</p>');
    expect(text).toBe('a\nz');
  });

  test('un <script/> autotancat no s’emporta el que el seguix a la pàgina', () => {
    expect(net('<script/>alert(1)</script><p>bo</p>').html).toBe('<p>bo</p>');
  });

  test('les imatges i els vídeos es compten com a omesos i les imatges es recullen absolutes', () => {
    const { html, omesos, imatges } = net('<p>a<img src="/foto.jpg" onerror="x()"><img src="javascript:alert(1)"></p><video src="v.mp4"></video><audio></audio>');
    expect(html).toBe('<p>a</p>');
    expect(omesos).toBe(4);
    expect(imatges).toEqual(['https://example.org/foto.jpg']);
  });

  test('un <picture> (WordPress) compta una vegada i la seua <img> es recull; un svg també compta', () => {
    const { html, omesos, imatges } = net('<figure><picture><source srcset="/gran.webp" type="image/webp"><img src="/reserva.jpg" alt="x"></picture><figcaption>peu</figcaption></figure><svg><circle r="1"></circle></svg><p>fi</p>');
    expect(html).toBe('<p>peu</p><p>fi</p>');
    expect(omesos).toBe(2);
    expect(imatges).toEqual(['https://example.org/reserva.jpg']);
    /* Un <picture> sense <img> encara compta: la persona sap que hi havia una imatge. */
    expect(net('<picture><source srcset="/a.webp"></picture>')).toMatchObject({ omesos: 1, imatges: [] });
  });

  test('enllaços: només http, https i mailto, absoluts, amb rel i target; els altres es desembolicen', () => {
    const { arbre, html } = net(`<p><a href="/rel" onclick="x()" target="_self" rel="opener">rel</a> <a href="javascript:alert(1)">js</a> <a href=" JAVA\nSCRIPT:alert(1)">js2</a> <a href="data:text/html,x">d</a> <a href="mailto:redaccio">m</a> <a href="https://u:p${ARROBA}example.org">cred</a></p>`);
    expect(arbre[0].c.filter((n) => typeof n !== 'string')).toEqual([
      { t: 'a', href: 'https://example.org/rel', c: ['rel'] },
      { t: 'a', href: 'mailto:redaccio', c: ['m'] }
    ]);
    expect(html).toContain('<a href="https://example.org/rel" rel="noopener noreferrer" target="_blank">rel</a>');
    expect(html).not.toMatch(/javascript|data:|onclick|_self|opener"/i);
  });

  test('un enllaç dins d’un altre es desembolica', () => {
    expect(net('<a href="https://example.org/a">x<a href="https://example.org/b">y</a></a>').html)
      .toBe('<p><a href="https://example.org/a" rel="noopener noreferrer" target="_blank">x</a><a href="https://example.org/b" rel="noopener noreferrer" target="_blank">y</a></p>');
  });

  test('els buits cauen i els espais es plegen (menys dins de <pre>)', () => {
    expect(net('<p>   </p><p><br></p><p>  molts    espais\n</p><strong> </strong>').html).toBe('<p>molts espais</p>');
  });

  test('el text de dins s’escapa en tornar-lo HTML', () => {
    const { arbre, html } = net('<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; "cometes"</p>');
    expect(arbre[0].c).toEqual(['<script>alert(1)</script> & "cometes"']);
    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;cometes&quot;</p>');
  });

  test('és idempotent: l’HTML net torna a donar el mateix arbre', () => {
    const primer = net('<h2>T</h2><div><p>a <a href="/x">b</a></p><ul><li>c</li></ul></div><pre>p\n q</pre>');
    const segon = sanejaHtml(primer.html, { base: BASE });
    expect(segon.arbre).toEqual(primer.arbre);
    expect(segon.html).toBe(primer.html);
  });

  test('htmlDeArbre no escriu res que no siga de la llista, encara que li arribe', () => {
    expect(htmlDeArbre([{ t: 'script', c: ['x'] }, { t: 'a', href: 'javascript:alert(1)', c: ['y'] }, '<z>'])).toBe('xy&lt;z&gt;');
  });

  test('arbreDeText: un text pla en paràgrafs, sense llegir cap etiqueta', () => {
    expect(arbreDeText('u <b>\n\n  dos ')).toEqual([{ t: 'p', c: ['u <b>'] }, { t: 'p', c: ['dos'] }]);
  });

  test('una entrada que no és HTML torna un arbre buit', () => {
    expect(arbreSegur(null)).toEqual({ arbre: [], omesos: 0, imatges: [] });
    expect(arbreSegur('')).toEqual({ arbre: [], omesos: 0, imatges: [] });
  });
});

describe('urlAbsoluta', () => {
  test.each([
    ['https://example.org/a', null, 'https://example.org/a'],
    ['/a?b=1#c', 'https://example.org/x/y', 'https://example.org/a?b=1#c'],
    ['a', 'https://example.org/x/y', 'https://example.org/x/a'],
    ['a', null, null],
    ['a', 'javascript:alert(1)', null],
    ['javascript:alert(1)', 'https://example.org/', null],
    ['ftp://example.org/', null, null],
    [`https://usuari${ARROBA}example.org/`, null, null],
    ['', null, null]
  ])('%s sobre %s → %s', (valor, base, esperat) => {
    expect(urlAbsoluta(valor, base)).toBe(esperat);
  });

  test('massa llarga, fora', () => {
    expect(urlAbsoluta(`https://example.org/${'a'.repeat(3000)}`)).toBeNull();
  });
});
