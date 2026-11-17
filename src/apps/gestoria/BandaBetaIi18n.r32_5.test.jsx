import { cleanup, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { BandaBetaMicroApp, TEXTOS_BANDA_BETA, textosBandaBeta } from '../../components/PedraSeca/index.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP, titolDe, validaManifestApp } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestGestoria from './manifest.js';
import manifestBar from '../bar/manifest.js';
import manifestNevera from '../nevera/manifest.js';
import manifestSalut from '../salut/manifest.js';
import manifestGenealogia from '../genealogia/manifest.js';
import manifestLector from '../lector/manifest.js';
import { TEXTOS_PONT_GESTORIA, textosPontGestoria } from './AppGestoria.jsx';
import { TEXTOS_FACTURACIO, textosFacturacio } from '../../sections/gestoria/facturar/nucli/textosFacturacio.js';
import { avisDeSessio, textError } from '../bar/estat/textos.js';
import { TEXTOS_UI_BAR, textosUiBar } from '../bar/i18nBar.js';
import { titolsBar } from '../bar/rutesBar.js';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('Onada R32.5 · Lot 01 (P0-112 / T3-UI-03) · Banda Beta Universal, No Verifactu i 5 Llengües', () => {
  test.each(LLENGUES_APP)('BandaBetaMicroApp pinta en %s el missatge seré de Fase Beta i No Verifactu', (lang) => {
    const { container } = render(<BandaBetaMicroApp idioma={lang} />);
    const banda = container.querySelector('aside.sdp-banda-beta[data-sdp-banda-beta]');
    expect(banda).not.toBeNull();
    expect(banda.getAttribute('aria-label')).toBe(TEXTOS_BANDA_BETA[lang].regio);
    expect(banda.textContent).toBe(TEXTOS_BANDA_BETA[lang].text);
    expect(banda.textContent).toContain('🧪');
    expect(banda.textContent).toMatch(/Verifactu/i);
  });

  /* Vitest no processa el CSS (un import ?inline hi torna ''): la prova és sobre les fonts. La porta de
     vocabulari (tractor-vocabulari.mjs) comprova a més que la clau i l'adoptant casen. */
  test('el CSS de la banda és un full diferit que adopta la peça, fora de l’arrencada (index.css)', () => {
    const llig = (rel) => readFileSync(path.join(process.cwd(), rel), 'utf8');
    expect(llig('src/css/diferit-banda-beta.css')).toMatch(/@layer components \{[\s\S]*\.sdp-banda-beta \{/);
    expect(llig('src/css/components.css')).not.toMatch(/\.sdp-banda-beta\b/);
    expect(llig('src/css/modules.css')).not.toMatch(/\.sdp-banda-beta\b/);
    const peca = llig('src/components/PedraSeca/molecules/BandaBetaMicroApp.jsx');
    expect(peca).toContain("import cssBandaBeta from '../../../css/diferit-banda-beta.css?inline';");
    expect(peca).toContain("useFullDiferit(arrel, 'banda-beta', cssBandaBeta);");
  });

  test('textosBandaBeta normalitza codis compostos i fa fallback segur a valencià', () => {
    expect(textosBandaBeta('es-ES')).toBe(TEXTOS_BANDA_BETA.es);
    expect(textosBandaBeta('en-GB')).toBe(TEXTOS_BANDA_BETA.en);
    expect(textosBandaBeta('fr')).toBe(TEXTOS_BANDA_BETA.ca);
  });

  /* Integració v1.2.7 · Els títols en/eu/gl dels manifests (Gemini R32.5) no hi entren: els manifests
     viatgen a l'entrada del paquet de WordPress (registreApps.js) i hi sumaven 3,6 kB, per damunt del sostre
     d'arrencada. Cada títol es resol igualment en les 5 llengües (titolDe recau en el valencià); la
     Genealogia ja els portava abans d'esta onada. */
  test.each([
    ['gestoria', manifestGestoria],
    ['bar', manifestBar],
    ['nevera', manifestNevera],
    ['salut', manifestSalut],
    ['genealogia', manifestGenealogia],
    ['lector', manifestLector]
  ])('manifest de %s és vàlid i resol el títol, els grups i les entrades en les 5 llengües', (_id, cru) => {
    const { ok, errors, manifest } = validaManifestApp(cru);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    for (const lang of LLENGUES_APP) {
      expect(titolDe(manifest.titol, lang).trim(), `titol.${lang}`).not.toBe('');
      for (const grup of manifest.grups) expect(titolDe(grup.titol, lang).trim(), `grup ${grup.id}.${lang}`).not.toBe('');
      for (const entrada of manifest.entrades) expect(titolDe(entrada.titol, lang).trim(), `entrada ${entrada.slug}.${lang}`).not.toBe('');
    }
  });

  test.each(LLENGUES_APP)('RutaApps injecta BandaBetaMicroApp i propaga idioma=%s a AppGestoria i Facturació sense reclams Veri*Factu', async (lang) => {
    const registre = creaRegistre({ internes: [manifestGestoria] });
    const { container } = muntaPlataforma('/app/gestoria/aprendre', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });
    const tx = TEXTOS_PONT_GESTORIA[lang];
    expect(await screen.findByRole('heading', { level: 1, name: tx.aprendreTitol })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: tx.aprendreSubtitol })).toBeTruthy();
    const banda = container.querySelector('[data-sdp-banda-beta]');
    expect(banda).not.toBeNull();
    expect(banda.textContent).toBe(TEXTOS_BANDA_BETA[lang].text);
    expect(container.textContent).not.toMatch(/Veri\*Factu/);
  });

  test('els diccionaris de Gestoria i El Bar tenen traduccions genuïnes en les 5 llengües', () => {
    for (const lang of LLENGUES_APP) {
      expect(textosPontGestoria(lang)).toBe(TEXTOS_PONT_GESTORIA[lang]);
      expect(textosFacturacio(lang)).toBe(TEXTOS_FACTURACIO[lang]);
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
