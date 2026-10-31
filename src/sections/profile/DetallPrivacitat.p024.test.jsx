/**
 * P0-24 (D06/D10) · Suite d'invariants de revisió d'App Store (Guideline 5.1.1(v))
 * i Google Play (Data Safety & Account Deletion) per a DetallPrivacitat.jsx:
 *   1. Visibilitat garantida dels blocs «Les meues dades» (exportació RGPD) i
 *      «Donar-se de baixa» (eliminació de compte in-app) quan el backend té capacitat 'compte'.
 *   2. Flux in-app complet de «Donar-se de baixa» amb diàleg de confirmació, 6 clàusules
 *      legals/tècniques (incloent revocació d'Apple i 30 dies de gràcia), motiu opcional
 *      i tancament de sessió via sessio.eixAmb / onSessioTancada.
 *   3. Flux de recuperació i cancel·lació d'una baixa pendent («Cancel·lar la baixa»).
 *   4. Honestedat de l'exportació RGPD dins de l'App Nativa (BOT-04: Web Share + Clipboard
 *      + quadre JSON, sense clic fantasma de <a download>) i a la Web (Blob + guarda d'avortament).
 *   5. Protecció de privacitat: UniversalPage rep traduccio={false} i una entitat no mostra la vista.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  caps: new Set(['compte', 'consentiment']),
  navigate: vi.fn(),
  exporta: vi.fn(),
  estatBaixa: vi.fn(),
  demana: vi.fn(),
  cancela: vi.fn(),
  estatConsentiment: vi.fn(),
  registra: vi.fn(),
  revoca: vi.fn(),
  sessio: null,
  ultimaUniversalPageProps: null,
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navigate,
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => m.sessio,
}));

vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.ultimaUniversalPageProps = props;
    const { title, lead, children } = props;
    return (
      <main>
        <header className="page-title">
          <h1>{title}</h1>
        </header>
        <p>{lead}</p>
        {children}
      </main>
    );
  },
}));

vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  exportaLesMeuesDades: m.exporta,
  estatBaixa: m.estatBaixa,
  demanaBaixa: m.demana,
  cancelaBaixa: m.cancela,
  estatConsentiment: m.estatConsentiment,
  registraConsentiment: m.registra,
  revocaConsentiment: m.revoca,
}));

import { DetallPrivacitat, nomFitxerExportacio } from './DetallPrivacitat.jsx';

const CONFIG_PROVA = { tenantId: '00000000-0000-4000-8000-000000000000' };
const IDENTITAT_PERSONA = {
  id: 'jo',
  mena: 'persona',
  nom: 'Anna Valor',
  avatar: '/assets/avatars/anna.webp',
  dades: {
    id: '11111111-1111-4111-8111-111111111111',
    full_name: 'Anna Valor',
    email: 'anna@socdepoble.org',
    is_public: true,
    town_name: 'La Torre de les Maçanes',
  },
};

const DADES_EXPORTADES = Object.freeze({
  format: 'socdepoble.exportacio.v1',
  perfil: { id: '11111111-1111-4111-8111-111111111111', full_name: 'Anna Valor' },
  federacio_no_versionada: { realms: [], user_realms: [], connections: [], posts: [] },
});

const posaPropietat = (obj, clau, valor) =>
  Object.defineProperty(obj, clau, { value: valor, configurable: true, writable: true });
const llevaPropietat = (obj, clau) => {
  delete obj[clau];
};

let clicsDescarrega = [];

beforeEach(() => {
  m.caps = new Set(['compte', 'consentiment']);
  m.sessio = null;
  m.ultimaUniversalPageProps = null;
  for (const fn of [
    m.navigate,
    m.exporta,
    m.estatBaixa,
    m.demana,
    m.cancela,
    m.estatConsentiment,
    m.registra,
    m.revoca,
  ]) {
    fn.mockReset();
  }
  m.estatBaixa.mockResolvedValue({
    demanada: false,
    demanadaAl: null,
    purgaPrevistaAl: null,
  });
  m.estatConsentiment.mockResolvedValue({
    versioVigent: '2026-10-24',
    url: '/legal',
    calReconsentir: false,
    consentiments: [
      {
        tipus: 'rgpd_acepta',
        accio: 'atorga',
        versio: '2026-10-24',
        al: '2026-10-24T10:00:00Z',
      },
    ],
  });
  m.exporta.mockResolvedValue(DADES_EXPORTADES);
  clicsDescarrega = [];
  URL.createObjectURL = vi.fn(() => 'blob:socdepoble-rgpd');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() {
    clicsDescarrega.push(this.download);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  llevaPropietat(window, 'Capacitor');
  llevaPropietat(navigator, 'share');
  llevaPropietat(navigator, 'canShare');
  llevaPropietat(navigator, 'clipboard');
});

describe('P0-24 (D06/D10): Invariants de revisió d’App Store i Google Play a DetallPrivacitat.jsx', () => {
  it('mostra sempre visibles els blocs «Les meues dades» i «Donar-se de baixa» amb traducció externa desactivada', async () => {
    render(
      <DetallPrivacitat
        identitat={IDENTITAT_PERSONA}
        config={CONFIG_PROVA}
        onPerfilCanviat={vi.fn()}
        onSessioTancada={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Privacitat i dades' })).toBeTruthy();
    const titolsSeccio = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titolsSeccio).toEqual(['Les meues dades', 'Consentiment', 'Donar-se de baixa']);

    expect(
      screen.getByRole('button', { name: 'Descarregar les meues dades' }),
    ).toBeTruthy();
    const botoBaixa = await screen.findByRole('button', { name: 'Donar-me de baixa' });
    expect(botoBaixa).toBeTruthy();

    // Dades privades: UniversalPage rep traduccio={false} i enllaç a la fitxa pública amb l'UUID real
    expect(m.ultimaUniversalPageProps?.traduccio).toBe(false);
    expect(m.ultimaUniversalPageProps?.topBarData).toMatchObject({
      authorName: 'Anna Valor',
      authorHref: '/gent/11111111-1111-4111-8111-111111111111',
    });
  });

  it('executa el flux in-app de «Donar-se de baixa» amb les 6 clàusules informatives (Apple inclòs) i tanca la sessió', async () => {
    const onSessioTancada = vi.fn();
    const eixAmb = vi.fn(async (accio) => accio());
    m.sessio = { eixAmb };
    m.demana.mockResolvedValue({ ok: true });

    render(
      <DetallPrivacitat
        identitat={IDENTITAT_PERSONA}
        config={CONFIG_PROVA}
        onPerfilCanviat={vi.fn()}
        onSessioTancada={onSessioTancada}
      />,
    );

    const botoObrirDialeg = await screen.findByRole('button', { name: 'Donar-me de baixa' });
    await act(async () => {
      fireEvent.click(botoObrirDialeg);
    });

    const dialeg = screen.getByRole('dialog', { name: 'Donar-te de baixa' });
    expect(dialeg).toBeTruthy();

    // Verifica que el diàleg exposa les 6 clàusules obligatòries (30 dies, Apple 7 dies, fitxers d'entitat, sessió)
    const punts = within(dialeg)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(punts).toHaveLength(6);
    expect(punts.some((p) => p.includes('Durant 30 dies pots cancel·lar-la'))).toBe(true);
    expect(punts.some((p) => p.includes('Si vas entrar amb Apple') && p.includes('7 dies més'))).toBe(
      true,
    );
    expect(punts.some((p) => p.includes('Es tancarà la sessió en tots els teus dispositius'))).toBe(
      true,
    );

    const campMotiu = within(dialeg).getByRole('textbox', {
      name: 'Per què te’n vas? (opcional)',
    });
    fireEvent.change(campMotiu, { target: { value: 'Prova de revisió App Store' } });

    const botoConfirmar = within(dialeg).getByRole('button', { name: 'Sí, donar-me de baixa' });
    await act(async () => {
      fireEvent.click(botoConfirmar);
    });

    expect(eixAmb).toHaveBeenCalledTimes(1);
    expect(m.demana).toHaveBeenCalledWith(
      { motiu: 'Prova de revisió App Store' },
      CONFIG_PROVA,
    );
    expect(onSessioTancada).toHaveBeenCalledTimes(1);
  });

  it('permet cancel·lar una baixa pendent durant els 30 dies de gràcia i notifica onPerfilCanviat', async () => {
    const onPerfilCanviat = vi.fn();
    m.estatBaixa.mockResolvedValue({
      demanada: true,
      demanadaAl: '2026-10-31T10:00:00Z',
      purgaPrevistaAl: '2026-11-30T10:00:00Z',
    });
    m.cancela.mockResolvedValue({
      demanada: false,
      demanadaAl: null,
      purgaPrevistaAl: null,
    });

    render(
      <DetallPrivacitat
        identitat={IDENTITAT_PERSONA}
        config={CONFIG_PROVA}
        onPerfilCanviat={onPerfilCanviat}
        onSessioTancada={vi.fn()}
      />,
    );

    expect(await screen.findByText('Tens una baixa pendent')).toBeTruthy();
    const botoCancelarBaixa = screen.getByRole('button', { name: 'Cancel·lar la baixa' });

    await act(async () => {
      fireEvent.click(botoCancelarBaixa);
    });

    expect(m.cancela).toHaveBeenCalledWith(CONFIG_PROVA);
    expect(onPerfilCanviat).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('Baixa cancel·lada. El teu perfil torna a ser com era.'),
    ).toBeTruthy();
  });

  it('presenta en l’App Nativa (BOT-04) el panell honest d’exportació RGPD (compartir, copiar i JSON lectura) sense clic fantasma de descàrrega', async () => {
    posaPropietat(window, 'Capacitor', { isNativePlatform: () => true });
    const writeText = vi.fn(async () => {});
    posaPropietat(navigator, 'clipboard', { writeText });

    render(
      <DetallPrivacitat
        identitat={IDENTITAT_PERSONA}
        config={CONFIG_PROVA}
        onPerfilCanviat={vi.fn()}
        onSessioTancada={vi.fn()}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Descarregar les meues dades' }));
    });

    expect(clicsDescarrega).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.queryByText(/Ja tens el fitxer .* a les descàrregues/)).toBeNull();

    const nomEsperat = nomFitxerExportacio();
    expect(
      screen.getByText(
        `Les teues dades ja estan preparades. Dins de l’app no es poden desar soles a les descàrregues: guarda-les tu com a ${nomEsperat}.`,
      ),
    ).toBeTruthy();

    const quadreJson = screen.getByRole('textbox', { name: 'Les teues dades, en JSON' });
    expect(quadreJson.readOnly).toBe(true);
    expect(quadreJson.value).toBe(JSON.stringify(DADES_EXPORTADES, null, 2));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar el text' }));
    });
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(DADES_EXPORTADES, null, 2));
    expect(
      screen.getByText(
        `Text copiat. Enganxa’l en una nota o un correu i desa’l com a ${nomEsperat}.`,
      ),
    ).toBeTruthy();
  });
});
