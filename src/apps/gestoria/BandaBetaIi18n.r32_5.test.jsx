import { cleanup, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import {
  BandaBetaMicroApp,
  TEXTOS_BANDA_BETA,
  TEXTOS_BANDA_BETA_FISCAL,
  TEXTOS_BANDA_BETA_GENERAL,
  textosBandaBeta,
} from '../../components/PedraSeca/index.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP, titolDe, validaManifestApp } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestGestoria from './manifest.js';
import manifestBar from '../bar/manifest.js';
import manifestNevera from '../nevera/manifest.js';
import manifestSalut from '../salut/manifest.js';
import manifestGenealogia from '../genealogia/manifest.js';
import manifestLector from '../lector/manifest.js';
import { TEXTOS_PONT_GESTORIA, TEXTOS_BUIT_GESTORIA, textosBuitGestoria, textosPontGestoria } from './AppGestoria.jsx';
import { TEXTOS_FACTURACIO, textosFacturacio } from '../../sections/gestoria/facturar/nucli/textosFacturacio.js';
import { avisDeSessio, textError } from '../bar/estat/textos.js';
import { TEXTOS_UI_BAR, textosUiBar } from '../bar/i18nBar.js';
import { titolsBar } from '../bar/rutesBar.js';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('Onada R32.5 / R32.10 · Lot 01 (D-v127-BANDA + T3-UI-03) · Banda Beta Contextual per Manifest, Zero Verifactu Espuri i 5 Llengües', () => {
  test.each(LLENGUES_APP)('BandaBetaMicroApp en mode general (%s) pinta avís net sense esmentar Verifactu ni AEAT', (lang) => {
    const { container } = render(<BandaBetaMicroApp idioma={lang} />);
    const banda = container.querySelector('aside.sdp-banda-beta[data-sdp-banda-beta="general"]');
    expect(banda).not.toBeNull();
    expect(banda.getAttribute('aria-label')).toBe(TEXTOS_BANDA_BETA_GENERAL[lang].regio);
    expect(banda.textContent).toBe(TEXTOS_BANDA_BETA_GENERAL[lang].text);
    expect(banda.textContent).toContain('🧪');
    expect(banda.textContent).not.toMatch(/Verifactu|AEAT|factur|invoic/i);
  });

  test.each(LLENGUES_APP)('BandaBetaMicroApp en mode fiscal (%s) pinta la clàusula No Verifactu / AEAT', (lang) => {
    const { container } = render(<BandaBetaMicroApp idioma={lang} avisBeta="fiscal" />);
    const banda = container.querySelector('aside.sdp-banda-beta[data-sdp-banda-beta="fiscal"]');
    expect(banda).not.toBeNull();
    expect(banda.getAttribute('aria-label')).toBe(TEXTOS_BANDA_BETA_FISCAL[lang].regio);
    expect(banda.textContent).toBe(TEXTOS_BANDA_BETA_FISCAL[lang].text);
    expect(banda.textContent).toContain('🧪');
    expect(banda.textContent).toMatch(/Verifactu/i);
    expect(banda.textContent).toMatch(/AEAT/);
  });

  test('el CSS de la banda és un full diferit que adopta la peça, i zero if per slug al component (Llei 7)', () => {
    const llig = (rel) => readFileSync(path.join(process.cwd(), rel), 'utf8');
    expect(llig('src/css/diferit-banda-beta.css')).toMatch(/@layer components \{[\s\S]*\.sdp-banda-beta \{/);
    expect(llig('src/css/components.css')).not.toMatch(/\.sdp-banda-beta\b/);
    expect(llig('src/css/modules.css')).not.toMatch(/\.sdp-banda-beta\b/);
    const peca = llig('src/components/PedraSeca/molecules/BandaBetaMicroApp.jsx');
    expect(peca).toContain("import cssBandaBeta from '../../../css/diferit-banda-beta.css?inline';");
    expect(peca).toContain("useFullDiferit(arrel, 'banda-beta', cssBandaBeta);");
    expect(peca).not.toMatch(/['"`](?:gestoria|bar|nevera|salut|lector|genealogia)['"`]/);
  });

  test('textosBandaBeta normalitza codis compostos, variants declaratives i fallback segur a valencià', () => {
    expect(textosBandaBeta('es-ES')).toBe(TEXTOS_BANDA_BETA.es);
    expect(textosBandaBeta('en-GB', 'general')).toBe(TEXTOS_BANDA_BETA_GENERAL.en);
    expect(textosBandaBeta('en-GB', 'fiscal')).toBe(TEXTOS_BANDA_BETA_FISCAL.en);
    expect(textosBandaBeta('fr', 'fiscal')).toBe(TEXTOS_BANDA_BETA_FISCAL.ca);
    expect(textosBandaBeta('fr')).toBe(TEXTOS_BANDA_BETA_GENERAL.ca);
  });

  test.each([
    ['gestoria', manifestGestoria, 'fiscal'],
    ['bar', manifestBar, 'fiscal'],
    ['nevera', manifestNevera, 'general'],
    ['salut', manifestSalut, 'general'],
    ['genealogia', manifestGenealogia, 'general'],
    ['lector', manifestLector, 'general']
  ])('manifest de %s declara avisBeta=%s i té traduccions genuïnes en les 5 llengües (ca, es, en, eu, gl)', (_id, cru, esperatAvis) => {
    const { ok, errors, manifest } = validaManifestApp(cru);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest.avisBeta).toBe(esperatAvis);
    for (const lang of LLENGUES_APP) {
      expect(typeof manifest.titol[lang], `titol.${lang}`).toBe('string');
      expect(titolDe(manifest.titol, lang).trim(), `titol.${lang}`).not.toBe('');
      for (const grup of manifest.grups) {
        expect(typeof grup.titol[lang], `grup ${grup.id}.${lang}`).toBe('string');
        expect(titolDe(grup.titol, lang).trim(), `grup ${grup.id}.${lang}`).not.toBe('');
      }
      for (const entrada of manifest.entrades) {
        expect(typeof entrada.titol[lang], `entrada ${entrada.slug}.${lang}`).toBe('string');
        expect(titolDe(entrada.titol, lang).trim(), `entrada ${entrada.slug}.${lang}`).not.toBe('');
      }
      for (const inter of manifest.interruptors) {
        expect(typeof inter.titol[lang], `interruptor ${inter.id}.${lang}`).toBe('string');
        expect(titolDe(inter.titol, lang).trim(), `interruptor ${inter.id}.${lang}`).not.toBe('');
      }
    }
  });

  test.each(LLENGUES_APP)('RutaApps resol declarativament avisBeta=fiscal per a Gestoria en idioma=%s sense reclams Veri*Factu', async (lang) => {
    const registre = creaRegistre({ internes: [manifestGestoria] });
    const { container } = muntaPlataforma('/app/gestoria/aprendre', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });
    const tx = TEXTOS_PONT_GESTORIA[lang];
    expect(await screen.findByRole('heading', { level: 1, name: tx.aprendreTitol })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: tx.aprendreSubtitol })).toBeTruthy();
    const banda = container.querySelector('[data-sdp-banda-beta="fiscal"]');
    expect(banda).not.toBeNull();
    expect(banda.textContent).toBe(TEXTOS_BANDA_BETA_FISCAL[lang].text);
    expect(container.textContent).not.toMatch(/Veri\*Factu/);
  });

  test.each(LLENGUES_APP)('RutaApps resol declarativament avisBeta=general per a micro-apps no fiscals en idioma=%s sense esmentar Verifactu', async (lang) => {
    const registre = creaRegistre({
      internes: [{
        ...manifestNevera,
        carrega: () => Promise.resolve({ default: () => <p>Vista de rebost</p> })
      }]
    });
    const { container } = muntaPlataforma('/app/nevera/rebost', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });
    expect(await within(container).findByText('Vista de rebost')).toBeTruthy();
    const banda = container.querySelector('[data-sdp-banda-beta="general"]');
    expect(banda).not.toBeNull();
    expect(banda.textContent).toBe(TEXTOS_BANDA_BETA_GENERAL[lang].text);
    expect(banda.textContent).not.toMatch(/Verifactu|AEAT/i);
  });

  test('els diccionaris i estats buits de Gestoria i El Bar tenen traduccions genuïnes en les 5 llengües', () => {
    for (const lang of LLENGUES_APP) {
      expect(textosPontGestoria(lang)).toBe(TEXTOS_PONT_GESTORIA[lang]);
      expect(textosFacturacio(lang)).toBe(TEXTOS_FACTURACIO[lang]);
      expect(textosBuitGestoria(lang)).toBe(TEXTOS_BUIT_GESTORIA[lang]);
      expect(TEXTOS_FACTURACIO[lang].llibreBuitFiltres.trim()).not.toBe('');
      expect(TEXTOS_FACTURACIO[lang].llibreBuitInicial.trim()).not.toBe('');
      expect(textosUiBar(lang)).toBe(TEXTOS_UI_BAR[lang]);
      expect(TEXTOS_PONT_GESTORIA[lang].facturacioSubtitol).not.toMatch(/Veri\*Factu/);
      expect(TEXTOS_FACTURACIO[lang].detallsResum).not.toMatch(/Veri\*Factu/);
      expect(textError({ codi: 'SENSE_TORN' }, lang)).toBeTruthy();
      const avis = avisDeSessio({ motiu: 'sense-sessio', enLinia: true }, lang);
      expect(avis).toEqual({ to: 'avis', text: TEXTOS_UI_BAR[lang].sessioSenseSessio, entra: true });
      const titols = titolsBar(lang);
      expect(titols).toEqual({ esquerra: TEXTOS_UI_BAR[lang].colEsquerra, mig: TEXTOS_UI_BAR[lang].colMig });
    }
    expect(TEXTOS_PONT_GESTORIA.en.facturacioTitol).toBe('Invoicing');
    expect(TEXTOS_PONT_GESTORIA.eu.facturacioTitol).toBe('Fakturazioa');
    expect(TEXTOS_FACTURACIO.en.llibreBuitInicial).toContain('not issued any invoices');
    expect(TEXTOS_FACTURACIO.eu.llibreBuitInicial).toContain('fakturarik jaulki');
    expect(TEXTOS_UI_BAR.en.cobra).toBe('Charge');
    expect(TEXTOS_UI_BAR.eu.cobra).toBe('Kobratu');
    expect(TEXTOS_UI_BAR.gl.tornTancatTitol).toBe('A quenda está pechada');
  });

  test('una micro-app que NO és en proves al registre de plugins no pinta BandaBetaMicroApp', async () => {
    const registre = creaRegistre({
      internes: [{
        schema: 'sdp.app.v1',
        id: 'estable',
        titol: { ca: 'Eina Estable' },
        icona: 'LayoutGrid',
        entrades: [{ slug: 'inici', titol: { ca: 'Inici' }, icona: 'LayoutGrid' }],
        entradaPerDefecte: 'inici',
        permisos: { veure: 'public' },
        capacitats: [],
        nivell: 'gratuit',
        actiuPerDefecte: true,
        entorn: 'produccio',
        dadesPersonals: false,
        carrega: () => Promise.resolve({ default: () => <p>Contingut estable</p> })
      }]
    });
    const { container } = muntaPlataforma('/app/estable/inici', { registre });
    expect(await within(container).findByText('Contingut estable')).toBeTruthy();
    expect(container.querySelector('[data-sdp-banda-beta]')).toBeNull();
  });
});
