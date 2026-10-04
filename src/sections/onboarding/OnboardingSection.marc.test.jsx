// @vitest-environment-options {"url": "https://socdepoble.sollutia.com/app/registre?mode=entrar&code=VELL&sdp_oauth_attempt=AAAAAAAAAAAAAAAAAAAAAA#access_token=vell"}
/* B · Onada 4, quarta passada (261003) · Directriu de MarIA 261003_2221. En un
   marc d'un altre origen (política conservadora: també els subdominis del
   mateix lloc), /registre no oferix Google: pinta abans del clic un avís
   honest i una eixida fora del marc, en una pestanya nova, a l'entrada real
   de l'app. Mai navega la finestra de dalt i mai porta codis OAuth, marques ni
   tokens a l'enllaç. El marc del mateix origen, la finestra de dalt i el
   component directe de WordPress (cap marc) conserven el botó.
   El detector és el de veres (data/oauthRelay.js) sobre una finestra feta amb
   el model de la política del mateix origen: jsdom no deixa falsejar
   window.top. Navegadors reals, [NO VERIFICAT] ací. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), google: vi.fn(), finestra: null }));
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => m.navigate,
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: null, registerWithPassword: vi.fn(), loginWithPassword: vi.fn(), loginWithGoogle: m.google }),
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' } }) }));
/* Només la finestra que mira el detector: la de cada cas, o la de veres. */
vi.mock('../../data/oauthRelay.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, googleEnMarcAlie: () => real.esMarcDAltreOrigen(m.finestra ?? window) };
});
import OnboardingSection from './OnboardingSection.jsx';
import { AVIS_ENTRADA_EN_MARC, CODI_ENTRADA_EN_MARC } from '../../data/oauthRelay.js';

const ORIGEN_APP = 'https://socdepoble.sollutia.com';
/* L'entrada real de l'app: sense el codi vell, la marca ni el fragment amb el token. */
const ENTRADA_REAL = `${ORIGEN_APP}/app/registre?mode=entrar`;

/* El model de la política del mateix origen (el mateix que oauthRelay.marc.test.js). */
function finestraDeDalt(origen) {
  const finestra = { location: { href: `${origen}/pagina` } };
  finestra.self = finestra;
  finestra.top = finestra;
  return finestra;
}
function marcDins(origenDalt, origenMarc = ORIGEN_APP) {
  const dalt = {
    location: {
      get href() {
        if (origenDalt !== origenMarc) throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError');
        return `${origenDalt}/pagina`;
      }
    }
  };
  dalt.top = dalt;
  dalt.self = dalt;
  const finestra = { top: dalt, location: { href: `${origenMarc}/app/registre` } };
  finestra.self = finestra;
  return finestra;
}

const botoGoogle = () => screen.queryByRole('button', { name: 'Entrar amb Google' });
const enllacFora = () => screen.queryByRole('link', { name: 'Obri en una pestanya nova' });

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.google]) f.mockReset();
  m.finestra = null;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test.each([
  ['iframe d’un altre origen del mateix lloc (política conservadora)', () => marcDins('https://www.sollutia.com')],
  ['iframe d’un altre lloc', () => marcDins('https://gentdelatorre.net')]
])('B · %s: cap botó de Google, l’avís honest i l’eixida en una pestanya nova', async (_cas, fes) => {
  m.finestra = fes();
  const obri = vi.spyOn(window, 'open');
  render(<OnboardingSection />);
  expect(botoGoogle()).toBeNull();
  const enllac = enllacFora();
  expect(enllac).not.toBeNull();
  // L'eixida: l'entrada real de l'app, a una pestanya nova i sense opener ni referent.
  expect(enllac.getAttribute('href')).toBe(ENTRADA_REAL);
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(enllac.getAttribute('rel').split(' ').sort()).toEqual(['noopener', 'noreferrer']);
  expect(enllac.classList.contains('sdp-boto')).toBe(true);
  expect(enllac.tabIndex).toBe(0);
  // L'avís és l'espècimen <Alerta> informatiu: regió viva, sense estils en línia, la frase clau en negreta.
  const avis = enllac.closest('.sdp-alerta');
  expect(avis.classList.contains('sdp-alerta--info')).toBe(true);
  expect(avis.getAttribute('role')).toBe('status');
  expect(avis.querySelector('strong').textContent).toBe('Dins d’este marc no es pot entrar amb Google.');
  expect(avis.textContent).toContain('Obri Sóc de Poble en una pestanya nova per a entrar.');
  expect(avis.querySelectorAll('[style]')).toHaveLength(0);
  // Si el marc no deixa obrir finestres: l'adreça, per a copiar-la.
  expect(avis.querySelector('code').textContent).toBe(ENTRADA_REAL);
  // El clic no comença cap entrada, no obri cap finestra per codi i no navega res.
  await act(async () => { fireEvent.click(enllac); });
  expect(m.google).not.toHaveBeenCalled();
  expect(obri).not.toHaveBeenCalled();
  expect(window.location.href).toContain('/app/registre?mode=entrar');
  // El correu continua disponible.
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
});

test.each([
  ['la finestra de dalt de veres (jsdom)', () => null],
  ['primera part', () => finestraDeDalt(ORIGEN_APP)],
  ['WordPress amb el component directe (cap marc)', () => finestraDeDalt('https://gentdelatorre.net')],
  ['iframe del mateix origen', () => marcDins(ORIGEN_APP)]
])('B · %s: el botó de Google de sempre i cap avís de marc', async (_cas, fes) => {
  m.finestra = fes();
  m.google.mockResolvedValue({ access_token: 'synthetic', user: { id: 'U' } });
  render(<OnboardingSection />);
  expect(enllacFora()).toBeNull();
  expect(screen.queryByText('Dins d’este marc no es pot entrar amb Google.')).toBeNull();
  const boto = botoGoogle();
  expect(boto).not.toBeNull();
  await act(async () => { fireEvent.click(boto); });
  expect(m.google).toHaveBeenCalledTimes(1);
});

test('B · si l’adaptador rebutja amb ENTRADA_EN_MARC després del clic, el botó deixa pas al mateix avís', async () => {
  m.google.mockRejectedValue(Object.assign(new Error(AVIS_ENTRADA_EN_MARC), { code: CODI_ENTRADA_EN_MARC }));
  render(<OnboardingSection />);
  await act(async () => { fireEvent.click(botoGoogle()); });
  expect(botoGoogle()).toBeNull();
  expect(enllacFora().getAttribute('href')).toBe(ENTRADA_REAL);
  // L'avís ja ho diu: cap error roig repetit.
  expect(screen.queryByRole('alert')).toBeNull();
});
