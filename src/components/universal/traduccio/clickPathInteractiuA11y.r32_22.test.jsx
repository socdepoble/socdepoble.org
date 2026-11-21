import { readFileSync } from 'node:fs';
import path from 'node:path';
import { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { BarraBlava } from '../barres/BarraBlava.jsx';
import { BotoComentar } from '../../PedraSeca/organismes/Comentar.jsx';
import { Dialeg } from '../../PedraSeca/organismes/Dialeg.jsx';
import ControlModeSenior from '../ControlModeSenior.jsx';
import { LLENGUES_TRADUCCIO } from '../../../data/traductor.js';
import { VEUS_TERRITORIALS } from '../../../services/veusTerritorials.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-sdp-senior');
});

function ArnesBarraInteractiva({ lang = 'ca' }) {
  const [menuObert, setMenuObert] = useState(false);
  const [dialegObert, setDialegObert] = useState(false);
  const [actual, setActual] = useState(null);

  return (
    <div>
      <ControlModeSenior llengua={lang} />
      <BarraBlava
        onBack={() => {}}
        onIndex={() => setDialegObert(true)}
        indexControla={dialegObert ? 'dialeg-index-r32-22' : undefined}
        traduirVisible
        comentarVisible
        compartirVisible
        connectarVisible
        comentarXat="comu"
        onTranslate={() => setMenuObert((v) => !v)}
        onComment={() => {}}
        onShare={() => {}}
        onConnect={() => {}}
        menuTraduir={{
          obert: menuObert,
          opcions: LLENGUES_TRADUCCIO,
          actual,
          onTria: (codi) => setActual(codi),
          onTanca: () => setMenuObert(false),
          lecturaVeu: {
            parlant: false,
            veuActual: 'arnau_valencia',
            veus: VEUS_TERRITORIALS,
            onEscoltar: () => {},
            onTriaVeu: () => {},
          },
        }}
      />
      <Dialeg
        obert={dialegObert}
        onTanca={() => setDialegObert(false)}
        titol="Índex de la pàgina"
      >
        <p>Contingut navegable de l’índex.</p>
      </Dialeg>
    </div>
  );
}

describe('Onada R32.22 · T1 · Click-Path interactiu, estanquitat a 320 px, Escape i retorn de focus en 5 llengües', () => {
  test('components.css acota .bar-blue .sdp-menu-traduir al sostre de Pedra Seca §12 sense sobreixir a 320 px', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'src/css/components.css'), 'utf8');
    const inici = css.indexOf('.bar-blue .sdp-menu-traduir {');
    expect(inici).toBeGreaterThan(0);
    const regla = css.slice(inici, css.indexOf('}', inici));
    expect(regla).toContain('box-sizing: border-box;');
    expect(regla).toContain('max-inline-size: min(var(--sdp-menu-ample-max), calc(100% - var(--sdp-space-4)));');
    expect(regla).toContain('overflow-x: hidden;');
  });

  test('MenuTraduir i MenuComentar a BarraBlava: 0 controls sense nom, Escape tanca i torna el focus al disparador', () => {
    const { container } = render(<ArnesBarraInteractiva />);

    const botoTraduir = container.querySelector('button[aria-label="Traduir"]');
    act(() => {
      botoTraduir.focus();
      fireEvent.click(botoTraduir);
    });

    const menuTraduir = screen.getByRole('menu', { name: 'Traduir la pàgina' });
    const itemsTraduir = [
      ...within(menuTraduir).getAllByRole('menuitem'),
      ...within(menuTraduir).getAllByRole('menuitemradio'),
    ];
    expect(itemsTraduir.length).toBeGreaterThanOrEqual(LLENGUES_TRADUCCIO.length + VEUS_TERRITORIALS.length + 1);
    for (const item of itemsTraduir) {
      const nom = (item.getAttribute('aria-label') || item.textContent || '').trim();
      expect(nom.length).toBeGreaterThan(0);
    }

    fireEvent.keyDown(document.activeElement || menuTraduir, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Traduir la pàgina' })).toBeNull();
    expect(document.activeElement).toBe(botoTraduir);

    const botoComentar = container.querySelector('button[aria-label="Comentar"]');
    act(() => {
      botoComentar.focus();
      fireEvent.click(botoComentar);
    });

    const menuComentar = screen.getByRole('menu', { name: 'On vols comentar?' });
    const filesComentar = within(menuComentar).getAllByRole('menuitem');
    expect(filesComentar).toHaveLength(2);
    fireEvent.keyDown(document.activeElement || menuComentar, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'On vols comentar?' })).toBeNull();
    expect(document.activeElement).toBe(botoComentar);
  });

  test('BotoComentar en peu de targeta: sets -> resets amb Escape i preserva el focus', () => {
    const onComment = vi.fn();
    function PeuTargeta() {
      const refExt = useRef(null);
      return (
        <footer ref={refExt} className="sp-card-footer">
          <BotoComentar comentarXat="privat" privatAmb="Associació El Rentonar" onComment={onComment} />
        </footer>
      );
    }

    render(<PeuTargeta />);
    const boto = screen.getByRole('button', { name: 'Comentar' });
    expect(boto.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      boto.focus();
      fireEvent.click(boto);
    });
    expect(boto.getAttribute('aria-expanded')).toBe('true');
    const menu = screen.getByRole('menu', { name: 'On vols comentar?' });
    const publica = within(menu).getByRole('menuitem', { name: /En públic/i });
    expect(publica.getAttribute('aria-disabled')).toBe('true');

    fireEvent.keyDown(document.activeElement || menu, { key: 'Escape' });
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(boto);
    expect(onComment).not.toHaveBeenCalled();
  });

  test('ControlModeSenior en les 5 llengües (ca, es, en, eu, gl): nom accessible invariant i simetria sets -> resets', () => {
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      const { unmount } = render(<ControlModeSenior llengua={llengua} />);
      const interruptor = screen.getByRole('switch');
      expect(interruptor.textContent.trim().length).toBeGreaterThan(4);
      expect(interruptor.getAttribute('aria-checked')).toBe('false');

      fireEvent.click(interruptor);
      expect(interruptor.getAttribute('aria-checked')).toBe('true');
      expect(document.documentElement.getAttribute('data-sdp-senior')).toBe('true');

      fireEvent.click(interruptor);
      expect(interruptor.getAttribute('aria-checked')).toBe('false');
      expect(document.documentElement.hasAttribute('data-sdp-senior')).toBe(false);
      unmount();
    }
  });
});
