// @vitest-environment node
/* T5a · P1-22 (assalt 261101; TE-02 generalitzat) · GUARDA AST CONTRA ELS
   LITERALS VISIBLES. i18n.usades.test.js mira que cada clau demanada existisca;
   esta mira l'altra meitat: que un fitxer que ja passa pel traductor no torne
   a pintar un text en valencià a pèl. Es llig la font amb @babel/parser (ja
   és devDependency; cap mòdul de producció s'importa) i falla en:
    · un JSXText amb lletres;
    · un atribut visible (aria-label, title, titol, etiqueta, ajuda…) amb un
      literal o una plantilla amb lletres, també dins d'un ternari o d'un &&;
    · un fill {…} que és un literal amb lletres ({cond ? 'Sí' : 'No'});
    · una propietat d'objecte visible ({ etiqueta: 'Membre' }) o un valor per
      defecte d'una prop visible ({ titol = 'Hola' }) amb un literal amb lletres;
      també amb sufix (etiquetaDesa, titolDialeg…);
    · una plantilla literal com a primer argument d'omple() (omple('Llevar:
      {nom}', …)), on siga: els marcadors {…} no compten com a lletres.
   No entra dins de cap altra crida: la reserva de t('clau', 'Text') i de
   tradueix(t, ['clau', 'Text']) és legítima (la porta i18n.usades).
   B3 (marató 261101_2143) hi afig dues regles més, més avall: les frases fora
   de parell (constants, retorns, fletxes, valors per defecte i eixides que
   pinten) i la Llei del Píxel (cada reserva és el valor valencià). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';

const ARREL = process.cwd();

/* Els fitxers de P1-22 que ja passen sencers pel traductor. Cada carril hi
   afig els seus, un per línia, dins del seu bloc. */
const FITXERS_AUDITATS_P122 = Object.freeze([
  "src/app/contexts/ModeracioContext.jsx",
  "src/components/PedraSeca/UniversalListCard/textosComu.js",
  "src/components/PedraSeca/atoms/Boto.jsx",
  "src/components/PedraSeca/hooks/useTraduccioPagina.js",
  "src/components/PedraSeca/molecules/Alerta.jsx",
  "src/components/PedraSeca/organismes/CalendariMes.jsx",
  "src/components/PedraSeca/organismes/Dialeg.jsx",
  "src/components/PedraSeca/organismes/SelectorDataHora.jsx",
  "src/components/PedraSeca/organismes/textosComentar.js",
  "src/components/PedraSeca/organismes/textosModeracio.js",
  "src/components/universal/BotoInstalaApp.jsx",
  "src/components/universal/FitxaMemoriaOral.jsx",
  "src/components/universal/MarcaAmfitrio.jsx",
  "src/components/universal/PageFrame.jsx",
  "src/components/universal/UniversalEditorShell.jsx",
  "src/components/universal/UniversalToolbar.jsx",
  "src/components/universal/barres/textosBarres.js",
  "src/components/universal/classificacio/BotoneraClassificacio.jsx",
  "src/components/universal/classificacio/DialegCarpeta.jsx",
  "src/components/universal/classificacio/DialegValors.jsx",
  "src/components/universal/connexio/estatConnexio.js",
  "src/components/universal/enquadrament/DialegEnquadrament.jsx",
  "src/components/universal/enquadrament/UbicacioImatge.jsx",
  "src/components/universal/richText/extensions/targetes/DialegTriaTargeta.jsx",
  "src/components/universal/richText/extensions/targetes/TargetaIncrustadaNodeView.jsx",
  "src/components/universal/traduccio/MenuTraduir.jsx",
  "src/components/universal/workspace/UniversalWorkspace.jsx",
  "src/config/systemPages.js",
  "src/natiu/CalActualitzar.jsx",
  "src/natiu/entrada.jsx",
  "src/sections/connectar/BlocRelacio.jsx",
  "src/sections/connectar/ConnectarSection.jsx",
  "src/sections/connectar/ResumConnexio.jsx",
  "src/sections/connectar/organitzacio/BlocFormarPart.jsx",
  "src/sections/connectar/useAplicaAbast.js",
  "src/sections/connectar/useSeguiment.js",
  "src/sections/control/xatCorporatiu.js",
  "src/sections/multimedia/AccionsCarpetaLocal.jsx",
  "src/sections/multimedia/EditorTextLocal.jsx",
  "src/sections/multimedia/GestorMultimediaLocal.jsx",
  "src/sections/multimedia/LaboratoriWebpLocal.jsx",
  "src/sections/multimedia/MultimediaSection.jsx",
  "src/sections/multimedia/OperacionsArxiuLocal.jsx",
  "src/sections/multimedia/PaginesEspaiMultimedia.jsx",
  "src/sections/multimedia/VisorDeLArxiu.jsx",
  "src/sections/multimedia/panellDeLaFoto.js",
  "src/sections/multimedia/textosEspaiMultimedia.js",
  "src/sections/multimedia/textosGestorLocal.js",
  "src/sections/mur/EstatErrorDades.jsx",
  "src/sections/mur/PublicacionsDeLActor.jsx",
  "src/sections/mur/usePublicacionsDeLActor.js",
  "src/sections/notes/ConnexioDetall.jsx",
  "src/sections/notes/NotesEditor.jsx",
  "src/sections/notes/NotesSection.jsx",
  "src/sections/notes/PrevisualitzacioExtern.jsx",
  "src/sections/notes/SnippetCurador.jsx",
  "src/sections/notes/canalEmojis.js",
  "src/sections/notes/carpetes.js",
  "src/sections/notes/classificacioBloc.js",
  "src/sections/notes/llavorNota.js",
  "src/sections/notes/visibilitatNota.js",
  "src/sections/onboarding/CampsDIdentitatALAlta.jsx",
  "src/sections/onboarding/IdentitatAlPoble.jsx",
  "src/sections/onboarding/OnboardingSteps.jsx",
  "src/sections/onboarding/RecuperacioSteps.jsx",
  "src/sections/plugins/PluginPage.jsx",
  "src/sections/plugins/useDestiDelPlugin.js",
  "src/sections/pobles/EntitatsDelPoble.jsx",
  "src/sections/pobles/usePublicacionsDelPoble.js",
  "src/sections/profile/DetallPrivacitat.jsx",
  "src/sections/profile/DetallVistes.jsx",
  "src/sections/profile/GestioMembres.jsx",
  "src/sections/profile/PerfilEditor.jsx",
  "src/sections/profile/PerfilShell.jsx",
  "src/sections/profile/ProfileSection.jsx",
  "src/sections/profile/PublicacionsDeLaFitxa.jsx",
  "src/sections/profile/fitxaDePerfil.js",
  "src/sections/profile/membresModel.js",
  "src/sections/profile/personesConfianca.js",
  "src/sections/profile/useImatgeDeFitxa.jsx",
  "src/sections/profile/visibilitatFitxa.js",
  "src/sections/search/EspaiCerca.jsx",
  "src/sections/search/useCercaGlobal.js",
  "src/sections/translations/TranslationsSection.jsx",
  "src/sections/xat/components/AdjuntXat.jsx",
  "src/sections/xat/components/AvisClauCanviada.jsx",
  "src/sections/xat/components/AvisOblitXat.jsx",
  "src/sections/xat/components/BarraResposta.jsx",
  "src/sections/xat/components/BarraSeleccio.jsx",
  "src/sections/xat/components/Bombolla.jsx",
  "src/sections/xat/components/BotoBaixar.jsx",
  "src/sections/xat/components/BotoInformaDUnError.jsx",
  "src/sections/xat/components/CapcaleraConversa.jsx",
  "src/sections/xat/components/CitaResposta.jsx",
  "src/sections/xat/components/Compositor.jsx",
  "src/sections/xat/components/ConsultaIAIA.jsx",
  "src/sections/xat/components/ControlsAdjunt.jsx",
  "src/sections/xat/components/DialegCompartir.jsx",
  "src/sections/xat/components/DialegNovaConversa.jsx",
  "src/sections/xat/components/EnllacSegur.jsx",
  "src/sections/xat/components/FilaConversa.jsx",
  "src/sections/xat/components/FilaPersona.jsx",
  "src/sections/xat/components/FilaPoble.jsx",
  "src/sections/xat/components/FiltreConverses.jsx",
  "src/sections/xat/components/FiltresCerca.jsx",
  "src/sections/xat/components/FitxaComunitat.jsx",
  "src/sections/xat/components/LlistaConverses.jsx",
  "src/sections/xat/components/PaginaNotificacions.jsx",
  "src/sections/xat/components/PastillaNoLlegits.jsx",
  "src/sections/xat/components/ResultatsCercaXat.jsx",
  "src/sections/xat/components/SeparadorNoLlegits.jsx",
  "src/sections/xat/components/VistaComunitats.jsx",
  "src/sections/xat/conversa.js",
  "src/sections/xat/errorsXat.js",
  "src/sections/xat/estatXifratgeFil.js",
  "src/sections/xat/silenciXat.js",
  "src/sections/xat/useAvisosPushXat.js",
  "src/sections/xat/useCanvisDeClau.js",
  "src/sections/xat/useInformaDUnError.js",
]);
const FITXERS = FITXERS_AUDITATS_P122;

/* Excepcions (`fitxer:línia tipus «text»`). Buida: cap marca no ho necessita. */
const ADMESOS = new Set([]);

/* Els noms d'atribut o de prop que es lligen. Les props de text de la casa,
   també amb sufix en camelCase (etiquetaDesa, etiquetaConfirma, titolDialeg).
   Patró ancorat i sense alternatives niades: cap retrocés. */
const VISIBLE = /^(?:aria-(?:label|valuetext|description|roledescription|placeholder)|title|placeholder|alt|lead|subtitle|textTriada|(?:titol|etiqueta|llegenda|ajuda|descripcio)(?:[A-Z]\w*)?)$/;
const esVisible = (nom) => typeof nom === 'string' && VISIBLE.test(nom);
const LLETRES = /\p{L}{2,}/u;
const MARCADOR = /\{\w+\}/g;
const esOmple = (callee) => (callee?.type === 'Identifier' && callee.name === 'omple')
  || (callee?.type === 'MemberExpression' && callee.property?.type === 'Identifier' && callee.property.name === 'omple');
const OMESOS = new Set(['loc', 'start', 'end', 'range', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'comments', 'tokens']);
/* B3 (marató 261101_2143) · Un selector CSS ('.editor-title-input', '#id',
   '[data-x]') no és cap text de la interfície, encara que vaja sota una clau
   visible (DESTINS_FOCUS de la closca de l'editor: title/subtitle/lead). Un
   punt o un coixinet seguit d'un nom en minúscula; uns punts suspensius no ho
   són, ni un text visible que comença per «[Esborrany]» o «#Fira». */
const ES_SELECTOR = /^\s*(?:[.#][a-z_-]|\[[a-z])/;

const nomDeClau = (clau) => (clau?.type === 'Identifier' ? clau.name : clau?.type === 'StringLiteral' ? clau.value : null);

/** Els trossos literals amb lletres que una expressió pot pintar tal qual (sense entrar a cap crida). */
function literalsDe(node) {
  if (!node) return [];
  switch (node.type) {
    case 'StringLiteral': return LLETRES.test(node.value) ? [node.value] : [];
    case 'TemplateLiteral': return [
      ...node.quasis.map((q) => q.value.cooked ?? q.value.raw).filter((text) => LLETRES.test(text)),
      ...node.expressions.flatMap(literalsDe),
    ];
    case 'ConditionalExpression': return [...literalsDe(node.consequent), ...literalsDe(node.alternate)];
    case 'LogicalExpression': return [...literalsDe(node.left), ...literalsDe(node.right)];
    case 'BinaryExpression': return node.operator === '+' ? [...literalsDe(node.left), ...literalsDe(node.right)] : [];
    case 'JSXExpressionContainer':
    case 'ParenthesizedExpression':
    case 'TSAsExpression': return literalsDe(node.expression);
    case 'SequenceExpression': return literalsDe(node.expressions.at(-1));
    default: return [];
  }
}

/** Cada literal visible de la font: `fitxer:línia tipus «text»`. */
function literalsVisibles(font, fitxer = 'font.jsx') {
  const ast = parse(font, { sourceType: 'module', plugins: ['jsx'] });
  const trobats = [];
  const anota = (node, tipus, text) => {
    if (tipus === 'JSXText' || !ES_SELECTOR.test(text)) trobats.push(`${fitxer}:${node.loc.start.line} ${tipus} «${text.trim()}»`);
  };
  const pila = [ast.program];
  while (pila.length) {
    const node = pila.pop();
    if (!node || typeof node.type !== 'string') continue;
    if (node.type === 'JSXText' && LLETRES.test(node.value.trim())) anota(node, 'JSXText', node.value);
    if (node.type === 'JSXAttribute' && esVisible(node.name?.name)) {
      for (const text of literalsDe(node.value)) anota(node, node.name.name, text);
    }
    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      for (const fill of node.children) {
        if (fill.type === 'JSXExpressionContainer') for (const text of literalsDe(fill.expression)) anota(fill, 'fill', text);
      }
    }
    if (node.type === 'ObjectProperty' && esVisible(nomDeClau(node.key))) {
      const valor = node.value?.type === 'AssignmentPattern' ? node.value.right : node.value;
      for (const text of literalsDe(valor)) anota(node, nomDeClau(node.key), text);
    }
    /* omple() pinta la seua plantilla: si és un literal, és un text a pèl. */
    if (node.type === 'CallExpression' && esOmple(node.callee)) {
      for (const text of literalsDe(node.arguments[0])) {
        if (LLETRES.test(text.replace(MARCADOR, ' '))) anota(node, 'omple', text);
      }
    }
    for (const [clau, valor] of Object.entries(node)) {
      if (OMESOS.has(clau)) continue;
      if (Array.isArray(valor)) for (let i = valor.length - 1; i >= 0; i -= 1) pila.push(valor[i]);
      else if (valor && typeof valor === 'object') pila.push(valor);
    }
  }
  return trobats.sort();
}

describe('P1-22 · cap literal visible als fitxers que ja passen pel traductor', () => {
  test.each(FITXERS)('%s', (fitxer) => {
    const font = readFileSync(path.join(ARREL, fitxer), 'utf8');
    expect(literalsVisibles(font, fitxer).filter((trobat) => !ADMESOS.has(trobat))).toEqual([]);
  });

  test('cap excepció admesa sobra', () => {
    const tots = new Set(FITXERS.flatMap((fitxer) => literalsVisibles(readFileSync(path.join(ARREL, fitxer), 'utf8'), fitxer)));
    expect([...ADMESOS].filter((admes) => !tots.has(admes))).toEqual([]);
  });
});

/* B3 · P1-22 (marató 261101_2143) · LES FRASES FORA DE PARELL.
   literalsVisibles només mira el JSX i les claus visibles: no veu una frase
   guardada en una constant (const AVIS = '…', també dins d'un objecte, d'un
   array o d'un Object.freeze), tornada per una funció (return `…`, o el cos
   d'una fletxa), posada de valor per defecte d'un paràmetre (heroEditLabel =
   '…') ni la que va directa a una eixida que la pinta: el toast, l'avís
   d'imatge, un setter d'estat (setError('…'), setMissatge({ text: '…' })),
   les accions que s'apilen (accions.push({ text: '…' })), alert() i
   confirm(). Tampoc la frase passada a qualsevol altra crida (avisa('…'),
   onError?.('…'), useState('…')), la d'un atribut JSX que no és de dades
   (<Avis text="…" />), l'assignada al DOM (el.textContent = '…') ni la d'una
   propietat de classe. Ni la reserva d'un parell llegida a mà, sense
   traduir: {P[1]}, o la constant X = P[1] pintada pel seu nom. Era el residu
   que quedava als mòduls de P1-22.
   Als FITXERS, una frase (lletres i un espai) o un mot de rètol («Avatar»,
   «CATEGORIES», «Tot», «Cancel·lar», «Carregant…») només viu dins d'una
   reserva: el segon element d'un parell ['clau', reserva] o la reserva de
   t('clau', reserva) o d'un ajudant de prefix. Una constant de text en queda
   fora només si TOTS els seus usos dins del fitxer són dins de reserves: ni
   es pinta ni es passa enlloc pel seu nom (exportar-la sí que val). No
   compten els selectors CSS ni les llistes de classes (cada mot amb guionet).
   A les crides lliures i als atributs que no són visibles, només les frases
   amb un espai (un mot sol hi sol ser una dada: 'Escape', 'Enter').
   Patrons ancorats i sense alternatives niades: cap retrocés. */
const ES_CLASSES = /^\s*[a-z0-9]+(?:[-_]{1,2}[a-z0-9]+)+(?:\s+[a-z0-9]+(?:[-_]{1,2}[a-z0-9]+)+)*\s*$/;
const CLAU_DE_PARELL = /^[a-z]+\.[\w.-]+$/;
/* Un mot sol també compta si comença en majúscula (≥ 3 caràcters): «Avatar», «CATEGORIES», «Tot», «Cancel·lar»,
   «Carregant…». Una sola classe i un sufix opcional disjunt: cap retrocés. */
const MOT_DE_ROTUL = /^\p{Lu}[\p{L}·’'-]{2,}(?:…|\.{3})?$/u;
const ES_SETTER = /^set[A-Z]/;
const SORTIDES = new Set(['showToast', 'onToast', 'avisImatge', 'alert', 'confirm']);
const APILADORS = new Set(['push', 'unshift']);
/* Els traductors amb la clau literal davant: els mateixos que llig i18n.usades.test.js (CRIDA). */
const TRADUCTORS = new Set(['t', 'tr', 'tradueix', 'ambNom']);
/* Crides que reben dades i no text visible: la regla de crides lliures no hi entra. */
const CRIDES_DE_DADES = new Set(['querySelector', 'querySelectorAll', 'closest', 'matches', 'matchMedia', 'startsWith', 'endsWith',
  'includes', 'indexOf', 'lastIndexOf', 'split', 'replace', 'replaceAll', 'match', 'matchAll', 'test', 'search', 'Error', 'RegExp']);
/* Atributs JSX de dades (o d'esdeveniment): la regla d'atributs no hi entra. Els visibles els mira literalsVisibles. */
const ATRIBUT_DE_DADES = /^(?:className|class|rel|style|sizes|srcSet|src|href|id|key|role|type|name|target|media|accept|allow|sandbox|autoComplete|headers|htmlFor|form|pattern|viewBox|xmlns|d|points|transform|(?:aria|data)-[\w-]+|on[A-Z]\w*)$/;
/* Les propietats del DOM que pinten el que s'hi assigna. */
const PROPIETATS_DOM = new Set(['textContent', 'innerText', 'innerHTML', 'title', 'placeholder', 'ariaLabel', 'alt']);
/* Excepcions per nom (`fitxer NOM`), mai per línia. Buida: un tros de frase
   que només viu dins de reserves (FITXERS_EN_US de DetallPrivacitat) ja en
   queda fora sol. */
const RESERVES_ADMESES = new Set([]);

const esFrase = (text) => {
  const net = text.trim();
  return LLETRES.test(net) && (/\s/.test(net) || MOT_DE_ROTUL.test(net)) && !ES_SELECTOR.test(net) && !ES_CLASSES.test(net);
};
const esFraseAmbEspai = (text) => esFrase(text) && /\s/.test(text.trim());
const esParell = (n) => n?.type === 'ArrayExpression' && n.elements.length === 2
  && n.elements[0]?.type === 'StringLiteral' && CLAU_DE_PARELL.test(n.elements[0].value);
const esCrida = (n) => n?.type === 'CallExpression' || n?.type === 'OptionalCallExpression';
const esFreeze = (c) => c?.type === 'MemberExpression' && c.object?.name === 'Object' && c.property?.name === 'freeze';
const esConsola = (c) => (c?.type === 'MemberExpression' || c?.type === 'OptionalMemberExpression') && c.object?.name === 'console';
const nomDeCrida = (c) => (c?.type === 'Identifier' ? c.name
  : (c?.type === 'MemberExpression' || c?.type === 'OptionalMemberExpression') && !c.computed ? c.property?.name ?? null : null);
const nomDePatro = (n) => (n?.type === 'Identifier' ? n.name : '{…}');
/* X[0] i X[1] del mateix X: t(X[0], X[1]) tradueix el parell, no el llig a mà. */
const esLecturaDeParell = ([a, b]) => [a, b].every((n, i) => n?.type === 'MemberExpression' && n.computed
  && n.property?.type === 'NumericLiteral' && n.property.value === i) && a.object?.type === 'Identifier' && a.object.name === b.object?.name;

function recorre(arrel, visita) {
  const pila = [arrel];
  while (pila.length) {
    const node = pila.pop();
    if (!node || typeof node.type !== 'string') continue;
    visita(node);
    for (const [clau, valor] of Object.entries(node)) {
      if (OMESOS.has(clau)) continue;
      if (Array.isArray(valor)) for (let i = valor.length - 1; i >= 0; i -= 1) pila.push(valor[i]);
      else if (valor && typeof valor === 'object') pila.push(valor);
    }
  }
}

/** Els trossos de text que una expressió deixa a la vista tal qual (sense entrar a cap crida que no siga Object.freeze). */
function trossosDe(node) {
  if (!node) return [];
  switch (node.type) {
    case 'StringLiteral': return [node.value];
    case 'TemplateLiteral': return [...node.quasis.map((q) => q.value.cooked ?? q.value.raw), ...node.expressions.flatMap(trossosDe)];
    case 'ConditionalExpression': return [...trossosDe(node.consequent), ...trossosDe(node.alternate)];
    case 'LogicalExpression': return [...trossosDe(node.left), ...trossosDe(node.right)];
    case 'BinaryExpression': return node.operator === '+' ? [...trossosDe(node.left), ...trossosDe(node.right)] : [];
    case 'ParenthesizedExpression':
    case 'JSXExpressionContainer': return trossosDe(node.expression);
    case 'ObjectExpression': return node.properties.flatMap((p) => (p.type === 'ObjectProperty' ? trossosDe(p.value) : []));
    case 'ArrayExpression': return esParell(node) ? [] : node.elements.flatMap(trossosDe);
    case 'CallExpression': return esFreeze(node.callee) ? trossosDe(node.arguments[0]) : [];
    default: return [];
  }
}

/** Un ajudant de prefix `(nom, reserva) => [`prefix.${nom}`, reserva]` (o amb Object.freeze, o amb un sol return):
    { prefix, node, iClau, iReserva, forma }, o null. Reconeix també les formes que i18n.usades.test.js (AJUDANT) no
    llig, amb forma: false: una reserva per defecte (reserva = ''), el prefix sumat ('prefix.' + nom), més de dos
    paràmetres o l'ordre girat. */
function clauDAjudant(f) {
  if (!['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(f?.type) || f.params.length < 2) return null;
  const noms = f.params.map((p) => (p.type === 'AssignmentPattern' ? p.left : p)).map((p) => (p?.type === 'Identifier' ? p.name : null));
  const tornat = f.body?.type !== 'BlockStatement' ? f.body
    : f.body.body.length === 1 && f.body.body[0].type === 'ReturnStatement' ? f.body.body[0].argument : null;
  const cos = esCrida(tornat) && esFreeze(tornat.callee) ? tornat.arguments[0] : tornat;
  const [clau, reserva] = cos?.type === 'ArrayExpression' && cos.elements.length === 2 ? cos.elements : [];
  const plantilla = clau?.type === 'TemplateLiteral' && clau.quasis.length === 2 && clau.quasis[1].value.cooked === '';
  const suma = clau?.type === 'BinaryExpression' && clau.operator === '+' && clau.left.type === 'StringLiteral';
  const variable = plantilla ? clau.expressions[0] : suma ? clau.right : null;
  const iClau = variable?.type === 'Identifier' ? noms.indexOf(variable.name) : -1;
  const iReserva = reserva?.type === 'Identifier' ? noms.indexOf(reserva.name) : -1;
  if (iClau < 0 || iReserva < 0 || iClau === iReserva) return null;
  const forma = plantilla && f.params.length === 2 && iClau === 0 && iReserva === 1 && f.params.every((p) => p.type === 'Identifier');
  return { prefix: plantilla ? clau.quasis[0].value.cooked : clau.left.value, node: clau, iClau, iReserva, forma };
}

/** Els ajudants de prefix: nom → { prefix, iClau, iReserva, cec, linia }. cec: i18n.usades.test.js (AJUDANT) no el veu,
    perquè no és `const x = (nom, reserva) =>` amb la plantilla a la mateixa línia, o el prefix no acaba en punt; les
    seues claus hi passarien sense comprovar. La Llei del Píxel el comprova igualment. */
function ajudantsDePrefix(programa) {
  const ajudants = new Map();
  const anota = (nom, { prefix, node, iClau, iReserva, forma }, canonica, linia) => {
    const cec = !canonica || !forma || node.loc.start.line !== linia || !/^[\w.-]+\.$/.test(prefix);
    ajudants.set(nom, { prefix, iClau, iReserva, cec, linia });
  };
  recorre(programa, (node) => {
    if (node.type === 'FunctionDeclaration' && node.id) {
      const clau = clauDAjudant(node);
      if (clau) anota(node.id.name, clau, false, node.loc.start.line);
    }
    if (node.type !== 'VariableDeclaration') return;
    node.declarations.forEach((d, i) => {
      const clau = d.id?.type === 'Identifier' ? clauDAjudant(d.init) : null;
      if (!clau) return;
      const canonica = node.kind === 'const' && i === 0 && d.init.type === 'ArrowFunctionExpression' && node.loc.start.line === d.loc.start.line;
      anota(d.id.name, clau, canonica, d.loc.start.line);
    });
  });
  return ajudants;
}

/** Cada reserva de la font: { node, clau, reserva } de ['clau', r], t('clau', r) (i tr, tradueix, ambNom) i ajudant('nom', r). */
function reservesDe(programa, ajudants = ajudantsDePrefix(programa)) {
  const llocs = [];
  recorre(programa, (node) => {
    if (esParell(node)) llocs.push({ node, clau: node.elements[0].value, reserva: node.elements[1] });
    if (!esCrida(node)) return;
    const nom = node.callee?.type === 'Identifier' ? node.callee.name : null;
    const [primer, segon] = node.arguments;
    if (TRADUCTORS.has(nom) && primer?.type === 'StringLiteral' && CLAU_DE_PARELL.test(primer.value) && segon) {
      llocs.push({ node, clau: primer.value, reserva: segon });
    }
    const ajudant = ajudants.get(nom);
    const [tros, reserva] = ajudant ? [node.arguments[ajudant.iClau], node.arguments[ajudant.iReserva]] : [];
    if (tros?.type === 'StringLiteral' && reserva) llocs.push({ node, clau: ajudant.prefix + tros.value, reserva });
  });
  return llocs;
}

/** nom → { dins, fora }: quantes voltes s'usa cada nom dins i fora de reserves. L'exportació no compta com a ús: les
    constants de sempre que importen les proves (ERROR_EXPORTA de l'enquadrament) són la reserva del seu parell. */
function usosDeNoms(programa, dinsDeReserva) {
  const noReferencia = new WeakSet();
  const usos = new Map();
  recorre(programa, (node) => {
    if (['ObjectProperty', 'ObjectMethod', 'ClassMethod', 'ClassProperty'].includes(node.type) && !node.computed) noReferencia.add(node.key);
    if (['MemberExpression', 'OptionalMemberExpression'].includes(node.type) && !node.computed) noReferencia.add(node.property);
    if (['VariableDeclarator', 'FunctionDeclaration', 'ClassDeclaration'].includes(node.type)) noReferencia.add(node.id);
    if (node.type === 'ExportSpecifier') { noReferencia.add(node.local); noReferencia.add(node.exported); }
    if (node.type === 'Identifier' && !noReferencia.has(node)) {
      const us = usos.get(node.name) ?? { dins: 0, fora: 0 };
      if (dinsDeReserva.has(node)) us.dins += 1; else us.fora += 1;
      usos.set(node.name, us);
    }
  });
  return usos;
}

/** El que les dues regles necessiten de la font, calculat una sola volta. */
function analitza(programa) {
  const ajudants = ajudantsDePrefix(programa);
  const reserves = reservesDe(programa, ajudants);
  const dinsDeReserva = new WeakSet();
  for (const { reserva } of reserves) recorre(reserva, (n) => dinsDeReserva.add(n));
  return { ajudants, reserves, dinsDeReserva, usos: usosDeNoms(programa, dinsDeReserva), ...avaluador(programa, ajudants) };
}

/** Cada frase fora de parell: `fitxer:línia tipus «text»`. */
function frasesForaDeParell(font, fitxer = 'font.jsx', admeses = RESERVES_ADMESES) {
  const ast = parse(font, { sourceType: 'module', plugins: ['jsx'] });
  const { dinsDeReserva, usos, reservaLlegida } = analitza(ast.program);
  const nomesDeReserva = (nom) => (usos.get(nom)?.dins ?? 0) > 0 && (usos.get(nom)?.fora ?? 0) === 0;
  const inicials = new WeakSet();
  const traduides = new WeakSet();
  const trobades = [];
  const anota = (node, tipus, trossos, prova = esFrase) => {
    for (const text of trossos) if (prova(text)) trobades.push(`${fitxer}:${node.loc.start.line} ${tipus} «${text.trim()}»`);
  };
  recorre(ast.program, (node) => {
    if (node.type === 'VariableDeclarator') {
      const nom = nomDePatro(node.id);
      if (!nomesDeReserva(nom) && !admeses.has(`${fitxer} ${nom}`)) anota(node, `const ${nom}`, trossosDe(node.init));
      if (node.init) inicials.add(node.init);
      /* export const X = P[1] (B3-I18N §2.4) val; pintar X o passar-lo pel seu nom, no. */
      const llegida = reservaLlegida(node.init);
      if (llegida !== undefined && (usos.get(nom)?.fora ?? 0) > 0) anota(node, `reserva llegida ${nom}`, [llegida]);
    }
    if (!inicials.has(node) && !dinsDeReserva.has(node) && !traduides.has(node)) {
      const llegida = reservaLlegida(node);
      if (llegida !== undefined) anota(node, 'reserva llegida', [llegida]);
    }
    if (node.type === 'ReturnStatement') anota(node, 'return', trossosDe(node.argument));
    if (node.type === 'ArrowFunctionExpression' && node.body?.type !== 'BlockStatement') anota(node, 'fletxa', trossosDe(node.body));
    if (node.type === 'AssignmentPattern') anota(node, `defecte ${nomDePatro(node.left)}`, trossosDe(node.right));
    if (node.type === 'ClassProperty' || node.type === 'ClassPrivateProperty') anota(node, `classe ${nomDeClau(node.key) ?? '#'}`, trossosDe(node.value));
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && !node.left.computed
      && PROPIETATS_DOM.has(node.left.property?.name)) anota(node, `.${node.left.property.name}`, trossosDe(node.right));
    if (node.type === 'JSXAttribute' && typeof node.name?.name === 'string' && !esVisible(node.name.name) && !ATRIBUT_DE_DADES.test(node.name.name)) {
      anota(node, `atribut ${node.name.name}`, trossosDe(node.value), esFraseAmbEspai);
    }
    if (!esCrida(node)) return;
    const nom = nomDeCrida(node.callee) ?? '';
    const lliures = node.arguments.filter((a) => !dinsDeReserva.has(a));
    if (TRADUCTORS.has(nom)) {
      if (esLecturaDeParell(node.arguments)) traduides.add(node.arguments[1]);
    } else if (SORTIDES.has(nom) || ES_SETTER.test(nom)) {
      anota(node, nom, trossosDe(node.arguments[0]));
      anota(node, nom, lliures.slice(1).flatMap(trossosDe), esFraseAmbEspai);
    } else if (APILADORS.has(nom)) {
      anota(node, nom, node.arguments.flatMap(trossosDe));
    } else if (!CRIDES_DE_DADES.has(nom) && !esFreeze(node.callee) && !esConsola(node.callee) && !esOmple(node.callee)) {
      anota(node, `crida ${nom || '…'}`, lliures.flatMap(trossosDe), esFraseAmbEspai);
    }
  });
  return trobades.sort();
}

describe('B3 · P1-22 · cap frase fora de parell als fitxers que ja passen pel traductor', () => {
  test.each(FITXERS)('%s', (fitxer) => {
    expect(frasesForaDeParell(readFileSync(path.join(ARREL, fitxer), 'utf8'), fitxer)).toEqual([]);
  });

  test('cap reserva admesa per nom sobra', () => {
    const fonts = Object.fromEntries(FITXERS.map((f) => [f, readFileSync(path.join(ARREL, f), 'utf8')]));
    /* Sobra si, sense l'excepció, la constant tampoc no faria cap troballa. */
    const sobren = [...RESERVES_ADMESES].filter((entrada) => {
      const [fitxer, nom] = entrada.split(' ');
      return !fonts[fitxer] || !frasesForaDeParell(fonts[fitxer], fitxer, new Set()).some((l) => l.includes(` const ${nom} «`));
    });
    expect(sobren).toEqual([]);
  });

  test('la regla mossega (sonda)', () => {
    const font = [
      "const AVIS = 'Hola món';",
      "const ETIQUETES = { search: 'Cercar notes', items: 'NOTES' };",
      "const TEXTOS = Object.freeze({ a: Object.freeze({ b: 'Frase niada ací' }) });",
      'function f(n) { return `Com a màxim ${n} caràcters`; }',
      "const g = (p) => (p ? 'en este dispositiu' : 'en esta pestanya');",
      "showToast('Imatge esborrada', 'success');",
      "const ETIQUETA = 'Avatar';",
      "const TECLES = { categories: 'CATEGORIES', tot: 'Tot', id: 'f-tot' };",
      "function h({ heroEditLabel = 'Editar capçalera' }, ajuda = 'Pots pujar una imatge') { return null; }",
      "setError('No s’ha pogut desar.'); estat.setMissatge({ tipus: 'error', text: 'Torna-ho a provar' });",
      "accions.push({ text: 'Tornar a provar', onClick }); alert('Fet i ben fet'); window.confirm('Segur que vols eixir?');",
      "const DOBLE = 'Una reserva pintada'; const P = ['section.x.doble', DOBLE]; avisa(DOBLE);",
      "export const PINTADA = 'Una reserva també pintada'; const Q = t('section.x.pintada', PINTADA); const el = <p>{PINTADA}</p>;",
      "const SOLA = 'Una reserva sola'; const R = Object.freeze({ s: ['section.x.sola', SOLA], c: { SOLA } });",
      'avisImatge?.(`Imatge de ${nom} pujada`);',
      "const OPCIONS = ['Primera opció', 'Segona opció']; setError('Cancel·lada'); const L = { loading: 'Carregant…', creating: 'CREANT…' };",
      "const PX = Object.freeze(['section.x.px', 'Una reserva llegida']); const el2 = <p>{PX[1]}</p>; export const PY = PX[1]; avisa(PY);",
      "avisa('Una frase directa a pèl'); onError?.('No s’ha pogut desar'); const [m] = useState('Frase en estat inicial');",
      "const el3 = <Avis text=\"Frase visible a pèl\" opcions={[{ label: 'Desar canvis' }]} />; el.setAttribute('aria-label', 'Tancar el quadre');",
      "node.textContent = 'Frase assignada a pèl'; class B { state = { missatge: 'Frase en estat de classe' }; }",
      "const ajudant = (nom, reserva = '') => [`section.x.${nom}`, reserva]; const el4 = <p>{ajudant('a', 'Reserva d’ajudant')[1]}</p>;",
    ].join('\n');
    expect(frasesForaDeParell(font)).toEqual([
      'font.jsx:1 const AVIS «Hola món»',
      'font.jsx:2 const ETIQUETES «Cercar notes»',
      'font.jsx:2 const ETIQUETES «NOTES»',
      'font.jsx:3 const TEXTOS «Frase niada ací»',
      'font.jsx:4 return «Com a màxim»',
      'font.jsx:5 fletxa «en este dispositiu»',
      'font.jsx:5 fletxa «en esta pestanya»',
      'font.jsx:6 showToast «Imatge esborrada»',
      'font.jsx:7 const ETIQUETA «Avatar»',
      'font.jsx:8 const TECLES «CATEGORIES»',
      'font.jsx:8 const TECLES «Tot»',
      'font.jsx:9 defecte ajuda «Pots pujar una imatge»',
      'font.jsx:9 defecte heroEditLabel «Editar capçalera»',
      'font.jsx:10 setError «No s’ha pogut desar.»',
      'font.jsx:10 setMissatge «Torna-ho a provar»',
      'font.jsx:11 alert «Fet i ben fet»',
      'font.jsx:11 confirm «Segur que vols eixir?»',
      'font.jsx:11 push «Tornar a provar»',
      'font.jsx:12 const DOBLE «Una reserva pintada»',
      'font.jsx:13 const PINTADA «Una reserva també pintada»',
      'font.jsx:14 const SOLA «Una reserva sola»',
      'font.jsx:15 avisImatge «Imatge de»',
      'font.jsx:16 const L «CREANT…»',
      'font.jsx:16 const L «Carregant…»',
      'font.jsx:16 const OPCIONS «Primera opció»',
      'font.jsx:16 const OPCIONS «Segona opció»',
      'font.jsx:16 setError «Cancel·lada»',
      'font.jsx:17 reserva llegida «Una reserva llegida»',
      'font.jsx:17 reserva llegida PY «Una reserva llegida»',
      'font.jsx:18 crida avisa «Una frase directa a pèl»',
      'font.jsx:18 crida onError «No s’ha pogut desar»',
      'font.jsx:18 crida useState «Frase en estat inicial»',
      'font.jsx:19 atribut opcions «Desar canvis»',
      'font.jsx:19 atribut text «Frase visible a pèl»',
      'font.jsx:19 setAttribute «Tancar el quadre»',
      'font.jsx:20 .textContent «Frase assignada a pèl»',
      'font.jsx:20 classe state «Frase en estat de classe»',
      'font.jsx:21 reserva llegida «Reserva d’ajudant»',
    ].sort());
  });

  test('deixa passar les reserves, les classes, els selectors i les dades (sonda)', () => {
    const font = [
      "const RESERVA = 'Una reserva sencera';",
      "const P = ['section.x.reserva', RESERVA];",
      "const Q = Object.freeze(['section.x.q', 'Text de parell']);",
      "const clau = (nom, reserva) => Object.freeze([`section.x.${nom}`, reserva]);",
      "const R = Object.freeze({ a: clau('a', 'Text del helper') });",
      "const TROS = 'un tros que només viu dins de reserves';",
      "const S = clau('s', `Una frase amb ${TROS}.`);",
      "const CLASSE = 'sdp-a sdp-b--c';",
      "const SEL = '.sdp-a .sdp-b button:not(:disabled)';",
      "const DESTINS = { title: '.editor-title-input', lead: '#lead', cos: '[data-cos]' };",
      "const RUTA = '/notes';",
      "const T = t('section.x.t', 'Text traduït'); const U = t?.('section.x.u', 'Un altre text');",
      "const MODE = 'original';",
      "function h({ etiqueta = tradueix(t, P) }, mida = 'sm') { setFase('carregant'); accions.push({ id: 'f-tot', onClick }); return etiqueta; }",
      "const V = tr('section.x.v', RESERVA_DE_FORA);",
      "setEstat({ fase: 'error', text: tradueix(t, Q) }); showToast(omple(tradueix(t, P), { n }), 'info');",
      "export const EXPORTADA = 'Una reserva exportada'; const W = t('section.x.exportada', EXPORTADA);",
      "const DE_LLISTA = 'Una altra reserva'; const X = ['section.x.llista', DE_LLISTA]; export { DE_LLISTA };",
      "const PZ = Object.freeze(['section.x.pz', 'Una reserva exportada del parell']); export const NASCUDA = PZ[1]; const Y = tradueix(t, PZ);",
      "const Z = t(PZ[0], PZ[1]); const AA = tradueix('section.x.aa', 'Text de tradueix'); const AB = ambNom('section.x.ab', 'Hola, {nom}');",
      "console.error('[Espai] Error creant l’element'); el.closest('ol.sdp-x, main'); text.startsWith('Heading 3 (punxa');",
      "const el = <a rel=\"noopener noreferrer\" className=\"sdp-a sdp-b\" aria-keyshortcuts=\"Meta+B Control+B\" data-x=\"a b\" onKey={f} />;",
      "const AC = textDe('Única'); onTecla('Escape'); x.name = 'ErrorPublicacio'; class C { static via = 'sdp-c'; }",
    ].join('\n');
    expect(frasesForaDeParell(font)).toEqual([]);
  });
});

/* B3 · P1-22 (marató 261101_2143) · LLEI DEL PÍXEL: LA RESERVA ÉS EL VALENCIÀ.
   t() torna dicc[clau] || CA[clau] || reserva: si la reserva d'un fitxer
   divergix del valor valencià (un apòstrof recte per un de tipogràfic, unes
   cometes, un espai), en valencià es pinta el diccionari i fora de l'app la
   reserva, i un dels dos ha canviat un píxel. Es comprova cada reserva dels
   FITXERS: ['clau', 'text'], t('clau', 'text') / tr / tradueix / ambNom i els
   ajudants de prefix, també quan la reserva és una constant, un membre d'una
   constant (TEXTOS.x, P[1], també dins d'un Object.freeze), una plantilla
   amb constants (`… ${FITXERS_EN_US}.`) o una suma de trossos ('…' + '…').
   Una reserva que no es pot calcular sense executar (una prop, una crida) no
   es compara; però cada fitxer n'ha de tindre almenys una de calculable, o
   l'escàner s'hauria quedat cec (un ajudant amb una forma que no reconeix).
   I cada ajudant de prefix ha de ser d'una línia, const i (nom, reserva),
   com el llig i18n.usades.test.js (AJUDANT): si no, les seues claus deixen
   de comprovar-se allà en silenci (risc 6 de l'especificació B3-I18N). */
function avaluador(programa, ajudants = ajudantsDePrefix(programa)) {
  const inits = new Map();
  recorre(programa, (node) => {
    if (node.type !== 'VariableDeclaration') return;
    for (const d of node.declarations) {
      if (d.id?.type !== 'Identifier') continue;
      /* Un nom declarat dues voltes (o amb let/var) no té un valor fix: no es calcula. */
      inits.set(d.id.name, inits.has(d.id.name) || node.kind !== 'const' ? null : d.init);
    }
  });
  /* { clau, reserva } d'un parell literal o d'una crida a un ajudant de prefix, o null. */
  const parellDe = (n) => {
    if (esParell(n)) return { clauNode: n.elements[0], reserva: n.elements[1] };
    const ajudant = esCrida(n) && n.callee?.type === 'Identifier' ? ajudants.get(n.callee.name) : null;
    return ajudant && n.arguments[ajudant.iClau]?.type === 'StringLiteral' ? { clauNode: null, reserva: n.arguments[ajudant.iReserva] } : null;
  };
  /* El node al qual es resol una expressió de constants: un Identifier const, un Object.freeze(…), un membre OBJ.clau o X[n]. */
  const nodeDe = (node, fondaria = 0) => {
    if (!node || fondaria > 8) return undefined;
    if (node.type === 'Identifier') return inits.get(node.name) ? nodeDe(inits.get(node.name), fondaria + 1) : undefined;
    if (esCrida(node) && esFreeze(node.callee)) return nodeDe(node.arguments[0], fondaria + 1);
    if (node.type !== 'MemberExpression') return node;
    const objecte = nodeDe(node.object, fondaria + 1);
    const nom = !node.computed ? node.property?.name
      : ['StringLiteral', 'NumericLiteral'].includes(node.property?.type) ? node.property.value : undefined;
    if (nom === undefined) return undefined;
    if (objecte?.type === 'ObjectExpression') {
      const p = objecte.properties.find((q) => q.type === 'ObjectProperty' && !q.computed && nomDeClau(q.key) === String(nom));
      return p ? nodeDe(p.value, fondaria + 1) : undefined;
    }
    const parell = parellDe(objecte);
    if (parell && (nom === 0 || nom === 1)) return nom === 0 ? parell.clauNode ?? undefined : nodeDe(parell.reserva, fondaria + 1);
    return objecte?.type === 'ArrayExpression' && typeof nom === 'number' ? nodeDe(objecte.elements[nom], fondaria + 1) : undefined;
  };
  const avalua = (node, fondaria = 0) => {
    if (!node || fondaria > 8) return undefined;
    switch (node.type) {
      case 'StringLiteral': return node.value;
      case 'TemplateLiteral': {
        let text = node.quasis[0].value.cooked;
        for (let i = 0; i < node.expressions.length; i += 1) {
          const tros = avalua(node.expressions[i], fondaria + 1);
          if (tros === undefined || text == null) return undefined;
          text += tros + node.quasis[i + 1].value.cooked;
        }
        return text ?? undefined;
      }
      case 'BinaryExpression': {
        if (node.operator !== '+') return undefined;
        const [a, b] = [avalua(node.left, fondaria + 1), avalua(node.right, fondaria + 1)];
        return a === undefined || b === undefined ? undefined : a + b;
      }
      case 'ParenthesizedExpression': return avalua(node.expression, fondaria + 1);
      case 'Identifier': return inits.get(node.name) ? avalua(inits.get(node.name), fondaria + 1) : undefined;
      case 'MemberExpression': {
        const resolt = nodeDe(node, fondaria + 1);
        return resolt && resolt.type !== 'MemberExpression' ? avalua(resolt, fondaria + 1) : undefined;
      }
      default: return undefined;
    }
  };
  /* El text d'X[1] quan X és un parell (literal o d'ajudant): la reserva llegida a mà, sense passar pel traductor. */
  const reservaLlegida = (node) => {
    if (node?.type !== 'MemberExpression' || !node.computed || node.property?.type !== 'NumericLiteral' || node.property.value !== 1) return undefined;
    const parell = parellDe(nodeDe(node.object));
    return parell ? avalua(parell.reserva) : undefined;
  };
  return { avalua, reservaLlegida };
}

/** { comprovades, divergents, cecs }: quantes reserves s'han pogut calcular, cada una que no és CA[clau] i cada ajudant que i18n.usades no veu. */
function revisaReserves(font, fitxer = 'font.jsx') {
  const ast = parse(font, { sourceType: 'module', plugins: ['jsx'] });
  const { ajudants, reserves, avalua } = analitza(ast.program);
  let comprovades = 0;
  const divergents = [];
  for (const { node, clau, reserva } of reserves) {
    const text = avalua(reserva);
    if (text === undefined) continue;
    comprovades += 1;
    if (CA[clau] !== text) divergents.push(`${fitxer}:${node.loc.start.line} ${clau} «${text}» ≠ «${CA[clau]}»`);
  }
  const cecs = [...ajudants].filter(([, a]) => a.cec).map(([nom, a]) => `${fitxer}:${a.linia} ajudant ${nom}`);
  return { comprovades, divergents: divergents.sort(), cecs: cecs.sort() };
}

/** Tot el que la Llei del Píxel retrau a un fitxer de la llista. Un fitxer que passa pel traductor porta reserves seues;
    si totes viuen en un mòdul de textos, el mòdul també va a la llista. */
function problemesDeReserves(font, fitxer = 'font.jsx') {
  const { comprovades, divergents, cecs } = revisaReserves(font, fitxer);
  return [...divergents, ...cecs, ...(comprovades > 0 ? [] : [`${fitxer} cap reserva calculable`])];
}

describe('B3 · P1-22 · Llei del Píxel: cada reserva dels FITXERS és el valor valencià', () => {
  test.each(FITXERS)('%s', (fitxer) => {
    expect(problemesDeReserves(readFileSync(path.join(ARREL, fitxer), 'utf8'), fitxer)).toEqual([]);
  });

  test('la comprovació mossega (sonda)', () => {
    const font = [
      "const RESERVA = 'Tornar a provar';",
      "const P = ['common.cancela', 'Cancelar'];",
      "const Q = ['common.cancela', RESERVA];",
      'const clau = (nom, reserva) => Object.freeze([`common.${nom}`, reserva]);',
      "const R = clau('cancela', 'Cancel·lar');",
      "const S = t('common.cancela', 'Cancel·la');",
      "const TROS = 'lar';",
      "const U = clau('cancela', 'Cancel·' + `${TROS} `);",
      "const V = t?.('common.cancela', `Cancel·${TROS}`);",
      "const W = tr('common.cancela', \"Cancel'lar\");",
      "const X = clau('cancela', reservaDeFora);",
      "const SENSE = t('sense punt', 'Qualsevol'); const NI = t('common.cancela');",
      "const OBJ = Object.freeze({ boto: 'Cancela', ok: 'Cancel·lar' }); const AA = ['common.cancela', OBJ.boto]; const AB = ['common.cancela', OBJ.ok];",
      "const AC = ['common.cancela', P[1]]; const AD = tradueix('common.cancela', 'Cancel·lar.'); const AE = ambNom('common.cancela', 'Cancel·lar');",
    ].join('\n');
    /* common.cancela és «Cancel·lar»: divergixen la 2, la 3 (per la constant), la 6, la 8 (l'espai del final), la 10
       (l'apòstrof), la 13 (OBJ.boto), la 14 (P[1] i el punt de tradueix); la 5, la 9, OBJ.ok i ambNom són idèntiques; la 11
       no es pot calcular, i la 12 no té cap clau (t('sense punt'…)) ni cap reserva. */
    expect(CA['common.cancela']).toBe('Cancel·lar');
    const { comprovades, divergents, cecs } = revisaReserves(font);
    expect(divergents.map((l) => l.split(' ')[0])).toEqual(['font.jsx:10', 'font.jsx:13', 'font.jsx:14', 'font.jsx:14', 'font.jsx:2',
      'font.jsx:3', 'font.jsx:6', 'font.jsx:8']);
    expect(comprovades).toBe(12);
    expect(cecs).toEqual([]);
  });

  test('un ajudant que i18n.usades no veu es marca i es comprova, i un fitxer sense reserves pròpies no en té cap de calculable (sonda)', () => {
    const partit = [
      'const clau = (nom, reserva) =>',
      '  Object.freeze([`common.${nom}`, reserva]);',
      'let solt = (nom, reserva) => [`common.${nom}`, reserva];',
      'const senseDot = (nom, reserva) => [`common${nom}`, reserva];',
      "const R = clau('cancela', 'Cancelar');",
      "const ambDefecte = (nom, reserva = '') => Object.freeze([`common.${nom}`, reserva]); const S = ambDefecte('cancela', 'Cancela');",
      "const sumat = (nom, reserva) => ['common.' + nom, reserva]; const T = sumat('cancela', 'Cancel-lar');",
      "const girat = (reserva, nom) => [`common.${nom}`, reserva]; const U = girat('Cancel.lar', 'cancela');",
      "const amplia = (nom, reserva, nota) => [`common.${nom}`, reserva]; const V = amplia('cancela', 'Cancel·lar', 'x');",
    ].join('\n');
    expect(revisaReserves(partit)).toEqual({
      comprovades: 5,
      divergents: ['font.jsx:5 common.cancela «Cancelar» ≠ «Cancel·lar»', 'font.jsx:6 common.cancela «Cancela» ≠ «Cancel·lar»',
        'font.jsx:7 common.cancela «Cancel-lar» ≠ «Cancel·lar»', 'font.jsx:8 common.cancela «Cancel.lar» ≠ «Cancel·lar»'],
      cecs: ['font.jsx:1 ajudant clau', 'font.jsx:3 ajudant solt', 'font.jsx:4 ajudant senseDot', 'font.jsx:6 ajudant ambDefecte',
        'font.jsx:7 ajudant sumat', 'font.jsx:8 ajudant girat', 'font.jsx:9 ajudant amplia'],
    });
    const funcio = [
      'function clau(nom, reserva) { return Object.freeze([`common.${nom}`, reserva]); }',
      "const R = clau('cancela', 'Cancelar');",
    ].join('\n');
    expect(revisaReserves(funcio)).toEqual({
      comprovades: 1,
      divergents: ['font.jsx:2 common.cancela «Cancelar» ≠ «Cancel·lar»'],
      cecs: ['font.jsx:1 ajudant clau'],
    });
    const importades = "import { P } from './textos.js';\nconst a = tradueix(t, P);";
    expect(revisaReserves(importades)).toEqual({ comprovades: 0, divergents: [], cecs: [] });
    expect(problemesDeReserves(importades)).toEqual(['font.jsx cap reserva calculable']);
    expect(problemesDeReserves("const P = ['common.cancela', 'Cancel·lar'];")).toEqual([]);
  });
});

/* Les .jsx porten JSX; les .js són mòduls (exporten alguna cosa). */
function formaDeLaFont(fitxer, font) {
  if (!/\.jsx?$/.test(fitxer)) return false;
  const { program } = parse(font, { sourceType: 'module', plugins: ['jsx'] });
  if (fitxer.endsWith('.js')) return program.body.some((n) => n.type.startsWith('Export'));
  let jsx = false;
  recorre(program, (n) => { if (n.type === 'JSXElement' || n.type === 'JSXFragment') jsx = true; });
  return jsx;
}

describe('la guarda mossega (sonda)', () => {
  test('troba cada forma d’un literal visible', () => {
    const font = [
      "export const OPCIONS = [{ valor: 'm', etiqueta: 'Membre' }];",
      "export function A({ titol = 'Per defecte', esJo }) {",
      '  return (',
      '    <div>',
      '      <p>Hola</p>',
      '      <B aria-label="Tanca" titol={\'Títol\'} ajuda={`Escriu ${n} lletres`} etiqueta={esJo ? \'Sí\' : \'No\'} />',
      "      <p>{esJo ? ' (tu)' : ''}{'Llevar'}</p>",
      "      <D etiquetaDesa=\"Desa\" titolDialeg={'Retalla'} aria-label={omple('Llevar: {nom}', { nom })} />",
      '    </div>',
      '  );',
      '}',
      "const AVIS = omple(`${n} fotos de {nom}`, { nom });",
      "const RECOMPTE = moderacio.omple('Queden {n}', { n });",
      "const PUNTS = { title: '...i més' };",
      'const CLAUDATOR = <span title="[Esborrany] Sense títol" aria-label="#Fira del poble" />;',
    ].join('\n');
    expect(literalsVisibles(font)).toEqual([
      'font.jsx:1 etiqueta «Membre»',
      'font.jsx:2 titol «Per defecte»',
      'font.jsx:5 JSXText «Hola»',
      'font.jsx:6 aria-label «Tanca»',
      'font.jsx:6 ajuda «Escriu»',
      'font.jsx:6 ajuda «lletres»',
      'font.jsx:6 etiqueta «No»',
      'font.jsx:6 etiqueta «Sí»',
      'font.jsx:6 titol «Títol»',
      'font.jsx:7 fill «(tu)»',
      'font.jsx:7 fill «Llevar»',
      'font.jsx:8 etiquetaDesa «Desa»',
      'font.jsx:8 titolDialeg «Retalla»',
      'font.jsx:8 omple «Llevar: {nom}»',
      'font.jsx:12 omple «fotos de {nom}»',
      'font.jsx:13 omple «Queden {n}»',
      'font.jsx:14 title «...i més»',
      'font.jsx:15 aria-label «#Fira del poble»',
      'font.jsx:15 title «[Esborrany] Sense títol»',
    ].sort());
  });

  test('deixa passar el traductor, les classes, els buits, els selectors i els noms propis de les dades', () => {
    const font = [
      "const PARELL = ['section.x.hola', 'Hola'];",
      'export function A({ t, nom }) {',
      '  return (',
      '    <div className="perfil-compte__text" role="status">',
      "      <p aria-label={`${t('section.x.tanca', 'Tanca')}: ${nom}`}>{t('section.x.hola', 'Hola')}</p>",
      "      <B titol={tradueix(t, PARELL)} alt=\"\" etiqueta={omple(t('section.x.n', '{n} lletres'), { n: 2 })} />",
      "      {' '}{nom || '—'}{' · '}",
      "      <D etiquetaDesa={t('section.x.desa', 'Desa')} etiquetaId=\"\" aria-label={omple('{nom} · {org}', { nom, org })} />",
      '    </div>',
      '  );',
      '}',
      "const etiquetaDeRol = (rol) => omple(tradueix(t, PARELL), { rol });",
      "const DESTINS_FOCUS = { title: '.editor-title-input', subtitle: '#subtitol', lead: '[data-lead] textarea' };",
    ].join('\n');
    expect(literalsVisibles(font)).toEqual([]);
  });

  test('les fonts de la llista existixen: les .jsx porten JSX i les .js són mòduls', () => {
    expect(FITXERS_AUDITATS_P122.length).toBeGreaterThanOrEqual(105);
    expect(new Set(FITXERS_AUDITATS_P122).size).toBe(FITXERS_AUDITATS_P122.length);
    for (const fitxer of FITXERS) {
      expect([fitxer, formaDeLaFont(fitxer, readFileSync(path.join(ARREL, fitxer), 'utf8'))]).toEqual([fitxer, true]);
    }
  });

  test('la forma de la font mossega (sonda)', () => {
    expect(formaDeLaFont('a.js', "import x from './x.js';\n// export no és cap export\nconst y = `\nexport const z = 1;`;")).toBe(false);
    expect(formaDeLaFont('a.js', "const y = 1;\nexport { y };")).toBe(true);
    expect(formaDeLaFont('a.jsx', "export const z = (a, b) => a<b;")).toBe(false);
    expect(formaDeLaFont('a.jsx', 'export const A = () => <p />;')).toBe(true);
    expect(formaDeLaFont('a.ts', 'export const z = 1;')).toBe(false);
  });

  /* B3 (marató 261101_2143) · Una llavor és dada (els noms de carpeta van a
     app_content.noteFolders i el folder_id hi apunta): traduir-la la
     corrompria. Es tradueix en pintar (carpetes.js), mai la llavor. */
  test('cap llavor de dades no entra a la llista', () => {
    expect(FITXERS.filter((fitxer) => /Seed\.js$/.test(fitxer))).toEqual([]);
  });
});

/* B3 · P1-22 · A (marató 261101_2143) · LES CARPETES DE SÈRIE. carpetesSeed.js
   no entra a FITXERS: els noms de la llavor són dades (app_content.noteFolders,
   i el folder_id hi apunta). El nom es tradueix en pintar (carpetes.js ·
   nomDeCarpeta), i només si és encara el de la llavor. Com la resta del
   fitxer, sense importar cap mòdul de producció: es lligen les dues fonts. */
describe('B3 · P1-22 · A · les carpetes de sèrie es tradueixen en pintar, amb el nom de la llavor de reserva', () => {
  const programaDe = (ruta) => parse(readFileSync(path.join(ARREL, ruta), 'utf8'), { sourceType: 'module', plugins: ['jsx'] }).program;
  const initDe = (programa, nom) => {
    let init = null;
    recorre(programa, (n) => { if (n.type === 'VariableDeclarator' && n.id?.name === nom) init = n.init; });
    return init;
  };
  const senseFreeze = (n) => (esCrida(n) && esFreeze(n.callee) ? n.arguments[0] : n);
  /* id → nom, de NOTE_FOLDERS_SEED. */
  const llavor = programaDe('src/data/carpetesSeed.js');
  const { avalua: avaluaLlavor } = avaluador(llavor);
  const NOMS_LLAVOR = new Map(senseFreeze(initDe(llavor, 'NOTE_FOLDERS_SEED')).elements.map((carpeta) => {
    const camp = (nom) => avaluaLlavor(carpeta.properties.find((p) => nomDeClau(p.key) === nom)?.value);
    return [camp('id'), camp('name')];
  }));
  /* id → { clau, reserva }, de NOMS_CARPETES_DE_SERIE (un ajudant de prefix per entrada). */
  const carpetes = programaDe('src/sections/notes/carpetes.js');
  const ajudants = ajudantsDePrefix(carpetes);
  const { avalua } = avaluador(carpetes, ajudants);
  const DE_SERIE = new Map(senseFreeze(initDe(carpetes, 'NOMS_CARPETES_DE_SERIE')).properties.map((p) => {
    const ajudant = ajudants.get(p.value?.callee?.name);
    const clau = ajudant ? ajudant.prefix + p.value.arguments[ajudant.iClau]?.value : null;
    return [nomDeClau(p.key), { clau, reserva: ajudant ? avalua(p.value.arguments[ajudant.iReserva]) : undefined }];
  }));

  test('cada reserva és el nom de la llavor amb el mateix id, i la clau és als cinc diccionaris', () => {
    expect(DE_SERIE.size).toBe(7);
    for (const [id, { clau, reserva }] of DE_SERIE) {
      expect([id, reserva]).toEqual([id, NOMS_LLAVOR.get(id)]);
      expect([id, clau, CA[clau]]).toEqual([id, clau, reserva]);
      for (const dic of [ES, EN, EU, GL]) expect([clau, typeof dic[clau], Boolean(dic[clau])]).toEqual([clau, 'string', true]);
    }
  });

  test('totes les de la llavor en tenen, menys «Tot» (no es pinta) i la Safata d’Entrada (nom propi, D-1)', () => {
    expect([...NOMS_LLAVOR.keys()].filter((id) => !DE_SERIE.has(id))).toEqual(['f-tot', 'f-connectats']);
  });
});

/* T5a · D-9 (assalt 261101) · POLIMENT D'EU I GL. Els valors que s'havien
   quedat en valencià (claus de la Consola, el Control, la Gestoria, els
   Dispositius i el perfil antic) ja no ho tornen a ser, i la nota dels ajustos
   del xat cita «Privacitat i dades» amb el nom que l'apartat té en cada
   llengua. La revisió nadiua humana continua pendent per al 10/10. */
describe('D-9 · eu i gl sense valencià que s’hi haja quedat', () => {
  const POLIDES = {
    eu: ['section.dispositius.kicker', 'section.dispositius.title', 'section.dispositius.subtitle', 'section.control.kicker',
      'section.gestoria.kicker', 'section.gestoria.title', 'section.gestoria.subtitle', 'section.gestoria.meta2',
      'section.consola.title', 'section.consola.subtitle', 'section.consola.lead'],
    gl: ['section.control.kicker', 'section.gestoria.kicker', 'section.gestoria.title', 'section.gestoria.subtitle',
      'section.gestoria.meta2', 'section.consola.title', 'section.consola.subtitle', 'section.consola.lead',
      'section.myprofile.success', 'section.myprofile.error', 'section.myprofile.title', 'section.myprofile.subtitle'],
  };
  const DICS = { es: ES, en: EN, eu: EU, gl: GL };

  test.each(Object.keys(POLIDES))('%s: cap de les claus polides no és el valor valencià', (codi) => {
    expect(POLIDES[codi].filter((clau) => typeof DICS[codi][clau] !== 'string' || DICS[codi][clau] === CA[clau])).toEqual([]);
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: la nota de «Privacitat» del xat cita l’apartat amb el seu nom en la mateixa llengua', (codi) => {
    const dic = codi === 'ca' ? CA : DICS[codi];
    const apartat = dic['section.perfil.privacitat.pagina.titol'];
    for (const clau of ['section.xat.ajustos.privacitat.nota', 'section.xat.ajustos.privacitat.notaSense']) {
      expect([clau, dic[clau].includes(apartat)]).toEqual([clau, true]);
      if (codi !== 'ca') expect([clau, dic[clau].includes(CA['section.perfil.privacitat.pagina.titol'])]).toEqual([clau, false]);
    }
  });
});
