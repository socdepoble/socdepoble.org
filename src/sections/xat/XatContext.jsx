/**
 * XatContext.jsx — L'estat del xat (F0: Fonament).
 *
 * QUÈ FA I QUÈ NO
 * ───────────────
 *   · La identitat del xat és `getCurrentUser().id` (via SessionContext), no
 *     l'`actorId` d'IdentitatContext: a les rutes /e/:slug/* eixe valor és un
 *     SLUG i marcaria tots els missatges com a 'other'.
 *   · No formata cap hora: `ultimAl` i `creatAl` ixen en ISO i la interfície
 *     els formata amb el `locale` de `useUIState()` (XAT-P11).
 *   · No coneix el mode seed: si no hi ha Supabase, l'adaptador de dades ja
 *     delega a un magatzem local. Ací no queda cap identificador fictici.
 *
 * PER QUÈ AÇÒ MAI TORNA status:'error'
 * ────────────────────────────────────
 * Un mòdul no pot tombar la casa: l'error del xat es queda dins del xat, a
 * `avis`. Amb l'esquema del xat sense aplicar, `loadFils` llança i el Mur, el
 * Mercat i les Notes han de continuar en peu.
 *
 * ENVIAMENT FIABLE (ARQ-A02, ARQ-H02, ARQ-H03)
 * ────────────────────────────────────────────
 * Cada missatge naix amb un UUID generat ací i es pinta `pendent` ABANS de la
 * xarxa (llei L4 de tractor-persistencia). El servidor l'accepta una sola
 * vegada per `id`: un reintent no duplica res. Si l'error és retriable es
 * reintenta sol tres vegades (1 s, 2 s, 4 s més component aleatori); si no, o
 * si s'esgoten, la bombolla passa a `error` i es queda fins que la persona la
 * reintenta o la descarta (XAT-B25). `sendChatMessage` només llança un
 * AbortError, i només quan la persona no accepta les normes de convivència
 * (Fase D, 261020, tasca 2: la porta d'abans del primer missatge, vegeu
 * «Moderació» més avall); qui l'envia torna a posar el text al camp.
 * Gauntlet 261025_0545 · Els enviaments d'un mateix fil ixen d'un en un i en
 * l'ordre en què s'escriuen (encuaEnviament), i sense xarxa (navigator.onLine
 * fals) una fallada de xarxa no gasta reintents: la bombolla es queda
 * `pendent` fins que torna la xarxa o la pàgina, amb el mateix id (XC-03).
 * Gauntlet 261025_0545 (D2) · Eixa espera és per a la conversa que la persona
 * té davant. Qui envia per programa i espera cada enviament (Connectar)
 * passa `{ esperaLaXarxa: false }`: els reintents de sempre i una resposta
 * acotada, i si el fil ja té una bombolla que espera la xarxa, la seua queda
 * en error sense eixir (ni passa davant ni s'hi queda).
 *
 * MODERACIÓ (Fase D, 261020, tasca 2; pla 261020_1300)
 * ────────────────────────────────────────────────────
 * Amb ProveidorModeracio (App.jsx) per damunt, el que has bloquejat s'amaga
 * a la font: els missatges d'una persona bloquejada arriben anotats
 * (`bloquejat: true`, sense text ni metadades) a getThreadMessages i a
 * chatMessages, la vista prèvia del fil s'amaga (`ultimAmagat`), cap avís no
 * en salta, i els directes amb ella no compten als no llegits ni als
 * contactes freqüents. Les dades crues (missatgesPerFil, fils, cursors) no
 * es toquen: la lectura, les marques i el seq continuen. Els missatges
 * signats per una entitat no s'anoten mai (config/moderacio.js). L'únic
 * `sendChatMessage` que s'exposa passa per la porta de les normes
 * (asseguraNormes); el relleu intern (accionsRef) continua cru.
 * Integració 261024 (Codex C-02) · Si el servidor rebutja igualment un
 * missatge o un adjunt per les normes (SDP-MOD-428), la porta es torna a obrir
 * (asseguraNormes({ rebutjades: true })) i, si les accepta, s'envia de nou
 * UNA sola vegada amb el mateix id; mai en bucle. El xat públic de /iaia ja
 * passa per la porta; el privat amb la IAIA, no.
 *
 * TEMPS REAL I SONDEIG (ARQ-A06, ARQ-F03)
 * ───────────────────────────────────────
 * El canal només avisa («hi ha nous a partir del seq X»); els missatges es
 * demanen sempre a l'adaptador amb `despresDeSeq`. El sondeig és la xarxa de
 * seguretat: la llista cada MS_LLISTA; el fil obert cada MS_FIL sense canal i
 * cada MS_FIL_AMB_CANAL amb canal viu. S'atura amb la pestanya amagada i es
 * desperta en tornar (`visibilitychange`) o en tornar la xarxa (`online`).
 *
 * XARXA RURAL INTERMITENT (auditoria 261008, B04 i B09)
 * ─────────────────────────────────────────────────────
 *   · Un sondeig fallit no buida una llista que ja s'havia carregat bé:
 *     `llistaFresca` passa a false i `avisLlista` porta l'avís no bloquejant.
 *     Només la primera càrrega fallida, o l'esquema sense aplicar, la buiden i
 *     posen `avis`. El tic següent arriba als 2, 5, 10 o 30 s (60 s de sostre),
 *     també després d'una càrrega inicial fallida o d'una altra crida que
 *     falla (revisió 261008), i també si obrir una conversa torna a armar el
 *     sondeig enmig de l'espera.
 *   · L'historial cap arrere compta les fallades seguides per fil i les
 *     exposa amb `esperaAntics(filId)`: Conversa no el torna a demanar sol
 *     dins de l'espera, ni després de la tercera fallada o d'un error no
 *     reintentable (només el botó o la xarxa que torna, `online`).
 *   · Gauntlet 261025_0545 (XC-13) · Una lectura o una marca fallida d'un fil
 *     no posa `avis` (no tapa la llista): és `avisFil(filId)`, i se'n va amb
 *     la lectura bona següent del fil. Una sola lectura en vol per fil
 *     (XC-01), i posar-se al dia buida el forat en una crida (XC-02).
 *
 * LECTURA (XAT-C08)
 * ─────────────────
 * Obrir una conversa NO la marca llegida. La interfície crida `marcaVist(filId,
 * seq)` quan una bombolla entra en pantalla amb la pestanya visible; ací
 * s'agrupa (una escriptura cada MS_MARQUES per conversa, mai cap arrere) i els
 * no llegits baixen en local abans que el servidor confirme. `marcaLlegides`
 * fa el mateix per a diverses converses alhora («Seleccionar xats»).
 *
 * XAT DE PÀGINA I COMUNITATS (T63.2 i T67, contracte del Xat §3)
 * ──────────────────────────────────────────────────────────────
 * `obriFilDePagina(objecte)` torna l'id del fil comú d'una Pàgina Universal
 * (el grup, o el General de la comunitat), null si el subjecte no en té, o
 * rebutja amb `codi: 'sense-capacitat'` si el backend no té 'xatDePagina'. En
 * remot el servidor no et fa participant fins que hi escrius: eixos fils es
 * queden com a VISITANTS (`participant: false`) dins de `chatThreads`, es
 * lligen amb `visitant` i el primer enviament hi entra; mai no s'hi envia cap
 * marca de lectura. `comunitats` i `contactesFrequents` són derivats purs
 * (missatges.js).
 *
 * QUI SOC (onada 3)
 * ─────────────────
 * `joId` (qui és «jo» al xat: la cerca no el troba, «Nova conversa» el pinta
 * amb «(Tu)»), `joNom` (el nom de la PERSONA, no el de l'entitat amb què
 * actua) i `senseSessio` (remot sense sessió, ja comprovada: mai mentre la
 * sessió es comprova). Cap valor d'un altre scope: van amb `visible`.
 *   Pla 261014_1450 (front C) · `joId`, `joNom` i `joAvatar` CONTINUEN sent
 *   la persona, també quan la barra negra actua com una entitat: el servidor
 *   desa usuari_id = auth.uid() (xat_envia, migració 2610081543) i
 *   missatges.js decidix el costat de cada bombolla amb `joId`. Posar-hi
 *   l'entitat passaria tots els missatges propis a 'other'. `entitatActiva`
 *   ({ id, nom, avatar } o null) és l'entitat amb què actua a la barra negra,
 *   el MATEIX `actor` d'IdentitatContext que pinta BotoIdentitatActiva, i
 *   només es presenta: el peu del rail en pinta el logo i el compositor diu
 *   qui signa. No canvia `joId` ni qui signa: ho decidix el servidor per fil
 *   (xat_participants.com_org_id → fil.comEntitat).
 *
 * DOS ÀMBITS (revisió adversarial 260930, troballes de l'entrada del poble i
 * dels esborranys)
 * ─────────────────────────────────────────────────────────────────────────
 * `scopeKey` porta `generacio`, que puja a CADA renovació del JWT (cada hora,
 * aprox.). El que la persona ha fet o ha escrit no caduca amb el testimoni:
 *   · `ambitEstable` (backend + persona + actor, sense generació) és la clau
 *     dels esborranys: canviar de persona o d'actor la canvia; renovar, no;
 *   · l'entrada automàtica (`consumixEntrada`) penja de backend + persona;
 * i, quan canvia la persona (eixir o entrar), s'obliden tots dos.
 *
 * LA CONVERSA SOBREVIU A LA RENOVACIÓ (Decisió 1 del Mestre, 261007)
 * ──────────────────────────────────────────────────────────────────
 * «Bombolles del xat: S'HAN DE CONSERVAR. La desaparició de l'historial del
 * xat cada hora en renovar-se la sessió destrossa l'experiència. L'estat local
 * ha de mantenir la continuïtat de la conversa malgrat la renovació del token
 * (JWT).» Abans, `scopeKey` era també la clau de les DADES i cada renovació ho
 * purgava tot: la bombolla en error amb el text que ja no era enlloc, l'historial
 * carregat, el fil obert i, amb XatWorkspace tornat a muntar, la cita a mitges i
 * la posició de lectura. Ara hi ha dos claus separades:
 *   · la de les DADES i l'aïllament (ARQ-H01) és `ambitEstable`: fils,
 *     missatges carregats, cursors, paginació, bombolles pròpies, visitants,
 *     marques i `filActiu`. Quan canvia (persona, actor o backend) es purga tot,
 *     com sempre, i res de l'àmbit anterior no es veu ni un sol render;
 *   · la de l'OPERACIÓ és `token` (scopeKey, amb `generacio`, i la config): cada
 *     petició captura el testimoni vigent. Una renovació avorta les operacions
 *     en vol i en llança de noves amb el testimoni nou (la llista, el fil obert
 *     per seq, l'historial cap arrere i el canal de temps real) sense buidar res.
 *     Els enviaments en vol passen a `error` (interromEnviaments) i es reintenten
 *     amb el MATEIX id; les obertures d'un sol tret (creaFil, obriFilDePagina) i
 *     les marques de lectura es tornen a fer soles amb l'operació nova, perquè
 *     qui les espera (XatSection ja no es torna a muntar) no reba un null fals.
 *   · Una config nova del MATEIX backend (backendScope igual) és, per a les
 *     dades, el mateix que una renovació: el mateix origen, la mateixa persona.
 *   · Relleu 261007 · sendChatMessage, creaFil i obriFilDePagina guardades
 *     d'abans d'una renovació i cridades després (un bucle en sèrie) passen
 *     per la versió vigent (accioVigent); d'un altre àmbit continuen tornant
 *     el [] o el null.
 *   · Relleu 261007 (revisió de seguretat de la Decisió 1, problema 2) · Una
 *     sessió anterior de la MATEIXA persona (eixir i tornar a entrar), o
 *     l'anada i tornada d'actor, només talla el llinatge si React ha arribat a
 *     PINTAR l'estat intermedi (sense sessió, o amb l'altre actor): la
 *     renovació es decidix comparant l'àmbit amb el de l'operació anterior, i
 *     la protecció és sobre el que React ha confirmat, no estructural. Hui es
 *     complix perquè sessionService notifica primer `usuari: null` (en eixir
 *     a la mateixa pestanya, esborraSessio → sincronitza; entre pestanyes,
 *     reconciliaAmbRegistre → sincronitza o recuperaSessio) i la sessió nova
 *     arriba després d'una volta de xarxa. Si mai arribaren A i A amb
 *     `generacio`+1 en una sola notificació, es tractaria com una renovació
 *     (la mateixa persona: cap fuita entre identitats).
 *   · Relleu 261007 (revisió de la correcció de seguretat, problema 1) · L'època
 *     de sessió ja existix: entradaSessio() i capturaSessio() (identitat.js),
 *     que una renovació no mou i eixir o tornar a entrar sí; la usen
 *     PerfilContext i NotesDataContext. No s'usa ací perquè, en mode
 *     incrustat, identitat.js compta cada reinjecció de l'amfitrió com una
 *     entrada nova, també la del mateix `sub` (vegeu el pendent de
 *     NotesDataContext): el xat purgaria la conversa a cada reinjecció, contra
 *     la Decisió 1. Per a la garantia estructural cal, primer, arreglar eixa
 *     reinjecció a identitat.js; després n'hi ha prou que `renovacio` exigisca
 *     també la mateixa entrada. Fora de l'abast d'este fitxer: pendent.
 */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  loadFils,
  loadMissatges,
  enviaMissatge,
  publicaAdjuntXat,
  marcaLlegit,
  creaFilDirecte,
  carregaMembres,
  subscribeToXat,
  unsubscribeFromXat,
  obriFilDePagina as obriFilDePaginaAlBackend,
  teCapacitat
} from '../../data/backendPort.js';
import { subjecteDeXat } from '../../data/contracte.js';
import {
  ID_FIL_DE_MOSTRA_DE_JAVI, ambXatsPerDefecte, esIdPerDefecte, esLaPersonaDeContacte, esXatDeLaIAIA, filDeMostraDeJavi,
  missatgesDeMostraDeJavi, senseLaIAIA, senseXatPerDefecte
} from '../../data/xatsPerDefecte.js';
import useNivellIaia from '../realitat/useNivellIaia.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { filsAmbLaGentDelPoble } from '../pobles/xatDelPoble.js';
import { normalizeBackendConfig, backendScope } from '../../config/backendConfig.js';
/* Gauntlet 261017 (WP7b, P2) · De la font, identitat.js: appSeed.js només el
   reexporta, i importar-lo d'allà arrossegava la llavor sencera (PAGE_COPY
   inclosa) al tros d'entrada. La mateixa funció, el mateix valor. */
import { getDefaultUserId } from '../../data/identitat.js';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import {
  LIMIT_PAGINA,
  MAX_REINTENTS,
  actualitzaFilAmbMissatge,
  actualitzaPendent,
  afigPendent,
  agrupaComunitats,
  aplicaMarcaLocal,
  combinaMissatges,
  contactesFrequents as calculaContactesFrequents,
  creaAgrupadorMarques,
  esperaReintent,
  filsEquivalents,
  fusionaPerSeq,
  generaId,
  interromEnviaments,
  mapejaFil,
  mapejaMissatge,
  retiraConfirmats,
  retiraPendent,
  seqMaxim,
  seqMinim,
  sumaNoLlegits,
  trobaPendent
} from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { canviaSessioCompartit, reiniciaDestiCompartit } from '../../config/compartirNatiu.js';
import { buidaRecents } from './emoticonesXat.js';
import { recordaRutaForaDelXat } from './informeDError.js';
import { recordaOrigenDelXat } from './origenDelXat.js';
import { clauDia } from './temps.js';
import {
  avisaNatiu, avisosNatiusActius, avisosNatiusDisponibles, demanaPermisAvisos, idDAvis, netejaAvisosNatius, refrescaPermisAvisos
} from '../../config/avisosNatius.js';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { anotaFilsBloquejats, anotaMissatgesBloquejats, senseDirectesBloquejats } from '../../config/moderacio.js';
import { CODI_NORMES_SERVIDOR, esRebuigDeNormes } from '../../data/errorsBackend.js';
import { TEXTOS_MODERACIO } from '../../components/PedraSeca/organismes/textosModeracio.js';
import { tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';

/* Integració 261024 (Codex C-02) · El xat PRIVAT amb la IAIA no passa per la
   porta de les normes (no és cap publicació per al poble), com al servidor
   (2610241400_normes_exigides_ugc.sql). El xat públic de la pàgina /iaia sí:
   el llig el poble i el servidor ja l'exigix. */
const esXatPrivatDeLaIAIA = (fil) => esXatDeLaIAIA(fil) && fil?.subjecte?.tipus !== 'pagina';

export const XatContext = createContext(null);
let hostPromise;
function hostReady(signal) {
  // Compartir la importació en el doble muntatge de StrictMode i el sondeig.
  hostPromise ||= import('../../host.js').catch(error => { hostPromise = null; throw error; });
  return hostPromise.then(host => host.quanLlest({ signal }));
}

/* Sondeig. La llista, lenta; el fil obert, ràpid sense canal i espaiat amb canal. */
const MS_LLISTA = 25000;
const MS_FIL = 5000;
const MS_FIL_AMB_CANAL = 30000;
/* 261026 (prompt 261026_1615, tasca 3) · Amb l'App fora de la vista i els avisos
   natius concedits, la llista es mira cada minut perquè arribe l'avís del
   sistema mentre l'App continua viva (a Android el WebView no s'atura). Sense
   avisos natius, amagada no es mira res, com sempre. */
const MS_LLISTA_SEGON_PLA = 60000;
/* Auditoria 261008 (B04) · Després d'una fallada REINTENTABLE de la llista
   (xarxa, temps d'espera, 5xx), el sondeig torna a provar aviat i cada vegada
   més espaiat: 2, 5, 10 i 30 s, i després cada 60 s fins al primer èxit. Una
   fallada que no es pot reintentar continua espaiant el tic a MS_LLISTA × 10. */
const ESPERES_LLISTA = Object.freeze([2000, 5000, 10000, 30000]);
const MS_LLISTA_SOSTRE = 60000;
/* Auditoria 261008 (B09) · L'historial cap arrere: després de cada fallada
   seguida d'un fil, l'observador de Conversa espera ESPERES_ANTICS abans de
   tornar a demanar-lo sol; a la fallada MAX_FALLADES_ANTICS, o amb un error
   que no es pot reintentar, ja no ho fa: només el botó «Carrega'n més» o la
   xarxa que torna ('online'). El primer èxit reinicia el comptador. */
const ESPERES_ANTICS = Object.freeze([2000, 5000]);
const MAX_FALLADES_ANTICS = ESPERES_ANTICS.length + 1;
/* Agrupació de les marques de lectura per conversa. */
const MS_MARQUES = 2000;
/* Gauntlet 261025_0545 (XC-02) · Posar-se al dia d'un fil: les pàgines
   incrementals seguides que una sola lectura demana mentre tornen plenes.
   xat_nous en torna com a molt 100, i el fil de pàgina LIMIT_PAGINA (50):
   una pàgina amb LIMIT_PAGINA o més pot ser plena. La resta, al tic següent. */
const MAX_PAGINES_NOUS = 5;
/* La ruta del xat, també dins d'un espai /e/:slug/xat. */
const RUTA_XAT = /(^|\/)xat(\/|$)/;
const paginaAmagada = () => typeof document !== 'undefined' && document.hidden === true;
/* Una sola llista buida: els derivats buits no canvien de referència. */
const CAP = Object.freeze([]);
/* Fase D (261020, tasca 2) · Sense ProveidorModeracio, ningú no és bloquejat:
   una sola funció, perquè cap derivat no canvie de referència. */
const SENSE_BLOQUEIG = () => false;

/* Sense la capacitat 'xatDePagina', «Comentar» ho ha de dir amb un avís honest. */
const errorSenseCapacitat = () => Object.assign(
  new Error('Este node no té xat de pàgina.'),
  { codi: 'sense-capacitat', code: 'SENSE_CAPACITAT', retriable: false }
);

/* Un fil de pàgina que encara llegixes sense ser-ne participant (remot). */
const esVisitant = (mapa, filId) => mapa[filId]?.participant === false;

/* Gauntlet 261025_0545 (XC-14) · Un fil que no es llig mai al port: el xat
   de només lectura de Javi i les files d'ajuda per defecte (que XatSection
   obri per la seua via). No hi ha cap lectura que esperar. */
const senseLecturaAlPort = (filId) => filId === ID_FIL_DE_MOSTRA_DE_JAVI || esIdPerDefecte(filId);

/* B04 · L'espera fins al tic següent de la llista després de `fallades`
   fallades seguides. Pura. XatSection la reutilitza per a tornar a obrir un
   fil de pàgina quan falla la xarxa (B05): una sola escala d'esperes. */
export function esperaDeLaLlista(fallades, reintentable) {
  if (!reintentable) return MS_LLISTA * 10;
  return ESPERES_LLISTA[Math.max(0, fallades - 1)] ?? MS_LLISTA_SOSTRE;
}

/* B09 · L'espera de l'historial cap arrere després de la fallada número
   `fallades` d'un fil: { fallades, manual, fins }. `manual` vol dir que
   l'observador ja no torna a provar sol; `fins`, l'instant (ms) abans del
   qual no ho fa. Pura, llevat de `ara`. */
function esperaDeLHistorial(fallades, reintentable, ara = Date.now()) {
  const manual = !reintentable || fallades >= MAX_FALLADES_ANTICS;
  return Object.freeze({ fallades, manual, fins: manual ? null : ara + ESPERES_ANTICS[fallades - 1] });
}

/* Decisió 1 del Mestre (261007) · Una operació per testimoni. `relleu` es
   resol una sola vegada, quan l'operació plega: amb la que la substituïx si és
   del MATEIX àmbit de dades (una renovació del JWT, o una config nova del mateix
   backend), o amb null si l'àmbit canvia o el proveïdor es desmunta.
   Relleu 261007 · `llinatge` és el mateix objecte per a totes les operacions
   que s'han rellevat per renovacions seguides, i un de nou a cada canvi
   d'àmbit: eixir i tornar a entrar com la mateixa persona dona la mateixa
   clau d'àmbit, però no el mateix llinatge (vegeu accioVigent), sempre que
   React haja pintat l'estat sense sessió entre mig (vegeu la capçalera). */
function novaOperacio(token, llinatge) {
  let passa = null;
  const relleu = new Promise((resol) => { passa = resol; });
  return { token, llinatge, controller: new AbortController(), relleu, passa };
}

/* Decisió 1 · L'operació VIVA que ha rellevat `op` per renovacions seguides
   del mateix àmbit, o null si en algun punt de la cadena l'àmbit ha canviat o
   el proveïdor s'ha desmuntat. No n'hi ha prou amb el primer relleu: una
   renovació i, abans que la petició tallada acabe, un canvi de persona deixen
   el primer relleu viu en la promesa però mort en l'arbre, i l'acció vigent ja
   seria de la persona nova. */
async function relleuViu(op) {
  let seguent = await op.relleu;
  while (seguent?.controller.signal.aborted) seguent = await seguent.relleu;
  return seguent;
}

/* Relleu 261007 (revisió de seguretat de la Decisió 1, problema 1) · L'acció
   `nom` de la versió VIGENT per a l'operació viva `viu`, o null. Qui la crida
   ho ha de fer en el MATEIX tic síncron, sense cap await entre mig. relleuViu
   comprova la cadena abans de tornar, però la continuació de qui l'espera
   arriba microtasques després: si React confirma entre mig un altre àmbit
   (un flushSync, una sessió nova), l'operació ja està avortada i accionsRef
   ja és d'una altra persona. Una operació no avortada és sempre la vigent:
   cada una s'avorta just quan se substituïx o quan el proveïdor es desmunta.
   I `accions` ha de ser la del render del seu testimoni. */
function accioDelRelleu(viu, accions, nom) {
  if (!viu || viu.controller.signal.aborted || accions?.token !== viu.token) return null;
  return accions[nom] || null;
}

/* Decisió 1 del Mestre (261007) · Una acció d'un sol tret que una renovació ha
   tallat (obrir o crear un fil) es torna a fer amb l'operació nova del mateix
   àmbit: es crida la versió VIGENT de l'acció `nom`, la del render del
   testimoni nou (accionsRef), amb `args`. Les dos són idempotents al servidor:
   creaFilDirecte «obri (o troba)» la conversa i obri_fil_de_pagina «troba o
   crea» el xat comú. Amb un altre àmbit, o desmuntat, el null de sempre: cap
   resposta vella no entra a l'àmbit nou. Relleu 261007 (revisió de seguretat)
   · La comprovació i la crida van en el mateix tic (accioDelRelleu).
   Relleu 261007 (revisió de la correcció de seguretat, problema 2) · Si
   l'operació que relleuViu ha trobat viva ja està avortada quan arriba la
   continuació (React ha confirmat entre mig una altra renovació), es torna a
   esperar el seu relleu en lloc de tornar null: el relleu es resol amb null
   si l'àmbit canvia o el proveïdor es desmunta, i per tant entre identitats
   no hi passa res. L'última comprovació del bucle i la crida continuen en el
   mateix tic. `senseRelleu` diu què es fa sense acció vigent: null, o el
   llançament de l'error original (enviaMarca). */
async function despresDelRelleu(op, accionsRef, nom, args, senseRelleu = () => null) {
  let viu = await relleuViu(op);
  while (viu?.controller.signal.aborted) viu = await relleuViu(viu);
  const accio = accioDelRelleu(viu, accionsRef.current, nom);
  return accio ? accio(...args) : senseRelleu();
}

const BUIT = {
  status: 'loading',
  error: null,
  avis: null,
  scopeKey: '',
  ambitEstable: '',
  joId: null,
  joNom: null,
  joAvatar: null,
  entitatActiva: null,
  senseSessio: false,
  chatThreads: [],
  chatMessages: [],
  totalNoLlegits: 0,
  filActiu: null,
  getThreadMessages: () => [],
  hiHaMesAntics: () => false,
  carregantAntics: () => false,
  esperaAntics: () => null,
  carregaMesAntics: async () => false,
  /* Gauntlet 261025_0545 (XC-14) · Fora del proveïdor no hi ha cap lectura
     que esperar: el fil es dona per carregat i sense avís. */
  filCarregat: () => true,
  avisFil: () => null,
  recarregaFil: () => {},
  /* Gauntlet 261025_0545 (D5) · Ni avís ni lectura en vol. */
  tipusAvisFil: () => null,
  llegintFil: () => false,
  llistaFresca: true,
  avisLlista: null,
  sendChatMessage: async () => [],
  sendChatMedia: null,
  reintenta: async () => [],
  descartaFallit: () => {},
  marcaVist: () => {},
  obriFil: () => {},
  creaFil: async () => { throw new Error('El xat encara no ha carregat.'); },
  cercaMembres: async () => [],
  recarrega: async () => false,
  obriFilDePagina: async () => null,
  comunitats: CAP,
  contactesFrequents: CAP,
  marcaLlegides: () => 0,
  modeDades: 'remote',
  consumixEntrada: () => false,
  iaiaApagada: false,
  esFilAmagat: () => false
};

/** Espera `ms` o fins que el senyal s'aborte. Torna `false` si s'ha abortat. */
function espera(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(false); return; }
    let temporitzador = null;
    const alAbortar = () => { clearTimeout(temporitzador); resolve(false); };
    temporitzador = setTimeout(() => {
      signal?.removeEventListener('abort', alAbortar);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', alAbortar, { once: true });
  });
}

/* Gauntlet 261025_0545 (XC-03) · El navegador diu que no hi ha xarxa. Només
   val el `false`: un `true` no garantix res, i llavors manen els reintents.
   Sense finestra no hi ha cap event que esperar: també manen els reintents. */
const senseXarxa = () => typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine === false;

/** Gauntlet 261025_0545 (XC-03) · Espera que torne la xarxa ('online') o que
 *  la pàgina torne a la vista. Torna `false` si el senyal s'avorta. */
function esperaXarxa(signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(false); return; }
    const acaba = (valor) => {
      window.removeEventListener('online', alTornar);
      document.removeEventListener('visibilitychange', alVeure);
      signal?.removeEventListener('abort', alAbortar);
      resolve(valor);
    };
    const alTornar = () => acaba(true);
    const alVeure = () => { if (!document.hidden) acaba(true); };
    const alAbortar = () => acaba(false);
    window.addEventListener('online', alTornar);
    document.addEventListener('visibilitychange', alVeure);
    signal?.addEventListener('abort', alAbortar, { once: true });
  });
}

/**
 * Avís dins de l'app (XAT-J01). Viu en un component propi perquè els seus
 * ganxos necessiten el router, el proveïdor de notificacions i el d'interfície,
 * que a App.jsx estan per damunt de XatProvider. Només diu qui ha escrit, mai
 * el text, i només quan la persona no és al xat.
 */
function AvisadorXat({ registra, ambSessio }) {
  const { pathname, search } = useLocation();
  const { showToast } = useToast();
  const { t } = useUIActions();
  /* Onada 6 · On era la persona abans d'entrar al Xat: la ruta (sense dades)
     de l'informe de «Informa d'un error» (informeDError.js). */
  useEffect(() => { recordaRutaForaDelXat(pathname); }, [pathname]);
  /* Ordre del Mestre (261021, pla 261021_0015 §8.5) · I la mateixa ruta amb
     la consulta, on torna la fletxa de la conversa (origenDelXat.js). */
  useEffect(() => { recordaOrigenDelXat(pathname, search); }, [pathname, search]);
  useEffect(() => {
    registra((nom, filId, { silenciat = false } = {}) => {
      /* 261026 (prompt 261026_1615, tasca 3) · Amb l'App fora de la vista, l'avís
         és del sistema (so i vibració), també si es va quedar al xat. Com el
         toast, només diu de quin xat és, mai el text del missatge. */
      if (paginaAmagada() && !silenciat && avisaNatiu({
        id: idDAvis(filId),
        titol: nom || t('section.xat.avisNatiu.titol', 'Sóc de Poble'),
        cos: t('section.xat.avisNatiu.cos', 'Missatge nou'),
        filId,
        vigent: paginaAmagada
      })) return;
      if (RUTA_XAT.test(String(pathname || ''))) return;
      const plantilla = t('section.xat.avisNouMissatge', 'Missatge nou de {nom}');
      showToast(String(plantilla).replace('{nom}', nom || ''));
    });
    return () => registra(null);
  }, [registra, pathname, showToast, t]);
  /* El toc d'un avís obri el seu xat: ho fa ReceptorCompartit (App.jsx), que té el router sencer. */
  /* El permís es demana amb context: la primera vegada que s'entra al Xat amb
     sessió. Qui ja ha dit que sí o que no no ho torna a vore (avisosNatius.js). */
  const alXat = RUTA_XAT.test(String(pathname || ''));
  useEffect(() => {
    if (ambSessio && alXat && avisosNatiusDisponibles()) demanaPermisAvisos();
  }, [ambSessio, alXat]);
  /* El permís es pot canviar als ajustos del sistema: es torna a llegir en tornar. */
  useEffect(() => {
    if (!avisosNatiusDisponibles() || typeof document === 'undefined') return undefined;
    /* I els avisos que ja són a la barra sobren: la persona ja és dins. */
    const alTornar = () => { if (!paginaAmagada()) { refrescaPermisAvisos(); netejaAvisosNatius(); } };
    document.addEventListener('visibilitychange', alTornar);
    return () => document.removeEventListener('visibilitychange', alTornar);
  }, []);
  return null;
}

/* ─────────────────────────────── Provider ─────────────────────────────── */

export function XatProvider({ children, config }) {
  const { currentUser: usuari, generacio, estat: estatSessio } = useSession();
  const { actorKey, identitats, actor } = useIdentitat();
  /* Onada 3 · El nom de la persona (no el de l'entitat amb què actua): el xat
     és sempre de `joId`, i «Nova conversa» el pinta amb «(Tu)». */
  const persona = Array.isArray(identitats) ? identitats.find((i) => i?.tipus === 'persona' && i.id === usuari?.id) : null;
  const joNom = persona?.nom || null;
  const joAvatar = persona?.avatar || null;
  /* Pla 261014_1450 (front C) · L'entitat amb què actua a la barra negra: el
     MATEIX `actor` d'IdentitatContext que pinta BotoIdentitatActiva
     (useIdentitatDeLaBarra.js:94-98). Només es presenta (rail, compositor);
     `joId` continua sent la persona (vegeu la capçalera, «Qui soc»). El memo
     penja dels camps i no de l'objecte: el valor no canvia si l'actor es
     torna a construir igual. */
  const actuaComEntitat = actor?.tipus === 'entitat';
  const entitatId = actuaComEntitat ? actor.id ?? null : null;
  const entitatNom = actuaComEntitat ? actor.nom || null : null;
  const entitatAvatar = actuaComEntitat ? actor.avatar || null : null;
  const entitatActiva = useMemo(
    () => (actuaComEntitat ? { id: entitatId, nom: entitatNom, avatar: entitatAvatar } : null),
    [actuaComEntitat, entitatId, entitatNom, entitatAvatar]
  );
  /* Onada 6 (tasca 12) · Amb el nivell d'IA a 0 (Apagada) la IAIA no apareix
     al xat: ni a la llista (i, per tant, a les cerques i a les comunitats),
     ni als no llegits, ni als contactes freqüents, ni als avisos. Les dades
     no es toquen: només el que es veu. En tornar a 1 o més, reapareix. */
  const iaiaApagada = useNivellIaia() === 0;
  const iaiaApagadaRef = useRef(iaiaApagada);
  iaiaApagadaRef.current = iaiaApagada;
  /* Fase D (261020, tasca 2) · La moderació (null sense proveïdor): qui has
     bloquejat (vegeu la capçalera, «Moderació») i la porta de les normes. Les
     dues refs les lligen avisaSiCal i l'enviament, que són estables. */
  const moderacioDePoble = useModeracio();
  const esPersonaBloquejada = moderacioDePoble?.esPersonaBloquejada ?? SENSE_BLOQUEIG;
  const bloquejatRef = useRef(esPersonaBloquejada);
  const moderacioRef = useRef(moderacioDePoble);
  useLayoutEffect(() => {
    bloquejatRef.current = esPersonaBloquejada;
    moderacioRef.current = moderacioDePoble;
  }, [esPersonaBloquejada, moderacioDePoble]);
  /* Sense sessió, el xat només existix en mode seed/local (l'adaptador ja escriu
     com a convidat amb el mateix identificador); en remot cal la sessió. Es llig
     de la configuració i no del port, que encara no està segellat al primer render. */
  const modeDades = normalizeBackendConfig(config || {}).dataMode;
  const joId = usuari?.id || (modeDades !== 'remote' ? getDefaultUserId() : null);
  /* Auditoria adversarial 261016 (P3) · Ordre del Mestre (prompt 261016_0015,
     Bloc 3.6): «Si un usuari no registrat fa clic per parlar-hi, es mostra el
     missatge automàtic». En llavor i en local ningú no té sessió (l'entrada
     torna MODE_LOCAL) i el convidat hi té un xat de veres: `convidat` és qui
     hi té joId sense cap sessió. La fila de Javi és per a ell el xat de només
     lectura (filDeMostraDeJavi, la mateixa peça que el xat de mostra del
     remot, FakeChatOnboarding), i res d'eixe xat no arriba al port: ni
     historial, ni marques, ni cap directe nou. En remot sense sessió no hi ha
     joId i el xat de mostra en té cura. */
  const convidat = !usuari?.id && Boolean(joId);
  const { t } = useUIActions();
  /* Integració 261024 · El text d'una bombolla rebutjada per les normes, sense refer l'enviament. */
  const traductorRef = useRef(t);
  useLayoutEffect(() => { traductorRef.current = t; }, [t]);
  const avisDeLaMostra = t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!");
  const [araDeLaMostra] = useState(() => new Date().toISOString());
  const filDeMostra = useMemo(() => (convidat ? filDeMostraDeJavi({ avis: avisDeLaMostra }) : null), [convidat, avisDeLaMostra]);
  const missatgesDeMostra = useMemo(() => missatgesDeMostraDeJavi(araDeLaMostra), [araDeLaMostra]);
  const scopeKey = JSON.stringify([backendScope(config), joId, actorKey, generacio]);
  /* Revisió adversarial 260930 · Les claus que NO porten `generacio`: una
     renovació del JWT no és una sessió nova (vegeu la capçalera, «Dos àmbits»). */
  const clauPersona = JSON.stringify([backendScope(config), joId]);
  const ambitEstable = JSON.stringify([backendScope(config), joId, actorKey]);
  /* Decisió 1 del Mestre (261007) · `token` és la clau de l'OPERACIÓ (porta
     `generacio` i la config: cada petició nova captura el testimoni nou) i
     `ambit` hi viatja perquè l'efecte de més avall sàpia si el testimoni nou és
     del mateix àmbit de DADES (una renovació) o d'un altre (cal purgar). */
  const token = useMemo(() => ({ scopeKey, ambit: ambitEstable, config }), [scopeKey, ambitEstable, config]);
  const tokenActual = useRef(token);
  tokenActual.current = token;
  /* Decisió 1 · L'àmbit de dades del render vigent i si el proveïdor és
     desmuntat: els getters guardats d'un altre àmbit (o d'un proveïdor ja
     desmuntat) tornen buit, encara que el testimoni d'operació siga un altre. */
  const ambitActual = useRef(ambitEstable);
  ambitActual.current = ambitEstable;
  const desmuntat = useRef(false);
  const operacio = useRef(null);
  const [tokenEstat, setTokenEstat] = useState(null);
  const captura = useCallback(() => {
    const op = operacio.current;
    return op?.token === token && !op.controller.signal.aborted ? op : null;
  }, [token]);
  const vigent = useCallback(op => Boolean(op && tokenActual.current === op.token
    && !op.controller.signal.aborted), []);
  /* Decisió 1 · La versió vigent de les accions, la del render del testimoni
     nou, amb el testimoni que captura (despresDelRelleu, el relleu
     d'enviaMarca i accioVigent; els dos primers, per accioDelRelleu). */
  const accionsRef = useRef(null);
  /* Relleu 261007 · L'operació que s'ha obert per a cada testimoni: diu de
     quin llinatge és el testimoni que porta una acció guardada. */
  const opDelToken = useRef(new WeakMap());
  /* Relleu 261007 (revisió adversarial de la Decisió 1) · Qui guarda una
     acció d'abans d'una renovació i la crida després no ha de rebre un null
     o un [] mut. Cas real: el bucle en sèrie de «Connectar»
     (useAplicaAbast.js) usa el creaFil i el sendChatMessage del render en
     què va començar; a mig bucle, la renovació deixava els destinataris
     següents sense bombolla i el seu avís («El trobaràs al xat per a
     tornar-ho a provar») era fals. Si l'operació viva és del MATEIX
     llinatge que el testimoni de qui crida (només renovacions entre mig) i
     ja té el seu render (accionsRef porta el seu testimoni), es torna la
     versió vigent de l'acció. Amb un altre àmbit (persona, actor o
     backend), amb eixir i tornar a entrar, amb el proveïdor desmuntat o
     abans que l'operació nova existisca, null: el [] o el null de sempre
     (ARQ-H01). La versió vigent passa captura() per construcció: no hi ha
     cap bucle. Relleu 261007 (revisió de seguretat, problema 2) · «Eixir i
     tornar a entrar» vol dir que React n'ha pintat l'estat sense sessió:
     la protecció és sobre el que React ha confirmat, no estructural (vegeu
     la capçalera: l'entrada de sessió d'identitat.js, encara sense usar ací). */
  const accioVigent = useCallback((nom) => {
    const op = operacio.current;
    const meua = opDelToken.current.get(token);
    const accions = accionsRef.current;
    if (desmuntat.current || !op || !meua || op.controller.signal.aborted) return null;
    if (meua.llinatge !== op.llinatge || accions?.token !== op.token) return null;
    return accions[nom] || null;
  }, [token]);

  const [fils, setFils] = useState([]);
  const filsRef = useRef([]);
  /* Auditoria 261007 (B) · El dia local («2026-10-07», clauDia) de l'última
     llista que el sondeig ha aplicat. Vegeu carregaFils: un canvi de dia
     aplica la llista encara que siga equivalent. */
  const diaFilsRef = useRef(null);
  const [estat, setEstat] = useState('loading');
  const [avis, setAvis] = useState(null);
  /* Auditoria 261008 (B04) · Un sondeig fallit ja no buida una llista que
     s'havia carregat bé: `llistaFresca` diu si l'última càrrega ha anat bé
     (XatSection no decidix cap 404 amb una llista rància) i `avisLlista`
     porta l'avís NO bloquejant d'eixa fallada (la llista es queda a la
     vista). `avis` continua sent l'error que tapa la llista: la primera
     càrrega fallida o l'esquema sense aplicar. `llistaCarregadaRef` diu si
     la llista de l'àmbit s'ha carregat bé alguna vegada; `falladesLlistaRef`
     i `reintentableLlistaRef`, l'espera del tic següent (esperaDeLaLlista). */
  const [llistaFresca, setLlistaFresca] = useState(true);
  const [avisLlista, setAvisLlista] = useState(null);
  const llistaCarregadaRef = useRef(false);
  const falladesLlistaRef = useRef(0);
  const reintentableLlistaRef = useRef(true);
  /* Revisió 261008 (B04) · El sondeig viu hi deixa com tornar a armar el
     seu tic: una fallada que no ve del tic (la càrrega inicial,
     «Connectar», la cerca global) també passa a l'espera curta. */
  const reprogramaLlistaRef = useRef(null);
  const [filActiu, setFilActiu] = useState(null);
  /* Missatges confirmats pel servidor, per fil, ordenats per seq. */
  const [missatgesPerFil, setMissatgesPerFil] = useState({});
  const missatgesRef = useRef({});
  /* Auditoria 261007 (B) · El cursor de SERVIDOR de cada fil: el seq més alt
     que ha tornat una lectura acceptada de `loadMissatges` (completa o
     incremental). És el `despresDeSeq` de la lectura següent. Abans era el
     seq màxim del magatzem, on també entra el missatge propi confirmat: si
     Pepa escrivia el 11 i jo enviava el 12 abans del sondeig, el cursor
     saltava al 12 i el 11 no arribava mai. Ni l'enviament ni l'historial cap
     arrere el mouen; una lectura superada tampoc. Sense entrada = càrrega
     completa; 0 = fil carregat i buit. */
  const cursorRef = useRef({});
  /* Bombolles pròpies encara sense seq: pendents i fallides. */
  const [pendentsPerFil, setPendentsPerFil] = useState({});
  const pendentsRef = useRef({});
  /* T63.2 · Fils de pàgina que llegixes sense ser-ne participant (remot), per id. */
  const [visitants, setVisitants] = useState({});
  const visitantsRef = useRef({});
  /* Paginació cap arrere per fil: { hiHaMes, carregant } i, després d'una
     fallada, `espera` (B09, esperaDeLHistorial). */
  const [paginacio, setPaginacio] = useState({});
  /* Auditoria 261008 (B09) · Les fallades SEGUIDES de l'historial cap arrere
     per fil. Només un èxit (o un altre àmbit) les torna a zero. */
  const falladesAnticsRef = useRef({});
  /* Decisió 1 · Les càrregues d'historial cap arrere en vol, per fil, amb
     l'operació que les porta: una renovació les avorta, i l'efecte del relleu
     les torna a demanar amb l'operació nova sense eixir de «carregant». */
  const carregantAnticsRef = useRef(new Map());
  /* Gauntlet 261025_0545 (XC-01) · La lectura del fil que vola, una per fil:
     { op, deNou, promesa }. Qui en demana una altra mentre vola només la
     marca `deNou` i n'espera la mateixa promesa (vegeu carregaMissatges). */
  const lecturesFilRef = useRef(new Map());
  /* Gauntlet 261025_0545 (XC-13, XC-14) · Per fil i dins de l'àmbit: si la
     primera lectura ja ha anat bé (`carregats`) i l'avís NO bloquejant de
     l'última lectura o marca fallida (`avisosFil`), que pinta la conversa i
     no tapa la llista. `avis` continua sent només el de la llista. */
  const [carregats, setCarregats] = useState({});
  const carregatsRef = useRef({});
  const [avisosFil, setAvisosFil] = useState({});
  const avisosFilRef = useRef({});
  /* Gauntlet 261025_0545 (D5) · Per fil, si vola una lectura que la vista ha
     de saber (publicaLectura): la del fil encara sense carregar o amb avís. */
  const [llegint, setLlegint] = useState({});
  const llegintRef = useRef({});
  /* Gauntlet 261025_0545 (ordre d'enviament) · La cua d'enviaments de cada
     fil: la promesa, que mai rebutja, de l'últim enviament encuat. */
  const cuesEnviamentRef = useRef(new Map());
  /* Gauntlet 261025_0545 (D2) · Per fil, quants enviaments esperen ara la
     xarxa (XC-03) i qui de la cua vol saber quan n'hi entra un:
     { esperen, oients }. */
  const esperesXarxaRef = useRef(new Map());
  /* Últim seq del qual ja s'ha avisat (o vist) per fil, per a no repetir avisos. */
  const ultimSeqAvisat = useRef({});
  /* Revisió 261026 · La primera llista de l'àmbit és la línia base dels avisos;
     un fil que apareix DESPRÉS és una conversa nova i el seu primer missatge avisa. */
  const baseAvisosRef = useRef(false);
  const avisadorRef = useRef(null);
  const enviaMarcaRef = useRef(null);
  const agrupador = useRef(null);
  if (!agrupador.current) {
    agrupador.current = creaAgrupadorMarques((filId, seq) => enviaMarcaRef.current?.(filId, seq), MS_MARQUES);
  }

  const genFils = useRef(0);

  /* Els refs són la font de veritat per als camins asíncrons; l'estat, per al render.
     Auditoria 261007 (B) · Els fils també: `filsRef` s'escriu alhora que
     l'estat, i no en un efecte posterior. El sondeig de la llista compara la
     resposta amb `filsRef` per a no cridar setFils si res no ha canviat; amb
     una còpia que arribava un render tard, una marca local o un enviament
     recent podien semblar «iguals» al servidor i quedar-se sense corregir. */
  const mutaFils = useCallback((fn) => {
    const nou = fn(filsRef.current);
    if (nou === filsRef.current) return;
    filsRef.current = nou;
    setFils(nou);
  }, []);
  const mutaMissatges = useCallback((fn) => {
    const nou = fn(missatgesRef.current);
    missatgesRef.current = nou;
    setMissatgesPerFil(nou);
  }, []);
  const mutaPendents = useCallback((fn) => {
    const nou = fn(pendentsRef.current);
    pendentsRef.current = nou;
    setPendentsPerFil(nou);
  }, []);
  const mutaVisitants = useCallback((fn) => {
    const nou = fn(visitantsRef.current);
    if (nou === visitantsRef.current) return;
    visitantsRef.current = nou;
    setVisitants(nou);
  }, []);
  /* Gauntlet 261025_0545 (XC-13, XC-14) · Els dos mapes per fil, amb la
     mateixa regla: si res no canvia, cap render. */
  const marcaCarregat = useCallback((filId) => {
    if (carregatsRef.current[filId]) return;
    carregatsRef.current = { ...carregatsRef.current, [filId]: true };
    setCarregats(carregatsRef.current);
  }, []);
  /* Gauntlet 261025_0545 (D5) · Publica si vola una lectura del fil, només
     quan la vista en pot pintar alguna cosa: el fil encara sense carregar
     («Carregant la conversa…») o amb avís (el botó de tornar-ho a provar,
     ocupat). Un fil ja carregat i sense avís no es publica: el sondeig no
     repinta la conversa cada 5 o 30 s per a res (Auditoria 261007, B).
     Publicada una vegada, es queda fins que la lectura acaba. */
  const publicaLectura = useCallback((filId) => {
    const ara = llegintRef.current[filId] === true;
    const importa = Object.hasOwn(avisosFilRef.current, filId) || carregatsRef.current[filId] !== true;
    const nou = lecturesFilRef.current.has(filId) && (ara || importa);
    if (nou === ara) return;
    const seguent = { ...llegintRef.current };
    if (nou) seguent[filId] = true;
    else delete seguent[filId];
    llegintRef.current = seguent;
    setLlegint(seguent);
  }, []);
  /* Gauntlet 261025_0545 (D5) · L'avís porta de quina operació ve: 'lectura'
     (els missatges o l'historial) o 'marca' (la de lectura), perquè la vista
     no diga d'una marca fallida que no s'ha pogut carregar la conversa. Si
     arriba mentre vola una lectura, ara la vista l'ha de saber. */
  const posaAvisFil = useCallback((filId, text, tipus) => {
    const previ = avisosFilRef.current[filId];
    if (previ?.text !== text || previ?.tipus !== tipus) {
      avisosFilRef.current = { ...avisosFilRef.current, [filId]: { text, tipus } };
      setAvisosFil(avisosFilRef.current);
    }
    publicaLectura(filId);
  }, [publicaLectura]);
  const llevaAvisFil = useCallback((filId) => {
    if (!Object.hasOwn(avisosFilRef.current, filId)) return;
    const nou = { ...avisosFilRef.current };
    delete nou[filId];
    avisosFilRef.current = nou;
    setAvisosFil(nou);
  }, []);
  useEffect(() => () => agrupador.current?.cancela(), []);
  /* Gauntlet 261025_0545 (MISSED P3) · La marca que esperava l'agrupació
     (MS_MARQUES) es perdia si la pàgina s'amagava o es tancava abans. Ara ix
     quan la pestanya s'amaga (l'últim moment fiable, sobretot al mòbil) i en
     'pagehide'. Un canvi d'àmbit continua cancel·lant-les (la purga: mai les
     d'A com a B), i desmuntar també, perquè l'operació ja és avortada. */
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    const buida = () => agrupador.current?.buidaTot();
    const alAmagar = () => { if (document.hidden) buida(); };
    window.addEventListener('pagehide', buida);
    document.addEventListener('visibilitychange', alAmagar);
    return () => {
      window.removeEventListener('pagehide', buida);
      document.removeEventListener('visibilitychange', alAmagar);
    };
  }, []);

  const registraAvisador = useCallback((fn) => { avisadorRef.current = fn; }, []);

  /* Avisa una sola vegada per seq nou d'una altra persona (XAT-J01). El primer
     valor d'un fil és la línia base: en arrencar no s'avisa de res.
     Onada 6 (tasca 12) · Amb la IAIA apagada, el seu xat no avisa: la línia
     base avança igual, i en tornar-la a encendre no arriba cap avís vell. */
  const avisaSiCal = useCallback((filId, seq, autorId, nom) => {
    const s = Number(seq) || 0;
    let previ = ultimSeqAvisat.current[filId];
    if (previ === undefined) {
      ultimSeqAvisat.current[filId] = s;
      if (!baseAvisosRef.current) return;
      previ = 0;
    }
    if (s <= previ) return;
    ultimSeqAvisat.current[filId] = s;
    if (!autorId || autorId === joId) return;
    /* Fase D (261020, tasca 2) · De qui has bloquejat, cap avís: la línia
       base avança igual, i desbloquejar no en porta cap de vell. */
    if (bloquejatRef.current(autorId)) return;
    if (iaiaApagadaRef.current) {
      const fil = filsRef.current.find((f) => f.id === filId) || visitantsRef.current[filId];
      if (esXatDeLaIAIA(fil)) return;
    }
    /* 261026 (prompt 261026_1615, tasca 3) · Un xat silenciat o arxivat no fa
       sonar el telèfon (com el comptador, que tampoc no els suma): l'avís
       natiu, no; el toast de dins de l'App, com sempre. */
    const fil = filsRef.current.find((f) => f.id === filId) || visitantsRef.current[filId];
    avisadorRef.current?.(nom, filId, { silenciat: Boolean(fil?.silenciat || fil?.arxivat) });
  }, [joId]);

  /* Decisió 1 · Desmuntar tanca l'àmbit: els getters guardats tornen buit i
     les accions que esperaven el relleu reben null. Declarat abans de l'efecte
     de l'operació: en el doble muntatge de StrictMode es torna a obrir primer. */
  useLayoutEffect(() => {
    desmuntat.current = false;
    return () => {
      desmuntat.current = true;
      operacio.current?.passa(null);
    };
  }, []);

  // Purga física després del render. El value oculta l'estat anterior des del
  // primer render, abans que React execute este efecte o les seues neteges.
  // Decisió 1 del Mestre (261007) · Només quan canvia l'àmbit de DADES
  // (backend, persona o actor). Una renovació del JWT (o una config nova del
  // mateix backend) només canvia l'operació: avorta les peticions en vol (la
  // neteja de l'efecte anterior), n'obri una de nova i els efectes que en
  // pengen tornen a demanar la llista, el fil obert per seq, l'historial en
  // vol i el canal de temps real. Fils, missatges, cursors, paginació,
  // bombolles, visitants, avisos ja fets, marques i `filActiu` es queden.
  useLayoutEffect(() => {
    const previa = operacio.current;
    const renovacio = previa?.token.ambit === token.ambit;
    const op = novaOperacio(token, renovacio ? previa.llinatge : {});
    operacio.current = op;
    opDelToken.current.set(token, op);
    if (renovacio) {
      /* Els enviaments en vol eren de l'operació que s'acaba d'avortar: la
         bombolla es queda, en error, i «Torna-ho a provar» la reenvia amb el
         mateix id. Si el servidor ja l'havia rebuda, la lectura següent la
         retira (retiraConfirmats). */
      mutaPendents(interromEnviaments);
    } else {
      setFils([]);
      filsRef.current = [];
      diaFilsRef.current = null;
      setMissatgesPerFil({});
      missatgesRef.current = {};
      cursorRef.current = {};
      setPendentsPerFil({});
      pendentsRef.current = {};
      setVisitants({});
      visitantsRef.current = {};
      setPaginacio({});
      carregantAnticsRef.current.clear();
      falladesAnticsRef.current = {};
      ultimSeqAvisat.current = {};
      baseAvisosRef.current = false;
      agrupador.current?.cancela();
      /* Gauntlet 261025_0545 · Ni les lectures i els enviaments encuats, ni
         els fils ja carregats o els seus avisos passen a l'àmbit nou. */
      lecturesFilRef.current.clear();
      cuesEnviamentRef.current.clear();
      carregatsRef.current = {};
      setCarregats({});
      avisosFilRef.current = {};
      setAvisosFil({});
      /* Gauntlet 261025_0545 (D2, D5) · Ni les esperes de xarxa ni les lectures publicades. */
      esperesXarxaRef.current.clear();
      llegintRef.current = {};
      setLlegint({});
      setFilActiu(null);
      setAvis(null);
      /* B04 · L'àmbit nou encara no ha carregat cap llista. */
      llistaCarregadaRef.current = false;
      falladesLlistaRef.current = 0;
      reintentableLlistaRef.current = true;
      setLlistaFresca(true);
      setAvisLlista(null);
      setEstat(joId ? 'loading' : 'ready');
    }
    setTokenEstat(token);
    /* Qui esperava el relleu (despresDelRelleu, enviaMarca) continua amb
       l'operació nova si és el mateix àmbit; si no, rep null. */
    previa?.passa(renovacio ? op : null);
    return () => { op.controller.abort(); };
  }, [token, joId, mutaPendents]);

  /* ── Llista de fils ──
     Torna true si s'ha aplicat, false si ha fallat (o l'àmbit ja no és el
     mateix) i null si una càrrega posterior l'ha superada.
     Auditoria 261007 (B) · Una càrrega superada no és una fallada: el sondeig
     només espaia el tic següent amb `false`. Abans, una recàrrega de la
     llista mentre el tic era en vol el portava de 25 s a 250 s. Obrir una
     conversa o un «Comentar» no hi arribava: naveguen a /xat/<filId>, el fil
     obert canvia i el sondeig es torna a armar a 25 s. Els camins comprovats
     que recarreguen sense navegar són tres: «Connectar» amb diversos
     destinataris (useAplicaAbast.js, creaFil en sèrie), el primer missatge
     com a visitant d'un fil de pàgina (executaEnviament) i el «Reintentar»
     de la cerca global (useCercaGlobal.js), que no llig el valor de tornada. */
  const carregaFils = useCallback(async () => {
    const op = captura();
    if (!vigent(op)) return false;
    const meua = ++genFils.current;
    if (!joId) {
      mutaFils((previs) => (previs.length ? [] : previs));
      setEstat('ready');
      return false;
    }

    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const bruts = await loadFils({ ...config, signal: op.controller.signal });
      if (!vigent(op)) return false;
      if (meua !== genFils.current) return null;
      /* Auditoria 261007 (B) · La marca de lectura que la interfície ja ha
         fet (pendent, en vol o confirmada a l'agrupador) es torna a aplicar
         sobre la resposta del servidor: un sondeig que ha eixit abans de la
         marca no torna a encendre la pastilla. Sense marca, el mateix fil. */
      const nous = (Array.isArray(bruts) ? bruts : [])
        .map((f) => aplicaMarcaLocal(mapejaFil(f), agrupador.current.marcatFins(f.id)));
      /* Auditoria 261007 (B) · Si la llista és la mateixa, ni setFils ni cap
         derivat nou: el sondeig de cada 25 s no repinta el xat per a res. Els
         avisos i la neteja de visitants es fan igualment. El «no llegit»
         manual apagat a l'instant (marcaLlegides) no passa per l'agrupador:
         la llista es dona per diferent i mana el servidor, com fins ara.
         Llevat d'un canvi de dia: les etiquetes de temps es calculen amb
         l'hora del render («14:32», «Ahir» o el dia de la setmana a
         FilaConversa; «Hui» i «Ahir» a SeparadorDia) i el xat no té cap
         rellotge propi; qui les refrescava era el sondeig, que repintava
         sempre. El primer sondeig del dia nou (passada la mitjanit, o en
         tornar a la pestanya l'endemà) aplica la llista encara que siga
         equivalent; amb els fils es tornen a calcular missatgesDerivats i
         es repinten la llista i la conversa oberta. */
      const dia = clauDia(new Date());
      if (dia !== diaFilsRef.current || !filsEquivalents(filsRef.current, nous)) {
        diaFilsRef.current = dia;
        mutaFils(() => nous);
      }
      /* Un visitant que ja torna a la llista ja hi participa. */
      const ids = new Set(nous.map((f) => f.id));
      mutaVisitants((previs) => (Object.keys(previs).some((id) => ids.has(id))
        ? Object.fromEntries(Object.entries(previs).filter(([id]) => !ids.has(id)))
        : previs));
      setAvis(null);
      llistaCarregadaRef.current = true;
      falladesLlistaRef.current = 0;
      reintentableLlistaRef.current = true;
      setLlistaFresca(true);
      setAvisLlista(null);
      for (const f of nous) avisaSiCal(f.id, f.ultimSeq, f.ultimAutorId, f.name);
      baseAvisosRef.current = true;
      return true;
    } catch (error) {
      if (!vigent(op)) return false;
      if (meua !== genFils.current) return null;
      /* No es propaga a `status`. Vegeu la capçalera del fitxer. */
      const text = error?.message || 'No s\'han pogut carregar les converses.';
      falladesLlistaRef.current += 1;
      reintentableLlistaRef.current = error?.retriable === true;
      setLlistaFresca(false);
      reprogramaLlistaRef.current?.();
      /* Auditoria 261008 (B04) · Amb cobertura rural intermitent, un sol
         sondeig fallit buidava la llista i convertia la conversa oberta en un
         404. Si la llista ja s'havia carregat bé, es conserva (fils i
         filsRef) i l'avís no la tapa. Només es buida si encara no s'ha
         carregat mai, o amb l'esquema del xat sense aplicar ('ESQUEMA'). */
      if (llistaCarregadaRef.current && error?.code !== 'ESQUEMA') {
        setAvisLlista(text);
        return false;
      }
      setAvisLlista(null);
      setAvis(text);
      filsRef.current = [];
      setFils([]);
      return false;
    } finally {
      if (vigent(op) && meua === genFils.current) setEstat('ready');
    }
  }, [joId, config, captura, vigent, avisaSiCal, mutaFils, mutaVisitants]);

  /* ── Missatges d'un fil: complet la primera vegada, incremental (despresDeSeq) després ──
     Torna true o false com carregaFils.
     Gauntlet 261025_0545 (XC-01) · Una sola lectura en vol per fil. Abans,
     cada crida (cada avís del canal) superava la que volava i en llençava la
     resposta: amb avisos més seguits que una volta de xarxa, la conversa
     oberta no rebia res fins que la ràfega parava, i cada avís era una
     petició. Ara, si n'hi ha una en vol, la crida només la marca `deNou` i
     n'espera la mateixa promesa; la lectura que torna S'APLICA sempre
     (avança el cursor) i, si estava marcada, se'n fa UNA més. L'única guarda
     de generació que queda és la de l'operació (vigent): una renovació o un
     altre àmbit. Els avisos no es filtren pel seq: el cursor no sap si el
     forat ja és ple (el missatge propi confirmat no el mou, vegeu cursorRef).
     Gauntlet 261025_0545 (XC-02) · Mentre una lectura incremental torna plena,
     se'n demana la pàgina següent, cada una aplicada, fins a MAX_PAGINES_NOUS;
     abans, cada tic en portava 100 i un fil ja visitat amb 350 de nous tardava
     més d'un minut a arribar al final. L'adaptador no canvia. */
  const carregaMissatges = useCallback((filId) => {
    const op = captura();
    if (!filId || !joId || !vigent(op)) return Promise.resolve(false);
    const enVol = lecturesFilRef.current.get(filId);
    if (enVol && enVol.op === op) {
      enVol.deNou = true;
      return enVol.promesa;
    }
    const lectura = { op, deNou: false, promesa: null };
    lecturesFilRef.current.set(filId, lectura);
    /* Gauntlet 261025_0545 (D5) · llegintFil, si la vista l'ha de saber. */
    publicaLectura(filId);

    /* Una lectura, aplicada: { ok, plena }. */
    const llegix = async () => {
      /* Auditoria 261007 (B) · El cursor de servidor (cursorRef), mai el seq
         màxim del magatzem: el missatge propi confirmat no el mou. */
      const desDe = cursorRef.current[filId] ?? null;
      const incremental = desDe != null;
      try {
        await hostReady(op.controller.signal);
        if (!vigent(op)) return { ok: false, plena: false };
        const opcions = { ...config, signal: op.controller.signal };
        if (incremental) opcions.despresDeSeq = desDe;
        if (esVisitant(visitantsRef.current, filId)) opcions.visitant = true;
        const bruts = await loadMissatges(filId, opcions);
        if (!vigent(op)) return { ok: false, plena: false };
        const nous = (Array.isArray(bruts) ? bruts : []).map((m) => mapejaMissatge(m, joId));
        /* Auditoria 261007 (B) · Només una lectura acceptada avança el cursor, i
           mai cap arrere. Una càrrega completa sense cap missatge el deixa a 0
           (cursor vàlid per a xat_nous): un fil buit no torna a fer una càrrega
           completa a cada sondeig. */
        const maxim = seqMaxim(nous);
        cursorRef.current[filId] = incremental ? Math.max(desDe, maxim ?? desDe) : (maxim ?? 0);
        /* Gauntlet 261025_0545 (XC-13, XC-14) · El fil ja s'ha llegit bé una
           vegada en este àmbit, i l'avís d'una lectura fallida se'n va. */
        marcaCarregat(filId);
        llevaAvisFil(filId);
        /* Auditoria 261007 (B) · Un sondeig incremental sense res nou no muta
           res: ni el magatzem ni els derivats, ni la conversa oberta es repinta
           cada 5 o 30 s per a res. El separador «Hui»/«Ahir» del dia nou el
           porta el sondeig de la llista (vegeu carregaFils). */
        if (incremental && !nous.length) return { ok: true, plena: false };
        /* Gauntlet 261025_0545 (Codex C0545-X3) · La càrrega completa ja no
           buida el magatzem: hi conserva els confirmats PROPIS que han arribat
           mentre volava (seq més alt que el màxim de la pàgina), que abans
           desapareixien fins al sondeig següent. El cursor el continua
           governant la lectura (maxim): el forat d'abans del meu ja arribarà.
           Si la pàgina porta el mateix id, mana la pàgina (un esborrat, també). */
        mutaMissatges((previs) => ({
          ...previs,
          [filId]: fusionaPerSeq(
            incremental ? previs[filId] || []
              : (previs[filId] || []).filter((m) => m.seq != null && m.seq > (maxim ?? 0)),
            nous
          )
        }));
        /* Un pendent que el servidor ja torna amb el seu id és un missatge confirmat. */
        mutaPendents((previs) => retiraConfirmats(previs, filId, nous));
        if (incremental) {
          for (const m of nous) avisaSiCal(filId, m.seq, m.usuariId, m.author);
        } else {
          setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: nous.length >= LIMIT_PAGINA, carregant: false } }));
          if (maxim != null) ultimSeqAvisat.current[filId] = Math.max(ultimSeqAvisat.current[filId] || 0, maxim);
        }
        return { ok: true, plena: incremental && nous.length >= LIMIT_PAGINA };
      } catch (error) {
        if (!vigent(op)) return { ok: false, plena: false };
        /* Gauntlet 261025_0545 (XC-13) · Abans, `avis`: l'error que TAPA la
           llista de converses fins al sondeig bo següent. Ara és un avís del
           fil, que no bloqueja res i se'n va amb la lectura bona següent. */
        posaAvisFil(filId, error?.message || 'No s\'han pogut carregar els missatges.', 'lectura');
        return { ok: false, plena: false };
      }
    };

    lectura.promesa = (async () => {
      try {
        for (let pagines = 1; ; pagines += 1) {
          lectura.deNou = false;
          const { ok, plena } = await llegix();
          if (!vigent(op)) return false;
          /* XC-01 · L'han tornada a demanar mentre volava: una lectura més. */
          if (lectura.deNou) { pagines = 0; continue; }
          /* XC-02 · Una pàgina plena, la següent, fins a MAX_PAGINES_NOUS. */
          if (!ok || !plena || pagines >= MAX_PAGINES_NOUS) return ok;
        }
      } finally {
        /* Una lectura d'una operació avortada no esborra la que ja vola amb la nova. */
        if (lecturesFilRef.current.get(filId) === lectura) lecturesFilRef.current.delete(filId);
        publicaLectura(filId);
      }
    })();
    return lectura.promesa;
  }, [joId, config, captura, vigent, avisaSiCal, mutaMissatges, mutaPendents, marcaCarregat, posaAvisFil, llevaAvisFil, publicaLectura]);

  /* ── Historial cap arrere (XAT-A23): abansDeSeq = el seq mínim carregat ── */
  const carregaMesAntics = useCallback(async (filId) => {
    const op = captura();
    if (!filId || filId === ID_FIL_DE_MOSTRA_DE_JAVI || !joId || !vigent(op)) return false;
    /* Decisió 1 · Només bloqueja una càrrega de l'operació vigent: la que una
       renovació ha avortat ja no compta, i el relleu la torna a demanar. */
    const enCurs = carregantAnticsRef.current.get(filId);
    if (enCurs && vigent(enCurs)) return false;
    const minim = seqMinim(missatgesRef.current[filId] || []);
    if (minim == null) return carregaMissatges(filId);

    carregantAnticsRef.current.set(filId, op);
    setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: previs[filId]?.hiHaMes ?? true, carregant: true } }));
    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const opcions = { ...config, signal: op.controller.signal, abansDeSeq: minim, limit: LIMIT_PAGINA };
      if (esVisitant(visitantsRef.current, filId)) opcions.visitant = true;
      const bruts = await loadMissatges(filId, opcions);
      if (!vigent(op)) return false;
      const antics = (Array.isArray(bruts) ? bruts : []).map((m) => mapejaMissatge(m, joId));
      mutaMissatges((previs) => ({ ...previs, [filId]: fusionaPerSeq(previs[filId] || [], antics) }));
      /* B09 · El primer èxit reinicia el comptador i lleva l'espera. */
      delete falladesAnticsRef.current[filId];
      setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: antics.length >= LIMIT_PAGINA, carregant: false } }));
      /* Gauntlet 261025_0545 (XC-13) · Una lectura bona del fil lleva el seu avís. */
      llevaAvisFil(filId);
      return true;
    } catch (error) {
      if (!vigent(op)) return false;
      /* Gauntlet 261025_0545 (XC-13) · Avís del fil, no `avis`: no tapa la llista. */
      posaAvisFil(filId, error?.message || 'No s\'ha pogut carregar l\'historial.', 'lectura');
      /* Auditoria 261008 (B09) · Sense xarxa, la crida falla en mil·lisegons
         i l'observador de Conversa, que es tornava a crear amb `carregant`,
         la tornava a demanar a l'instant: un bucle de peticions. Cada fallada
         seguida porta ara una espera (esperaDeLHistorial) que l'observador
         respecta; a la tercera, o amb un error no reintentable, només el
         botó o la xarxa que torna. */
      const fallades = (falladesAnticsRef.current[filId] || 0) + 1;
      falladesAnticsRef.current[filId] = fallades;
      const espera = esperaDeLHistorial(fallades, error?.retriable === true);
      setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: previs[filId]?.hiHaMes ?? true, carregant: false, espera } }));
      return false;
    } finally {
      /* La d'una operació avortada no esborra la que el relleu ja ha llançat. */
      if (carregantAnticsRef.current.get(filId) === op) carregantAnticsRef.current.delete(filId);
    }
  }, [joId, config, captura, vigent, carregaMissatges, mutaMissatges, posaAvisFil, llevaAvisFil]);

  /* ── Càrrega inicial. `joId` a la clau: canviar de sessió recarrega. ──
     Decisió 1 · Una renovació també hi torna (carregaFils penja de l'operació),
     però sense passar per 'loading': la llista que ja es veu es queda fins que
     arriba la nova. L'estat de càrrega el posa la purga, només quan canvia
     l'àmbit (i el muntatge arrenca ja en 'loading'). */
  useEffect(() => {
    carregaFils();
  }, [joId, carregaFils]);

  /* Decisió 1 · L'historial cap arrere que la renovació ha tallat es torna a
     demanar amb l'operació nova. La paginació no ha eixit de «carregant»: ni
     el botó «Carrega'n més» ni l'espera d'obrir de Conversa no veuen cap salt. */
  useEffect(() => {
    if (tokenEstat !== token) return;
    for (const [filId, op] of [...carregantAnticsRef.current]) {
      if (!vigent(op)) carregaMesAntics(filId);
    }
  }, [tokenEstat, token, vigent, carregaMesAntics]);

  /* Auditoria 261008 (B09) · Quan torna la xarxa, l'historial cap arrere
     torna a provar: es lleva l'espera de tots els fils i l'observador de
     Conversa, si el sentinella encara és a la vista, el demana una vegada.
     El comptador de fallades es queda: si torna a fallar, només el botó. */
  const despertaAntics = useCallback(() => {
    setPaginacio((previs) => {
      const ids = Object.keys(previs).filter((id) => previs[id]?.espera);
      if (!ids.length) return previs;
      const nou = { ...previs };
      for (const id of ids) nou[id] = { hiHaMes: previs[id].hiHaMes, carregant: previs[id].carregant };
      return nou;
    });
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('online', despertaAntics);
    return () => window.removeEventListener('online', despertaAntics);
  }, [despertaAntics]);

  /* ── Obrir un fil: carregar-lo. La lectura la marca la interfície amb marcaVist. ── */
  /* Auditoria adversarial 261016 · El xat de només lectura de Javi no és cap
     fil del port: obrir-lo no en demana res (ni historial, ni canal). */
  const obriFil = useCallback((filId) => {
    if (vigent(captura())) setFilActiu(joId && filId !== ID_FIL_DE_MOSTRA_DE_JAVI ? filId || null : null);
  }, [joId, captura, vigent]);

  useEffect(() => {
    const op = captura();
    if (!filActiu || tokenEstat !== token || !joId || !vigent(op)) return;
    carregaMissatges(filActiu);
  }, [filActiu, carregaMissatges, tokenEstat, token, joId, captura, vigent]);

  /* ── Sondeig de fils i del fil obert, amb el canal de temps real com a avís ── */
  useEffect(() => {
    const op = captura();
    if (!joId || tokenEstat !== token || !vigent(op)) return undefined;
    let viu = true;
    let temporitzador = null;
    let temporitzadorFil = null;
    let debounceVisibilitat = null;
    let subscripcio = null;
    let canalViu = false;
    let versioSub = 0;

    const amagat = () => typeof document !== 'undefined' && document.hidden;

    /* Una baixa fallida no tomba el xat: el sondeig continua i queda a la consola. */
    const donaDeBaixa = (sub) => {
      const avisa = (error) => console.warn('[Xat] No s’ha pogut tancar el canal de temps real.', error);
      try { Promise.resolve(unsubscribeFromXat(sub)).catch(avisa); } catch (error) { avisa(error); }
    };

    const desconnecta = () => {
      versioSub += 1;
      canalViu = false;
      if (subscripcio) {
        const antiga = subscripcio;
        subscripcio = null;
        donaDeBaixa(antiga);
      }
    };

    const connectaRealtime = () => {
      desconnecta();
      if (!viu || !vigent(op) || !filActiu || amagat()) return;
      const versio = versioSub;
      /* CUR-03 · El callback pot arribar abans de resoldre l'obertura:
         l'últim estat del canal mana sobre el resultat inicial. */
      let estatCanal = null;
      const alRebre = (error, dades) => {
        if (!viu || !vigent(op) || versio !== versioSub) return;
        if (error) { estatCanal = false; canalViu = false; return; }
        /* Un avís vàlid prova que el canal viu, també després d'una
           reconnexió. Les dades es demanen sempre pel cursor de seq. */
        if (dades?.tipus === 'nous' && dades.filId === filActiu) {
          estatCanal = true;
          canalViu = true;
          carregaMissatges(filActiu);
        }
      };
      let promesa;
      try {
        promesa = Promise.resolve(subscribeToXat(filActiu, alRebre, { ...config, signal: op.controller.signal }));
      } catch (error) {
        promesa = Promise.reject(error);
      }
      promesa.then((res) => {
        const sub = res?.subscription || null;
        if (!sub) return;
        if (viu && vigent(op) && versio === versioSub) {
          subscripcio = sub;
          canalViu = estatCanal ?? !res.error;
        } else {
          donaDeBaixa(sub);
        }
      }).catch(() => {
        if (viu && vigent(op) && versio === versioSub) canalViu = false;
      });
    };

    connectaRealtime();

    /* Auditoria 261007 (B) · Només una fallada espaia el tic; una càrrega
       superada (null) manté la cadència, com ja fa ticFil.
       Auditoria 261008 (B04) · Una fallada reintentable torna a provar aviat
       (2, 5, 10, 30 s i sostre de 60 s), no als 250 s.
       Revisió 261008 · L'espera es llig dels refs de l'última càrrega
       APLICADA, no del resultat del tic: així mana també quan la fallada ha
       vingut d'una altra crida o quan el tic ha quedat superat per una que
       ha fallat. Amb la pestanya amagada no es demana res: 25 s. */
    const esperaSeguent = () => (falladesLlistaRef.current > 0
      ? esperaDeLaLlista(falladesLlistaRef.current, reintentableLlistaRef.current)
      : MS_LLISTA);
    let tic = null;
    const arma = (ms) => {
      if (temporitzador) clearTimeout(temporitzador);
      temporitzador = setTimeout(tic, ms);
    };
    tic = async () => {
      if (!viu || !vigent(op)) return;
      if (temporitzador) clearTimeout(temporitzador);
      temporitzador = null;
      const visible = !amagat();
      const vigila = !visible && avisosNatiusActius();
      if (visible || vigila) await carregaFils();
      if (viu && vigent(op)) arma(visible ? esperaSeguent() : vigila ? MS_LLISTA_SEGON_PLA : MS_LLISTA);
    };

    /* Revisió 261008 (B04) · La càrrega inicial ja pot haver fallat quan
       s'arma el sondeig, i obrir una conversa el torna a armar enmig de
       l'espera curta: el primer tic no torna als 25 s. */
    arma(esperaSeguent());
    const reprograma = () => { if (viu && vigent(op)) arma(esperaSeguent()); };
    reprogramaLlistaRef.current = reprograma;

    const ticFil = async () => {
      if (!viu || !vigent(op) || !filActiu) return;
      if (temporitzadorFil) clearTimeout(temporitzadorFil);
      let ok = true;
      if (!amagat()) ok = await carregaMissatges(filActiu);
      if (viu && vigent(op)) {
        const base = canalViu ? MS_FIL_AMB_CANAL : MS_FIL;
        temporitzadorFil = setTimeout(ticFil, ok === false ? base * 6 : base);
      }
    };

    if (filActiu) temporitzadorFil = setTimeout(ticFil, MS_FIL);

    const desperta = () => {
      if (!viu || !vigent(op)) return;
      if (temporitzador) clearTimeout(temporitzador);
      tic();
      if (filActiu) {
        ticFil();
        connectaRealtime();
      }
    };

    const alCanviarVisibilitat = () => {
      if (debounceVisibilitat) clearTimeout(debounceVisibilitat);
      debounceVisibilitat = setTimeout(() => {
        if (!viu || !vigent(op)) return;
        if (amagat()) desconnecta();
        else desperta();
      }, 300);
    };
    const alTornarXarxa = () => { if (!amagat()) desperta(); };

    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', alCanviarVisibilitat);
    if (typeof window !== 'undefined') window.addEventListener('online', alTornarXarxa);

    return () => {
      viu = false;
      if (reprogramaLlistaRef.current === reprograma) reprogramaLlistaRef.current = null;
      if (temporitzador) clearTimeout(temporitzador);
      if (temporitzadorFil) clearTimeout(temporitzadorFil);
      if (debounceVisibilitat) clearTimeout(debounceVisibilitat);
      desconnecta();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', alCanviarVisibilitat);
      if (typeof window !== 'undefined') window.removeEventListener('online', alTornarXarxa);
    };
  }, [joId, filActiu, carregaFils, carregaMissatges, tokenEstat, token, config, captura, vigent]);

  /* ── Enviament amb reintents: sempre el mateix id (XAT-A25) ──
     Gauntlet 261025_0545 (D2) · `esperaLaXarxa` fals (Connectar): sense
     xarxa, els reintents de sempre en lloc de l'espera de XC-03. */
  const executaEnviament = useCallback(async (filId, id, cos, respostaA = null, esperaLaXarxa = true) => {
    const op = captura();
    if (!vigent(op)) return [];
    /* Una resposta porta l'id del missatge citat; el port ja l'accepta
       (enviaMissatge(filId, { id, text, respostaA })). Sense resposta, el cos
       és el de sempre. */
    const entrada = respostaA ? { id, text: cos, respostaA } : { id, text: cos };
    /* Integració 261024 (Codex C-02) · Un rebuig per les normes (SDP-MOD-428)
       torna a obrir la porta UNA sola vegada per enviament. */
    let normesReobertes = false;
    /* Gauntlet 261025_0545 (XC-03) · `intent` només puja amb un reintent que
       gasta (els de sempre i el de les normes), no amb l'espera de la xarxa. */
    let intent = 0;
    for (;;) {
      try {
        /* T63.2 · En un fil de pàgina que llegixes com a visitant, el primer missatge hi entra. */
        const visitant = esVisitant(visitantsRef.current, filId);
        const opcions = { ...config, signal: op.controller.signal };
        if (visitant) opcions.visitant = true;
        const desat = await enviaMissatge(filId, entrada, opcions);
        if (!vigent(op)) return [];
        if (visitant) {
          mutaVisitants((previs) => (previs[filId] ? { ...previs, [filId]: { ...previs[filId], participant: true } } : previs));
          carregaFils();
        }
        const definitiu = { ...mapejaMissatge(desat, joId), author: 'Jo' };
        mutaPendents((previs) => retiraPendent(previs, id));
        /* Auditoria 261007 (B) · Es pinta al magatzem, però el cursor de
           servidor (cursorRef) no es toca: el missatge d'un altre amb un seq
           anterior encara ha d'arribar per la lectura incremental. */
        mutaMissatges((previs) => ({ ...previs, [filId]: fusionaPerSeq(previs[filId] || [], [definitiu]) }));
        if (definitiu.seq != null) {
          ultimSeqAvisat.current[filId] = Math.max(ultimSeqAvisat.current[filId] || 0, definitiu.seq);
        }
        mutaFils((previs) => previs.map((f) => (f.id === filId ? actualitzaFilAmbMissatge(f, definitiu) : f)));
        return [definitiu];
      } catch (error) {
        if (!vigent(op)) return [];
        /* Gauntlet 261025_0545 (XC-03) · Sense xarxa (el navegador ho diu),
           una fallada de xarxa no gasta cap reintent: abans, els tres
           s'esgotaven en uns 10 s i la bombolla quedava en error, i res no la
           reenviava en tornar la cobertura. Ara es queda 'pendent' i espera
           que torne la xarxa o que la pàgina torne a la vista, i ho torna a
           provar amb el MATEIX id (el servidor és idempotent per id). Mentre
           espera, la cua del fil (encuaEnviament) reté els següents: ixen en
           ordre i d'un en un (el límit de 15 per 5 s, trg_rate_limit_xat). Un
           error no reintentable, o els reintents esgotats amb xarxa, fan el
           camí de sempre. Una renovació talla l'espera com talla els
           reintents (interromEnviaments: la bombolla passa a error). El text
           només viu en memòria: desar-lo al dispositiu és decisió del Mestre. */
        if (error?.retriable && esperaLaXarxa && senseXarxa()) {
          /* Gauntlet 261025_0545 (D2) · Els de programa encuats darrere ho
             saben ara (encuaEnviament): no esperaran la xarxa amb esta. */
          const esperes = esperesXarxaRef.current.get(filId) || { esperen: 0, oients: new Set() };
          esperesXarxaRef.current.set(filId, esperes);
          esperes.esperen += 1;
          for (const oient of [...esperes.oients]) oient();
          let seguir;
          try {
            seguir = await esperaXarxa(op.controller.signal);
          } finally {
            esperes.esperen -= 1;
            if (!esperes.esperen && !esperes.oients.size && esperesXarxaRef.current.get(filId) === esperes) {
              esperesXarxaRef.current.delete(filId);
            }
          }
          if (!seguir || !vigent(op)) return [];
          continue;
        }
        if (error?.retriable && intent < MAX_REINTENTS) {
          const seguir = await espera(esperaReintent(intent), op.controller.signal);
          intent += 1;
          if (!seguir || !vigent(op)) return [];
          continue;
        }
        /* Integració 261024 (Codex C-02) · El servidor no troba acceptada la
           versió vigent de les normes, encara que este dispositiu ho
           recordara: s'oblida el record i es torna a preguntar
           (asseguraNormes({ rebutjades: true })). Si les accepta, el mateix
           missatge (el mateix id: el disparador l'ha rebutjat abans
           d'inserir-lo) es reenvia una sola vegada; si les declina, o el
           servidor el torna a rebutjar, la bombolla queda en error amb el
           motiu. Mai en bucle. Sense proveïdor, la bombolla de sempre. */
        const perNormes = esRebuigDeNormes(error);
        const moderacio = moderacioRef.current;
        if (perNormes && !normesReobertes && typeof moderacio?.asseguraNormes === 'function') {
          normesReobertes = true;
          const acceptades = await moderacio.asseguraNormes({ rebutjades: true });
          if (!vigent(op)) return [];
          if (acceptades === true) { intent += 1; continue; }
        }
        /* Onada 6 · `codiError` deixa que la bombolla diga en la llengua de
           la interfície els codis SDP que té traduïts (errorsXat.js). */
        mutaPendents((previs) => actualitzaPendent(previs, id, {
          estatEnviament: 'error',
          error: perNormes ? tradueix(traductorRef.current, TEXTOS_MODERACIO.calAcceptar) : error?.message || 'No s\'ha enviat.',
          codiError: perNormes ? CODI_NORMES_SERVIDOR : error?.code || null
        }));
        return [];
      }
    }
  }, [joId, config, captura, vigent, mutaFils, mutaMissatges, mutaPendents, mutaVisitants, carregaFils]);

  /* Gauntlet 261025_0545 (MISSED P2, ordre d'enviament) · Els enviaments d'un
     mateix fil, en l'ordre en què s'escriuen: cada un espera que l'anterior
     acabe (enviat, en error o tallat). Abans anaven en paral·lel i, si el
     primer esperava un reintent, el segon el passava davant i el servidor el
     numerava abans: tothom els veia al revés. Amb la cua buida ix en el mateix
     tic (la bombolla i la crida, com sempre); un altre fil no espera. */
  /* Gauntlet 261025_0545 (D2) · `abandona` (els de programa, que no esperen
     la xarxa): si el fil té, o arriba a tindre mentre este espera el torn, un
     enviament que espera la xarxa (XC-03), este no s'hi queda ni el passa
     davant: `abandona()` el deixa en error i en torna la resposta. El
     següent de la cua continua darrere de l'anterior. */
  const encuaEnviament = useCallback((filId, tasca, abandona = null) => {
    const anterior = cuesEnviamentRef.current.get(filId);
    let actual;
    if (!anterior) actual = tasca();
    else if (!abandona) actual = anterior.then(tasca);
    else {
      const mapa = esperesXarxaRef.current;
      const esperes = mapa.get(filId) || { esperen: 0, oients: new Set() };
      if (esperes.esperen > 0) actual = Promise.resolve(abandona());
      else {
        mapa.set(filId, esperes);
        actual = new Promise((resol) => {
          let fet = false;
          const oient = () => acaba(abandona);
          function acaba(fn) {
            if (fet) return;
            fet = true;
            esperes.oients.delete(oient);
            if (!esperes.esperen && !esperes.oients.size && mapa.get(filId) === esperes) mapa.delete(filId);
            resol(fn());
          }
          esperes.oients.add(oient);
          anterior.then(() => acaba(tasca));
        });
      }
    }
    const cua = (abandona && anterior ? Promise.all([anterior, actual]) : actual).then(() => undefined, () => undefined);
    cuesEnviamentRef.current.set(filId, cua);
    cua.then(() => { if (cuesEnviamentRef.current.get(filId) === cua) cuesEnviamentRef.current.delete(filId); });
    return actual;
  }, []);

  /* ── Enviar: la bombolla es pinta abans de la xarxa (L4). No llança. ──
     D7 · Defensa en profunditat: a un fil on no es pot escriure (els Avisos
     per a qui no n'és administrador) no s'envia res ni es pinta cap bombolla.
     El Compositor ja no hi mostra el formulari i el servidor ho rebutja
     (SDP-XAT-011).
     `opcions.respostaA`: l'id del missatge al qual es respon (la cita del
     patró de missatgeria).
     Gauntlet 261025_0545 (D2) · `opcions.esperaLaXarxa` (cert si no es diu):
     fals per a qui envia per programa i espera cada enviament (Connectar,
     missatgeAlXat). Sense xarxa, la resposta arriba acotada, com abans de
     XC-03: els reintents de sempre i [] amb la bombolla en error, que es
     queda al xat per a tornar-la a provar. La conversa que la persona té
     davant no el passa: hi continua l'espera de la xarxa. */
  const sendChatMessage = useCallback(async (fil, text, opcions = {}) => {
    const op = captura();
    /* Relleu 261007 · Guardada d'abans d'una renovació: la versió vigent. */
    const delegada = op ? null : accioVigent('sendChatMessage');
    if (delegada) return delegada(fil, text, opcions);
    if (!joId || !vigent(op)) return [];
    if (fil?.potEscriure === false) return [];
    const filId = fil?.id;
    const cos = String(text ?? '').trim();
    if (!filId || !cos) return [];
    const respostaA = opcions?.respostaA ? String(opcions.respostaA) : null;
    const esperaLaXarxa = opcions?.esperaLaXarxa !== false;

    const id = generaId();
    const pendent = {
      id,
      threadId: filId,
      seq: null,
      usuariId: joId,
      text: cos,
      tipus: 'text',
      sender: 'me',
      author: 'Jo',
      is_ai: false,
      creatAl: new Date().toISOString(),
      respostaA,
      esborrat: false,
      metadades: {},
      estatEnviament: 'pendent',
      error: null
    };
    mutaPendents((previs) => afigPendent(previs, filId, pendent));
    const tasca = () => executaEnviament(filId, id, cos, respostaA, esperaLaXarxa);
    if (esperaLaXarxa) return encuaEnviament(filId, tasca);
    /* Gauntlet 261025_0545 (D2) · El fil espera la xarxa per una bombolla
       d'abans: esta no ix (no la passa davant) i queda en error, a mà. */
    const abandona = () => {
      if (vigent(op)) {
        mutaPendents((previs) => actualitzaPendent(previs, id, {
          estatEnviament: 'error', error: 'No s\'ha enviat: no hi ha xarxa.', codiError: 'XARXA'
        }));
      }
      return [];
    };
    return encuaEnviament(filId, tasca, abandona);
  }, [joId, captura, vigent, accioVigent, mutaPendents, executaEnviament, encuaEnviament]);

  /* ── Fase D (261020, tasca 2; crítica 261020, troballa 1) · La porta de les
     normes de convivència, UNA sola i ací: és l'únic sendChatMessage que
     s'exposa, també el que fa servir Connectar (useAplicaAbast). Abans de
     res, i abans de pintar cap bombolla: si la persona no les accepta, llança
     un AbortError i no s'envia ni es pinta res (Conversa torna a posar el
     text al camp). El xat privat de la IAIA no hi passa: no és cap
     publicació per al poble. Integració 261024 (Codex C-02) · El xat públic
     de la pàgina /iaia, sí: el llig el poble i el servidor també l'exigix
     (esXatPrivatDeLaIAIA). Sense proveïdor, o amb la porta que no s'aplica
     (llavor, local, sense sessió), és l'enviament de sempre. El relleu intern
     (accionsRef) continua cru: una crida guardada d'abans d'una renovació ja
     ha passat la porta. */
  const enviaAmbNormes = useCallback(async (fil, text, opcions) => {
    const moderacio = moderacioRef.current;
    const complet = filsRef.current.find((f) => f.id === fil?.id) || visitantsRef.current[fil?.id] || fil;
    if (typeof moderacio?.asseguraNormes === 'function' && String(text ?? '').trim() && !esXatPrivatDeLaIAIA(complet)
      && !(await moderacio.asseguraNormes())) {
      throw new DOMException('Cal acceptar les normes de convivència.', 'AbortError');
    }
    return opcions === undefined ? sendChatMessage(fil, text) : sendChatMessage(fil, text, opcions);
  }, [sendChatMessage]);

  /* L'adjunt conserva la previsualització local fins a la confirmació.
     No entra a la cua de text ni desa Blobs/URL temporals en localStorage.
     XAT-03 · `onProgres` (opcional) passa tal qual al port: el progrés de la pujada. */
  const sendChatMedia = useCallback(async (fil, adjunt, { signal, onProgres } = {}) => {
    const op = captura();
    if (!joId || !vigent(op) || signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
    const complet = filsRef.current.find((f) => f.id === fil?.id) || visitantsRef.current[fil?.id] || fil;
    if (!complet?.id || complet.potEscriure === false || (complet.tipus === 'canal' && complet.potEscriure !== true)) {
      throw new Error('No pots enviar fitxers en esta conversa.');
    }
    if (!teCapacitat('xatMultimedia')) throw new Error('Este node encara no permet enviar adjunts.');
    const moderacio = moderacioRef.current;
    if (typeof moderacio?.asseguraNormes === 'function' && !(await moderacio.asseguraNormes())) {
      throw new DOMException('Cal acceptar les normes de convivència.', 'AbortError');
    }
    if (!vigent(op) || signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
    const controller = new AbortController();
    const avorta = () => controller.abort();
    signal?.addEventListener('abort', avorta, { once: true });
    op.controller.signal.addEventListener('abort', avorta, { once: true });
    let desat;
    /* Integració 261024 (Codex C-02) · Un rebuig per les normes (SDP-MOD-428,
       a la causa de l'error de l'adjunt) torna a obrir la porta UNA vegada; si
       les accepta, es publica de nou amb el mateix id (la reserva ja pujada no
       es torna a pujar); si les declina, l'AbortError de sempre. */
    const publica = () => publicaAdjuntXat(complet.id, adjunt, { ...config, signal: controller.signal, onProgres });
    try {
      try { desat = await publica(); }
      catch (error) {
        if (!esRebuigDeNormes(error) || typeof moderacio?.asseguraNormes !== 'function') throw error;
        const acceptades = await moderacio.asseguraNormes({ rebutjades: true });
        if (!vigent(op) || signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
        if (acceptades !== true) throw new DOMException('Cal acceptar les normes de convivència.', 'AbortError');
        desat = await publica();
      }
    }
    finally { signal?.removeEventListener('abort', avorta); op.controller.signal.removeEventListener('abort', avorta); }
    if (!vigent(op) || signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
    const definitiu = { ...mapejaMissatge(desat, joId), author: 'Jo' };
    mutaMissatges((previs) => ({ ...previs, [complet.id]: fusionaPerSeq(previs[complet.id] || [], [definitiu]) }));
    mutaFils((previs) => previs.map((f) => f.id === complet.id ? actualitzaFilAmbMissatge(f, definitiu) : f));
    return [definitiu];
  }, [joId, captura, vigent, config, mutaMissatges, mutaFils]);

  /* ── Reintent manual d'una bombolla en error, amb el mateix id ── */
  const reintenta = useCallback(async (missatgeId) => {
    if (!joId || !vigent(captura())) return [];
    const trobat = trobaPendent(pendentsRef.current, missatgeId);
    if (!trobat || trobat.missatge.estatEnviament !== 'error') return [];
    mutaPendents((previs) => actualitzaPendent(previs, missatgeId, { estatEnviament: 'pendent', error: null, codiError: null }));
    /* Gauntlet 261025_0545 (ordre d'enviament) · També a la cua del seu fil. */
    return encuaEnviament(trobat.filId, () => executaEnviament(trobat.filId, missatgeId, trobat.missatge.text, trobat.missatge.respostaA || null));
  }, [joId, captura, vigent, mutaPendents, executaEnviament, encuaEnviament]);

  const descartaFallit = useCallback((missatgeId) => {
    if (!vigent(captura())) return;
    const trobat = trobaPendent(pendentsRef.current, missatgeId);
    if (!trobat || trobat.missatge.estatEnviament !== 'error') return;
    mutaPendents((previs) => retiraPendent(previs, missatgeId));
  }, [captura, vigent, mutaPendents]);

  /* ── Marques de lectura (XAT-C08): local a l'instant, servidor agrupat ──
     Auditoria 261007 (B) · Una marca fallida torna a llançar després de
     l'avís: l'agrupador (missatges.js) l'ha de saber per a no donar-la per
     enviada i acceptar-la de nou en la lectura següent. Qui la crida fora de
     l'agrupador (marcaLlegides) s'ho empassa: l'avís ja s'ha pintat.
     Amb una fallada PERSISTENT (RLS, servidor caigut) i la conversa a la
     vista, cada sondeig de la llista torna els no llegits del servidor, la
     lectura torna a marcar i torna a fallar.
     Gauntlet 261025_0545 (XC-13) · L'avís ja no és `avis`, que tapava la
     llista a cada fallada, sinó el del fil (avisFil), que no bloqueja res i
     se'n va amb la lectura bona següent del fil. */
  const enviaMarca = useCallback(async (filId, seq) => {
    const op = captura();
    if (!vigent(op)) return;
    try {
      const res = await marcaLlegit(filId, { ...config, signal: op.controller.signal, llegitFinsSeq: seq });
      if (!vigent(op)) return;
      const confirmat = Number(res?.llegitFinsSeq);
      if (Number.isFinite(confirmat) && confirmat > 0) {
        mutaFils((previs) => previs.map((f) => (f.id === filId ? aplicaMarcaLocal(f, confirmat) : f)));
      }
    } catch (error) {
      if (vigent(op)) {
        posaAvisFil(filId, error?.message || 'No s\'ha pogut marcar com a llegit.', 'marca');
        throw error;
      }
      /* Decisió 1 · Una marca en vol que la renovació ha tallat es torna a
         enviar amb l'operació nova: la conversa no es torna a muntar i la
         interfície no la tornaria a demanar fins que entrara una bombolla nova.
         Amb un altre àmbit, la fallada de sempre (l'agrupador ja s'ha cancel·lat).
         Relleu 261007 (revisió de seguretat de la Decisió 1, problema 1) · La
         versió vigent ix d'accionsRef amb la guarda de testimoni, comprovada
         en el mateix tic que la crida (accioDelRelleu), i no d'enviaMarcaRef,
         que després de l'await ja podria ser la d'una altra persona.
         Relleu 261007 (revisió de la correcció de seguretat, problema 2) · Pel
         mateix camí que creaFil (despresDelRelleu): una segona renovació entre
         mig torna a esperar el relleu. Sense acció vigent, l'error original. */
      return despresDelRelleu(op, accionsRef, 'enviaMarca', [filId, seq], () => { throw error; });
    }
  }, [config, captura, vigent, mutaFils, posaAvisFil]);
  /* L'agrupador crida sempre l'última enviaMarca, que passa captura(). */
  enviaMarcaRef.current = enviaMarca;

  const marcaVist = useCallback((filId, seq) => {
    if (!filId || filId === ID_FIL_DE_MOSTRA_DE_JAVI || !joId || !vigent(captura())) return;
    /* Un visitant no té marques al servidor: llegir no deixa rastre. */
    if (esVisitant(visitantsRef.current, filId)) return;
    const s = Number(seq) || 0;
    if (s <= 0) return;
    const fil = filsRef.current.find((f) => f.id === filId);
    if (fil && s <= (Number(fil.llegitFinsSeq) || 0)) return;
    if (!agrupador.current.marca(filId, s)) return;
    mutaFils((previs) => previs.map((f) => (f.id === filId ? aplicaMarcaLocal(f, s) : f)));
  }, [joId, captura, vigent, mutaFils]);

  /* ── «Seleccionar xats» → marcar com a llegides: la mateixa marca, per a
     diverses converses alhora. El «no llegit» manual s'apaga en local a
     l'instant i al servidor amb la marca fins a l'últim. Torna quantes. ── */
  const marcaLlegides = useCallback((filIds) => {
    if (!joId || !vigent(captura())) return 0;
    const ids = new Set((Array.isArray(filIds) ? filIds : [filIds]).filter((id) => id != null && id !== '').map(String));
    if (!ids.size) return 0;
    const tractades = [];
    for (const fil of filsRef.current) {
      if (!ids.has(String(fil.id)) || esVisitant(visitantsRef.current, fil.id)) continue;
      const ultim = Number(fil.ultimSeq) || 0;
      if (ultim > (Number(fil.llegitFinsSeq) || 0)) marcaVist(fil.id, ultim);
      /* La fallada ja s'ha avisat dins d'enviaMarca: ací no queda cap promesa rebutjada sense atendre. */
      else if (fil.noLlegitManual) enviaMarca(fil.id, ultim).catch(() => {});
      else continue;
      tractades.push(fil.id);
    }
    if (tractades.length) {
      mutaFils((previs) => previs.map((f) => (tractades.includes(f.id) && f.noLlegitManual ? { ...f, noLlegitManual: false } : f)));
    }
    return tractades.length;
  }, [joId, captura, vigent, marcaVist, enviaMarca, mutaFils]);

  /* ── El padró del poble ──
     NO es guarda a l'estat del context a propòsit: la llista només fa falta
     mentre el selector està obert. L'error puja perquè la interfície el pinte. */
  const cercaMembres = useCallback(
    async (text = null) => {
      const op = captura();
      if (!joId || !vigent(op)) return [];
      try {
        const reals = await carregaMembres(text, { ...config, signal: op.controller.signal });
        return vigent(op) ? reals || [] : [];
      } catch (error) {
        if (!vigent(op)) return [];
        throw error;
      }
    },
    [joId, config, captura, vigent]
  );

  /* ── Obrir conversa amb algú. Idempotent al servidor. ──
     Decisió 1 · Si una renovació la talla (abans o després de la llista), es
     torna a fer amb l'operació nova: el ?amb= i «Nova conversa» de XatSection
     ja no es tornen a muntar i, amb un null, la persona es quedaria sense
     conversa i sense avís. Guardada d'abans d'una renovació i cridada
     després, passa per la versió vigent (accioVigent, Relleu 261007). */
  const creaFil = useCallback(async (altreUsuariId, titol = null) => {
    const op = captura();
    const delegada = op ? null : accioVigent('creaFil');
    if (delegada) return delegada(altreUsuariId, titol);
    if (!joId || !vigent(op)) return null;
    /* Auditoria adversarial 261016 (P3) · El ?amb= de Javi («Escriu-li al
       xat», «En privat») i «Nova conversa» porten el convidat al xat de només
       lectura, per id o àlies del padró pilot: cap directe escrivible. */
    if (convidat && esLaPersonaDeContacte({ id: altreUsuariId })) return ID_FIL_DE_MOSTRA_DE_JAVI;
    try {
      const filId = await creaFilDirecte(altreUsuariId, titol, { ...config, signal: op.controller.signal });
      if (vigent(op)) {
        await carregaFils();
        if (vigent(op)) return filId;
      }
    } catch (error) {
      if (vigent(op)) throw error;
    }
    return despresDelRelleu(op, accionsRef, 'creaFil', [altreUsuariId, titol]);
  }, [joId, convidat, config, captura, vigent, accioVigent, carregaFils]);

  /* ── T63.2 i T67 · El xat comú d'una Pàgina Universal ──
     Null si el subjecte no en té; 'sense-capacitat' si el backend no el sap
     obrir. Els fils que encara no has escrit queden com a visitants.
     Decisió 1 · Una renovació que la talla la torna a fer amb l'operació nova:
     el ?sobre= de XatSection ja no es torna a muntar, i un null deia «Ací no
     hi ha cap xat comú on comentar» i tornava a la llista. Guardada d'abans
     d'una renovació, passa per la versió vigent (accioVigent, Relleu 261007). */
  const obriFilDePagina = useCallback(async (objecte) => {
    const op = captura();
    const delegada = op ? null : accioVigent('obriFilDePagina');
    if (delegada) return delegada(objecte);
    if (!joId || !vigent(op) || !subjecteDeXat(objecte)) return null;
    if (!teCapacitat('xatDePagina')) throw errorSenseCapacitat();
    try {
      const obert = await obriFilDePaginaAlBackend(objecte, { ...config, signal: op.controller.signal });
      if (vigent(op)) {
        if (!obert?.filId) return null;
        /* Un visitant no té marques: res no hi compta com a no llegit. */
        const visitats = (Array.isArray(obert.fils) ? obert.fils : []).map((f) => mapejaFil(f))
          .filter((f) => !f.participant).map((f) => ({ ...f, noLlegits: 0 }));
        if (visitats.length) mutaVisitants((previs) => ({ ...previs, ...Object.fromEntries(visitats.map((f) => [f.id, f])) }));
        await carregaFils();
        if (vigent(op)) return String(obert.filId);
      }
    } catch (error) {
      if (vigent(op)) throw error;
    }
    return despresDelRelleu(op, accionsRef, 'obriFilDePagina', [objecte]);
  }, [joId, config, captura, vigent, accioVigent, carregaFils, mutaVisitants]);
  /* Relleu 261007 (revisió de seguretat) · enviaMarca també: el seu relleu
     passa per la mateixa guarda de testimoni (accioDelRelleu). */
  accionsRef.current = { token, creaFil, obriFilDePagina, sendChatMessage, enviaMarca };

  /* ── Lectures derivades ── */
  /* Les converses i, al final, els fils de pàgina que llegixes com a visitant.
     Ordre del Mestre (261007) · Les files d'ajuda per defecte (perDefecte,
     xatsPerDefecte.js) que el port ha posat a la cua:
       · se'n va la que ja té el seu xat real entre els visitants (qui llig el
         xat públic de /iaia ja no veu la fila sintètica de la IAIA), sense
         afegir-ne cap: les afig, si cal, el port;
       · qui gestiona l'entitat pilot no veu la de Sóc de Poble: no pot obrir
         un xat amb ella mateixa (SDP-XAT-002). Ací i no a la llista, perquè
         la cerca global i la del xat lligen esta mateixa llista.
     En llavor no n'hi ha cap: la mateixa referència i la mateixa pantalla.
     Gauntlet 261016 (Bloc 3.6) · Ordre del Mestre: «permanentment 4
     converses visibles». Des d'ara l'adaptador les porta també en llavor i
     en local, i les dues regles de dalt es conserven perquè són d'identitat:
     ningú no es parla a si mateix (SDP-XAT-002). Per la mateixa raó Javi
     Llinares no veu la seua pròpia fila (esLaPersonaDeContacte). La IAIA
     apagada també es conserva: és la tria explícita de la persona (nivell
     d'IA 0), no una regla de la plataforma.
     Auditoria adversarial 261016 · Tres correccions:
       · (P2) Javi es reconeix per id o àlies del padró pilot, mai pel nom de
         la sessió, que tria cada usuari (esLaPersonaDeContacte);
       · (P2) en llavor i en local el xat públic de /iaia que llegixes com a
         visitant no retira la fila de la IAIA (paginaDeLaIAIA), com a
         l'adaptador: allí és un grup on la IAIA no contesta;
       · (P3) per al convidat, la fila sintètica de Javi és el seu xat de
         només lectura (filDeMostra), al mateix lloc de la cua.
     Gauntlet 261016_1530 (Bloc 3.6.1) · Derogada la regla «qui gestiona
     l'entitat pilot no veu la fila de Sóc de Poble»: ja no hi ha cap fila
     sintètica de Sóc de Poble (data/xatsPerDefecte.js · ACTORS_PERMANENTS), i
     ambXatsPerDefecte ja lleva la que arribe d'abans. El seu actor és la
     comunitat, i qui la gestiona també la veu. L'ordre dels quatre actors el
     posa la llista (actorsDelXat.js). */
  const quiMiraEsJavi = esLaPersonaDeContacte({ id: joId });
  const paginaDeLaIAIA = modeDades === 'remote';
  /* Onada 6 (tasca 12) · Amb la IAIA apagada, cap xat seu (senseLaIAIA): la
     llista, les dues cerques i les comunitats lligen d'ací. */
  const filsDeLaLlista = useMemo(() => {
    const ids = new Set(fils.map((f) => f.id));
    const extra = Object.values(visitants).filter((f) => !ids.has(f.id));
    const ambAjuda = ambXatsPerDefecte(extra.length ? [...fils, ...extra] : fils, { afig: false, paginaDeLaIAIA });
    const senseJavi = quiMiraEsJavi ? senseXatPerDefecte(ambAjuda, 'javi') : ambAjuda;
    const llista = filDeMostra && senseJavi.some((f) => f.perDefecte === 'javi')
      ? senseJavi.map((f) => (f.perDefecte === 'javi' ? filDeMostra : f))
      : senseJavi;
    return iaiaApagada ? senseLaIAIA(llista) : llista;
  }, [fils, visitants, paginaDeLaIAIA, quiMiraEsJavi, filDeMostra, iaiaApagada]);
  /* Integració Xat i Pobles (Onada 6, pla 261009_0245, ítem 4: «El fil de
     xat específic també es dirà 'Gent de la Torre'») · El xat d'un poble que
     és a les fitxes (useCoreContent) es diu com la seua gent a la llista, a
     les comunitats, a les cerques i a la capçalera de la conversa («Sobre:
     …»), també els fils que el servidor ja ha creat amb el nom del poble
     (pobles/xatDelPoble.js, filsAmbLaGentDelPoble). Presentació: les dades i
     el que va al servidor no es toquen. Sense fitxes, la mateixa llista. */
  const { towns } = useCoreContent();
  const filsVisibles = useMemo(() => filsAmbLaGentDelPoble(filsDeLaLlista, towns), [filsDeLaLlista, towns]);
  /* Els fils de la persona sense els de la IAIA, si està apagada: els no
     llegits i els contactes freqüents. La mateixa referència si no n'hi ha. */
  /* Fase D (261020, tasca 2) · Ni els directes amb una persona bloquejada,
     com la IAIA apagada: el seu recompte del servidor no s'hi suma. */
  const filsComptats = useMemo(
    () => senseDirectesBloquejats(iaiaApagada ? senseLaIAIA(fils) : fils, esPersonaBloquejada),
    [fils, iaiaApagada, esPersonaBloquejada]
  );
  /* Fase D (261020, tasca 2) · La llista que es VEU, amb la vista prèvia
     d'una persona bloquejada amagada. Internament (missatgesDerivats,
     comunitats, la cerca de fils per id) es continua llegint filsVisibles. */
  const filsAmbBloquejos = useMemo(() => anotaFilsBloquejats(filsVisibles, esPersonaBloquejada), [filsVisibles, esPersonaBloquejada]);
  /* Onada 6 (tasca 12) · Cert si `filId` és un xat de la IAIA que s'amaga
     perquè està apagada: XatSection en trau qui hi era dins, en lloc d'un 404. */
  const esFilAmagat = useCallback((filId) => {
    if (!iaiaApagada || filId == null || filId === '') return false;
    const id = String(filId);
    const fil = fils.find((f) => String(f.id) === id) || visitants[id];
    return esXatDeLaIAIA(fil);
  }, [iaiaApagada, fils, visitants]);

  const missatgesDerivats = useMemo(() => {
    const ids = new Set([...Object.keys(missatgesPerFil), ...Object.keys(pendentsPerFil)]);
    const resultat = {};
    for (const id of ids) {
      const fil = filsVisibles.find((f) => f.id === id);
      /* Fase D (261020, tasca 2) · Els d'una persona bloquejada, anotats i
         sense text: la cerca, la cita, la multimèdia i les Notes ja no el
         veuen. La MATEIXA llista si no n'hi ha cap. */
      resultat[id] = anotaMissatgesBloquejats(
        combinaMissatges(missatgesPerFil[id] || [], pendentsPerFil[id] || [], fil?.llegitPelsAltresFinsSeq ?? 0),
        esPersonaBloquejada
      );
    }
    return resultat;
  }, [missatgesPerFil, pendentsPerFil, filsVisibles, esPersonaBloquejada]);

  /* Decisió 1 del Mestre (261007) · El que es VEU penja de l'àmbit de dades,
     no del testimoni d'operació. Amb un àmbit nou, res no es veu fins que la
     purga s'ha fet (`tokenEstat` encara és de l'àmbit anterior). Amb una
     renovació, ni el render del testimoni nou (abans de l'efecte) ni els
     següents buiden la llista, la conversa o el fil obert: res no es desmunta
     i Conversa no torna al fons. Els getters guardats d'un altre àmbit, o
     d'un proveïdor desmuntat, tornen buit (ARQ-H01). */
  const visible = tokenEstat?.ambit === ambitEstable && Boolean(joId);
  const dins = useCallback(
    () => visible && !desmuntat.current && ambitActual.current === ambitEstable,
    [visible, ambitEstable]
  );

  /* Torn 260930 (T1, «Gent de la Torre») · Una entrada automàtica (obrir el
     poble en arribar a /xat; des del 14-10, XAT-01, la fitxa de la seua
     comunitat i mai el General) es fa UNA sola vegada per sessió (pla
     2135, :116). El component que la dispara es torna a muntar cada vegada
     que es torna a /xat; este proveïdor viu per damunt de les rutes i
     sobreviu. Torna true només la primera vegada per a cada clau.
     Revisió adversarial 260930 (P1) · La clau era `scopeKey`: cada renovació
     del JWT (generacio+1) i cada canvi d'actor la feien nova, i el General es
     tornava a obrir sense que ningú l'haguera demanat. Ara penja de
     backend + persona. L'actor en queda fora a propòsit: l'entrada és
     l'ARRIBADA de la persona a l'amfitrió, no de cada màscara amb què actua
     dins de la sessió; passar de persona a entitat és un gest deliberat a
     mitja faena i segrestar-li /xat després és justament el defecte. La
     guarda només diu «ja s'ha fet», no guarda cap dada: compartir-la entre
     actors no revela res. */
  const entradesFetes = useRef(new Set());
  const consumixEntrada = useCallback((clau) => {
    const k = `${clauPersona}\n${String(clau)}`;
    if (entradesFetes.current.has(k)) return false;
    entradesFetes.current.add(k);
    return true;
  }, [clauPersona]);

  /* Eixir o entrar (canvia la persona, o el backend) és una sessió nova:
     l'entrada del poble es torna a fer i els esborranys de qui se n'ha anat
     s'obliden (esborranys.js promet buidar-los «en tancar la sessió», i fins
     ara no ho cridava ningú). Una renovació no hi arriba: `clauPersona` no
     porta `generacio`. La ref arrenca amb el valor del muntatge perquè el
     doble efecte de StrictMode no buide res. */
  const personaPrevia = useRef(clauPersona);
  useLayoutEffect(() => {
    if (personaPrevia.current === clauPersona) return;
    const previa = personaPrevia.current;
    personaPrevia.current = clauPersona;
    entradesFetes.current = new Set();
    buidaEsborranys();
    /* Pla 261022_1425 · Les emoticones recents tampoc passen d'una persona a l'altra. */
    buidaRecents();
    /* Gauntlet 261026_1615 (Codex C1615-01, Gemini G1615-00) · El que s'havia
       compartit des del menú del dispositiu tampoc: eixir d'una sessió (o canviar
       de persona o de backend) el descarta, també el que el compositor tenia en
       vol. Compartir abans d'entrar (convidat → persona) el conserva.
       Pla 261028_1526 (P1-31) · I el que el pont encara llegia: la sessió té
       època pròpia (no `generacio`, que puja amb el «Descarta» del diàleg).
       Sense ningú dins, un canvi de backend només torna el lot a «Envia a…». */
    const [backendAbans, personaAbans] = JSON.parse(previa);
    if (personaAbans != null) canviaSessioCompartit();
    else if (backendAbans !== JSON.parse(clauPersona)[0]) reiniciaDestiCompartit();
  }, [clauPersona]);

  /* Auditoria adversarial 261016 (P3) · El xat de només lectura de Javi porta
     només el literal de l'ordre, i només per al convidat. */
  const getThreadMessages = useCallback(
    (filId) => {
      if (!dins()) return [];
      if (filDeMostra && filId === ID_FIL_DE_MOSTRA_DE_JAVI) return missatgesDeMostra;
      return missatgesDerivats[filId] || [];
    },
    [missatgesDerivats, dins, filDeMostra, missatgesDeMostra]
  );
  const hiHaMesAntics = useCallback(
    (filId) => (dins() ? Boolean(paginacio[filId]?.hiHaMes) : false),
    [paginacio, dins]
  );
  const carregantAntics = useCallback(
    (filId) => (dins() ? Boolean(paginacio[filId]?.carregant) : false),
    [paginacio, dins]
  );
  /* B09 · L'espera de l'historial cap arrere del fil (esperaDeLHistorial), o
     null si l'observador hi pot tornar a provar. */
  const esperaAntics = useCallback(
    (filId) => (dins() ? paginacio[filId]?.espera || null : null),
    [paginacio, dins]
  );
  const totalNoLlegits = useMemo(() => (visible ? sumaNoLlegits(filsComptats) : 0), [visible, filsComptats]);
  const comunitats = useMemo(() => (visible ? agrupaComunitats(filsVisibles) : CAP), [visible, filsVisibles]);
  const contactesFrequents = useMemo(() => (visible ? calculaContactesFrequents(filsComptats, null, joId) : CAP), [visible, filsComptats, joId]);
  const filAmagat = useCallback((filId) => (dins() ? esFilAmagat(filId) : false), [dins, esFilAmagat]);
  /* Gauntlet 261025_0545 (XC-14) · Contracte amb la vista. Abans, mentre la
     primera lectura d'un fil volava (o després que fallara), Conversa deia
     «Cap missatge encara. Inicia la conversa!» d'un fil que en tenia.
       · filCarregat(filId): cert quan la primera lectura del fil ha anat bé
         en este àmbit; en llavor i en local, i amb un fil que no té res per
         llegir al port (el de mostra de Javi, una fila d'ajuda per defecte),
         cert des del primer moment; fals mentre la primera lectura remota
         vola o si ha fallat;
       · avisFil(filId): l'avís no bloquejant de l'última lectura o marca
         fallida del fil (el text cru: l'etiqueta la traduïx la vista), o null;
       · recarregaFil(filId): torna a llegir el fil ara (si ja en vola una,
         en farà una més quan torne). No torna res.
     Gauntlet 261025_0545 (D5) · Dos més, per a la vista:
       · tipusAvisFil(filId): de quina operació ve l'avís del fil, 'lectura'
         (els missatges o l'historial) o 'marca' (la de lectura), o null;
       · llegintFil(filId): cert mentre vola una lectura del fil que encara
         no s'ha carregat o que té avís (el «Carregant…» i el botó de tornar-ho
         a provar, ocupat). D'un fil carregat i sense avís, el sondeig no es
         publica (no repinta res) i torna fals (vegeu publicaLectura). */
  const filCarregat = useCallback((filId) => {
    if (filId == null || filId === '') return false;
    if (modeDades !== 'remote' || senseLecturaAlPort(filId)) return true;
    return dins() && carregats[filId] === true;
  }, [modeDades, dins, carregats]);
  const avisFil = useCallback(
    (filId) => (dins() && Object.hasOwn(avisosFil, filId) ? avisosFil[filId].text : null),
    [dins, avisosFil]
  );
  const tipusAvisFil = useCallback(
    (filId) => (dins() && Object.hasOwn(avisosFil, filId) ? avisosFil[filId].tipus ?? null : null),
    [dins, avisosFil]
  );
  const llegintFil = useCallback(
    (filId) => dins() && llegint[filId] === true,
    [dins, llegint]
  );
  const recarregaFil = useCallback((filId) => {
    if (!filId || !dins() || senseLecturaAlPort(filId)) return;
    carregaMissatges(filId);
  }, [dins, carregaMissatges]);

  const value = useMemo(() => ({
    status: visible ? estat : joId ? 'loading' : 'ready',
    error: null,
    avis: visible ? avis : null,
    /* Auditoria 261008 (B04) · Si l'última càrrega de la llista ha anat bé, i
       l'avís no bloquejant d'una que ha fallat amb la llista conservada. */
    llistaFresca: visible ? llistaFresca : true,
    avisLlista: visible ? avisLlista : null,
    scopeKey,
    /* Revisió adversarial 260930 (P2) · La clau dels esborranys: backend +
       persona + actor, sense `generacio`. L'actor hi és: un text a mig
       escriure amb la veu d'una entitat no ha d'aparéixer, llest per a
       enviar, quan la mateixa persona torna a parlar com a ella mateixa. */
    ambitEstable,
    /* Qui és «jo» al xat (la cerca no el troba a ell mateix; el diàleg «Nova
       conversa» el pinta amb «(Tu)»). Null sense sessió en remot. */
    joId: visible ? joId : null,
    joNom: visible ? joNom : null,
    joAvatar: visible ? joAvatar : null,
    /* Pla 261014_1450 (front C) · L'entitat de la barra negra, només per a
       pintar-la (rail i compositor); null si actua com a persona. */
    entitatActiva: visible ? entitatActiva : null,
    /* Remot sense sessió, ja comprovat (mai mentre la sessió es comprova):
       ?sobre= porta a /registre en lloc de fer com si. */
    senseSessio: !joId && estatSessio !== 'comprovant',
    chatThreads: visible ? filsAmbBloquejos : [],
    chatMessages: visible && filActiu ? missatgesDerivats[filActiu] || [] : [],
    totalNoLlegits,
    filActiu: visible ? filActiu : null,
    getThreadMessages,
    hiHaMesAntics,
    carregantAntics,
    esperaAntics,
    carregaMesAntics,
    /* Gauntlet 261025_0545 (XC-14) · Si el fil ja s'ha llegit, el seu avís
       no bloquejant i tornar-lo a llegir ara. */
    filCarregat,
    avisFil,
    recarregaFil,
    /* Gauntlet 261025_0545 (D5) · De quina operació ve l'avís i si en vola la lectura. */
    tipusAvisFil,
    llegintFil,
    /* Fase D (261020, tasca 2) · Amb la porta de les normes (enviaAmbNormes). */
    sendChatMessage: enviaAmbNormes,
    sendChatMedia,
    reintenta,
    descartaFallit,
    marcaVist,
    obriFil,
    creaFil,
    cercaMembres,
    recarrega: carregaFils,
    obriFilDePagina,
    comunitats,
    contactesFrequents,
    marcaLlegides,
    /* 'seed' | 'local' | 'remote': qui decidix si crear el grup del poble
       en entrar (en remot, només quan la persona hi prem). */
    modeDades,
    consumixEntrada,
    /* Onada 6 (tasca 12) · El nivell d'IA és 0 i la IAIA no apareix; i si un
       fil és un xat seu amagat per això. */
    iaiaApagada,
    esFilAmagat: filAmagat
  }), [visible, joId, joNom, joAvatar, entitatActiva, estatSessio, estat, avis, llistaFresca, avisLlista, scopeKey, ambitEstable, filsAmbBloquejos, missatgesDerivats,
    totalNoLlegits, filActiu, getThreadMessages, hiHaMesAntics, carregantAntics, esperaAntics, carregaMesAntics, filCarregat, avisFil, recarregaFil, tipusAvisFil, llegintFil,
    enviaAmbNormes, sendChatMedia, reintenta, descartaFallit, marcaVist,
    obriFil, creaFil, cercaMembres, carregaFils, obriFilDePagina, comunitats, contactesFrequents, marcaLlegides,
    modeDades, consumixEntrada, iaiaApagada, filAmagat]);

  return (
    <XatContext.Provider value={value}>
      <AvisadorXat registra={registraAvisador} ambSessio={Boolean(joId)} />
      {children}
    </XatContext.Provider>
  );
}

export function useXat() {
  return useContext(XatContext) || BUIT;
}
