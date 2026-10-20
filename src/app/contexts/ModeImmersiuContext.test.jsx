import { readFileSync } from 'node:fs';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ProveidorModeImmersiu, useModeImmersiu } from './ModeImmersiuContext.jsx';

/* Ordre del Mestre (261007) · La conversa del Xat en mòbil demana la pantalla
   sencera; la closca compta les peticions i en compacte marca l'arrel. */

afterEach(cleanup);

function Demana({ actiu }) {
  useModeImmersiu(actiu);
  return null;
}

/* Com AppShell: un comptador que la petició puja i l'alliberament baixa. */
function proveidor() {
  const estat = { peticions: 0 };
  const demana = vi.fn(() => {
    estat.peticions += 1;
    return () => { estat.peticions -= 1; };
  });
  return { estat, demana };
}

test('sense proveïdor no fa res ni peta (catàleg, proves, peça sola)', () => {
  expect(() => render(<Demana actiu />)).not.toThrow();
});

test('demana el mode mentre és actiu i l’allibera en apagar-se i en desmuntar-se', () => {
  const { estat, demana } = proveidor();
  const vista = render(<ProveidorModeImmersiu value={demana}><Demana actiu={false} /></ProveidorModeImmersiu>);
  expect(estat.peticions).toBe(0);
  act(() => vista.rerender(<ProveidorModeImmersiu value={demana}><Demana actiu /></ProveidorModeImmersiu>));
  expect(estat.peticions).toBe(1);
  act(() => vista.rerender(<ProveidorModeImmersiu value={demana}><Demana actiu={false} /></ProveidorModeImmersiu>));
  expect(estat.peticions).toBe(0);
  act(() => vista.rerender(<ProveidorModeImmersiu value={demana}><Demana actiu /></ProveidorModeImmersiu>));
  vista.unmount();
  expect(estat.peticions).toBe(0);
});

test('dues vistes alhora (fitxa i conversa): el mode dura fins que l’allibera l’última', () => {
  const { estat, demana } = proveidor();
  const vista = render(
    <ProveidorModeImmersiu value={demana}><Demana actiu /><Demana actiu /></ProveidorModeImmersiu>
  );
  expect(estat.peticions).toBe(2);
  act(() => vista.rerender(<ProveidorModeImmersiu value={demana}><Demana actiu /></ProveidorModeImmersiu>));
  expect(estat.peticions).toBe(1);
});

/* Contracte CSS: el token es declara fora de capa (tokens.css), així que la
   reserva només es pot posar a zero allí; les barres s'amaguen a layout.css. */
test('l’arrel immersiva posa a zero la reserva de la barra inferior i amaga la franja i la barra inferior, mai la negra', () => {
  const tokens = readFileSync('src/css/tokens.css', 'utf8');
  const layout = readFileSync('src/css/layout.css', 'utf8');
  expect(tokens).toMatch(/\.sdp-root\[data-sdp-immersiu\]\s*\{\s*--sdp-alt-nav-mobil:\s*0px;\s*\}/);
  const regla = /\.sdp-root\[data-sdp-immersiu\] \.sdp-amfitrio-franja,\s*\.sdp-root\[data-sdp-immersiu\] nav\.mobile-nav\s*\{\s*display:\s*none;\s*\}/;
  expect(layout).toMatch(regla);
  /* Ordre del Mestre (261020; sdp-app-grid-shell §5) · la barra negra no
     s'amaga mai, tampoc en mode immersiu. */
  expect(layout).not.toMatch(/data-sdp-immersiu\][^{]*header\.bar-black/);
});
