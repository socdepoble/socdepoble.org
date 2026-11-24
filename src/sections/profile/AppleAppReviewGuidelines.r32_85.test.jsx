/**
 * AppleAppReviewGuidelines.r32_85.test.jsx — Onada v1.2.24 · R32.85b (IDEA-346)
 *
 * Blindatge automatitzat dels 5 pilars d'Apple App Review Guidelines per a la
 * publicació directa a l'App Store pública (iPhone + iPad, ZERO TestFlight):
 *   1. Zero mencions visibles ni botons de TestFlight o APK extern a la UI pública
 *      i acompliment estricte de la Regla 2.3.10 dins de l'app nativa iOS.
 *   2. Guideline 4.8 (Sign in with Apple): en iOS natiu sense `appleActiu: true`
 *      no s'exposa cap botó d'entrada social de tercers; amb `appleActiu: true`
 *      «Continua amb Apple» apareix sempre en primer lloc i amb la mateixa jerarquia.
 *   3. Guideline 5.1.1(i): rutes públiques obertes a la navegació anònima sense
 *      mur d'inici de sessió obligatori.
 *   4. Guideline 5.1.1(v): opció d'eliminar compte («Donar-se de baixa») accessible
 *      dins de «Privacitat i dades» en les 5 llengües (ca, es, en, eu, gl), amb
 *      explicació explícita de la revocació del permís d'Apple i confirmació real.
 *   5. Guideline 1.2 (UGC): eines de denúncia i bloqueig traduïdes en les 5 llengües
 *      amb compromís de revisió humana en menys de 24 hores.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  caps: new Set(['compte', 'consentiment']),
  navigate: vi.fn(),
  estatBaixa: vi.fn(),
  demanaBaixa: vi.fn(),
  cancelaBaixa: vi.fn(),
  estatConsentiment: vi.fn(),
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navigate,
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      {lead ? <p>{lead}</p> : null}
      {children}
    </main>
  ),
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  exportaLesMeuesDades: vi.fn(),
  estatBaixa: m.estatBaixa,
  demanaBaixa: m.demanaBaixa,
  cancelaBaixa: m.cancelaBaixa,
  estatConsentiment: m.estatConsentiment,
  registraConsentiment: vi.fn(),
  revocaConsentiment: vi.fn(),
}));

import '../../../tests/helpers/diccionaris.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { createTranslator } from '../../config/i18n.js';
import { CANALS_DE_BOTIGA, canalsOberts, urlDeCanal } from '../../config/canalsDeBotiga.js';
import { SECTIONS } from '../../config/sections.js';
import { esPaginaVisible } from '../../config/systemPages.js';
import { proveidorsDe, creaEntradaSocial } from '../../natiu/entradaSocial.js';
import { EntradaNativa } from '../onboarding/EntradaNativa.jsx';
import QuadreEstatCanalsVersions from '../text/QuadreEstatCanalsVersions.jsx';
import { DetallPrivacitat, TEXTOS_PRIVACITAT } from './DetallPrivacitat.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { TEXTOS_MODERACIO, TEXTOS_MOTIUS } from '../../components/PedraSeca/organismes/textosModeracio.js';

const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });
const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
const CLIENTS_GOOGLE = Object.freeze({
  googleWeb: '123456-websintetic.apps.googleusercontent.com',
  googleIos: '123456-iossintetic.apps.googleusercontent.com',
});

beforeAll(async () => {
  await Promise.all([
    import('../control/GinySalutDispositiuJarvis.jsx'),
    import('../../data/salutEmmagatzematgeDispositiu.js'),
    import('./BlocModeRuralPerfil.jsx'),
    import('./PortabilitatFederada.jsx'),
    import('./ProvaXifratXat.jsx'),
  ]);
});

beforeEach(() => {
  m.caps = new Set(['compte', 'consentiment']);
  m.navigate.mockReset();
  m.estatBaixa.mockReset().mockResolvedValue({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
  m.demanaBaixa.mockReset().mockResolvedValue({ ok: true });
  m.cancelaBaixa.mockReset().mockResolvedValue({ demanada: false });
  m.estatConsentiment.mockReset().mockResolvedValue({
    versioVigent: '2.5',
    url: '/legal',
    textSha256: null,
    calReconsentir: false,
    consentiments: [],
  });
});

afterEach(cleanup);

describe('IDEA-346 · Apple App Store Pública (iPhone + iPad, ZERO TestFlight) i App Review Guidelines', () => {
  test('Zero TestFlight i Zero APK extern: CANALS_DE_BOTIGA i QuadreEstatCanalsVersions exposen App Store pública i oculten TestFlight/APK i plataformes alienes en iOS (2.3.10)', () => {
    const oberts = canalsOberts(CANALS_DE_BOTIGA);
    expect(oberts.map((c) => c.id)).toEqual(['app-store', 'wordpress-org']);
    expect(oberts.find((c) => c.id === 'app-store')?.url).toBe('https://apps.apple.com/es/app/soc-de-poble/id6826441844');
    expect(urlDeCanal({ id: 'apk-directe', url: 'https://socdepoble.org/descarregues/socdepoble.apk' })).toBeNull();
    expect(CANALS_DE_BOTIGA.find((c) => c.id === 'testflight')?.url).toBeNull();

    for (const lang of LLENGUES) {
      // Vista web: mostra App Store i WordPress, zero TestFlight i zero APK
      const webRender = render(
        <QuadreEstatCanalsVersions llengua={lang} plataforma="web" nativa={false} origen="http://127.0.0.1:4178" />
      );
      expect(webRender.container.textContent).not.toMatch(/testflight|\.apk\b/i);
      cleanup();

      // Vista nativa iOS/iPadOS: Regla 2.3.10 d'Apple — cap menció a Android, Google Play, TestFlight ni APK
      const iosRender = render(
        <QuadreEstatCanalsVersions llengua={lang} plataforma="ios" nativa={true} origen="http://127.0.0.1:4178" fetchImpl={async () => null} />
      );
      expect(iosRender.container.textContent).not.toMatch(/testflight|google play|android|\.apk\b/i);
      cleanup();
    }
  });

  test('Guideline 5.1.1(i) · Navegació anònima lliure: les seccions i pàgines públiques principals no exigixen compte, i /descarregues queda exclosa de l’app nativa', () => {
    for (const id of ['mur', 'mercat', 'pobles', 'xat', 'versions']) {
      const sec = SECTIONS.find((s) => s.id === id);
      expect(sec, id).toBeTruthy();
      expect(Boolean(sec?.requiresAuth), `${id} no ha de bloquejar visitants anònims`).toBe(false);
    }
    for (const key of ['projecte', 'versions', 'reconeixements']) {
      expect(esPaginaVisible(key, { nativa: true }), `${key} visible en iOS/iPadOS`).toBe(true);
    }
    expect(esPaginaVisible('descarregues', { nativa: true })).toBe(false);
  });

  test('Guideline 4.8 · Paritat d’entrada social en iOS: sense Apple actiu no hi ha Google; amb Apple actiu, «Continua amb Apple» va sempre primer en les 5 llengües', () => {
    // 1. Fail-closed: sense appleActiu === true, cap proveïdor social de tercers a iOS
    expect(proveidorsDe('ios', CLIENTS_GOOGLE, { appleActiu: false })).toEqual([]);
    expect(creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS_GOOGLE, appleActiu: false }).proveidors).toEqual([]);

    // 2. Amb appleActiu === true, Apple va SEMPRE davant de Google i comparteix les classes de mida completa (48px)
    const proveidorsIos = proveidorsDe('ios', CLIENTS_GOOGLE, { appleActiu: true });
    expect(proveidorsIos).toEqual(['apple', 'google']);

    for (const lang of LLENGUES) {
      const t = createTranslator(lang);
      const { container } = render(
        <EntradaNativa proveidors={proveidorsIos} t={t} onEntra={vi.fn()} />
      );
      const botons = [...container.querySelectorAll('.onboarding-entrada-nativa button')];
      expect(botons).toHaveLength(2);
      expect(botons[0].className).toContain('sdp-boto--apple');
      expect(botons[0].className).toContain('sdp-boto--ple');
      expect(botons[0].textContent).toBe(DICCIONARIS[lang]['section.login.nativa.apple']);
      expect(botons[1].className).toContain('sdp-boto--google');
      expect(botons[1].className).toContain('sdp-boto--ple');
      expect(botons[1].textContent).toBe(DICCIONARIS[lang]['section.login.nativa.google']);
      cleanup();
    }
  });

  test.each(LLENGUES)(
    'Guideline 5.1.1(v) & 1.2 · Eliminació de compte amb avís de revocació Apple + controls de moderació UGC operatius en «%s»',
    async (lang) => {
      const dict = DICCIONARIS[lang];
      // Verify UGC moderation dictionary completeness and <24h commitment in every language
      for (const parell of Object.values(TEXTOS_MODERACIO)) {
        const clau = parell[0];
        expect(typeof dict[clau], `${lang} · ${clau}`).toBe('string');
        expect(dict[clau].trim().length, `${lang} · ${clau}`).toBeGreaterThan(0);
      }
      for (const motiu of Object.values(TEXTOS_MOTIUS)) {
        expect(typeof dict[motiu.etiqueta[0]], `${lang} · ${motiu.etiqueta[0]}`).toBe('string');
        expect(typeof dict[motiu.ajuda[0]], `${lang} · ${motiu.ajuda[0]}`).toBe('string');
      }
      expect(dict[TEXTOS_MODERACIO.termini[0]]).toMatch(/24/);

      // Verify Privacy & Account Deletion translations in every language
      const clauBotoBaixa = TEXTOS_PRIVACITAT.baixa.boto[0];
      const clauConfirmaBaixa = TEXTOS_PRIVACITAT.baixa.confirma[0];
      const clauPuntApple = TEXTOS_PRIVACITAT.baixa.puntApple[0];
      expect(dict[clauBotoBaixa], `${lang} · boto baixa`).toBeTruthy();
      expect(dict[clauConfirmaBaixa], `${lang} · confirma baixa`).toBeTruthy();
      expect(dict[clauPuntApple], `${lang} · puntApple`).toContain('account.apple.com');

      // Functional execution of Account Deletion + UGC Unblock inside DetallPrivacitat
      const onSessioTancada = vi.fn();
      const desbloqueja = vi.fn().mockResolvedValue(undefined);
      const valorModeracio = {
        disponible: true,
        potBloquejar: true,
        estatBloquejos: 'llest',
        codiErrorBloquejos: null,
        bloquejats: [{ tipus: 'persona', id: 'pepa', nom: 'Pepa', creatAl: null }],
        desbloqueja,
      };
      const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { id: 'jo', full_name: 'Pep', email: 'pep@poble.test' } };

      render(
        <ModeracioContext.Provider value={valorModeracio}>
          <DetallPrivacitat
            identitat={jo}
            config={{ tenantId: '00000000-0000-4000-8000-000000000000' }}
            onPerfilCanviat={vi.fn()}
            onSessioTancada={onSessioTancada}
          />
        </ModeracioContext.Provider>
      );

      // UGC block list operational
      const botoDesbloqueja = await screen.findByRole('button', { name: 'Desbloqueja Pepa' });
      await act(async () => {
        fireEvent.click(botoDesbloqueja);
      });
      expect(desbloqueja).toHaveBeenCalledWith({ tipus: 'persona', id: 'pepa', nom: 'Pepa' });

      // Account deletion button -> confirmation dialog with Apple token revocation info -> confirm deletion
      const botoBaixa = await screen.findByRole('button', { name: 'Donar-me de baixa' });
      await act(async () => {
        fireEvent.click(botoBaixa);
      });
      const dialeg = screen.getByRole('dialog');
      expect(dialeg.textContent).toContain('account.apple.com');

      const botoConfirma = within(dialeg).getByRole('button', { name: 'Sí, donar-me de baixa' });
      await act(async () => {
        fireEvent.click(botoConfirma);
      });
      expect(m.demanaBaixa).toHaveBeenCalledTimes(1);
      expect(onSessioTancada).toHaveBeenCalledTimes(1);
      cleanup();
    }
  );
});
