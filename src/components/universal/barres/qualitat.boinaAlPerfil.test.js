// @vitest-environment node
/* Onada 8 (261009; requeriments, punts 3 i 4) · Qualitat del front «boina
   taronja, accés al xat i targetes d'entitat»: un clic a QUALSEVOL boina
   taronja porta SEMPRE al perfil públic de qui signa, mai a /projecte ni al
   xat; al xat s'hi entra per «Comentar → En privat» (l'autor) o pels botons
   grans que ja hi eren. ESLint amb la configuració del projecte i zero
   missatges (avisos inclosos) en tots els fitxers del front, cap estil en
   línia i, sobre tot src/, cap ruta de boina que porte al xat. Els patrons
   vetats es componen a trossos perquè les portes que llegixen src/ no els
   troben ací (patró de control/qualitat.boina.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const FRONT = [
  'src/config/navigation.js',
  'src/config/navigation.autoria.test.js',
  'src/config/objecteConnectable.js',
  'src/components/universal/UniversalUtils.js',
  'src/components/universal/PageFrame.jsx',
  'src/components/universal/EventCard.jsx',
  'src/components/universal/barres/BarraBlava.jsx',
  'src/components/universal/barres/BarraBlava.comentar.test.jsx',
  'src/components/universal/barres/BarraTaronja.test.jsx',
  'src/components/universal/barres/pastillaCalendari.test.jsx',
  'src/components/universal/barres/qualitat.boinaAlPerfil.test.js',
  'src/components/universal/richText/extensions/targetes/formaDelGrup.js',
  'src/components/universal/richText/extensions/targetes/formaDelGrup.test.js',
  'src/components/universal/richText/extensions/targetes/TargetaIncrustadaNodeView.test.jsx',
  'src/components/PedraSeca/hooks/useAccions.js',
  'src/components/PedraSeca/hooks/useAccions.comentar.test.jsx',
  'src/components/PedraSeca/hooks/useComentaEnPrivat.test.jsx',
  'src/components/PedraSeca/hooks/xatSocDePoble.js',
  'src/components/PedraSeca/organismes/Comentar.jsx',
  'src/components/PedraSeca/organismes/textosComentar.js',
  'src/components/PedraSeca/organismes/UniversalCard.jsx',
  'src/components/PedraSeca/organismes/UniversalCard.accio.test.jsx',
  'src/components/PedraSeca/organismes/PaginaApp.test.jsx',
  'src/sections/control/xatCorporatiu.js',
  'src/sections/detail/elementDeSeccio.js',
  'src/sections/detail/detailSectionMeta.jsx',
  'src/sections/mur/TargetaDelMur.jsx',
  'src/sections/notes/PublicacioDetall.jsx',
  'src/sections/notes/autoriaNota.js',
  'src/sections/pobles/PoblesSection.jsx',
  'src/sections/pobles/PoblesSection.test.jsx',
  'src/sections/profile/DetallEspai.jsx',
  'src/sections/profile/fitxaDePerfil.js',
  'src/sections/profile/PerfilEditor.jsx',
  'src/sections/profile/PerfilPublicSection.jsx',
  'src/sections/xat/errorsXat.js',
  'src/sections/xat/errorsXat.test.js',
  'src/sections/disseny/cataleg/detalls/EspecimenUniversalCard.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenPage.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenPaginaApp.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx',
  'src/data/supabase/xat.js',
  /* Revisió adversarial de l'Onada 8 · la targeta viva, el padró de la
     llavor, l'autoria de les apps i les seues proves. */
  'src/components/universal/targetaViva.js',
  'src/components/universal/targetaViva.test.js',
  'src/components/universal/TargetaViva.jsx',
  'src/components/universal/TargetaViva.test.jsx',
  'src/components/universal/DocumentEditor.jsx',
  'src/sections/notes/NotaFitxa.jsx',
  'src/sections/notes/ConnexioDetall.test.jsx',
  'src/sections/profile/DetallVistes.jsx',
  'src/sections/control/xatCorporatiu.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenTargetaViva.jsx',
  'src/sections/disseny/cataleg/versio.js',
  'src/apps/nevera/vistes/autoria.js',
  'src/apps/plataforma/autoria.js',
  'src/apps/plataforma/autoria.test.js',
  'src/data/supabase/xat.consentiment.test.js',
  'src/sections/xat/XatSection.falladaDirecte.test.js'
];
const JSX_DE_PRODUCCIO = FRONT.filter((ruta) => ruta.endsWith('.jsx') && !ruta.includes('.test.'));
/* Un atribut d'estil en JSX, amb claus o amb cometes. */
const ESTIL_EN_LINIA = new RegExp(['\\ss', 'tyle=[{"]'].join(''));

/* Tots els fitxers de codi de src/, sense proves. */
function codiDe(carpeta) {
  return readdirSync(path.join(ARREL, carpeta), { withFileTypes: true }).flatMap((entrada) => {
    const ruta = `${carpeta}/${entrada.name}`;
    if (entrada.isDirectory()) return entrada.name === 'node_modules' ? [] : codiDe(ruta);
    return /\.(jsx?|mjs)$/.test(entrada.name) && !/\.test\./.test(entrada.name) ? [ruta] : [];
  });
}
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/* On s'escriu la ruta d'una boina (UniversalCard, BarraTaronja, PageFrame,
   la meta d'una secció i l'editor) i el que hi va darrere, fins a la coma,
   la clau o el final de la línia. */
const ON_VA_LA_BOINA = new RegExp(['\\b(author', 'Href|getAuthor', 'Href|barAuthor', 'Href)\\b\\s*[:=]\\s*\\{?([^\\n,}]*)'].join(''), 'g');
/* Una ruta del xat: el literal o qualsevol peça que en fa (rutaXat…, xatDel…). */
const DEL_XAT = new RegExp(["['\"`]\\/", 'xat', '|\\b\\w*[Xx]', 'at[A-Z]\\w*|\\b', 'xat\\w*'].join(''));

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, en tots els fitxers del front', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FRONT.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FRONT.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/components/universal/barres/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('cap estil en línia en el JSX del front', () => {
    expect(ESTIL_EN_LINIA.test(` s${'tyle'}={{ marginTop: '3rem' }}`)).toBe(true);
    for (const ruta of JSX_DE_PRODUCCIO) expect([ruta, ESTIL_EN_LINIA.test(llig(ruta))]).toEqual([ruta, false]);
  });
});

describe('Onada 8 · la boina porta al perfil, mai al xat ni a /projecte', () => {
  test('cap ruta de boina de src/ porta al xat', () => {
    /* Sondes: el patró veu les formes que hi havia abans d'esta onada. */
    const vella = senseComentaris(`authorHref={xatDelPoble || undefined}\n    getAuthorHref: rutaXatDelPoble,\n  authorHref: '/${'xat'}?amb=socdepoble'`);
    const trobades = [...vella.matchAll(ON_VA_LA_BOINA)].filter(([, , valor]) => DEL_XAT.test(valor));
    expect(trobades).toHaveLength(3);
    expect(DEL_XAT.test('rutaDAutoria({ tipus: perfil.tipus, id: perfil.id })')).toBe(false);
    expect(DEL_XAT.test('poble?.ruta || undefined')).toBe(false);
    const fitxers = codiDe('src');
    expect(fitxers.length).toBeGreaterThan(300);
    const infraccions = fitxers.flatMap((ruta) => [...senseComentaris(llig(ruta)).matchAll(ON_VA_LA_BOINA)]
      .filter(([, , valor]) => DEL_XAT.test(valor))
      .map(([sencer]) => `${ruta}: ${sencer.trim()}`));
    expect(infraccions).toEqual([]);
  });

  /* L'entorn node no carrega navigation.js (el sanejador vol finestra): la
     igualtat de les rutes la fixa navigation.autoria.test.js. Ací, el literal
     que la boina de Sóc de Poble porta a la font. */
  test('DEFAULT_AUTHOR.href és el perfil de l’entitat, i cap literal de boina és /projecte', () => {
    expect(senseComentaris(llig('src/components/universal/UniversalUtils.js'))).toMatch(/href: '\/empresa\/socdepoble',/);
    const literalVell = new RegExp(['\\b(author', 'Href|getAuthor', 'Href)\\b\\s*[:=]\\s*\\{?\\s*[\'"`]\\/pro', 'jecte[\'"`]'].join(''));
    const vells = codiDe('src').filter((ruta) => literalVell.test(senseComentaris(llig(ruta))));
    expect(vells).toEqual([]);
  });
});
