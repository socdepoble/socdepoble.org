import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
/* Els mateixos dobles del port i del xassís que DetallPrivacitat.test.jsx. */
const m = vi.hoisted(() => ({
  caps: new Set(), navigate: vi.fn(),
  exporta: vi.fn(), estatBaixa: vi.fn(), demana: vi.fn(), cancela: vi.fn(),
  estatConsentiment: vi.fn(), registra: vi.fn(), revoca: vi.fn(),
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>,
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  exportaLesMeuesDades: m.exporta, estatBaixa: m.estatBaixa, demanaBaixa: m.demana, cancelaBaixa: m.cancela,
  estatConsentiment: m.estatConsentiment, registraConsentiment: m.registra, revocaConsentiment: m.revoca,
}));
import { DetallPrivacitat, dataLlegible, rescataFocus } from './DetallPrivacitat.jsx';

/* ═══════════════════════════════════════════════════════════════════
   T5a · P1-15 (assalt 261101) · EL FOCUS NO CAU AL <body>

   Acceptar o retirar el consentiment i cancel·lar la baixa fan desaparéixer
   el botó que tenia el focus. Abans, el focus quedava al <body> (o en un
   botó d'un <dialog> ja tancat) i el lector de pantalla perdia el fil. Ara va
   a la línia que diu el resultat, i només si s'havia perdut. Si l'acció falla,
   el botó desactivat també el pot perdre: va a l'error (dins del diàleg obert,
   si n'hi ha). jsdom no fa el «focus fixup» del navegador: es simula.
   ═══════════════════════════════════════════════════════════════════ */

/* El «focus fixup» d'un navegador: el botó que es desactiva perd el focus i el
   document el torna al <body>. jsdom no ho fa, i el seu blur() no actua sobre
   un element desactivat: un camp de pas pren el focus i se'n va. */
const perdElFocus = () => {
  const pas = document.createElement('input');
  document.body.append(pas);
  pas.focus();
  pas.remove();
  expect(document.activeElement).toBe(document.body);
};

const config = { tenantId: '00000000-0000-4000-8000-000000000000' };
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { full_name: 'Pep', is_public: false, town_name: 'La Torre' } };
const ACCEPTAT = { versioVigent: 'v1', url: '/legal', textSha256: null, calReconsentir: false,
  consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v1', al: '2026-09-15T10:00:00Z' }] };
const RETIRAT = { ...ACCEPTAT, calReconsentir: true,
  consentiments: [{ tipus: 'rgpd_acepta', accio: 'revoca', versio: 'v1', al: '2026-09-26T10:00:00Z' }] };
const CAL_V2 = { versioVigent: 'v2', url: '/legal', textSha256: null, calReconsentir: true,
  consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v1', al: '2026-09-15T10:00:00Z' }] };
const ACCEPTAT_V2 = { ...CAL_V2, calReconsentir: false,
  consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v2', al: '2026-10-01T10:00:00Z' }] };
const deferred = () => { let resolve; const promise = new Promise((s) => { resolve = s; }); return { promise, resolve }; };
const seccio = (titol) => screen.getByRole('heading', { level: 2, name: titol }).closest('section');

beforeEach(() => {
  m.caps = new Set();
  for (const f of [m.navigate, m.exporta, m.estatBaixa, m.demana, m.cancela, m.estatConsentiment, m.registra, m.revoca]) f.mockReset();
  m.estatBaixa.mockResolvedValue({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
  m.estatConsentiment.mockResolvedValue(ACCEPTAT);
});
afterEach(() => { cleanup(); document.body.replaceChildren(); });

describe('BlocConsentiment', () => {
  test('retirar-lo: el focus va a «La vas retirar el …», no al <body> ni al diàleg tancat', async () => {
    m.caps = new Set(['consentiment']);
    m.revoca.mockResolvedValue(undefined);
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const retira = await within(seccio('Consentiment')).findByRole('button', { name: 'Retirar el consentiment' });
    retira.focus();
    fireEvent.click(retira);
    const dialeg = screen.getByRole('dialog', { name: 'Retirar el consentiment' });
    m.estatConsentiment.mockResolvedValue(RETIRAT);
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Retirar-lo' })); });
    expect(retira.isConnected).toBe(false);
    const linia = within(seccio('Consentiment')).getByText(`La vas retirar el ${dataLlegible('2026-09-26T10:00:00Z')}.`);
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(linia);
    expect(linia.tabIndex).toBe(-1);
  });

  test('retirar-lo amb la relectura tardana: el diàleg es tanca abans i, quan arriba l’estat nou, el focus va a la línia', async () => {
    m.caps = new Set(['consentiment']);
    m.revoca.mockResolvedValue(undefined);
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const retira = await within(seccio('Consentiment')).findByRole('button', { name: 'Retirar el consentiment' });
    retira.focus();
    fireEvent.click(retira);
    const relectura = deferred();
    m.estatConsentiment.mockReturnValue(relectura.promise);
    const dialeg = screen.getByRole('dialog', { name: 'Retirar el consentiment' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Retirar-lo' })); });
    /* Mentre es rellig, el diàleg ja és tancat i «Retirar el consentiment»
       és desactivat (treballant): el Dialeg no hi pot tornar el focus. */
    expect(dialeg.hasAttribute('open')).toBe(false);
    expect(retira.disabled).toBe(true);
    await act(async () => { relectura.resolve(RETIRAT); });
    expect(retira.isConnected).toBe(false);
    expect(document.activeElement.textContent).toBe(`La vas retirar el ${dataLlegible('2026-09-26T10:00:00Z')}.`);
  });

  test('acceptar la versió nova: el focus va a «L’has acceptada (versió v2) el …»', async () => {
    m.caps = new Set(['consentiment']);
    m.estatConsentiment.mockResolvedValue(CAL_V2);
    m.registra.mockResolvedValue(undefined);
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const accepta = await screen.findByRole('button', { name: 'Acceptar la versió v2' });
    accepta.focus();
    m.estatConsentiment.mockResolvedValue(ACCEPTAT_V2);
    await act(async () => { fireEvent.click(accepta); });
    expect(accepta.isConnected).toBe(false);
    expect(document.activeElement.textContent).toBe(`L’has acceptada (versió v2) el ${dataLlegible('2026-10-01T10:00:00Z')}.`);
  });

  test('si acceptar falla i el botó no ha perdut el focus, el focus no es mou i l’error té role=alert', async () => {
    m.caps = new Set(['consentiment']);
    m.estatConsentiment.mockResolvedValue(CAL_V2);
    m.registra.mockRejectedValue(new Error('Sense xarxa'));
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const accepta = await screen.findByRole('button', { name: 'Acceptar la versió v2' });
    accepta.focus();
    await act(async () => { fireEvent.click(accepta); });
    expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
    expect(accepta.isConnected).toBe(true);
    expect(document.activeElement).toBe(accepta);
  });

  test('si acceptar falla i el botó desactivat havia perdut el focus, va a l’error del bloc, no al del diàleg tancat ni a la línia', async () => {
    m.caps = new Set(['consentiment']);
    m.estatConsentiment.mockResolvedValue(CAL_V2);
    let falla;
    m.registra.mockReturnValue(new Promise((_, rebutja) => { falla = rebutja; }));
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const bloc = seccio('Consentiment');
    const accepta = await within(bloc).findByRole('button', { name: 'Acceptar la versió v2' });
    const linia = within(bloc).getByText(`L’has acceptada (versió v1) el ${dataLlegible('2026-09-15T10:00:00Z')}.`);
    accepta.focus();
    await act(async () => { fireEvent.click(accepta); });
    expect(accepta.disabled).toBe(true);
    perdElFocus();
    await act(async () => { falla(new Error('Sense xarxa')); });
    const alerta = screen.getByRole('alert');
    expect(alerta.textContent).toBe('Sense xarxa');
    expect(document.activeElement).not.toBe(linia);
    expect(document.activeElement.closest('dialog')).toBe(null);
    expect(alerta.contains(document.activeElement)).toBe(true);
    expect(document.activeElement.textContent).toBe('Sense xarxa');
    expect(document.activeElement.tabIndex).toBe(-1);
  });

  test('si retirar falla, el diàleg continua obert amb l’error i el focus no ix del diàleg', async () => {
    m.caps = new Set(['consentiment']);
    m.revoca.mockRejectedValue(new Error('Sense xarxa'));
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const retira = await within(seccio('Consentiment')).findByRole('button', { name: 'Retirar el consentiment' });
    retira.focus();
    fireEvent.click(retira);
    const dialeg = screen.getByRole('dialog', { name: 'Retirar el consentiment' });
    const confirma = within(dialeg).getByRole('button', { name: 'Retirar-lo' });
    confirma.focus();
    await act(async () => { fireEvent.click(confirma); });
    expect(within(dialeg).getByRole('alert').textContent).toBe('Sense xarxa');
    expect(dialeg.contains(document.activeElement)).toBe(true);
  });

  test('si retirar falla i el botó desactivat havia perdut el focus, va a l’error dins del diàleg, no darrere del modal', async () => {
    m.caps = new Set(['consentiment']);
    let falla;
    m.revoca.mockReturnValue(new Promise((_, rebutja) => { falla = rebutja; }));
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const bloc = seccio('Consentiment');
    const retira = await within(bloc).findByRole('button', { name: 'Retirar el consentiment' });
    const linia = within(bloc).getByText(`L’has acceptada (versió v1) el ${dataLlegible('2026-09-15T10:00:00Z')}.`);
    retira.focus();
    fireEvent.click(retira);
    const dialeg = screen.getByRole('dialog', { name: 'Retirar el consentiment' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Retirar-lo' })); });
    perdElFocus();
    await act(async () => { falla(new Error('Sense xarxa')); });
    expect(dialeg.hasAttribute('open')).toBe(true);
    const alerta = within(dialeg).getByRole('alert');
    expect(alerta.textContent).toBe('Sense xarxa');
    expect(document.activeElement).not.toBe(linia);
    expect(document.activeElement).not.toBe(document.body);
    expect(alerta.contains(document.activeElement)).toBe(true);
    expect(document.activeElement.textContent).toBe('Sense xarxa');
  });

  test('Escape al diàleg de retirada: es tanca i el focus torna a «Retirar el consentiment»', async () => {
    m.caps = new Set(['consentiment']);
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const retira = await within(seccio('Consentiment')).findByRole('button', { name: 'Retirar el consentiment' });
    retira.focus();
    fireEvent.click(retira);
    const dialeg = screen.getByRole('dialog', { name: 'Retirar el consentiment' });
    const cancel = new Event('cancel', { cancelable: true });
    await act(async () => { dialeg.dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialeg.hasAttribute('open')).toBe(false);
    expect(m.revoca).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(retira);
  });
});

describe('BlocBaixa', () => {
  test('cancel·lar la baixa: el focus va a l’avís «Baixa cancel·lada…», dins d’un role=status', async () => {
    m.caps = new Set(['compte']);
    m.estatBaixa.mockResolvedValue({ demanada: true, demanadaAl: '2026-09-20T10:00:00Z', purgaPrevistaAl: '2026-10-20T10:00:00Z' });
    m.cancela.mockResolvedValue({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const boto = await screen.findByRole('button', { name: 'Cancel·lar la baixa' });
    boto.focus();
    await act(async () => { fireEvent.click(boto); });
    expect(boto.isConnected).toBe(false);
    const avis = screen.getByText('Baixa cancel·lada. El teu perfil torna a ser com era.');
    expect(document.activeElement).toBe(avis);
    expect(avis.closest('[role="status"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Donar-me de baixa' })).toBeTruthy();
  });

  test('si cancel·lar falla i el botó no ha perdut el focus, el focus no es mou', async () => {
    m.caps = new Set(['compte']);
    m.estatBaixa.mockResolvedValue({ demanada: true, demanadaAl: '2026-09-20T10:00:00Z', purgaPrevistaAl: '2026-10-20T10:00:00Z' });
    m.cancela.mockRejectedValue(new Error('Sense xarxa'));
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const boto = await screen.findByRole('button', { name: 'Cancel·lar la baixa' });
    boto.focus();
    await act(async () => { fireEvent.click(boto); });
    expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
    expect(document.activeElement).toBe(boto);
  });

  test('si cancel·lar falla i el botó desactivat havia perdut el focus, va a l’error del bloc', async () => {
    m.caps = new Set(['compte']);
    m.estatBaixa.mockResolvedValue({ demanada: true, demanadaAl: '2026-09-20T10:00:00Z', purgaPrevistaAl: '2026-10-20T10:00:00Z' });
    let falla;
    m.cancela.mockReturnValue(new Promise((_, rebutja) => { falla = rebutja; }));
    render(<DetallPrivacitat identitat={jo} config={config} />);
    const boto = await screen.findByRole('button', { name: 'Cancel·lar la baixa' });
    boto.focus();
    await act(async () => { fireEvent.click(boto); });
    expect(boto.disabled).toBe(true);
    perdElFocus();
    await act(async () => { falla(new Error('Sense xarxa')); });
    const alerta = screen.getByRole('alert');
    expect(alerta.textContent).toBe('Sense xarxa');
    expect(alerta.contains(document.activeElement)).toBe(true);
    expect(document.activeElement.closest('dialog')).toBe(null);
    expect(document.activeElement.textContent).toBe('Sense xarxa');
    // La baixa continua pendent: el botó hi és, i la persona hi pot tornar.
    expect(boto.isConnected).toBe(true);
    expect(boto.disabled).toBe(false);
  });

  test('si demanar la baixa falla i el botó desactivat havia perdut el focus, va a l’error dins del diàleg', async () => {
    m.caps = new Set(['compte']);
    let falla;
    m.demana.mockReturnValue(new Promise((_, rebutja) => { falla = rebutja; }));
    render(<DetallPrivacitat identitat={jo} config={config} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Donar-me de baixa' }));
    const dialeg = screen.getByRole('dialog', { name: 'Donar-te de baixa' });
    const confirma = within(dialeg).getByRole('button', { name: 'Sí, donar-me de baixa' });
    confirma.focus();
    await act(async () => { fireEvent.click(confirma); });
    expect(confirma.disabled).toBe(true);
    perdElFocus();
    await act(async () => { falla(new Error('Sense xarxa')); });
    expect(dialeg.hasAttribute('open')).toBe(true);
    const alerta = within(dialeg).getByRole('alert');
    expect(alerta.textContent).toBe('Sense xarxa');
    expect(alerta.contains(document.activeElement)).toBe(true);
    expect(document.activeElement.textContent).toBe('Sense xarxa');
    expect(m.navigate).not.toHaveBeenCalled();
  });
});

describe('rescataFocus', () => {
  /* Nodes d'un fragment de prova fets amb DOMParser (cap escriptura d'HTML cru al DOM: porta innerHTML). */
  const nodesDe = (html) => [...new DOMParser().parseFromString(html, 'text/html').body.childNodes];
  const fes = (html) => {
    const arrel = document.createElement('div');
    arrel.append(...nodesDe(html));
    document.body.append(arrel);
    return arrel;
  };

  test('un focus viu no es mou', () => {
    const arrel = fes('<p tabindex="-1">Estat</p><input aria-label="Camp">');
    const camp = arrel.querySelector('input');
    camp.focus();
    expect(rescataFocus(arrel.querySelector('p'))).toBe(false);
    expect(document.activeElement).toBe(camp);
  });

  test('focus al <body> o en un <dialog> tancat: es rescata; un destí desconnectat, no', () => {
    const arrel = fes('<p tabindex="-1">Estat</p><dialog><button type="button">Tanca</button></dialog>');
    const linia = arrel.querySelector('p');
    expect(document.activeElement).toBe(document.body);
    expect(rescataFocus(linia)).toBe(true);
    expect(document.activeElement).toBe(linia);
    const boto = arrel.querySelector('dialog button');
    boto.focus();
    expect(document.activeElement).toBe(boto);
    expect(rescataFocus(linia)).toBe(true);
    expect(document.activeElement).toBe(linia);
    expect(rescataFocus(document.createElement('p'))).toBe(false);
    expect(rescataFocus(null)).toBe(false);
  });

  test('un destí dins d’un <dialog> tancat no es fa servir; dins d’un d’obert, sí', () => {
    const arrel = fes('<dialog><p tabindex="-1">Error</p></dialog>');
    const dialeg = arrel.querySelector('dialog');
    const error = arrel.querySelector('p');
    expect(document.activeElement).toBe(document.body);
    expect(rescataFocus(error)).toBe(false);
    expect(document.activeElement).toBe(document.body);
    dialeg.setAttribute('open', '');
    expect(rescataFocus(error)).toBe(true);
    expect(document.activeElement).toBe(error);
  });

  test('dins d’un shadow root (WordPress): rescata el focus perdut, però no el pren de la pàgina amfitriona', () => {
    const amfitrio = document.createElement('soc-de-poble');
    const input = document.createElement('input');
    document.body.append(amfitrio, input);
    const shadow = amfitrio.attachShadow({ mode: 'open' });
    shadow.append(...nodesDe('<p tabindex="-1">Estat</p><button type="button">Accepta</button>'));
    const linia = shadow.querySelector('p');
    const boto = shadow.querySelector('button');
    boto.focus();
    expect(shadow.activeElement).toBe(boto);
    expect(rescataFocus(linia)).toBe(false);
    boto.remove();
    expect(shadow.activeElement).toBe(null);
    expect(rescataFocus(linia)).toBe(true);
    expect(shadow.activeElement).toBe(linia);
    // La persona ja és a la pàgina amfitriona: el focus no se li pren.
    input.focus();
    expect(shadow.activeElement).toBe(null);
    expect(rescataFocus(linia)).toBe(false);
    expect(document.activeElement).toBe(input);
  });
});
