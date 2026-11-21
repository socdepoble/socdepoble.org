/**
 * v1.2.17 · El mode de taulell (chrome="feed", R32.26 · IDEA-305) porta les seues regles en un full diferit:
 * fora de modules.css (que viatja a l'arrencada del connector), adoptat per PageFrame abans del primer
 * pintat amb la funció que li passa la config del Mur, del Mercat i del Calendari.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PageFrame } from './PageFrame.jsx';
import { CLAU_TAULELL_FEED, adoptaEstilsTaulellFeed } from './estilsTaulellFeed.js';

vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), useRouter: () => null, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* Vitest no servix el text dels .css?inline: una regla de mostra, com a PedraSecaEmbed.config.test.jsx. */
vi.mock('../../css/diferit-taulell-feed.css?inline', () => ({ default: '.sdp-universal-page-container--feed > header.page-title { display: flex; }' }));

const llegix = (cami) => readFileSync(resolve(process.cwd(), cami), 'utf8');
/* Els fulls de l'arrel: els adoptats (CSSStyleSheet) i, com a recurs, el <style> de la clau. */
const fullsDeLArrel = () => (document.adoptedStyleSheets?.length ?? 0)
  + document.querySelectorAll(`style[data-sdp-full-diferit="${CLAU_TAULELL_FEED}"]`).length;

afterEach(() => cleanup());

describe('v1.2.17 · el full diferit del mode de taulell', () => {
  test('les regles són al full diferit, dins de la capa components, i ja no a modules.css', () => {
    const diferit = llegix('src/css/diferit-taulell-feed.css');
    expect(diferit).toMatch(/@layer components \{[\s\S]*\.sdp-universal-page-container--feed > header\.page-title \{/);
    expect(diferit).toContain('.sdp-universal-page-container--feed > .content-wrapper > .page-intro h2 {');
    expect(llegix('src/css/modules.css')).not.toContain('--feed');
  });

  test('el Mur, el Mercat i el Calendari passen l’adoptador amb la seua config; PageFrame no importa cap full', () => {
    for (const cami of ['src/sections/mur/MurSection.jsx', 'src/sections/mercat/MercatSection.jsx', 'src/sections/calendari/CalendariSection.jsx']) {
      const font = llegix(cami);
      expect(font, cami).toContain("import { adoptaEstilsTaulellFeed } from '../../components/universal/estilsTaulellFeed.js';");
      expect(font, cami).toContain('adoptaEstilsChrome: adoptaEstilsTaulellFeed');
    }
    const pageFrame = llegix('src/components/universal/PageFrame.jsx');
    expect(pageFrame).not.toMatch(/^import .*(?:estilsTaulellFeed|diferit-taulell-feed|config\/fullDiferit)/m);
  });

  test('amb chrome="feed", PageFrame l’adopta abans de pintar, una sola vegada; amb un altre chrome, mai', () => {
    const adopta = vi.fn(adoptaEstilsTaulellFeed);
    const abans = fullsDeLArrel();
    const { unmount } = render(<PageFrame chrome="system" title="Mur" adoptaEstilsChrome={adopta}><p>Targeta</p></PageFrame>);
    expect(adopta).not.toHaveBeenCalled();
    unmount();
    const { container, rerender } = render(<PageFrame chrome="feed" title="Mur" adoptaEstilsChrome={adopta}><p>Targeta</p></PageFrame>);
    expect(adopta).toHaveBeenCalled();
    expect(container.querySelector('.content-wrapper')).toBe(adopta.mock.calls[0][0]);
    expect(fullsDeLArrel()).toBe(abans + 1);
    rerender(<PageFrame chrome="feed" title="Mur 2" adoptaEstilsChrome={adopta}><p>Targeta</p></PageFrame>);
    expect(fullsDeLArrel()).toBe(abans + 1);
    expect(adoptaEstilsTaulellFeed(container.querySelector('.content-wrapper'))).toBe(false);
  });
});
