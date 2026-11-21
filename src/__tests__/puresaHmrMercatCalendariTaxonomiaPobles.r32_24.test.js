// @vitest-environment node
/**
 * puresaHmrMercatCalendariTaxonomiaPobles.r32_24.test.js — Onada R32.24 · T2
 *
 * Tercera escombrada de puresa Vite Fast Refresh / HMR:
 * 1) Audita amb AST (@babel/parser) tots els .jsx sanejats en R32.19, R32.20,
 *    R32.22 i els 11 nous .jsx de R32.24 perquè exporten exclusivament
 *    components React (PascalCase o default), documentant només els dos ponts
 *    explícits de reexport (WikiDePobleSection: modulsLocalsActius,
 *    FacetaTaxonomia: FACETA_TAXONOMIA).
 * 2) Verifica que els 11 nous mòduls *Model.js de R32.24 són 100 % purs (zero JSX)
 *    i conserven tota la semàntica funcional extreta.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';

import {
  CLASSE_VARIANT,
  CLASSE_VARIANT_ESGOTADA,
  TEXT_ESGOTAT_PER_DEFECTE,
  classeVariantOpcio,
  idLlegendaVariacions,
  idOpcioVariacio,
} from '../sections/mercat/selectorDeVariacionsModel.js';
import {
  SECCIO_MERCAT,
  esProducteTraduibleMercat,
  modeTraduccioProducteMercat,
  resolImatgePropiaMercat,
} from '../sections/mercat/targetaDelMercatModel.js';
import {
  DENSITAT_CALENDARI,
  ETIQUETES_PERIODE,
  LOCALE_CALENDARI,
  ambDe,
  capitalitzaPeriode,
  textSenseDataCalendari,
  textosDeLaVista,
} from '../sections/calendari/calendariDelPobleModel.js';
import {
  formataDataCurtaIso,
  localeCalendariDe,
  mesDeLEntrada,
  resumDataEntrada,
  textNet,
} from '../sections/calendari/desplegableEsdevenimentsCalendariModel.js';
import { ERRORS_DE_FONT } from '../sections/calendari/fonts/contracteFonts.js';
import {
  CLASSE_CASELLA,
  classeCasellaFont,
  esErrorFontReintentable,
} from '../sections/calendari/fonts/panellFontsCalendariModel.js';
import {
  AMPLARIES_PREVIEW_BRAIN,
  ESTIL_BRAIN_TAXONOMIA,
  FONT_NOMS_BRAIN,
  SECCIONS_VIVES_BRAIN,
  netaTextBrain,
  nomRelacioBrain,
} from '../sections/taxonomia/brainTaxonomiaModel.js';
import {
  ALCARIA_INICIAL_PREVIEW,
  ATRIBUTS_OBSERVATS_PREVIEW,
  ATRIBUTS_PRESENTACIO_PREVIEW,
  classeFramePreview,
  etiquetaPreviewCard,
  titolIframePreviewCard,
} from '../sections/taxonomia/previsualitzacioCardTaxonomiaModel.js';
import {
  CAP_ELEMENT,
  CONTACTE_IAIA_LOCAL,
  MAXIM_MISSATGES_IAIA_LOCAL,
  MAXIM_SESSIONS_NOVES_IAIA,
  creaMissatgeBenvingudaIAIA,
  esFilLocalIAIA,
  textRespostaIAIALocal,
} from '../sections/xat/iaiaLocalProviderModel.js';
import {
  PESTANYA_PER_DEFECTE_PUBLICACIONS_POBLE,
  VARIETAT_PORTA_PUBLICACIONS_POBLE,
  clauResetPublicacionsPoble,
} from '../sections/pobles/publicacionsDelPobleModel.js';
import {
  RUTA_XARXA_POBLES,
  dadesCamiTerritorial,
  fillsDirectesDePoble,
  poblesArrelDeComarca,
  rutaFitxaPoble,
  titolVisiblePoble,
} from '../sections/pobles/territoriDelPobleModel.js';
import {
  ESTATS_DESABLES_VIQUIPEDIA,
  TERMINI_MS,
  construeixModelFontsTerritorials,
  enLinia,
  focusPerdut,
  subscriuConnexio,
  urlDeFont,
} from '../sections/pobles/panellDeViquipediaModel.js';

const ARREL = process.cwd();
const llig = (relPath) => readFileSync(path.join(ARREL, relPath), 'utf8');

function exportsDeclarats(relPath) {
  const ast = parse(llig(relPath), { sourceType: 'module', plugins: ['jsx'] });
  const noms = [];
  for (const node of ast.program.body) {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration?.id?.name) {
        noms.push({ nom: node.declaration.id.name, reexport: false });
      } else if (node.declaration?.declarations) {
        for (const decl of node.declaration.declarations) {
          if (decl.id?.name) noms.push({ nom: decl.id.name, reexport: false });
        }
      }
      for (const spec of node.specifiers || []) {
        const exp = spec.exported?.name || spec.exported?.value;
        if (exp) noms.push({ nom: exp, reexport: Boolean(node.source) });
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      noms.push({ nom: 'default', reexport: false });
    }
  }
  return noms;
}

const JSX_PURS_R32_19_20_22 = Object.freeze([
  // R32.19
  'src/sections/text/TaulerTelemetria.jsx',
  'src/sections/profile/GestioMembres.jsx',
  // R32.20
  'src/sections/pobles/DetallPoble.jsx',
  'src/sections/pobles/SubnavigacioPoblesIGent.jsx',
  'src/sections/pobles/EntitatsDelPoble.jsx',
  'src/sections/pobles/CreditsDeViquipedia.jsx',
  'src/sections/plugins/PluginPage.jsx',
  // R32.22
  'src/sections/admin/SegonFactor.jsx',
  'src/sections/admin/PanellTraspasPublicacioInline.jsx',
  'src/sections/admin/IndicadorsAdmin.jsx',
  'src/sections/xat/ComptadorGlobalXat.jsx',
  'src/sections/xat/components/VistaEnConstruccio.jsx',
  'src/sections/pobles/RestauradorOpenData.jsx',
]);

const JSX_PURS_R32_24 = Object.freeze([
  'src/sections/mercat/SelectorDeVariacions.jsx',
  'src/sections/mercat/TargetaDelMercat.jsx',
  'src/sections/calendari/CalendariDelPoble.jsx',
  'src/sections/calendari/DesplegableEsdevenimentsCalendari.jsx',
  'src/sections/calendari/fonts/PanellFontsCalendari.jsx',
  'src/sections/taxonomia/BrainTaxonomia.jsx',
  'src/sections/taxonomia/PrevisualitzacioCardTaxonomia.jsx',
  'src/sections/xat/IAIALocalProvider.jsx',
  'src/sections/pobles/PublicacionsDelPoble.jsx',
  'src/sections/pobles/TerritoriDelPoble.jsx',
  'src/sections/pobles/PanellDeViquipedia.jsx',
]);

const MODELS_PURS_R32_24 = Object.freeze([
  'src/sections/mercat/selectorDeVariacionsModel.js',
  'src/sections/mercat/targetaDelMercatModel.js',
  'src/sections/calendari/calendariDelPobleModel.js',
  'src/sections/calendari/desplegableEsdevenimentsCalendariModel.js',
  'src/sections/calendari/fonts/panellFontsCalendariModel.js',
  'src/sections/taxonomia/brainTaxonomiaModel.js',
  'src/sections/taxonomia/previsualitzacioCardTaxonomiaModel.js',
  'src/sections/xat/iaiaLocalProviderModel.js',
  'src/sections/pobles/publicacionsDelPobleModel.js',
  'src/sections/pobles/territoriDelPobleModel.js',
  'src/sections/pobles/panellDeViquipediaModel.js',
]);

describe('Onada R32.24 · T2 · Puresa HMR acumulada (R32.19 + R32.20 + R32.22 + R32.24)', () => {
  test.each([...JSX_PURS_R32_19_20_22, ...JSX_PURS_R32_24])(
    '%s exporta exclusivament components React (PascalCase o default, cap constant UPPER_CASE)',
    (relPath) => {
      const exp = exportsDeclarats(relPath);
      expect(exp.length).toBeGreaterThan(0);
      for (const { nom } of exp) {
        expect(
          nom === 'default' || /^[A-Z][A-Za-z0-9]*$/.test(nom),
          `${relPath}: export no-component «${nom}»`,
        ).toBe(true);
        expect(
          /^[A-Z0-9_]+$/.test(nom),
          `${relPath}: constant UPPER_CASE «${nom}» dins de .jsx`,
        ).toBe(false);
      }
    },
  );

  // v1.2.16: el pont de FacetaTaxonomia es retira amb la costura opcional
  // d'R32.22; només queda el de WikiDePobleSection.
  test('l\'únic pont històric documentat (WikiDePobleSection) es manté acotat i FacetaTaxonomia ja no en porta cap', () => {
    expect(exportsDeclarats('src/sections/wiki-de-poble/WikiDePobleSection.jsx')).toEqual([
      { nom: 'modulsLocalsActius', reexport: false },
      { nom: 'BarreraDeLaConsola', reexport: false },
      { nom: 'default', reexport: false },
    ]);
    expect(exportsDeclarats('src/sections/admin/FacetaTaxonomia.jsx')).toEqual([
      { nom: 'FacetaTaxonomia', reexport: false },
      { nom: 'default', reexport: false },
    ]);
  });

  test.each(MODELS_PURS_R32_24)('%s és un mòdul pur sense cap etiqueta JSX', (relPath) => {
    const codi = llig(relPath);
    expect(/<[A-Za-z]/.test(codi), `${relPath} no pot contindre JSX`).toBe(false);
  });

  test('els 11 mòduls *Model.js de R32.24 preserven el contracte funcional exacte', () => {
    // 1. selectorDeVariacionsModel
    expect(TEXT_ESGOTAT_PER_DEFECTE).toBe('Esgotat');
    expect(idLlegendaVariacions('r1')).toBe('r1-llegenda');
    expect(idOpcioVariacio('r1', '2kg')).toBe('r1-2kg');
    expect(classeVariantOpcio(false)).toBe(CLASSE_VARIANT);
    expect(classeVariantOpcio(true)).toBe(CLASSE_VARIANT_ESGOTADA);

    // 2. targetaDelMercatModel
    expect(SECCIO_MERCAT).toBe('mercat');
    const dataPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(resolImatgePropiaMercat(dataPng, (x) => x)).toBe(dataPng);
    expect(resolImatgePropiaMercat('javascript:alert(1)', (x) => x)).toBeNull();
    expect(esProducteTraduibleMercat({ title: 'Oli', translation_mode: 'none' }, 'es')).toBe(false);
    expect(modeTraduccioProducteMercat({ translation_mode: 'none' })).toBe('none');

    // 3. calendariDelPobleModel
    expect(LOCALE_CALENDARI).toBe('ca-ES');
    expect(DENSITAT_CALENDARI).toBe('responsiva');
    expect(ETIQUETES_PERIODE.mes.hui).toBe('Hui');
    expect(ambDe('octubre de 2026')).toBe('d’octubre de 2026');
    expect(ambDe('novembre de 2026')).toBe('de novembre de 2026');
    expect(capitalitzaPeriode('novembre de 2026')).toBe('Novembre de 2026');
    expect(textosDeLaVista('any', { any: 2026, mes: 10 }, {}).buit).toBe('Cap publicació este any.');
    expect(textSenseDataCalendari(1)).toContain('Una publicació');
    expect(textSenseDataCalendari(3)).toContain('3 publicacions');

    // 4. desplegableEsdevenimentsCalendariModel
    expect(textNet('  Mercat  ')).toBe('Mercat');
    expect(localeCalendariDe('en')).toBe('en-GB');
    expect(localeCalendariDe('ca')).toBe('ca-ES');
    expect(formataDataCurtaIso('2026-11-20', 'ca-ES')).toContain('2026');
    expect(mesDeLEntrada({ item: { date: '2026-11-20' } })).toBe('2026-11');
    expect(resumDataEntrada({ item: { date: '2026-11-20', location: 'Alcoi' } }, 'ca-ES')).toContain('Alcoi');

    // 5. panellFontsCalendariModel
    expect(classeCasellaFont('accent')).toBe(CLASSE_CASELLA.accent);
    expect(classeCasellaFont('desconegut')).toBe(CLASSE_CASELLA.accio);
    expect(esErrorFontReintentable(ERRORS_DE_FONT.XARXA)).toBe(true);
    expect(esErrorFontReintentable('permis')).toBe(false);

    // 6. brainTaxonomiaModel
    expect(ESTIL_BRAIN_TAXONOMIA.radis.category).toBe(16);
    expect(FONT_NOMS_BRAIN.mur).toBe('Mur carregat');
    expect(SECCIONS_VIVES_BRAIN).toEqual(['mur', 'mercat', 'events']);
    expect(AMPLARIES_PREVIEW_BRAIN).toEqual([375, 1440]);
    expect(netaTextBrain('Músiques d’Estiu')).toBe('musiques d’estiu');
    expect(nomRelacioBrain({ tipus: 'skos' })).toBe('Jerarquia SKOS declarada');

    // 7. previsualitzacioCardTaxonomiaModel
    expect(ALCARIA_INICIAL_PREVIEW).toBe(640);
    expect(ATRIBUTS_PRESENTACIO_PREVIEW).toEqual(['data-theme', 'data-contrast']);
    expect(ATRIBUTS_OBSERVATS_PREVIEW).toEqual(['data-theme', 'data-contrast', 'style']);
    expect(classeFramePreview(375)).toContain('--mobil');
    expect(classeFramePreview(1440)).toContain('--escriptori');
    expect(etiquetaPreviewCard(375, 'Abans')).toContain('375 píxels · Abans');
    expect(titolIframePreviewCard(1440)).toBe('UniversalCard a 1440 px');

    // 8. iaiaLocalProviderModel
    expect(MAXIM_MISSATGES_IAIA_LOCAL).toBe(100);
    expect(MAXIM_SESSIONS_NOVES_IAIA).toBe(50);
    expect(CAP_ELEMENT).toEqual([]);
    expect(CONTACTE_IAIA_LOCAL.tipus).toBe('ia');
    expect(esFilLocalIAIA(CONTACTE_IAIA_LOCAL.fil_id)).toBe(true);
    expect(esFilLocalIAIA('fil-remot-1')).toBe(false);
    expect(creaMissatgeBenvingudaIAIA('2026-11-20T00:00:00.000Z')[0].is_ai).toBe(true);
    expect(textRespostaIAIALocal('Hola!')).toBe('Hola!');

    // 9. publicacionsDelPobleModel
    expect(PESTANYA_PER_DEFECTE_PUBLICACIONS_POBLE).toBe('gent');
    expect(VARIETAT_PORTA_PUBLICACIONS_POBLE).toBe('secundari');
    expect(clauResetPublicacionsPoble({ id: 'p1' }, 'tot')).toBe('p1:tot');

    // 10. territoriDelPobleModel
    expect(RUTA_XARXA_POBLES).toBe('/pobles');
    const mostraPobles = [
      { id: 'municipi-a', title: 'Municipi A' },
      { id: 'pedania-b', name: 'Pedania B', parent_poble_id: 'municipi-a' },
    ];
    expect(poblesArrelDeComarca(mostraPobles)).toHaveLength(1);
    expect(fillsDirectesDePoble(mostraPobles, 'municipi-a')).toHaveLength(1);
    expect(titolVisiblePoble(mostraPobles[1])).toBe('Pedania B');
    expect(rutaFitxaPoble('municipi a')).toBe('/pobles/municipi%20a');
    expect(dadesCamiTerritorial({ id: 'p1', title: 'Poble 1', provincia: 'Alacant', comarca: 'Comarca X' }).titolActual).toBe('Poble 1');

    // 11. panellDeViquipediaModel
    expect(TERMINI_MS).toBe(20000);
    expect(ESTATS_DESABLES_VIQUIPEDIA).toEqual(['complet', 'parcial']);
    expect(urlDeFont('http://ca.wikipedia.org/wiki/Portada')).toBeNull();
    expect(urlDeFont('https://ca.wikipedia.org/wiki/Portada')).toBe('https://ca.wikipedia.org/wiki/Portada');
    expect(urlDeFont('https://malicios.example/x')).toBeNull();
    expect(focusPerdut(null)).toBe(false);
    expect(typeof subscriuConnexio(() => {})).toBe('function');
    expect(typeof enLinia()).toBe('boolean');
    const resumFonts = construeixModelFontsTerritorials(
      { wikipedia_provenance: {}, comarca: 'Comarca X', population: 500, population_year: 2025 },
      { comarca: 'Comarca', poblacio: 'Població' },
    );
    expect(resumFonts.dades).toEqual([
      ['Comarca', 'Comarca X'],
      ['Població', '500 (2025)'],
    ]);
  });
});
