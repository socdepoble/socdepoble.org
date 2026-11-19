/* Fase D (261020, tasca 1; ordre del Mestre) · /registre a l'app nativa: el
   full d'Apple (només a iOS) i de Google en lloc del Google web. El registre és
   el de veres amb la plataforma, els botons i el full controlables; el port
   (entraAmbTokenDeProveidor) i host.quanLlest són dobles. A la web, el DOM de
   sempre. Tot és sintètic. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), entra: vi.fn(), demana: vi.fn(), oblida: vi.fn(), abandona: vi.fn(), quanLlest: vi.fn(),
  plataforma: 'web', botons: [], capacitat: true, config: null, t: undefined, enterRemote: vi.fn(), pagina: null,
  /* R24 botigues (A3) · La capacitat opcional de recuperar la contrasenya (el port remot la té). */
  recupera: false
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
/* Fase D (261020, revisió) · L1 · La doble guarda les props de la capçalera. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => { m.pagina = props; return <main>{children}</main>; }
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({
    currentUser: null, registerWithPassword: vi.fn(), loginWithPassword: vi.fn(), loginWithGoogle: vi.fn(),
    teCapacitat: (nom) => (nom === 'entradaAmbToken' && m.capacitat) || (nom === 'recuperacioContrasenya' && m.recupera),
    entraAmbTokenDeProveidor: m.entra, demanaRecuperacioContrasenya: vi.fn(), definixContrasenyaNova: vi.fn()
  })
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config, t: m.t }) }));
vi.mock('../../config/dataMode.js', () => ({
  resolveDataMode: (config) => config.dataMode || 'remote',
  enterRemoteMode: m.enterRemote, enterTestMode: vi.fn(), eleccioRemotaActiva: () => false, exitRemoteMode: vi.fn()
}));
vi.mock('../../host.js', () => ({ quanLlest: (...args) => m.quanLlest(...args) }));
vi.mock('../../config/entradaNativa.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    plataformaNativa: () => m.plataforma,
    botonsNatius: () => m.botons,
    demanaCredencialNativa: (...args) => m.demana(...args),
    oblidaCredencialNativa: (...args) => m.oblida(...args),
    abandonaCredencialNativa: (...args) => m.abandona(...args)
  };
});
import OnboardingSection from './OnboardingSection.jsx';
import { createTranslator } from '../../config/i18n.js';
import { CODI_ENTRADA_NATIVA } from '../../config/entradaNativa.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';

const TENANT = '00000000-0000-4000-8000-0000000000de';
/* Actualitzada a posta (261024 T1): la credencial porta el camp codiAutoritzacio (el codi d'Apple). */
const CREDENCIAL = Object.freeze({ testimoni: 'a.b.c', nonce: 'n'.repeat(64), testimoniAcces: null, nom: 'Maria', codiAutoritzacio: 'c0d1.0.apple-sintetic' });
const promesaOberta = () => {
  let resol;
  let rebutja;
  const promesa = new Promise((r, j) => { resol = r; rebutja = j; });
  return { promesa, resol, rebutja };
};
const errorNatiu = (code) => Object.assign(new Error(code), { code });
const apple = () => screen.queryByRole('button', { name: 'Continua amb Apple' });
const google = () => screen.queryByRole('button', { name: 'Continua amb Google' });
const estat = () => document.querySelector('.onboarding-entrada-nativa ~ [role="status"]');
const INTRO_WEB = 'Entra amb el correu i la contrasenya del teu compte. Si el vas crear amb Google, no té contrasenya: entra amb Google.';
const enNatiu = (plataforma, botons) => { m.plataforma = plataforma; m.botons = botons; };
/* El port llest (quanPortLlest) i el que en penja ja pintat. */
const pinta = async () => {
  const resultat = render(<OnboardingSection />);
  await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
  return resultat;
};

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.entra, m.demana, m.oblida, m.abandona, m.quanLlest, m.enterRemote]) f.mockReset();
  m.pagina = null;
  m.quanLlest.mockResolvedValue(undefined);
  m.demana.mockResolvedValue(CREDENCIAL);
  m.entra.mockResolvedValue({ user: { id: 'U' } });
  m.capacitat = true;
  m.recupera = false;
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.t = createTranslator('ca');
  enNatiu('web', []);
});
afterEach(() => { cleanup(); });

describe('a la web, res no canvia', () => {
  test('el Google web, el divisor de sempre i cap botó natiu', async () => {
    await pinta();
    expect(screen.getByRole('button', { name: 'Entrar amb Google' })).toBeTruthy();
    expect(screen.getByText('O amb el teu correu')).toBeTruthy();
    expect(apple()).toBeNull();
    expect(google()).toBeNull();
    expect(document.querySelector('.onboarding-entrada-nativa')).toBeNull();
    expect(m.quanLlest).toHaveBeenCalledTimes(0);
  });

  /* Fase D (261020, revisió) + R32.8 (P0-125c) · Jerarquia unificada: damunt del botó de Google només el logotip i títol (sense entradeta ni etiquetes que l'empenyen avall en 360px), i l'entradeta va al peu de benvinguda. */
  test('la capçalera unificada (logotip sense paràgrafs llargs a sobre) i l’explicació d’Entrar que nomena Google', async () => {
    window.history.replaceState(null, '', '/registre?mode=entrar');
    try {
      await pinta();
      expect(m.pagina).toEqual({
        title: 'Benvinguda al Mas Electrònic',
        showLogos: true,
        chrome: 'system',
        className: 'sdp-universal-page-container--onboarding',
        // Gauntlet 261030 (cicle 2, decisió 7) · L'alta mostra el correu de la persona: Traduir no hi envia res.
        traduccio: false
      });
      expect(screen.getByText(INTRO_WEB).className).toBe('onboarding-card__intro');
      expect(screen.getByText("Entra per a participar. A l'interior podràs configurar la teua identitat i gestionar grups o empreses.")).toBeTruthy();
      expect(screen.queryByText(/entra amb el botó de dalt/)).toBeNull();
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });
});

/* Fase D (261020, revisió) · L1 (HIG, «visible sense desplaçar») i L2. */
describe('la capçalera i l’explicació d’Entrar a l’app nativa', () => {
  afterEach(() => { window.history.replaceState(null, '', '/'); });

  test('a iOS: amb el logotip però sense etiquetes ni entradeta, i la targeta nativa abans del formulari de correu', async () => {
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    expect(m.pagina).toEqual({
      title: 'Benvinguda al Mas Electrònic',
      showLogos: true,
      chrome: 'system',
      className: 'sdp-universal-page-container--onboarding',
      traduccio: false
    });
    const targeta = apple().closest('section');
    const correu = screen.getByLabelText('Correu electrònic');
    expect(targeta.compareDocumentPosition(correu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(targeta.contains(correu)).toBe(false);
  });

  test('a iOS, «Entra al teu compte» nomena Apple i Google i el botó de dalt; a Android, només Google', async () => {
    window.history.replaceState(null, '', '/registre?mode=entrar');
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    expect(screen.getByText('Entra amb el correu i la contrasenya del teu compte. Si el vas crear amb Apple o amb Google, no té contrasenya: entra amb el botó de dalt.').className)
      .toBe('onboarding-card__intro');
    expect(screen.queryByText(INTRO_WEB)).toBeNull();
    cleanup();
    enNatiu('android', ['google']);
    await pinta();
    expect(screen.getByText('Entra amb el correu i la contrasenya del teu compte. Si el vas crear amb Google, no té contrasenya: entra amb el botó de dalt.').className)
      .toBe('onboarding-card__intro');
    expect(screen.queryByText(INTRO_WEB)).toBeNull();
  });

  test('a Android sense cap proveïdor: ni targeta nativa, ni Google web, ni cap divisor; només el correu', async () => {
    enNatiu('android', []);
    await pinta();
    expect(m.pagina).toEqual({
      title: 'Benvinguda al Mas Electrònic',
      showLogos: true,
      chrome: 'system',
      className: 'sdp-universal-page-container--onboarding',
      traduccio: false
    });
    expect(document.querySelector('.onboarding-entrada-nativa')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Entrar amb Google' })).toBeNull();
    expect(screen.queryByText('O amb el teu correu')).toBeNull();
    expect(screen.queryByText('O amb el teu correu electrònic')).toBeNull();
    expect(screen.getByLabelText('Correu electrònic')).toBeTruthy();
  });
});

describe('a iOS', () => {
  test('Apple i després Google, sense el Google web, amb el divisor del Mestre i l’avís de dades', async () => {
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    const botons = [...document.querySelectorAll('.onboarding-entrada-nativa button')].map((b) => b.textContent);
    expect(botons).toEqual(['Continua amb Apple', 'Continua amb Google']);
    expect(screen.queryByRole('button', { name: 'Entrar amb Google' })).toBeNull();
    expect(screen.getByText('O amb el teu correu electrònic')).toBeTruthy();
    expect(screen.queryByText('O amb el teu correu')).toBeNull();
    expect(screen.getByText('En continuar, acceptes les condicions d’ús i la política de privacitat de Sóc de Poble.')).toBeTruthy();
    expect(apple().disabled || google().disabled).toBe(false);
  });

  test('cap style en línia, logotips decoratius, la targeta abans de la benvinguda i la regió viva ja muntada', async () => {
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    const targeta = apple().closest('section');
    expect(targeta.querySelectorAll('[style]')).toHaveLength(0);
    for (const logotip of targeta.querySelectorAll('svg.sdp-boto__logotip')) expect(logotip.getAttribute('aria-hidden')).toBe('true');
    expect(targeta.querySelectorAll('svg.sdp-boto__logotip')).toHaveLength(2);
    const benvinguda = document.querySelector('.onboarding-benvinguda');
    expect(targeta.compareDocumentPosition(benvinguda) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(estat()).not.toBeNull();
    expect(estat().textContent).toBe('');
    expect(apple().className).toBe('sdp-boto sdp-boto--ple sdp-boto--marca sdp-boto--apple');
  });

  test('només Apple quan el registre només en dona un', async () => {
    enNatiu('ios', ['apple']);
    await pinta();
    expect(apple()).not.toBeNull();
    expect(google()).toBeNull();
  });

  test('sense t del context, el valencià de reserva', async () => {
    m.t = undefined;
    enNatiu('ios', ['apple']);
    await pinta();
    expect(apple()).not.toBeNull();
  });
});

describe('a Android', () => {
  test('només Google', async () => {
    enNatiu('android', ['google']);
    await pinta();
    expect(google()).not.toBeNull();
    expect(apple()).toBeNull();
  });
});

describe('la capacitat i el mode', () => {
  test('abans que el port estiga llest, els botons ja hi són però desactivats; llest i sense la capacitat, fora', async () => {
    const llest = promesaOberta();
    m.quanLlest.mockReturnValue(llest.promesa);
    m.capacitat = false;
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    expect(apple().disabled).toBe(true);
    expect(google().disabled).toBe(true);
    await act(async () => { llest.resol(); for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    expect(apple()).toBeNull();
    expect(screen.queryByText('O amb el teu correu electrònic')).toBeNull();
  });

  test('fora del mode remot (seed), els botons es queden desactivats', async () => {
    m.config = { dataMode: 'seed', tenantId: TENANT };
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    expect(apple().disabled).toBe(true);
    expect(google().disabled).toBe(true);
  });
});

describe('el toc', () => {
  test('mentre el full espera: aria-busy, tots dos desactivats i el text d’espera; després, el port, el toast i l’oblit', async () => {
    const full = promesaOberta();
    m.demana.mockReturnValue(full.promesa);
    const avis = vi.spyOn(window, 'dispatchEvent');
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    await act(async () => { fireEvent.click(apple()); });
    expect(apple().getAttribute('aria-busy')).toBe('true');
    expect(google().getAttribute('aria-busy')).toBeNull();
    expect(apple().disabled && google().disabled).toBe(true);
    expect(estat().textContent).toBe('Esperant la confirmació del telèfon…');
    await act(async () => { full.resol(CREDENCIAL); });
    expect(m.entra).toHaveBeenCalledWith('apple', { ...CREDENCIAL }, m.config);
    expect(m.toast).toHaveBeenCalledWith('Sessió iniciada.', 'success');
    expect(m.oblida).toHaveBeenCalledWith('apple');
    expect(avis.mock.calls.some(([e]) => e.type === 'sdp:auth-change')).toBe(true);
    avis.mockRestore();
  });

  test('si la persona tanca el full: cap avís, els botons tornen i el focus torna a Apple', async () => {
    m.demana.mockRejectedValue(errorNatiu(CODI_ENTRADA_NATIVA.CANCELADA));
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    await act(async () => { fireEvent.click(apple()); });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.querySelector('.sp-card-body .sdp-alerta')).toBeNull();
    expect(apple().disabled).toBe(false);
    expect(document.activeElement).toBe(apple());
    expect(m.entra).not.toHaveBeenCalled();
  });

  test('«Cancel·la l’entrada» allibera els botons i una credencial tardana ja no arriba al port', async () => {
    const full = promesaOberta();
    m.demana.mockReturnValue(full.promesa);
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    await act(async () => { fireEvent.click(google()); });
    const cancela = screen.getByRole('button', { name: 'Cancel·la l’entrada' });
    await act(async () => { fireEvent.click(cancela); });
    expect(screen.queryByRole('button', { name: 'Cancel·la l’entrada' })).toBeNull();
    expect(google().disabled).toBe(false);
    expect(document.activeElement).toBe(google());
    // Fase D (261020, revisió) · El registre també ho sap.
    expect(m.abandona).toHaveBeenCalledTimes(1);
    await act(async () => { full.resol(CREDENCIAL); });
    expect(m.entra).not.toHaveBeenCalled();
    expect(m.oblida).toHaveBeenCalledWith('google');
    expect(m.toast).not.toHaveBeenCalled();
  });

  test('la fase 1 rep el viu() de l’intent: fals en cancel·lar', async () => {
    const full = promesaOberta();
    m.demana.mockReturnValue(full.promesa);
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    await act(async () => { fireEvent.click(apple()); });
    const [[proveidor, { viu }]] = m.demana.mock.calls;
    expect(proveidor).toBe('apple');
    expect(viu()).toBe(true);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Cancel·la l’entrada' })); });
    expect(viu()).toBe(false);
  });
});

describe('els errors', () => {
  test('una fallada del telèfon pinta l’Alerta d’error en valencià', async () => {
    m.demana.mockRejectedValue(errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA));
    enNatiu('ios', ['apple']);
    await pinta();
    await act(async () => { fireEvent.click(apple()); });
    const alerta = screen.getByRole('alert');
    expect(alerta.classList.contains('sdp-alerta--error')).toBe(true);
    expect(alerta.textContent).toContain('No s’ha pogut completar l’entrada des del telèfon.');
    expect(document.activeElement).toBe(apple());
  });

  /* Fase D (261020, revisió) · botigues_a11y F3 · L'avís es diu per la regió viva
     ja muntada (VoiceOver no anuncia un node que naix amb el text); l'Alerta
     visible va sense rol, per no llegir-lo dues vegades. */
  test('un testimoni rebutjat pel servidor és un avís (no és culpa de la persona), dit per la regió viva ja muntada', async () => {
    m.entra.mockRejectedValue(errorNatiu(CODI_ENTRADA.TOKEN_REBUTJAT));
    enNatiu('ios', ['apple']);
    await pinta();
    const regio = estat();
    await act(async () => { fireEvent.click(apple()); });
    const alerta = document.querySelector('.sp-card-body .sdp-alerta');
    expect(alerta.classList.contains('sdp-alerta--avis')).toBe(true);
    expect(alerta.getAttribute('role')).toBeNull();
    expect(alerta.textContent).toContain('El servidor de Sóc de Poble no ha acceptat la identificació del teu compte.');
    expect(estat()).toBe(regio);
    expect(regio.textContent).toContain('El servidor de Sóc de Poble no ha acceptat la identificació del teu compte.');
    expect(document.querySelectorAll('.sp-card-body [role="status"]')).toHaveLength(1);
    expect(m.oblida).toHaveBeenCalledWith('apple');
  });

  test('el text propi de l’adaptador es conserva tal qual', async () => {
    m.entra.mockRejectedValue(new Error('No s’ha pogut desar la sessió. Comprova l’emmagatzematge del navegador.'));
    enNatiu('android', ['google']);
    await pinta();
    await act(async () => { fireEvent.click(google()); });
    expect(within(screen.getByRole('alert')).getByText('No s’ha pogut desar la sessió. Comprova l’emmagatzematge del navegador.')).toBeTruthy();
  });

  /* Fase D (261020, revisió) · correcció F2 i proves F1 · Ja no és un botó mort. */
  test('una altra entrada oberta al telèfon (EN_CURS) es diu: avís visible i regió viva, i el focus torna al botó', async () => {
    m.demana.mockRejectedValue(errorNatiu(CODI_ENTRADA_NATIVA.EN_CURS));
    enNatiu('ios', ['apple', 'google']);
    await pinta();
    await act(async () => { fireEvent.click(apple()); });
    const alerta = document.querySelector('.sp-card-body .sdp-alerta');
    expect(alerta.classList.contains('sdp-alerta--avis')).toBe(true);
    expect(alerta.textContent).toContain('Ja hi ha una entrada oberta al telèfon: acaba-la o tanca-la.');
    expect(estat().textContent).toBe('Ja hi ha una entrada oberta al telèfon: acaba-la o tanca-la.');
    expect(document.activeElement).toBe(apple());
    expect(apple().disabled).toBe(false);
  });

  test('una fallada (to error) continua amb role="alert" i la regió viva no la repetix', async () => {
    m.demana.mockRejectedValue(errorNatiu(CODI_ENTRADA_NATIVA.NO_DISPONIBLE));
    enNatiu('ios', ['apple']);
    await pinta();
    await act(async () => { fireEvent.click(apple()); });
    expect(screen.getByRole('alert').textContent).toContain('Esta manera d’entrar no està disponible en este dispositiu.');
    expect(estat().textContent).toBe('');
  });

  test('desmuntar amb el full obert no deixa cap avís de React', async () => {
    const full = promesaOberta();
    m.demana.mockReturnValue(full.promesa);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      enNatiu('ios', ['apple']);
      const { unmount } = await pinta();
      await act(async () => { fireEvent.click(apple()); });
      unmount();
      await act(async () => { full.resol(CREDENCIAL); });
      expect(errors).not.toHaveBeenCalled();
      expect(m.entra).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});

/* R24 botigues · A3 (RC-1, incident 261106) · Un compte creat amb Google al web no té contrasenya. Al
   build 1.0.0+2 (sense cap client de Google) l'app no oferia cap botó i l'error natiu només deia
   «entra amb el correu»: la persona no tenia cap camí. Ara, amb la recuperació del port, l'error del
   telèfon i l'explicació d'«Entra al teu compte» sense botons nomenen «Has oblidat la contrasenya?». */
describe('A3 · el camí de rescat dels comptes només de Google o d’Apple', () => {
  const RESCAT = 'Has oblidat la contrasenya?';
  afterEach(() => { window.history.replaceState(null, '', '/'); });

  test('una fallada del telèfon (FALLIDA) apunta a «Has oblidat la contrasenya?» quan el port pot recuperar-la', async () => {
    m.recupera = true;
    m.demana.mockRejectedValue(errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA));
    enNatiu('android', ['google']);
    await pinta();
    await act(async () => { fireEvent.click(google()); });
    const alerta = screen.getByRole('alert');
    expect(alerta.textContent).toContain('No s’ha pogut completar l’entrada des del telèfon.');
    expect(alerta.textContent).toContain(`«${RESCAT}»`);
    expect(alerta.textContent).toMatch(/Si vas crear el compte amb Google o amb Apple al web/);
  });

  test('sense la recuperació al port, el text de sempre: cap promesa d’un botó que no hi és', async () => {
    m.demana.mockRejectedValue(errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA));
    enNatiu('android', ['google']);
    await pinta();
    await act(async () => { fireEvent.click(google()); });
    const text = screen.getByRole('alert').textContent;
    expect(text).toContain('No s’ha pogut completar l’entrada des del telèfon. Torna-ho a provar o entra amb el correu.');
    expect(text).not.toContain(RESCAT);
  });

  test('B1 · CONFIGURACIO (Google no reconeix la instal·lació) té text propi, honest, i el mateix camí de rescat', async () => {
    m.recupera = true;
    m.demana.mockRejectedValue(errorNatiu(CODI_ENTRADA_NATIVA.CONFIGURACIO));
    enNatiu('android', ['google']);
    await pinta();
    await act(async () => { fireEvent.click(google()); });
    const alerta = screen.getByRole('alert');
    expect(alerta.classList.contains('sdp-alerta--error')).toBe(true);
    expect(alerta.textContent).toContain('Google no reconeix esta instal·lació de l’app: el problema és de la configuració de Sóc de Poble, no del teu compte.');
    expect(alerta.textContent).toContain(`«${RESCAT}»`);
    expect(document.activeElement).toBe(google());
  });

  test('a l’app sense cap botó social, «Entra al teu compte» explica com posar-li contrasenya, i el botó hi és', async () => {
    m.recupera = true;
    window.history.replaceState(null, '', '/registre?mode=entrar');
    enNatiu('android', []);
    await pinta();
    const intro = screen.getByText('Entra amb el correu i la contrasenya del teu compte. Si el vas crear amb Google o amb Apple al web, encara no té contrasenya: toca «Has oblidat la contrasenya?» per a posar-li’n una.');
    expect(intro.className).toBe('onboarding-card__intro');
    expect(screen.queryByText(INTRO_WEB)).toBeNull();
    expect(screen.getByRole('button', { name: RESCAT })).toBeTruthy();
    cleanup();
    /* iOS sense Apple encés (cap botó, App Store 4.8): el mateix camí. */
    enNatiu('ios', []);
    await pinta();
    expect(screen.getByText(/encara no té contrasenya: toca «Has oblidat la contrasenya\?» per a posar-li’n una\./).className).toBe('onboarding-card__intro');
  });
});
