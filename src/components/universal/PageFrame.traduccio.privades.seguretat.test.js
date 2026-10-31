// @vitest-environment node
/* Decisions 261030 §7 · Abans de dir en públic «mai els teus missatges ni
   les teues notes»: cap pàgina que mostre contingut privat d'una persona té
   Traduir actiu. Les apps (Xat, Notes…) i el multimèdia local ja el portaven
   apagat; el Cercador (les teues notes i converses), Connectar i el Curador
   (el teu Bloc), els detalls privats del perfil, el Tauler (usuaris) i
   Dispositius (missatges directes), també. El botó no canvia (Llei del
   Píxel): en clicar-lo, PageFrame avisa i no ix cap text. (Les pàgines del
   multimèdia mesclen les locals, apagades, i les de la Fototeca publicada,
   públiques: les cobrixen les seues proves.)
   Gauntlet 261030 (cicle 2) · Venia de PageFrame.traduccio.lliure.test.jsx,
   fora del precommit (precommit-sense-guardes-traductor): ara entra pel nom
   (*.seguretat.test.*) i només llig fitxers. I hi entren l'alta i la
   contrasenya nova (traduir-correu-a-registre: el correu de la persona) i la
   fitxa pròpia amb el veïnat connectat (traduir-fitxa-propia-veinat-connectat). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const llig = (rel) => senseComentaris(fs.readFileSync(path.join(SRC, rel), 'utf8'));

const PAGINES_PRIVADES = Object.freeze([
  'components/PedraSeca/organismes/PaginaApp.jsx',
  'sections/search/SearchSection.jsx',
  'sections/connectar/ConnectarSection.jsx',
  'sections/notes/SnippetCurador.jsx',
  'sections/profile/DetallCompte.jsx',
  'sections/profile/DetallPrivacitat.jsx',
  'sections/profile/DetallVistes.jsx',
  'sections/profile/DetallMultimedia.jsx',
  'sections/admin/AdminSection.jsx',
  'sections/dispositius/DevicesSection.jsx',
  'sections/onboarding/OnboardingSection.jsx',
  /* Gauntlet 261030 (cicle 4, ALT-C1 de Codex; altc1-consola-fora-del-precommit) · La
     Consola: consola.json, el Mapa, la matriu de requeriments oberta d'un fitxer i els
     empaquetats d'este ordinador. El comportament, a ConsolaSection.traduccio.test.jsx. */
  'sections/consola/ConsolaSection.jsx',
  'sections/consola/EmpaquetatsConsola.jsx',
  'sections/consola/govern/GovernConsola.jsx',
]);

test('pàgines amb contingut privat: cada pàgina porta traduccio={false} (Traduir no envia res fora)', () => {
  for (const rel of PAGINES_PRIVADES) {
    const codi = llig(rel);
    const pagines = (codi.match(/<(?:UniversalPage|PageFrame)\b/g) || []).length;
    const apagades = (codi.match(/\btraduccio=\{false\}/g) || []).length;
    expect([rel, pagines > 0, apagades]).toEqual([rel, true, pagines]);
  }
});

/* Gauntlet 261030 (cicle 4, traduir-tauler-taxonomia-uuid-autors) · El Tauler
   no és només AdminSection.jsx: les facetes que importa pinten la seua pròpia
   pàgina (FacetaTaxonomia, amb l'«Historial» i l'uuid de qui va desar cada
   versió). La guarda seguix cada import local del Tauler que pinta una
   pàgina: una faceta nova sense traduccio={false} cau ací. */
test('el Tauler: cada fitxer local que AdminSection importa i pinta una pàgina porta traduccio={false}', () => {
  const tauler = llig('sections/admin/AdminSection.jsx');
  const locals = [...tauler.matchAll(/from '\.\/([\w.-]+\.jsx)'/g)].map(([, fitxer]) => `sections/admin/${fitxer}`);
  const ambPagina = locals.filter((rel) => /<(?:UniversalPage|PageFrame)\b/.test(llig(rel)));
  expect(ambPagina).toContain('sections/admin/FacetaTaxonomia.jsx');
  for (const rel of ambPagina) {
    const codi = llig(rel);
    const pagines = (codi.match(/<(?:UniversalPage|PageFrame)\b/g) || []).length;
    const apagades = (codi.match(/\btraduccio=\{false\}/g) || []).length;
    expect([rel, apagades]).toEqual([rel, pagines]);
  }
});

/* Gauntlet 261030 (cicle 4, C4-CONSOLA-WIKI-TRADUIR) · La Consola també es munta dins
   de la Wiki (/wikidepoble?item=consola_termodinamica): la seua fitxa no es traduïx,
   i ConsolaIncrustada no es munta en cap altra pàgina de la Wiki, que sí que es
   traduïxen. El comportament, a WikiDePobleSection.consolaTraduccio.seguretat.test.jsx. */
test('la Consola dins de la Wiki: la seua fitxa porta traduccio={false} i és l’única que munta el tauler', () => {
  const codi = llig('sections/wiki-de-poble/WikiDePobleSection.jsx');
  const inici = codi.indexOf("if (item.id === 'consola_termodinamica') {");
  const muntatge = codi.indexOf('<ConsolaIncrustada', inici);
  expect([inici > 0, muntatge > inici]).toEqual([true, true]);
  const fitxa = codi.slice(inici, muntatge);
  expect((fitxa.match(/<(?:UniversalPage|PageFrame)\b/g) || []).length).toBe(1);
  expect((fitxa.match(/\btraduccio=\{false\}/g) || []).length).toBe(1);
  expect((codi.match(/<ConsolaIncrustada\b/g) || []).length).toBe(1);
});

test('el correu de la persona, a l’alta i a la contrasenya nova, porta translate="no"', () => {
  expect(llig('sections/onboarding/OnboardingSteps.jsx')).toContain('<strong translate="no">{confirmationEmail}</strong>');
  expect(llig('sections/onboarding/RecuperacioSteps.jsx')).toContain('<strong translate="no">{correu}</strong>');
});

test('la fitxa pròpia amb el veïnat connectat apaga Traduir amb la mateixa condició que pinta la llista', () => {
  const codi = llig('sections/profile/PerfilPublicSection.jsx');
  expect(codi).toContain('const ambVeinatConnectat = esPersona && perfil.propietari && esDeQuiMira;');
  /* Gauntlet 261030 (Fase 3, TC3.2) · La condició continua dins de la regla
     de la fitxa, que ara també exigix una fitxa pública (`publicat`). */
  expect(codi).toContain('const fitxaTraduible = perfil.publicat === true && !ambVeinatConnectat;');
  expect(codi).toContain('traduccio={fitxaTraduible}');
  expect(codi).toContain('{ambVeinatConnectat ? <GentQueEtSegueix');
});

/* Gauntlet 261030 (cicle 3, traduir-perfil-lectura-fitxa-no-publica; TC3.2) ·
   La fitxa en lectura de /el-meu-perfil (DocumentEditor · EmptyDocumentPage)
   només deixa Traduir actiu amb la marca explícita de l'adaptador
   (fallada tancada), i PerfilEditor la posa amb la regla de la fitxa
   pública. El comportament, a DocumentEditor.traduccio.test.jsx. */
test('la fitxa en lectura del Perfil: Traduir només amb la marca de l’adaptador, i el Perfil la posa si la fitxa és pública', () => {
  const editor = llig('components/universal/DocumentEditor.jsx');
  const estatBuit = editor.slice(editor.indexOf('function EmptyDocumentPage('), editor.indexOf('export function DocumentEditor('));
  expect((estatBuit.match(/<UniversalPage\b/g) || []).length).toBe(1);
  expect(estatBuit).toContain('traduccio={doc.traduccio === true}');
  expect(llig('sections/profile/PerfilEditor.jsx')).toContain('traduccio: fitxaPublicada(identitat) && identitat?.dades?.reserva !== true,');
});
