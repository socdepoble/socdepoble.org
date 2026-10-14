import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* Prompt 261014_0400 (ordre del Mestre) · Guarda de la barra negra, sense cap
   simulació de SessionContext ni d'IdentitatContext: els mòduls de veres i la
   mateixa composició que la TopBar d'App.jsx (useIdentitatDeLaBarra,
   BotoIdentitatActiva, CalaixIdentitats i BotoCrom). La TopBar no s'exporta,
   i muntar App sense proveïdors peta igualment a CoreContentProvider. */
import { useIdentitatDeLaBarra } from './useIdentitatDeLaBarra.js';
import { BotoIdentitatActiva } from './BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from './CalaixIdentitats.jsx';
import { BotoCrom } from '../PanellCrom.jsx';

function barraAmb({ useBarra, Crom }) {
  return function BarraNegra({ onNavega }) {
    const { boto, calaix } = useBarra({ onNavega, etiquetaEntrar: 'Entrar' });
    return (
      <>
        <header className="bar-black">
          <div className="right-icons">
            <Crom />
            <BotoIdentitatActiva {...boto} />
          </div>
        </header>
        {calaix ? <CalaixIdentitats {...calaix} /> : null}
      </>
    );
  };
}

const BarraNegra = barraAmb({ useBarra: useIdentitatDeLaBarra, Crom: BotoCrom });

afterEach(() => {
  cleanup();
  vi.doUnmock('../../../data/sessionService.js');
  vi.doUnmock('../../../data/autodesament/sessio.js');
});

test('sense proveïdors, la composició de la barra negra es munta: «Entrar» i cap roda del crom', () => {
  const onNavega = vi.fn();
  expect(() => render(<BarraNegra onNavega={onNavega} />)).not.toThrow();
  expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Entrar']);
  expect(screen.queryByRole('button', { name: 'Crom del sistema' })).toBeNull();
  expect(document.querySelector('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(onNavega).toHaveBeenCalledWith('/registre?mode=entrar&tornar=%2F');
});

/* Prompt 261014_0400 (ordre del Mestre) · [DEFECTE] La reproducció del
   mecanisme del HMR (src/apps/plataforma/fronteres.test.js:205-219): desar un
   fitxer amb el servidor engegat torna a carregar SessionContext.jsx amb un
   createContext nou, React Refresh posa la implementació nova al
   SessionProvider de l'arrel, i la barra, que no s'ha tornat a executar, llig
   el context vell. Ací: el proveïdor ve d'una instància del mòdul i la barra
   està lligada a una altra. Reproduïx un deute conegut de desenvolupament,
   no una regressió: la guarda no el cura, el fa honest (la barra diu
   «Entrar» a qui té sessió, fins a recarregar). En producció no hi ha HMR. */
const ESTAT_DINS = Object.freeze({ usuari: { id: 'U' }, estat: 'dins', rol: 'superadmin', generacio: 1, nivell: 'aal2' });
const CONFIG = Object.freeze({ supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', tenantId: '00000000-0000-4000-8000-000000000000' });

test('[DEFECTE] HMR · amb el SessionProvider d’una altra instància de SessionContext, la barra no llança: pinta «Entrar»', async () => {
  vi.doMock('../../../data/sessionService.js', () => ({
    getSessionState: () => ESTAT_DINS,
    subscribeSession: () => () => {},
    setSessionConfig: () => () => {},
    renovaAra: () => {}
  }));
  vi.doMock('../../../data/autodesament/sessio.js', () => ({
    reprenSessio: () => {},
    eixDeLaSessio: async () => {},
    preparaEixida: async () => ({ pendents: [] })
  }));
  vi.resetModules();
  const nova = await import('../../../app/contexts/SessionContext.jsx');
  vi.resetModules();
  const [vellaBarra, vellCrom] = await Promise.all([import('./useIdentitatDeLaBarra.js'), import('../PanellCrom.jsx')]);
  const BarraVella = barraAmb({ useBarra: vellaBarra.useIdentitatDeLaBarra, Crom: vellCrom.BotoCrom });

  let veuElProveidor;
  function Sonda() {
    const sessio = nova.useSessioOpcional();
    veuElProveidor = { id: sessio?.currentUser?.id ?? null, rol: sessio?.rol ?? null };
    return null;
  }
  const onNavega = vi.fn();
  await act(async () => {
    render(<nova.SessionProvider config={CONFIG}><Sonda /><BarraVella onNavega={onNavega} /></nova.SessionProvider>);
  });
  /* El proveïdor té la sessió i és superadmin; la barra vella no la veu. Per
     això la roda que falta baix la lleva l'absència de context, no el rol. */
  expect(veuElProveidor).toEqual({ id: 'U', rol: 'superadmin' });
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Crom del sistema' })).toBeNull();
});
