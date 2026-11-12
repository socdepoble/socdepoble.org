import { BookOpen, Coffee, HeartHandshake, HeartPulse, Landmark, Receipt, ShoppingCart, Users } from 'lucide-react';
import { rutaDeApp } from '../../apps/plataforma/manifestApp.js';
import { rutaDeLaFitxa } from '../control/destiSnippet.js';
import { metadadesAplicacioDelNode, metadadesDatesDelPerfil } from './datesDelPerfil.js';

/* La ruta del Panell de Control (App.jsx, <Route path="/control">): la fitxa del Snippet hi penja. */
const RUTA_PANELL = '/control';

/* ═══════════════════════════════════════════════════════════════════
   APLICACIONS DEL PERFIL · configuració pura (sense React)

   Cada entrada és una utilitat que el Perfil mostra al grup APLICACIONS
   de la primera columna. Una utilitat nova s'endolla afegint-hi una
   entrada; una altra instància federada de Sóc de Poble pot passar la
   seua pròpia llista a PerfilShell (propietat `aplicacions`).

     · id          identificador estable: minúscules, xifres i guions
     · nom         el que es llig a la navegació i al títol de la pàgina
     · descripcio  una frase: què fa
     · icona       component de lucide-react (opcional)
     · estat       'pendent' (este node no té la secció) o 'connectada'
     · ruta        només amb 'connectada': la ruta interna de la secció
     · panell      l'id amb què el Panell de Control llig la preferència
                   «Mostrar al Panell» d'esta utilitat: el del registre de
                   plugins (sections/plugins/registrePlugins.js) o
                   'snippet'. Sense, el mateix id (opcional). Un `null`
                   EXPLÍCIT vol dir que la utilitat no té targeta al Panell:
                   la seua fitxa no oferix cap preferència (Onada 10)
     · intern      true: maquinària interna de desenvolupament; el Perfil
                   només la mostra a qui és superadmin (opcional; sense,
                   la veu tothom)

   Ordre del Mestre (261007, prompt 261007_1628, peça C) · El Perfil escrivia
   la preferència amb l'id de l'aplicació i el Panell l'amagava per l'id del
   registre: «Ocultar del Panell» de la Consola de Mètriques ('metriques') i
   del Lector RSS ('lector-rss') no feia res. La correspondència viu NOMÉS
   ací (`panell`): DetallEspai llig i escriu amb ella, i utilitatsActives.js
   tradueix les preferències desades abans amb l'id vell (ALIES_DEL_PANELL).
   L'id de l'aplicació no canvia: és el de la navegació del Perfil.

   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
   targetes «Consola Termodinàmica» i «El Cervell» ixen del Panell de Control
   i viuen només al Mur. La «Consola de Mètriques» i el «Cervell (Node
   Graph)» es queden a la navegació del Perfil, però amb `panell: null`: ja
   no hi ha cap targeta que mostrar ni que ocultar, i un botó que no fa res
   està vetat (DetallEspai.jsx; és la mateixa falla que va arreglar la peça
   C). DEROGAT, per a estes dues: `panell: 'consola'` per a les Mètriques
   (peça C) i l'id 'cervell' com a clau del Panell (Onada 8, quan les pintava
   «Maquinària i Sistema»). Les preferències que algú ja tinga desades amb
   'consola', 'cervell', 'disseny' o 'metriques' es queden al storage, sense
   efecte: no s'esborra res.

   Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   La Consola de Mètriques («Monitorització i auditoria de la IA») i el
   Cervell (el mateix codi l'anomena «maquinària interna del Mas») porten
   `intern: true`: l'aside APLICACIONS del Perfil només les mostra a qui és
   superadmin (PerfilShell.jsx), com la ruta /consola en producció. No
   s'esborra cap preferència desada.

   Encàrrec d'harmonització (261018, ordre del Mestre) · El catàleg és el
   complet del Panell de Control, en este ordre: Gestoria de Poble, Rebost
   Domèstic, Salut, Lector RSS (abans «Curation AI (Lector RSS)»: un nom llarg
   que es tallava a la columna), TPV del Bar i Snippet. La Consola de Mètriques
   i el Cervell, internes, van darrere i només per a superadmin.

   R19 · T3 (ordre del Mestre, 261111; pla 261111_1720: «sincronització
   d'aplicacions.js perquè totes les eines del Panell de Control funcionen al
   100%») · Cada utilitat amb destí real en este node és 'connectada', amb la
   mateixa ruta que «Obrir…» de la seua targeta del Panell
   (registrePlugins.js, `obrir`): Gestoria /app/gestoria, Rebost
   /app/nevera/casa, Salut /app/salut, Arbre Genealògic /app/genealogia,
   L'Avisador /page/avisador, Lector RSS /app/lector i TPV del Bar /app/bar.
   La governa el MATEIX literal de build que l'app (el `carrega` del seu
   manifest, import.meta.env.VITE_SDP_APP_<ID> !== '0') o que L'Avisador
   (App.jsx i registrePlugins.js): un build que la trau (=0; el paquet de
   l'amfitrió ho fa sempre amb Salut, la Gestoria i l'Arbre,
   vite.standalone.config.js) la deixa 'pendent' i sense ruta, i la fitxa no
   enllaça res. En temps d'execució, la ruta /app/<id> passa pels interruptors
   de la plataforma (RutaApps.jsx): si esta persona o este document no la
   poden obrir, la pàgina ho explica (AvisApp), mai un 404 mut. La Consola de
   Mètriques i el Cervell no tenen cap ruta pròpia al Perfil i continuen
   'pendent'. registrePlugins.test.js comprova que cada ruta connectada la
   servix App i que és la de la targeta del Panell.
   Arbitratge del carril Genealogia + Perfil (P1) · Tres correccions:
     · La Gestoria, Salut i l'Arbre Genealògic, que el paquet de l'amfitrió
       no porta mai, no tenen fitxa en un build que les trau
       (nomesSiElBuildLaPorta): una fitxa 'pendent' prometria una connexió
       que no arribarà. DEROGAT, per a estes tres, «amb =0 la fitxa queda
       'pendent' i sense ruta».
     · El Snippet és 'connectada': la seua fitxa del Panell
       (/control?fitxa=snippet) és la seua secció. DEROGAT «El Snippet … no
       té cap ruta pròpia al Perfil i continua 'pendent'».
     · La configuració diu si este build porta la secció; si ARA i ACÍ es pot
       obrir ho decidix la porta de la plataforma, la mateixa de la pàgina del
       plugin (useDestiDelPlugin, a DetallEspai.jsx): sense, cap enllaç.
   DEROGAT «Cap encara no té una ruta connectada des del Perfil: totes són
   'pendent'.». La fitxa de les que tenen targeta al Panell continua
   permetent triar si hi apareixen; la de les dues internes només en diu
   l'estat.
   ═══════════════════════════════════════════════════════════════════ */

/* R19 · T3 · L'estat i la ruta d'una utilitat segons el seu interruptor de
   build: el literal es queda a cada entrada (Vite el plega i el paquet de
   l'amfitrió el fixa), i ací només se'n fa la parella { estat, ruta }. Val
   per a les apps que qui porta la web pot afegir al seu paquet
   (VITE_SDP_APP_<ID>=1 al monolític, vite.standalone.config.js): fins
   llavors, la fitxa és 'pendent' i diu que es connectarà, i és cert. */
const destiDelBuild = (compilada, ruta) => (compilada ? { estat: 'connectada', ruta } : { estat: 'pendent' });

/* R19 · Arbitratge del carril Genealogia + Perfil (P1, tractor-promesa) · La
   Gestoria, Salut i l'Arbre Genealògic no poden entrar MAI al paquet de
   l'amfitrió: vite.standalone.config.js hi fixa la variable a '0' «Sempre …
   Cap variable de l'entorn ho canvia» (DADES_NOMES_AL_DOCUMENT_PROPI). Una
   fitxa 'pendent' prometria «Quan s'hi connecte, s'obrirà des d'ací mateix»,
   i no passarà. Com L'Avisador amb =0, la fitxa no hi és; amb el build que
   la porta, és 'connectada'. Al Panell, la seua targeta fa el mateix
   (registrePlugins.js, GESTORIA_COMPILADA, SALUT_COMPILADA i
   GENEALOGIA_COMPILADA). */
const nomesSiElBuildLaPorta = (compilada, entrada) => (compilada ? [aplicacioDelNode({ ...entrada, estat: 'connectada' })] : []);

export const ESTATS_APLICACIO = Object.freeze({
  pendent: 'Pendent de connectar en este node',
  connectada: 'Connectada en este node',
  /* R19 · Arbitratge del carril (P1) · Connectada, però ací no es pot obrir:
     la persona l'ha desactivada, qui porta la web no l'ha encesa o el
     document no és el de Sóc de Poble. El motiu, el de la plataforma
     (DetallEspai.jsx). */
  noDisponible: 'No disponible ací',
});

/* R55 · Només el catàleg local rep les dates canòniques. El validador de
   llistes federades no les resol per ID: conserva les que aporte cada node. */
const aplicacioDelNode = entrada => Object.freeze({ ...entrada, ...metadadesAplicacioDelNode(entrada.id) });

export const APLICACIONS = Object.freeze([
  ...nomesSiElBuildLaPorta(import.meta.env.VITE_SDP_APP_GESTORIA !== '0', {
    id: 'gestoria',
    nom: 'Gestoria de Poble',
    descripcio: 'Comptabilitat i facturació trimestral.',
    icona: Receipt,
    ruta: rutaDeApp('gestoria'),
    panell: 'gestoria',
  }),
  aplicacioDelNode({
    id: 'rebost',
    nom: 'Rebost Domèstic',
    descripcio: 'La nevera i el rebost de casa.',
    icona: ShoppingCart,
    ...destiDelBuild(import.meta.env.VITE_SDP_APP_NEVERA !== '0', rutaDeApp('nevera', 'casa')),
    panell: 'rebost',
  }),
  ...nomesSiElBuildLaPorta(import.meta.env.VITE_SDP_APP_SALUT !== '0', {
    id: 'salut',
    nom: 'Salut',
    descripcio: 'Un quadern per a cuidar dels nostres.',
    icona: HeartHandshake,
    ruta: rutaDeApp('salut'),
    panell: 'salut',
  }),
  ...nomesSiElBuildLaPorta(import.meta.env.VITE_SDP_APP_GENEALOGIA !== '0', {
    id: 'genealogia',
    nom: 'Arbre Genealògic',
    descripcio: 'La memòria de la família, els malnoms i els masos.',
    /* R19 · Loop 1 · La icona del seu manifest (apps/genealogia/manifest.js,
       icona: 'Users'). Abans, HeartHandshake, la de Salut. */
    icona: Users,
    ruta: rutaDeApp('genealogia'),
    panell: 'genealogia',
  }),
  /* P0-114 (ordre del Mestre, 261111) · L'Avisador torna a «La llar» del
     Panell, i la persona el pot llevar del Panell des d'ací, com les altres
     utilitats (`panell`, l'id del registre de plugins). Governat pel mateix
     literal de build que el registre i App.jsx: amb VITE_SDP_APP_AVISADOR=0
     no hi ha fitxa.
     R19 · T3 (261111) · Amb fitxa, sempre té la seua pàgina (la mateixa
     guarda munta <Route path="/page/avisador"> a App.jsx): 'connectada'. */
  ...(import.meta.env.VITE_SDP_APP_AVISADOR !== '0' ? [aplicacioDelNode({
    id: 'avisador',
    nom: 'L’Avisador',
    descripcio: 'Batec de Vida: un avís pel Xat a les teues persones de confiança.',
    icona: HeartPulse,
    estat: 'connectada',
    ruta: '/page/avisador',
    panell: 'avisador',
  })] : []),
  aplicacioDelNode({
    id: 'lector-rss',
    nom: 'Lector RSS',
    descripcio: 'Les notícies de les entitats del poble, juntes.',
    icona: BookOpen,
    ...destiDelBuild(import.meta.env.VITE_SDP_APP_LECTOR !== '0', rutaDeApp('lector')),
    panell: 'rss',
  }),
  aplicacioDelNode({
    id: 'tpv',
    nom: 'TPV del Bar',
    descripcio: 'La caixa del bar o del casino.',
    icona: Coffee,
    ...destiDelBuild(import.meta.env.VITE_SDP_APP_BAR !== '0', rutaDeApp('bar')),
    panell: 'tpv',
  }),
  /* R19 · Arbitratge del carril (P1) · El Snippet té secció en este node: la
     seua fitxa del Panell (/control?fitxa=snippet, FitxaSnippet.jsx), la
     mateixa ruta que obri la seua targeta (ControlSection.jsx,
     rutaDeLaFitxa). Abans, 'pendent': la fitxa del Perfil deia que no en
     tenia cap. */
  aplicacioDelNode({
    id: 'snippet',
    nom: 'Snippet',
    descripcio: 'Extensió de Chrome per a desar webs al Bloc.',
    icona: BookOpen,
    estat: 'connectada',
    ruta: rutaDeLaFitxa(RUTA_PANELL),
  }),
  aplicacioDelNode({
    id: 'metriques',
    nom: 'Consola de Mètriques',
    descripcio: 'Monitorització i auditoria de la IA.',
    icona: Landmark, // TODO proper icon
    estat: 'pendent',
    /* Onada 10 (261010) · Sense targeta al Panell: cap preferència. Abans, 'consola'. */
    panell: null,
    /* Gauntlet 261016 (Bloc 3.4) · Maquinària interna: només superadmin. */
    intern: true,
  }),
  aplicacioDelNode({
    id: 'cervell',
    nom: 'Cervell (Node Graph)',
    descripcio: 'Mapa visual de relacions i categories.',
    icona: Landmark,
    estat: 'pendent',
    /* Onada 10 (261010) · Sense targeta al Panell: cap preferència. Abans, el seu id. */
    panell: null,
    /* Gauntlet 261016 (Bloc 3.4) · Maquinària interna: només superadmin. */
    intern: true,
  }),
]);

const ID_VALID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const esText = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esRutaInterna = (ruta) => typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//');
const esComponent = (icona) => typeof icona === 'function' || (typeof icona === 'object' && icona !== null);

/**
 * La llista que el Perfil pot pintar sense prometre res: fora les entrades
 * sense id vàlid o sense nom i els ids repetits (guanya la primera). Una
 * utilitat 'connectada' sense ruta interna es pinta com a 'pendent'.
 * Peça C (261007) · `panell` sempre hi és: el declarat si és un id vàlid i,
 * si no, el mateix id. DetallEspai no ha de saber-ne la regla.
 * Onada 10 (261010; decisió del Mestre del 261010) · Un `null` EXPLÍCIT es
 * conserva: la utilitat no té targeta al Panell. Només el null: sense el
 * camp, o amb qualsevol altre valor que no siga un id vàlid (undefined, '',
 * majúscules), continua caient al mateix id, així una llista federada que
 * no el declara es comporta com abans.
 * Gauntlet 261016 (Bloc 3.4) · `intern` només s'hi posa quan és true: una
 * entrada sense la marca no porta cap clau nova (el mateix objecte de sempre).
 */
export function aplicacionsValides(llista) {
  if (!Array.isArray(llista)) return [];
  const vistos = new Set();
  const valides = [];
  for (const entrada of llista) {
    if (!entrada || !ID_VALID.test(String(entrada.id ?? '')) || !esText(entrada.nom) || vistos.has(entrada.id)) continue;
    vistos.add(entrada.id);
    const connectada = entrada.estat === 'connectada' && esRutaInterna(entrada.ruta);
    valides.push(Object.freeze({
      id: entrada.id,
      nom: entrada.nom.trim(),
      descripcio: esText(entrada.descripcio) ? entrada.descripcio.trim() : '',
      icona: esComponent(entrada.icona) ? entrada.icona : null,
      estat: connectada ? 'connectada' : 'pendent',
      ruta: connectada ? entrada.ruta : null,
      panell: entrada.panell === null || ID_VALID.test(String(entrada.panell ?? '')) ? entrada.panell : entrada.id,
      ...(entrada.intern === true ? { intern: true } : null),
      ...metadadesDatesDelPerfil(entrada),
    }));
  }
  return valides;
}

/**
 * Peça C (ordre del Mestre, 261007) · Les preferències desades abans amb l'id
 * de l'aplicació en lloc del del Panell: { 'lector-rss': 'rss' }. Ix de la
 * mateixa taula (APLICACIONS), cap segona font; utilitatsActives.js les
 * respecta mentre l'id del Panell no en tinga cap de pròpia.
 * Onada 10 (261010; decisió del Mestre del 261010) · DEROGAT l'àlies
 * 'metriques' → 'consola': la Consola ja no té targeta al Panell. Una
 * utilitat amb `panell: null` no fa cap àlies; sense este filtre, la
 * preferència vella es copiaria a una clau «null» del storage.
 */
export const ALIES_DEL_PANELL = Object.freeze(Object.fromEntries(
  aplicacionsValides(APLICACIONS).filter((aplicacio) => aplicacio.panell !== null && aplicacio.panell !== aplicacio.id)
    .map((aplicacio) => [aplicacio.id, aplicacio.panell])
));
