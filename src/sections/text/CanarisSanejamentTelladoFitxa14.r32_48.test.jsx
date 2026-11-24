/**
 * CanarisSanejamentTelladoFitxa14.r32_48.test.jsx — Bateria permanent de canaris
 * inofensius contra Stored XSS i escalada d'atributs en marcatge d'usuari
 * (Fitxa 14 de Fernando Tellado · Onada v1.2.23 · R32.48 Lot 3).
 *
 * Verifica sobre els 5 mòduls amb contingut d'usuari (Mur, Mercat, Notes, Perfil i Xat):
 *   1. Cap etiqueta activa (<script>, <svg>, <math>, <iframe>, <object>, <embed>,
 *      <style>, <form>, <input>, <foreignObject>) ni cap atribut d'esdeveniment
 *      (onload, onerror, onclick, onmouseover, onfocus, formaction, ping, style,
 *      srcset) no sobreviu al sanejament ni al muntatge React.
 *   2. Cap URI d'execució o exfiltració (javascript:, vbscript:, data:text/html,
 *      data:image/svg+xml, //evil.example) no entra en href ni en src.
 *   3. Les imatges externes d'usuari al Mur i Mercat (mode imatgesPropies) perden
 *      el src i queden marcades amb data-sdp-bloquejada="1" (zero rastreig d'IP).
 *   4. El Xat (Bombolla, CapcaleraConversa, FilaConversa, segmentaEnllacos) tracta
 *      tot marcatge d'usuari com a text pla escapat i preserva literals $&, $`, $'.
 *   5. Els punts d'entrada de Perfil (enllacMailto, esVideoDeCapcaleraDesable,
 *      presentacioAmbLaTargetaDeLAnima) rebutgen injeccions de capçalera, esquemes
 *      aliens i controls Unicode C0/C1.
 */
import '../../../tests/helpers/diccionaris.js';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { esVideoDeCapcaleraDesable, netejaText, sanitizeHtml } from '../../utils/sanitize.js';
import { renderPostContent, renderRichText } from '../detail/detailRichText.jsx';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import { propsDeTargetaDeProducte } from '../mercat/targetaDeProducte.js';
import { rutaSegura } from '../notes/connexions.js';
import { enllacMailto } from '../profile/contacteOrganitzacio.js';
import { presentacioAmbLaTargetaDeLAnima } from '../profile/PerfilPublicSection.jsx';
import Bombolla from '../xat/components/Bombolla.jsx';
import CapcaleraConversa from '../xat/components/CapcaleraConversa.jsx';
import FilaConversa from '../xat/components/FilaConversa.jsx';
import { segmentaEnllacos } from '../xat/enllacos.js';
import CreditsComunitatS23 from './CreditsComunitatS23.jsx';

const CANARIS_HTML_TELLADO = Object.freeze([
  '"><svg onload=1><circle cx="1" cy="1" r="1"/></svg>',
  '<img src="x" onerror="window.__canari=1" alt="canari">',
  '<p onclick="window.__canari=1" onmouseover="window.__canari=1">Text veïnal</p>',
  '<a href="javascript:alert(1)" formaction="javascript:alert(1)" ping="https://tracker.invalid/p">Punxa ací</a>',
  '<a href="  \tjavascript:confirm(1)">Espais i tabulador</a>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Data HTML</a>',
  '<img src="data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' onload=\'alert(1)\'></svg>">',
  '<svg><foreignObject><iframe srcdoc="<script>alert(1)</script>"></iframe></foreignObject></svg>',
  '<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;img src=1 onerror=1&gt;">',
  '<div class="sdp-taula-prosa" data-sdp-taula="falsificada" role="region" tabindex="0" style="position:fixed;inset:0">Taula falsa</div>',
  '<script>window.__canari = true;</script><iframe src="https://evil.invalid"></iframe>'
]);

function verificaArbreNetDeCanaris(arrel) {
  expect(globalThis.__canari).toBeUndefined();
  expect(arrel.querySelector('script, math, iframe, object, embed, style, form, input, foreignObject, svg[onload]')).toBeNull();
  // Cap SVG injectat pel marcatge d'usuari sobreviu dins dels blocs de prosa sanejada.
  expect(arrel.querySelector('.sdp-cos-tros svg, .cms-preview svg')).toBeNull();

  for (const el of arrel.querySelectorAll('*')) {
    for (const attr of el.getAttributeNames()) {
      expect(attr.toLowerCase().startsWith('on')).toBe(false);
      expect(['style', 'srcset', 'formaction', 'ping', 'data-sdp-taula']).not.toContain(attr.toLowerCase());
    }
    const href = el.getAttribute('href');
    if (href !== null) {
      expect(href).not.toMatch(/^\s*(?:javascript|vbscript|data):/i);
      expect(href).not.toMatch(/^\s*\/\//);
    }
    const src = el.getAttribute('src');
    if (src !== null) {
      expect(src).not.toMatch(/^\s*(?:javascript|vbscript|data:text\/html|data:image\/svg)/i);
      expect(src).not.toMatch(/^\s*\/\//);
    }
  }
}

afterEach(() => {
  delete globalThis.__canari;
  cleanup();
});

describe('Fitxa 14 (Fernando Tellado) · Canaris anti-XSS emmagatzemat en Mur, Mercat, Notes, Perfil i Xat', () => {
  test('1. MUR · renderRichText i UniversalCard neutralitzen tots els canaris i bloquegen imatges de tercers', () => {
    const cosBrut = [
      '<p><a href="https://ayudawp.com" target="_blank">Enllaç extern legítim</a></p>',
      '<p><img src="https://tracker.evil.invalid/pixel.png" alt="Rastrejador"></p>',
      ...CANARIS_HTML_TELLADO
    ].join('\n');

    const vista = render(
      <MemoryRouter>
        <div>
          {renderRichText(cosBrut)}
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(cosBrut, { imatgesPropies: true }) }} />
          <UniversalCard
            title={'Bàndol "><svg onload=1>'}
            subtitle={'<img src=x onerror=1>'}
            excerpt={'Crònica amb <script>alert(1)</script>'}
            mainHref="javascript:alert(1)"
            authorName={'Associació "><svg onload=1>'}
            authorHref="javascript:alert(1)"
            imageUrl="https://tracker.evil.invalid/foto.jpg"
            avatarUrl="https://lh3.googleusercontent.com/a/avatar"
            imatgePrivada
          />
        </div>
      </MemoryRouter>
    );

    verificaArbreNetDeCanaris(vista.container);
    // La imatge de rastreig extern perd el src i rep la marca d'imatge bloquejada.
    const bloquejades = vista.container.querySelectorAll('img[data-sdp-bloquejada="1"]');
    expect(bloquejades.length).toBeGreaterThanOrEqual(1);
    for (const img of bloquejades) {
      expect(img.hasAttribute('src')).toBe(false);
    }
    // Cap caixa escrita per un usuari guanya role="region" ni tabindex="0" sense MARCA_TAULA interna.
    for (const taulaFalsa of vista.container.querySelectorAll('.sdp-taula-prosa')) {
      expect(taulaFalsa.hasAttribute('role')).toBe(false);
      expect(taulaFalsa.hasAttribute('tabindex')).toBe(false);
    }
    // Els enllaços d'usuari externs porten sempre rel="noopener noreferrer nofollow ugc".
    const enllacExtern = [...vista.container.querySelectorAll('a')].find((a) => a.getAttribute('href') === 'https://ayudawp.com');
    expect(enllacExtern?.getAttribute('rel')).toContain('noopener');
    expect(enllacExtern?.getAttribute('rel')).toContain('noreferrer');
    expect(enllacExtern?.getAttribute('rel')).toContain('nofollow');
    expect(enllacExtern?.getAttribute('rel')).toContain('ugc');
  });

  test('2. MERCAT · propsDeTargetaDeProducte + UniversalCard + renderPostContent sanegen títols, preus i descripcions', () => {
    const producteMalicios = {
      id: 'oli-canari"><svg onload=1>',
      type: 'market',
      title: 'Oli verge extra "><svg onload=1>',
      price: '12 € <img src=x onerror=1>',
      description: CANARIS_HTML_TELLADO.join(' '),
      imageSrc: 'javascript:alert(1)',
      author_name: 'Cooperativa <script>1</script>',
      author_avatar: 'https://evil.invalid/avatar.png'
    };
    const props = propsDeTargetaDeProducte(producteMalicios, (_, r) => r);
    const vista = render(
      <MemoryRouter>
        <div>
          <UniversalCard {...props} imatgePrivada />
          {renderPostContent(producteMalicios.description)}
        </div>
      </MemoryRouter>
    );

    verificaArbreNetDeCanaris(vista.container);
    expect(vista.container.textContent).toContain('Oli verge extra "><svg onload=1>');
  });

  test('3. NOTES · cos de nota, netejaText i rutaSegura de connexions bloquegen vectors i esquemes perillosos', () => {
    const textPla = netejaText('Llista del mercat: < 5 kg & "><svg onload=1>\u0000\u0007');
    expect(textPla).toBe('Llista del mercat: < 5 kg & "><svg onload=1>');
    expect(rutaSegura({ ruta: 'javascript:alert(1)' })).toBe('');
    expect(rutaSegura({ ruta: '//evil.invalid/x' })).toBe('');
    expect(rutaSegura({ ruta: '/\\evil.invalid/x' })).toBe('');
    expect(rutaSegura({ ruta: '/mur/123' })).toBe('/mur/123');

    const vista = render(
      <MemoryRouter>
        <div>{renderRichText(`<p>Nota d’acció Emowe</p>${CANARIS_HTML_TELLADO.join('')}`)}</div>
      </MemoryRouter>
    );
    verificaArbreNetDeCanaris(vista.container);
    expect(vista.container.textContent).toContain('Nota d’acció Emowe');
  });

  test('4. PERFIL · presentació amb targeta incrustada, enllacMailto i vídeo de capçalera rebutgen injeccions', () => {
    expect(enllacMailto('forn@socdepoble.org?subject=<script>1</script>')).toBeNull();
    expect(enllacMailto('javascript:alert(1)@socdepoble.org')).toBeNull();
    expect(enllacMailto('forn@socdepoble.org')).toBe('mailto:forn@socdepoble.org');

    expect(esVideoDeCapcaleraDesable('javascript:alert(1).mp4')).toBe(false);
    expect(esVideoDeCapcaleraDesable('https://evil.invalid/video.mp4')).toBe(false);
    expect(esVideoDeCapcaleraDesable('/media/bo\u0085mal.mp4')).toBe(false);
    expect(esVideoDeCapcaleraDesable('sdp-media://mitjans/../secret.mp4')).toBe(false);
    expect(esVideoDeCapcaleraDesable('sdp-media://mitjans/portada.mp4')).toBe(true);

    const htmlPresentacio = presentacioAmbLaTargetaDeLAnima(`<h3>Presentació</h3>${CANARIS_HTML_TELLADO.join('')}`);
    const vista = render(
      <MemoryRouter>
        <div>{renderRichText(htmlPresentacio)}</div>
      </MemoryRouter>
    );
    verificaArbreNetDeCanaris(vista.container);
  });

  test('5. XAT · Bombolla, CapcaleraConversa, FilaConversa i segmentaEnllacos pinten canaris com a text literal inert', () => {
    const textCanari = 'Mira "><svg onload=1> javascript:alert(1) data:text/html,<script>1</script> i https://xn--pple-43d.com/test $& $` $\'';
    const segments = segmentaEnllacos(textCanari);
    // Només http(s) es converteix en enllaç; javascript: i data: queden com a text pla.
    const enllacos = segments.filter((s) => s.tipus === 'enllac');
    expect(enllacos.length).toBe(1);
    expect(enllacos[0].href).toBe('https://xn--pple-43d.com/test');
    expect(enllacos[0].sospitos).toBe(true);

    const t = (_, alternativa) => alternativa;
    const missatge = {
      id: 'm-canari',
      seq: 1,
      sender: 'other',
      author: 'Veí "><img src=x onerror=1>',
      usuariId: 'vei-1',
      text: textCanari,
      creatAl: '2026-11-23T10:00:00Z',
      estatEnviament: 'enviat'
    };

    const vista = render(
      <MemoryRouter>
        <div>
          <CapcaleraConversa
            fil={{ id: 'fil-1', tipus: 'grup', name: 'Grup "><svg onload=1>', altresNoms: ['Pep <script>1</script>'] }}
            onTorna={vi.fn()}
            t={t}
          />
          <FilaConversa
            fil={{ id: 'fil-1', tipus: 'grup', name: 'Grup "><svg onload=1>', ultimText: textCanari }}
            onSelect={() => {}}
            locale="ca-ES"
            t={t}
          />
          <ol>
            <Bombolla missatge={missatge} esGrup locale="ca-ES" t={t} />
          </ol>
          <CreditsComunitatS23 language="ca" />
        </div>
      </MemoryRouter>
    );

    verificaArbreNetDeCanaris(vista.container);
    expect(vista.container.querySelector('.sdp-xat-bombolla__text')?.textContent).toContain('"><svg onload=1>');
    expect(vista.container.querySelector('.sdp-xat-enllac__avis')).not.toBeNull();
  });
});
