// @vitest-environment node
/* Onada R29 · Contractes de font de les barreres de ruta i de càrrega.
   · R29-RUT-01 · Els fitxers que pinten una vista de ruta carreguen els seus
     trossos amb lazyRoute (LazyRouteError, «Recarrega l’aplicació» i la
     recuperació de l'entrada web), mai amb el lazy nu de React, que dona un
     reintent fals. Les excepcions porten el motiu.
   · R29-RUT-02 · La barrera de L'Avisador rep la config de l'amfitrió i la
     connexió (a socdepoble.org, el botó de recàrrega).
   · R29-RUT-03 · La barrera de la ruta es reinicia també amb la consulta.
   · R29-RUT-04 · Els trossos accessoris (tauler de /legal, cròniques de
     /versions, aparadors, guia, barra de veu) van dins de
     BarreraDelTrosAccessori: si no arriben, la pàgina es queda.
   Les proves de comportament són a RouteErrorBoundary.test.jsx,
   lazyRoute.test.jsx, ItemDetailSection.trosFallat.test.jsx i
   PageDetailSection.accessoriFallat.r29.test.jsx; ací es fixa el cablejat
   d'App.jsx, que no es pot muntar sencer per a cada cas. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
/* El lazy nu: una crida a lazy( que no és lazyRoute( ni lazyRouteRenovable(, ni un mètode. */
const LAZY_NU = /(?<![\w.])lazy\s*\(/;
const LAZY_IMPORTAT = /^import[^;]*\blazy\b[^;]*from 'react'/m;

const FITXERS_DE_RUTA = [
  'src/sections/detail/ItemDetailSection.jsx',
  'src/sections/detail/PageDetailSection.jsx',
  'src/sections/search/SearchSection.jsx',
  'src/sections/text/TextSection.jsx',
  'src/sections/control/ControlSection.jsx',
  'src/sections/notes/NotesSection.jsx',
  'src/sections/profile/DetallPrivacitat.jsx',
  'src/components/universal/PageFrame.jsx',
];

/* Excepcions justificades: el lazy nu queda dins d'una barrera local que ja el conté.
   Onada R32 · T1 · PerfilShell.jsx passa a lazyRouteRenovable + BarreraDelTrosAccessori (zero excepcions). */
const EXCEPCIONS = {};

describe('R29-RUT-01 · trossos de ruta amb lazyRoute', () => {
  test.each(FITXERS_DE_RUTA)('%s no usa el lazy nu de React', (fitxer) => {
    const font = llig(fitxer);
    expect(font).not.toMatch(LAZY_NU);
    expect(font).not.toMatch(LAZY_IMPORTAT);
    expect(font).toMatch(/\blazyRoute\(\(\) => import\(/);
  });

  test('cada excepció existix encara i porta el motiu', () => {
    for (const [fitxer, motiu] of Object.entries(EXCEPCIONS)) {
      expect(existsSync(path.join(ARREL, fitxer)), fitxer).toBe(true);
      expect(motiu.length).toBeGreaterThan(40);
      expect(FITXERS_DE_RUTA).not.toContain(fitxer);
    }
  });

  test('R32 · PerfilShell carrega els panells diferits amb lazyRouteRenovable i BarreraDelTrosAccessori, mai lazy nu', () => {
    const font = llig('src/sections/profile/PerfilShell.jsx');
    expect(font).not.toMatch(LAZY_NU);
    expect(font).not.toMatch(LAZY_IMPORTAT);
    expect(font).toMatch(/\blazyRouteRenovable\(\(\) => import\(/);
    expect(font).toContain('<BarreraDelTrosAccessori');
  });
});

describe('App.jsx · barreres', () => {
  const app = llig('src/app/App.jsx');
  const funcio = (nom) => {
    const inici = app.indexOf(`function ${nom}(`);
    expect(inici, nom).toBeGreaterThan(-1);
    const fi = app.indexOf('\nfunction ', inici + 1);
    return app.slice(inici, fi === -1 ? undefined : fi);
  };

  test('R29-RUT-02 · la barrera de L’Avisador rep la config, la connexió i una etiqueta fixa', () => {
    const avisador = funcio('AvisadorAjornat');
    expect(avisador).toContain('const enLinia = useEnLinia();');
    expect(avisador).toContain('<RouteErrorBoundary key={avisadorClau} resetKey="avisador" externalConfig={config} enLinia={enLinia}>');
    expect(avisador).not.toMatch(/<RouteErrorBoundary>/);
  });

  test('R29-RUT-03 · la barrera de la ruta es reinicia amb la ruta i amb la consulta', () => {
    expect(funcio('AppDataLoader'))
      .toContain('<RouteErrorBoundary resetKey={`${location.pathname}?${location.search}`} externalConfig={externalConfig} enLinia={enLinia}>');
  });

  test('R29-RUT-04 · el tauler de /legal i les cròniques de /versions van dins de la seua barrera', () => {
    const text = funcio('TextRouteContingut');
    expect(text).toContain('<BarreraDelTrosAccessori><Suspense fallback={null}><TaulerTelemetria /></Suspense></BarreraDelTrosAccessori>');
    expect(text).toContain('<BarreraDelTrosAccessori><Suspense fallback={null}><CroniquesFites261104 /></Suspense></BarreraDelTrosAccessori>');
  });
});

describe('R29-RUT-04 · accessoris dins de BarreraDelTrosAccessori', () => {
  test.each([
    ['src/sections/detail/PageDetailSection.jsx', ['<GuiaCanalsActualitzacio />', '<AparadorFediversity/>', '<IaiaWhatsappCard />', '<PanellTraspasPublicacioInline']],
    ['src/sections/text/TextSection.jsx', ['<CreditsComunitatS23 language={language}/>', '<AparadorFediversity language={language}/>', '<ConsolaIncrustada/>']],
    ['src/sections/profile/DetallPrivacitat.jsx', ['<BlocPersonesConfianca />', '<PortabilitatFederada ', '<ProvaXifratXat ']],
    ['src/components/universal/PageFrame.jsx', ['<BarraReproductorVeuLazy']],
  ])('%s', (fitxer, accessoris) => {
    const font = llig(fitxer);
    for (const accessori of accessoris) {
      const lloc = font.indexOf(accessori);
      expect(lloc, accessori).toBeGreaterThan(-1);
      /* La barrera s'obri abans de l'accessori i no s'ha tancat entremig. */
      const obertura = font.lastIndexOf('<BarreraDelTrosAccessori', lloc);
      expect(obertura, accessori).toBeGreaterThan(-1);
      expect(font.slice(obertura, lloc), accessori).not.toContain('</BarreraDelTrosAccessori>');
    }
  });

  test('la barra de veu tanca el reproductor si el seu tros no arriba', () => {
    expect(llig('src/components/universal/PageFrame.jsx')).toContain('<BarreraDelTrosAccessori onFalla={tancaReproductorVeu}>');
  });
});
