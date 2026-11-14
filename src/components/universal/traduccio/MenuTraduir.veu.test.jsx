import { useRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { VEUS_TERRITORIALS } from '../../../services/veusTerritorials.js';
import { BarraBlava } from '../barres/BarraBlava.jsx';
import { MenuTraduir } from './MenuTraduir.jsx';

const IDIOMES = [
  { codi: 'es', nom: 'Castellano' },
  { codi: 'en', nom: 'English' },
  { codi: 'eu', nom: 'Euskara' },
  { codi: 'gl', nom: 'Galego' },
];

function ContenidorMenu({ lecturaVeu = null, actual = null, onTria = vi.fn(), onTanca = vi.fn() }) {
  const botoRef = useRef(null);
  return (
    <div>
      <button ref={botoRef} type="button">Traduir</button>
      <MenuTraduir
        opcions={IDIOMES}
        actual={actual}
        onTria={onTria}
        onTanca={onTanca}
        botoRef={botoRef}
        lecturaVeu={lecturaVeu}
      />
    </div>
  );
}

afterEach(cleanup);

describe('MenuTraduir · integració de lectura en veu alta i selector territorial d’accent/veu', () => {
  test('sense lecturaVeu conserva exactament les files d’idioma i cap bloc de veu', () => {
    render(<ContenidorMenu lecturaVeu={null} />);
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(4);
    expect(screen.queryByRole('menuitem')).toBeNull();
    expect(screen.queryByText('Veu i accent')).toBeNull();
  });

  test('amb lecturaVeu mostra l’acció d’escoltar i les 8 opcions d’accent/veu navegables amb teclat', () => {
    const onEscoltar = vi.fn();
    const onTriaVeu = vi.fn();
    const onTanca = vi.fn();

    render(
      <ContenidorMenu
        onTanca={onTanca}
        lecturaVeu={{
          parlant: false,
          veuActual: 'arnau_valencia',
          veus: VEUS_TERRITORIALS,
          onEscoltar,
          onTriaVeu,
        }}
      />
    );

    const botoEscoltar = screen.getByRole('menuitem', { name: 'Escoltar esta pàgina en veu alta' });
    expect(botoEscoltar).toBeTruthy();

    const radios = screen.getAllByRole('menuitemradio');
    /* 4 idiomes destinació + 8 veus = 12 menuitemradio */
    expect(radios).toHaveLength(12);

    const radioArnau = screen.getByRole('menuitemradio', { name: 'Arnau · Valencià' });
    expect(radioArnau.getAttribute('aria-checked')).toBe('true');

    const menu = screen.getByRole('menu', { name: 'Traduir la pàgina' });
    fireEvent.keyDown(menu, { key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Veu del dispositiu' }));

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Emma · Terres de l’Ebre i Ponent' }));
    expect(onTriaVeu).toHaveBeenCalledWith('emma_occidental');

    fireEvent.click(botoEscoltar);
    expect(onEscoltar).toHaveBeenCalledTimes(1);
    expect(onTanca).toHaveBeenCalledTimes(2);
  });

  test('quan parlant és true mostra el rètol per aturar la lectura en veu alta i BarraBlava reenvia lecturaVeu', () => {
    render(
      <BarraBlava
        traduirVisible
        onTranslate={vi.fn()}
        menuTraduir={{
          obert: true,
          opcions: IDIOMES,
          actual: null,
          onTria: vi.fn(),
          onTanca: vi.fn(),
          lecturaVeu: {
            parlant: true,
            veuActual: 'gina_valencia',
            veus: VEUS_TERRITORIALS,
            onEscoltar: vi.fn(),
            onTriaVeu: vi.fn(),
          },
        }}
      />
    );

    expect(screen.getByRole('menuitem', { name: 'Aturar la lectura en veu alta' })).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: 'Gina · Valencià' }).getAttribute('aria-checked')).toBe('true');
  });
});
