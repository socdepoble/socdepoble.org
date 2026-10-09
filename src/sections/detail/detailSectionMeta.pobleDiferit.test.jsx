/**
 * Revisió adversarial de l'Onada 6 (pàgina del poble) · El panell de la
 * pestanya «Gent de …» es carrega en diferit (lazyRoute). Si el tros no es pot
 * descarregar (una connexió rural que cau), la fallada queda dins de la
 * pestanya: la capçalera, el botó blau i la mateixa pestanya continuen, i
 * l'error no puja a la barrera de la ruta. Qualsevol altre error sí que hi
 * puja, com sempre.
 *
 * Fitxer propi: el mòdul del panell es simula com un import que falla, i eixa
 * simulació no ha de tocar les altres proves de la pàgina del poble.
 */
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* El tros del panell no arriba: el mateix que un import() rebutjat per la xarxa. */
vi.mock('../pobles/PublicacionsDelPoble.jsx', () => {
  throw new TypeError('Failed to fetch dynamically imported module');
});

import { BarreraDelPanellDelPoble, buildPoblesDetailSectionMeta } from './detailSectionMeta.jsx';
import { LazyRouteError } from '../../apps/plataforma/lazyRoute.js';

const t = (_, alternativa) => alternativa;
const POBLE = Object.freeze({ id: 'vilanova-de-prova-sdp', title: 'Vilanova de Prova SdP', content: '.' });

/* La barrera de la ruta, de mentides: diu si li ha arribat cap error. */
class BarreraDeLaRuta extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    return this.state.error ? <p data-ruta="error">{this.state.error.name}</p> : this.props.children;
  }
}

/* React avisa per consola de cada error que recull una barrera i, en
   desenvolupament, el torna a llançar dins d'un esdeveniment de jsdom: es dona
   per atés (el patró de PublicacionsDeLActor.test.jsx). */
let silenci;
const atesa = (event) => event.preventDefault();
beforeEach(() => {
  silenci = vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', atesa);
});
afterEach(() => {
  cleanup();
  window.removeEventListener('error', atesa);
  silenci.mockRestore();
});

describe('el panell diferit del poble', () => {
  test('si el tros no arriba, l’avís queda dins de la pestanya i la pàgina continua', async () => {
    const meta = buildPoblesDetailSectionMeta({ t });
    const { container } = render(<BarreraDeLaRuta>{meta.renderBody(POBLE, { detall: true })}</BarreraDeLaRuta>);
    const panell = container.querySelector('[role="tabpanel"]');
    await waitFor(() => expect(panell.querySelector('.sdp-alerta--error')).not.toBeNull());
    expect(screen.getByRole('alert').textContent).toContain('No s’han pogut carregar les publicacions del poble');
    expect(panell.textContent).toContain('La resta de la pàgina continua com sempre.');
    // Cap reintent fals: un import fallit no es recupera sense recarregar.
    expect(panell.querySelector('button')).toBeNull();
    // La barrera de la ruta no ha rebut res; la resta de la pàgina, sencera.
    expect(container.querySelector('[data-ruta="error"]')).toBeNull();
    expect(container.querySelector('.sdp-pagina-accio > a').textContent).toBe('Parlar amb la Gent de Vilanova de Prova SdP');
    expect(container.querySelector('[role="tab"]').textContent).toBe('Gent de Vilanova de Prova SdP');
  });

  test('la barrera només es queda la fallada d’un import: un altre error puja a la ruta', () => {
    const Peta = () => { throw new Error('una targeta malformada'); };
    const { container } = render(
      <BarreraDeLaRuta>
        <BarreraDelPanellDelPoble fallback={<p data-panell="avis">avís</p>}><Peta /></BarreraDelPanellDelPoble>
      </BarreraDeLaRuta>
    );
    expect(container.querySelector('[data-panell="avis"]')).toBeNull();
    expect(container.querySelector('[data-ruta="error"]').textContent).toBe('Error');
  });

  test('una fallada d’import la recull, i en canviar de poble torna a provar', () => {
    let peta = true;
    const Fill = () => {
      if (peta) throw new LazyRouteError(new TypeError('xarxa'));
      return <p data-panell="ple">ple</p>;
    };
    const pinta = (clau) => (
      <BarreraDeLaRuta>
        <BarreraDelPanellDelPoble resetKey={clau} fallback={<p data-panell="avis">avís</p>}><Fill /></BarreraDelPanellDelPoble>
      </BarreraDeLaRuta>
    );
    const { container, rerender } = render(pinta('a'));
    expect(container.querySelector('[data-panell="avis"]')).not.toBeNull();
    expect(container.querySelector('[data-ruta="error"]')).toBeNull();
    peta = false;
    rerender(pinta('b'));
    expect(container.querySelector('[data-panell="ple"]')).not.toBeNull();
  });
});
